package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class HomePage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    private final By search = By.cssSelector("input[placeholder*='Buscar'][placeholder*='actividad']");
    private final By ctaActividad = By.xpath("//button[.//text()[contains(.,'Ver toda la actividad')]]");

    private static String resolveBaseUrl() {
        String prop = System.getProperty("BASE_URL");
        String env = System.getenv("BASE_URL");
        String url = (prop != null && !prop.isBlank()) ? prop
                : (env != null && !env.isBlank()) ? env
                : "http://localhost:3000";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /* ctor simple */
    public HomePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        this.baseUrl = resolveBaseUrl();
    }

    /* ==== NUEVO: ctor usado por tus tests ==== */
    public HomePage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = (wait != null) ? wait : new WebDriverWait(driver, Duration.ofSeconds(15));
        String url = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : resolveBaseUrl();
        this.baseUrl = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String abs(String p) {
        return p.startsWith("http") ? p : baseUrl + (p.startsWith("/") ? p : "/" + p);
    }

    public void open() {
        driver.navigate().to(abs("/home"));
        wait.until(ExpectedConditions.visibilityOfElementLocated(search));
    }

    public void searchEnter(String q) {
        WebElement s = wait.until(ExpectedConditions.elementToBeClickable(search));
        s.clear();
        s.sendKeys(q + Keys.ENTER);
    }

    public void goToActividadByButton() {
        wait.until(ExpectedConditions.elementToBeClickable(ctaActividad)).click();
    }
}
