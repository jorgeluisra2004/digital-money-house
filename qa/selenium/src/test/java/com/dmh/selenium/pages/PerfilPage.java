package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PerfilPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    private final By aliasBlock = By.xpath(
            "//*[("
            + "self::section or self::div or self::article"
            + ")]"
            + "[.//text()[contains(translate(.,'ALIAS','alias'),'alias')]]"
    );

    private final By aliasEditBtn = By.xpath("(.//*[contains(translate(.,'ALIAS','alias'),'alias')]//following::*[normalize-space()='Editar'])[1]");
    private final By aliasInput = By.cssSelector("input[placeholder*='alias' i], input[name*='alias' i]");
    private final By aliasSave = By.xpath("//button[normalize-space()='Guardar' or @data-testid='alias-save']");

    private final By aliasText = By.xpath("(.//*[contains(translate(.,'ALIAS','alias'),'alias')]//*[self::div or self::span][contains(@class,'mt-')])[1]");

    private final By copyAlias = By.cssSelector("button[title*='alias' i]");
    private final By copyCvu = By.cssSelector("button[title*='cvu' i]");

    private static String resolveBaseUrl() {
        String prop = System.getProperty("BASE_URL");
        String env = System.getenv("BASE_URL");
        String url = (prop != null && !prop.isBlank()) ? prop
                : (env != null && !env.isBlank()) ? env
                : "http://localhost:3000";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    public PerfilPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        this.baseUrl = resolveBaseUrl();
    }

    private String abs(String p) {
        return p.startsWith("http") ? p : baseUrl + (p.startsWith("/") ? p : "/" + p);
    }

    public void open() {
        driver.navigate().to(abs("/perfil"));
        wait.until(ExpectedConditions.visibilityOfElementLocated(aliasBlock));
    }

    public void open(String path) {
        driver.navigate().to(abs(path));
        wait.until(ExpectedConditions.visibilityOfElementLocated(aliasBlock));
    }

    public void editAlias(String nuevoAlias) {
        wait.until(ExpectedConditions.elementToBeClickable(aliasEditBtn)).click();
        WebElement inp = wait.until(ExpectedConditions.visibilityOfElementLocated(aliasInput));
        inp.clear();
        inp.sendKeys(nuevoAlias);
        wait.until(ExpectedConditions.elementToBeClickable(aliasSave)).click();
        wait.until(d -> {
            try {
                return d.findElement(aliasText).getText().trim().equalsIgnoreCase(nuevoAlias);
            } catch (Exception e) {
                return false;
            }
        });
    }

    public void copyBoth() {
        if (!driver.findElements(copyCvu).isEmpty()) {
            driver.findElement(copyCvu).click();
        }
        if (!driver.findElements(copyAlias).isEmpty()) {
            driver.findElement(copyAlias).click();
        }
    }
}
