package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    // XPaths tolerantes (email, pass, submit)
    private final By anyEmail = By.xpath(
            "//input[(translate(@type,'EMAIL','email')='email') or contains(translate(@name,'EMAIL','email'),'email') or @autocomplete='username']"
    );
    private final By anyPass = By.xpath(
            "//input[(translate(@type,'PASSWORD','password')='password') or contains(translate(@name,'PASSWORD','password'),'pass') or @autocomplete='current-password']"
    );
    private final By anySubmit = By.xpath(
            "//button[@type='submit' or @data-testid='login-submit' or "
            + "normalize-space()='Ingresar' or normalize-space()='Iniciar sesión' or .//span[normalize-space()='Ingresar'] or .//span[normalize-space()='Iniciar sesión']]"
    );

    private final By navbarGreeting = By.cssSelector("[data-testid='navbar-user-greeting']");

    public LoginPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = (wait != null) ? wait : new WebDriverWait(driver, Duration.ofSeconds(25));
        String url = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : "http://localhost:3000";
        this.baseUrl = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String abs(String path) {
        return path.startsWith("http") ? path : baseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    private WebElement clickable(By by) {
        return wait.until(ExpectedConditions.elementToBeClickable(by));
    }

    private WebElement visible(By by) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(by));
    }

    /**
     * Intenta /login y si no aparece el form, cae a /auth/login
     */
    public void open() {
        driver.navigate().to(abs("/login"));
        if (driver.findElements(anyEmail).isEmpty() && driver.findElements(anyPass).isEmpty()) {
            driver.navigate().to(abs("/auth/login"));
        }
        // Asegura que al menos uno de los inputs esté visible
        wait.until(d
                -> !d.findElements(anyEmail).isEmpty() || !d.findElements(anyPass).isEmpty()
        );
    }

    public void login(String user, String pass) {
        open();

        WebElement e = visible(anyEmail);
        e.clear();
        e.sendKeys(user);

        WebElement p = visible(anyPass);
        p.clear();
        p.sendKeys(pass);

        // algunos botones están dentro de un <span> – usa JS click si hace falta
        WebElement btn = driver.findElements(anySubmit).isEmpty()
                ? p // fallback: ENTER
                : driver.findElement(anySubmit);

        try {
            btn.click();
        } catch (org.openqa.selenium.WebDriverException ex) {
            ((org.openqa.selenium.JavascriptExecutor) driver)
                    .executeScript("arguments[0].click();", btn);
        }

        // Espera post-login: saludo o /home
        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(navbarGreeting),
                ExpectedConditions.urlContains("/home")
        ));
    }
}
