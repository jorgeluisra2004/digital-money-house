package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PerfilPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    private final By CVU_COPY = By.cssSelector("[data-testid='perfil-copy-cvu']");
    private final By ALIAS_COPY = By.cssSelector("[data-testid='perfil-copy-alias']");
    private final By ALIAS_INPUT = By.cssSelector("[data-testid='perfil-alias-input']");

    public PerfilPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = wait;
        this.baseUrl = baseUrl != null ? baseUrl : "";
    }

    // Sobrecarga: solo WebDriver
    public PerfilPage(WebDriver driver) {
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

    public PerfilPage open() {
        driver.get(baseUrl + "/perfil");
        // Espera a que exista la sección “Alias”
        wait.until(ExpectedConditions.visibilityOfElementLocated(aliasContainerLocator()));
        return this;
    }

    public PerfilPage copyBoth() {
        clickIfPresent(CVU_COPY);
        waitMiniToast();
        clickIfPresent(ALIAS_COPY);
        waitMiniToast();
        return this;
    }

    // Firma que piden tus tests
    public PerfilPage editAlias(String newAlias) {
        return editAliasTo(newAlias);
    }

    // Editor de alias real (scoped a la sección "Alias")
    public PerfilPage editAliasTo(String newAlias) {
        WebElement container = wait.until(ExpectedConditions.visibilityOfElementLocated(aliasContainerLocator()));

        // Click en “Editar”
        By EDIT = By.xpath(".//button[normalize-space()='Editar']");
        waitUntilClickable(container, EDIT).click();

        // Input con data-testid
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(ALIAS_INPUT));
        input.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        input.sendKeys(Keys.DELETE);
        input.sendKeys(newAlias);

        // Guardar dentro del container
        By SAVE = By.xpath(".//button[normalize-space()='Guardar']");
        waitUntilClickable(container, SAVE).click();

        // Confirmar que el texto nuevo aparece en el container (y el input desaparece)
        wait.until(ExpectedConditions.invisibilityOfElementLocated(ALIAS_INPUT));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(aliasContainerLocator(), newAlias));
        return this;
    }

    // --- helpers ---
    private By aliasContainerLocator() {
        // Contenedor de la fila "Alias" en la tarjeta oscura
        return By.xpath("//div[contains(@class,'py-4')][.//div[normalize-space()='Alias']]");
    }

    private void clickIfPresent(By locator) {
        try {
            waitUntilClickable(locator).click();
        } catch (TimeoutException | NoSuchElementException ignore) {
        }
    }

    private WebElement waitUntilClickable(By locator) {
        return new WebDriverWait(driver, Duration.ofSeconds(20))
                .until(ExpectedConditions.elementToBeClickable(locator));
    }

    private WebElement waitUntilClickable(WebElement scope, By inner) {
        return new WebDriverWait(driver, Duration.ofSeconds(20))
                .until(ExpectedConditions.elementToBeClickable(scope.findElement(inner)));
    }

    private void waitMiniToast() {
        // “CVU copiado” o “Alias copiado”
        By TOAST = By.xpath("//*[contains(translate(.,'COPIADO','copiado'),'copiado')]");
        try {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(TOAST));
            new WebDriverWait(driver, Duration.ofSeconds(3))
                    .until(ExpectedConditions.invisibilityOfElementLocated(TOAST));
        } catch (TimeoutException ignore) {
        }
    }
}
