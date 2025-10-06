package com.dmh.selenium.pages;

import java.time.Duration;
import java.util.Locale;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class TarjetasPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private String baseUrl;

    // Ajustados al frontend actual
    private final By HEADING_LIST = By.xpath("//*[contains(@class,'font-semibold') and normalize-space()='Tus tarjetas']");
    private final By BTN_ADD = By.cssSelector("[data-testid='btn-alta-tarjeta']");
    private final By BRAND_INFO = By.cssSelector("[data-testid='tarjetas-brand-detect']");

    // Inputs por placeholder (tal cual en el form)
    private final By IN_NUM = By.xpath("//input[@placeholder='Número de la tarjeta*']");
    private final By IN_EXP = By.xpath("//input[@placeholder='Fecha de vencimiento (MM/YY)*']");
    private final By IN_NAME = By.xpath("//input[@placeholder='Nombre y apellido del titular*']");
    private final By IN_CVV = By.xpath("//input[contains(@placeholder,'Código de seguridad')]");
    private final By BTN_CONTINUAR = By.xpath("//button[normalize-space()='Continuar']");

    public TarjetasPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = wait;
        this.baseUrl = baseUrl;
    }

    // Sobrecarga: solo WebDriver
    public TarjetasPage(WebDriver driver) {
        this(
                driver,
                new WebDriverWait(driver, Duration.ofSeconds(20)),
                resolveBaseUrl()
        );
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

    // Tu test llama t.openList(baseUrl)
    public TarjetasPage openList(String baseUrl) {
        if (baseUrl != null && !baseUrl.isBlank()) {
            this.baseUrl = baseUrl;
        }
        driver.get(this.baseUrl + "/tarjetas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(HEADING_LIST));
        return this;
    }

    // Overload por si se usa sin argumento
    public TarjetasPage openList() {
        driver.get((baseUrl != null ? baseUrl : "") + "/tarjetas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(HEADING_LIST));
        return this;
    }

    public TarjetasPage openForm() {
        waitUntilClickable(BTN_ADD).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(BRAND_INFO));
        return this;
    }

    public TarjetasPage assertBrandShown(String expectedBrand) {
        String expected = (expectedBrand == null ? "" : expectedBrand).trim().toLowerCase(Locale.ROOT);
        wait.until((ExpectedCondition<Boolean>) d -> {
            String txt = d.findElement(BRAND_INFO).getText().toLowerCase(Locale.ROOT);
            return txt.contains(expected);
        });
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

        waitUntilClickable(BTN_CONTINUAR).click();

        // Vuelve al listado
        wait.until(ExpectedConditions.visibilityOfElementLocated(HEADING_LIST));
        return this;
    }

    // --- helpers ---
    private WebElement waitUntilClickable(By locator) {
        return new WebDriverWait(driver, Duration.ofSeconds(20))
                .until(ExpectedConditions.elementToBeClickable(locator));
    }

    private void clearAndType(WebElement el, String text) {
        el.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        el.sendKeys(Keys.DELETE);
        el.sendKeys(text);
    }
}
