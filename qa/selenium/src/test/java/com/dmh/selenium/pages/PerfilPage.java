package com.dmh.selenium.pages;

import java.time.Duration;

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
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PerfilPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    private static final Duration TIMEOUT = Duration.ofSeconds(25);

    // Selectors
    private final By CVU_COPY = By.cssSelector("[data-testid='perfil-copy-cvu']");
    private final By ALIAS_COPY = By.cssSelector("[data-testid='perfil-copy-alias']");
    private final By ALIAS_INPUT = By.cssSelector("[data-testid='perfil-alias-input']");
    private final By ALIAS_ROW = By.xpath("//div[contains(@class,'py-4')][.//div[normalize-space()='Alias']]");
    private final By EDIT_BTN = By.xpath("//div[contains(@class,'py-4')][.//div[normalize-space()='Alias']]//button[normalize-space()='Editar']");
    private final By SAVE_BTN = By.xpath("//div[contains(@class,'py-4')][.//div[normalize-space()='Alias']]//button[normalize-space()='Guardar']");
    private final By CANCEL_BTN = By.xpath("//div[contains(@class,'py-4')][.//div[normalize-space()='Alias']]//button[normalize-space()='Cancelar']");
    private final By ANY_ALIAS_INP = By.xpath("//div[contains(@class,'py-4')][.//div[normalize-space()='Alias']]//input | //input[@data-testid='perfil-alias-input']");

    public PerfilPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = wait != null ? wait : new WebDriverWait(driver, TIMEOUT);
        this.baseUrl = baseUrl != null ? baseUrl : resolveBaseUrl();
    }

    // Sobrecarga: solo WebDriver (como usan los tests)
    public PerfilPage(WebDriver driver) {
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

    public PerfilPage open() {
        driver.get(baseUrl + "/perfil");
        // Esperar que la fila de "Alias" exista (modo lectura)
        wait.until(ExpectedConditions.visibilityOfElementLocated(ALIAS_ROW));
        return this;
    }

    /**
     * Click de copiar en CVU y Alias (para el test que lo usa).
     */
    public PerfilPage copyBoth() {
        clickIfPresent(CVU_COPY);
        waitMiniToast();
        clickIfPresent(ALIAS_COPY);
        waitMiniToast();
        return this;
    }

    /**
     * Firma requerida por el test: abrir editor de alias y guardar el valor.
     */
    public PerfilPage editAlias(String newAlias) {
        return editAliasTo(newAlias);
    }

    public PerfilPage editAliasTo(String newAlias) {
        // 1) asegurarse que estamos viendo la fila de Alias
        WebElement row = wait.until(ExpectedConditions.visibilityOfElementLocated(ALIAS_ROW));
        scrollIntoView(row);

        // 2) abrir editor: intentar click normal, si no, JS click + segundo intento
        if (!ensureEditMode()) {
            // reintentar una vez tras un pequeño scroll / hover
            new Actions(driver).moveToElement(row).pause(Duration.ofMillis(150)).perform();
            ensureEditMode(); // si aún falla, la espera siguiente abortará igualmente
        }

        // 3) esperar a que aparezca el input o, alternativamente, el botón "Guardar"
        wait.until(ExpectedConditions.or(
                ExpectedConditions.visibilityOfElementLocated(ALIAS_INPUT),
                ExpectedConditions.elementToBeClickable(SAVE_BTN)
        ));

        // 4) escribir el alias (try data-testid, fallback a ANY_ALIAS_INP)
        WebElement input;
        try {
            input = new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(ALIAS_INPUT));
        } catch (TimeoutException e) {
            input = wait.until(ExpectedConditions.visibilityOfElementLocated(ANY_ALIAS_INP));
        }

        clearAndType(input, newAlias);

        // 5) guardar (click robusto) y verificar que el input ya no esté
        jsClick(wait.until(ExpectedConditions.elementToBeClickable(SAVE_BTN)));

        wait.until(ExpectedConditions.invisibilityOfElementLocated(ALIAS_INPUT));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(ALIAS_ROW, newAlias));
        return this;
    }

    // --- helpers -------------------------------------------------------------
    private boolean ensureEditMode() {
        try {
            WebElement edit = new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.elementToBeClickable(EDIT_BTN));
            scrollIntoView(edit);
            try {
                edit.click();
            } catch (ElementClickInterceptedException ignored) {
                jsClick(edit);
            }
            return true;
        } catch (TimeoutException e) {
            // Fallback global por si el XPath no matcheó: cualquier botón "Editar" visible
            try {
                WebElement anyEdit = new WebDriverWait(driver, Duration.ofSeconds(3))
                        .until(ExpectedConditions.elementToBeClickable(
                                By.xpath("//button[normalize-space()='Editar']")));
                scrollIntoView(anyEdit);
                jsClick(anyEdit);
                return true;
            } catch (TimeoutException ignore) {
                return false;
            }
        }
    }

    private void clickIfPresent(By locator) {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.elementToBeClickable(locator));
            scrollIntoView(el);
            try {
                el.click();
            } catch (ElementClickInterceptedException e) {
                jsClick(el);
            }
        } catch (TimeoutException | NoSuchElementException ignored) {
        }
    }

    private void waitMiniToast() {
        // “CVU copiado” o “Alias copiado” (el texto exacto puede cambiar; buscamos 'copiado')
        By TOAST = By.xpath("//*[contains(translate(.,'COPIADO','copiado'),'copiado')]");
        try {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(TOAST));
            new WebDriverWait(driver, Duration.ofSeconds(3))
                    .until(ExpectedConditions.invisibilityOfElementLocated(TOAST));
        } catch (TimeoutException ignore) {
        }
    }

    private void scrollIntoView(WebElement el) {
        try {
            ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center', inline:'nearest'});", el);
        } catch (JavascriptException ignore) {
        }
    }

    private void clearAndType(WebElement el, String text) {
        el.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        el.sendKeys(Keys.DELETE);
        el.sendKeys(text);
    }

    private void jsClick(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }
}
