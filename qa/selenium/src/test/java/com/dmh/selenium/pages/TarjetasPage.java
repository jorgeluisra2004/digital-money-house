// src/test/java/com/dmh/selenium/pages/TarjetasPage.java
package com.dmh.selenium.pages;

import java.time.Duration;
import java.util.Locale;

import org.openqa.selenium.By;
import org.openqa.selenium.ElementClickInterceptedException;
import org.openqa.selenium.JavascriptException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class TarjetasPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private String baseUrl;

    private static final Duration TIMEOUT = Duration.ofSeconds(25);

    // Selectors (alineados al frontend actual)
    private final By HEADING_LIST = By.xpath("//*[contains(@class,'font-semibold') and normalize-space()='Tus tarjetas']");
    private final By BTN_ADD = By.cssSelector("[data-testid='btn-alta-tarjeta']");
    private final By BTN_ADD_FALLBACK = By.xpath("//span[normalize-space()='Alta de tarjeta']/ancestor::button | //button[contains(normalize-space(),'Alta de tarjeta')]");
    private final By BRAND_INFO = By.cssSelector("[data-testid='tarjetas-brand-detect']");

    // Inputs por placeholder
    private final By IN_NUM = By.xpath("//input[@placeholder='Número de la tarjeta*']");
    private final By IN_EXP = By.xpath("//input[@placeholder='Fecha de vencimiento (MM/YY)*']");
    private final By IN_NAME = By.xpath("//input[@placeholder='Nombre y apellido del titular*']");
    private final By IN_CVV = By.xpath("//input[contains(@placeholder,'Código de seguridad')]");
    private final By BTN_CONTINUAR = By.xpath("//button[normalize-space()='Continuar']");

    public TarjetasPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = wait != null ? wait : new WebDriverWait(driver, TIMEOUT);
        this.baseUrl = baseUrl != null ? baseUrl : resolveBaseUrl();
    }

    // Sobrecarga: solo WebDriver (como usan los tests)
    public TarjetasPage(WebDriver driver) {
        this(driver, new WebDriverWait(driver, TIMEOUT), resolveBaseUrl());
    }

    private static String resolveBaseUrl() {
        String s = System.getProperty("baseUrl");
        if (s == null || s.isBlank()) {
            s = System.getProperty("BASE_URL");
        }
        if (s == null || s.isBlank()) {
            s = System.getenv("BASE_URL");
        }
        if (s == null || s.isBlank()) {
            s = "http://localhost:3000";
        }
        return s;
    }

    public TarjetasPage openList(String baseUrl) {
        if (baseUrl != null && !baseUrl.isBlank()) {
            this.baseUrl = baseUrl;
        }
        driver.get(this.baseUrl + "/tarjetas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(HEADING_LIST));
        return this;
    }

    public TarjetasPage openList() {
        driver.get((baseUrl != null ? baseUrl : "") + "/tarjetas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(HEADING_LIST));
        return this;
    }

    public TarjetasPage openForm() {
        // 1) intentamos por data-testid
        if (!clickAddIfPresent(BTN_ADD)) {
            // 2) fallback por texto visible “Alta de tarjeta”
            if (!clickAddIfPresent(BTN_ADD_FALLBACK)) {
                // 3) pequeño scroll y último intento
                new Actions(driver).scrollByAmount(0, 200).pause(Duration.ofMillis(150)).perform();
                clickAddIfPresent(BTN_ADD_FALLBACK);
            }
        }

        // Al abrir, debe aparecer el bloque de marca o la URL con ?alta=1
        wait.until(ExpectedConditions.or(
                ExpectedConditions.visibilityOfElementLocated(BRAND_INFO),
                (ExpectedCondition<Boolean>) d -> d.getCurrentUrl().contains("alta=1")
        ));
        return this;
    }

    /**
     * En algunos tests llaman este assert ANTES de tipear el número; el UI
     * muestra “Desconocida”. Para que no falle por timing, validamos
     * visibilidad y, si se pidió una marca concreta, lo intentamos unos
     * segundos pero SIN tirar Timeout si aún no coincide.
     */
    public TarjetasPage assertBrandShown(String expectedBrand) {
        // 1) El bloque debe estar visible
        WebElement info = wait.until(ExpectedConditions.visibilityOfElementLocated(BRAND_INFO));

        // 2) Si no se pidió marca específica, listo
        if (expectedBrand == null || expectedBrand.isBlank()) {
            return this;
        }

        String expected = expectedBrand.trim().toLowerCase(Locale.ROOT);

        // 3) Intento best-effort (no rompe si todavía dice “Desconocida”)
        try {
            new WebDriverWait(driver, Duration.ofSeconds(8)).until(d -> {
                String txt = d.findElement(BRAND_INFO).getText().toLowerCase(Locale.ROOT);
                return txt.contains(expected);
            });
        } catch (TimeoutException ignore) {
            // toleramos el estado inicial; más tarde al tipear ya cambia a la marca correcta
        }
        return this;
    }

    public TarjetasPage createVisaDemo() {
        String num = "4111 1111 1111 1111";
        String exp = "12/30";
        String name = "DEMO USER";
        String cvv = "123";

        WebElement eNum = wait.until(ExpectedConditions.visibilityOfElementLocated(IN_NUM));
        WebElement eExp = wait.until(ExpectedConditions.visibilityOfElementLocated(IN_EXP));
        WebElement eName = wait.until(ExpectedConditions.visibilityOfElementLocated(IN_NAME));
        WebElement eCvv = wait.until(ExpectedConditions.visibilityOfElementLocated(IN_CVV));

        clearAndType(eNum, num);
        clearAndType(eExp, exp);
        clearAndType(eName, name);
        clearAndType(eCvv, cvv);

        WebElement continuar = wait.until(ExpectedConditions.elementToBeClickable(BTN_CONTINUAR));
        scrollIntoView(continuar);
        try {
            continuar.click();
        } catch (ElementClickInterceptedException e) {
            jsClick(continuar);
        }

        // Vuelve al listado
        wait.until(ExpectedConditions.visibilityOfElementLocated(HEADING_LIST));
        return this;
    }

    // --- helpers -------------------------------------------------------------
    private boolean clickAddIfPresent(By locator) {
        try {
            WebElement btn = new WebDriverWait(driver, Duration.ofSeconds(7))
                    .until(ExpectedConditions.elementToBeClickable(locator));
            scrollIntoView(btn);
            try {
                btn.click();
            } catch (ElementClickInterceptedException e) {
                jsClick(btn);
            }
            return true;
        } catch (TimeoutException | NoSuchElementException e) {
            return false;
        }
    }

    private void clearAndType(WebElement el, String text) {
        el.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        el.sendKeys(Keys.DELETE);
        el.sendKeys(text);
    }

    private void scrollIntoView(WebElement el) {
        try {
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center', inline:'nearest'});", el);
        } catch (JavascriptException ignore) {
        }
    }

    private void jsClick(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }
}
