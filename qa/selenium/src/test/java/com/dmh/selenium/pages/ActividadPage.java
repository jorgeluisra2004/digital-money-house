package com.dmh.selenium.pages;

import java.time.Duration;
import java.util.Locale;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class ActividadPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    // --- Locators principales ---
    private final By LIST = By.cssSelector("[data-testid='actividad-list'], .divide-y");
    private final By SEARCH = By.cssSelector("[data-testid='actividad-search-input']");
    private final By BTN_APPLY = By.cssSelector("[data-testid='filters-apply']");
    private final By BTN_CLEAR = By.cssSelector("[data-testid='filters-clear']");

    // Periodos por data-testid (si existen)
    private final By P_HOY = By.cssSelector("[data-testid='period-hoy']");
    private final By P_U7 = By.cssSelector("[data-testid='period-ultimos-7']");
    private final By P_U15 = By.cssSelector("[data-testid='period-ultimos-15']");
    private final By P_UMES = By.cssSelector("[data-testid='period-ultimo-mes']");
    private final By P_U3M = By.cssSelector("[data-testid='period-ultimos-3-meses']");

    // ---------- Constructores ----------
    public ActividadPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = wait;
        this.baseUrl = baseUrl != null ? baseUrl : "";
    }

    // Sobrecarga: solo WebDriver (como usan tus tests)
    public ActividadPage(WebDriver driver) {
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

    // Para wait.until(ActividadPage.assertLoaded())
    public static ExpectedCondition<WebElement> assertLoaded() {
        return drv -> {
            WebElement el = drv.findElement(By.cssSelector("[data-testid='actividad-list'], .divide-y"));
            return el.isDisplayed() ? el : null;
        };
    }

    // Para usar encadenado en instancia
    public ActividadPage assertLoadedInstance() {
        wait.until(assertLoaded());
        return this;
    }

    public ActividadPage open() {
        driver.get(baseUrl + "/actividad");
        wait.until(assertLoaded());
        return this;
    }

    public ActividadPage openFilters() {
        // Hay más de un botón “Filtrar”; elegir el visible
        By FILTRAR = By.xpath("//button[normalize-space()='Filtrar' or contains(.,'Filtrar')]");
        waitUntilClickable(FILTRAR).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(BTN_APPLY));
        return this;
    }

    public ActividadPage choosePeriodo(String key) {
        if (key == null) {
            return this;
        }
        String k = key.trim().toLowerCase(Locale.ROOT);

        // 1) intento por testid
        By target = null;
        switch (k) {
            case "hoy":
                target = P_HOY;
                break;
            case "ultima_semana":
            case "última_semana":
            case "ultimos_7":
            case "últimos_7":
                target = P_U7;
                break;
            case "ultimos_15":
            case "últimos_15":
                target = P_U15;
                break;
            case "ultimo_mes":
            case "último_mes":
                target = P_UMES;
                break;
            case "ultimos_3_meses":
            case "últimos_3_meses":
                target = P_U3M;
                break;
            default:
                // "" (todos) => no seleccionar nada
                return this;
        }

        try {
            waitUntilClickable(target).click();
            return this;
        } catch (NoSuchElementException | TimeoutException ignore) {
            // 2) fallback por texto visible en el modal “Período”
            String label = mapPeriodoLabel(k);
            if (label != null) {
                By BTN = By.xpath("//section[.//p[contains(.,'Período')]]//button[normalize-space()='" + label + "']");
                waitUntilClickable(BTN).click();
            }
            return this;
        }
    }

    public ActividadPage chooseOperacion(String operacion) {
        String op = (operacion == null ? "" : operacion).trim().toLowerCase(Locale.ROOT);
        String label = "Todas";
        if ("ingresos".equals(op)) {
            label = "Ingresos";
        }
        if ("egresos".equals(op)) {
            label = "Egresos";
        }

        By BTN = By.xpath("//section[.//p[contains(.,'Operación')]]//button[normalize-space()='" + label + "']");
        waitUntilClickable(BTN).click();
        return this;
    }

    public ActividadPage applyFilters() {
        waitUntilClickable(BTN_APPLY).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(LIST));
        return this;
    }

    public ActividadPage clearFilters() {
        waitUntilClickable(BTN_CLEAR).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(LIST));
        return this;
    }

    public ActividadPage search(String text) {
        WebElement el = wait.until(ExpectedConditions.visibilityOfElementLocated(SEARCH));
        el.clear();
        el.sendKeys(text);
        el.sendKeys(Keys.ENTER);
        return this;
    }

    // --- Helpers ---
    private WebElement waitUntilClickable(By locator) {
        return new WebDriverWait(driver, Duration.ofSeconds(20))
                .until(ExpectedConditions.elementToBeClickable(locator));
    }

    private String mapPeriodoLabel(String key) {
        switch (key) {
            case "hoy":
                return "Hoy";
            case "ayer":
                return "Ayer";
            case "ultima_semana":
            case "última_semana":
            case "ultimos_7":
            case "últimos_7":
                return "Última semana";
            case "ultimos_15":
            case "últimos_15":
                return "Últimos 15 días";
            case "ultimo_mes":
            case "último_mes":
                return "Último mes";
            case "ultimos_3_meses":
            case "últimos_3_meses":
                return "Últimos 3 meses";
            default:
                return null;
        }
    }
}
