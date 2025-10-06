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

public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    // 1) Solo driver
    public LoginPage(WebDriver driver) {
        this(driver,
                new WebDriverWait(driver, Duration.ofSeconds(40)),
                System.getProperty("baseUrl", "http://localhost:3000"));
    }

    // 2) driver + baseUrl
    public LoginPage(WebDriver driver, String baseUrl) {
        this(driver, new WebDriverWait(driver, Duration.ofSeconds(40)), baseUrl);
    }

    // 3) driver + wait + baseUrl
    public LoginPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = (wait != null) ? wait : new WebDriverWait(driver, Duration.ofSeconds(40));
        this.baseUrl = (baseUrl != null && !baseUrl.isBlank())
                ? baseUrl
                : System.getProperty("baseUrl", "http://localhost:3000");
    }

    /* ---------- Selectores (solo soportados por Selenium) ---------- */
    private final By emailSel = By.cssSelector(
            "[data-testid='login-email'], input[type='email' i], input[name*='email' i], [autocomplete='username']"
    );
    private final By passSel = By.cssSelector(
            "[data-testid='login-password'], input[type='password' i], input[name*='pass' i], [autocomplete='current-password']"
    );
    private final By submitByTestId = By.cssSelector("[data-testid='login-submit']");
    private final By continueByTestId = By.cssSelector("[data-testid='login-continue']");

    // Apoyos por texto (usa XPATH porque CSS no soporta :has/:contains)
    private final By continueByText = By.xpath(
            "//button[contains(translate(normalize-space(.),'CONTINUAR','continuar'),'continuar') or "
            + " contains(translate(normalize-space(.),'SIGUIENTE','siguiente'),'siguiente') or "
            + " contains(translate(normalize-space(.),'NEXT','next'),'next')]"
    );
    private final By submitByText = By.xpath(
            "//button[@type='submit' or "
            + " contains(translate(normalize-space(.),'INICIAR SESIÓN','iniciar sesión'),'iniciar sesión') or "
            + " contains(translate(normalize-space(.),'INGRESAR','ingresar'),'ingresar') or "
            + " contains(translate(normalize-space(.),'ENTRAR','entrar'),'entrar')]"
    );

    /* ---------- Helpers ---------- */
    private static String read(String... keys) {
        for (String k : keys) {
            String v = System.getProperty(k);
            if (v != null && !v.isBlank()) {
                return v;
            }
            v = System.getenv(k);
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    private void goToLogin() {
        // Intenta rutas típicas de login
        String[] paths = {"/login", "/auth/login", "/signin", "/ingresar"};
        for (String p : paths) {
            driver.get(baseUrl + p);
            try {
                new WebDriverWait(driver, Duration.ofSeconds(4))
                        .until(ExpectedConditions.presenceOfElementLocated(emailSel));
                return; // encontró el email → esta es la ruta correcta
            } catch (TimeoutException ignore) {
                /* prueba la siguiente */ }
        }
        // Último intento: ir a /login y seguir
        driver.get(baseUrl + "/login");
    }

    /* ---------- API ---------- */
    public void login() {
        String email = read("E2E_EMAIL", "E2E_USER");
        String password = read("E2E_PASSWORD", "E2E_PASS");
        if (email == null || password == null) {
            throw new IllegalStateException("Faltan credenciales: define E2E_EMAIL y E2E_PASSWORD (system props o ENV).");
        }
        login(email, password);
    }

    public void login(String email, String password) {
        goToLogin();

        // Email
        WebElement emailEl = wait.until(ExpectedConditions.visibilityOfElementLocated(emailSel));
        emailEl.clear();
        emailEl.sendKeys(email);

        // Si hay paso intermedio, clic en Continuar (por testId o por texto)
        try {
            WebElement contBtn = null;
            try {
                contBtn = driver.findElement(continueByTestId);
            } catch (NoSuchElementException ignored) {
            }
            if (contBtn == null) {
                try {
                    contBtn = driver.findElement(continueByText);
                } catch (NoSuchElementException ignored) {
                }
            }
            if (contBtn != null && contBtn.isDisplayed() && contBtn.isEnabled()) {
                contBtn.click();
            }
        } catch (Exception ignored) {
        }

        // Password
        WebElement passEl = wait.until(ExpectedConditions.visibilityOfElementLocated(passSel));
        passEl.clear();
        passEl.sendKeys(password);

        // Submit (por testId o por texto; fallback ENTER)
        try {
            WebElement submit = null;
            try {
                submit = driver.findElement(submitByTestId);
            } catch (NoSuchElementException ignored) {
            }
            if (submit == null) {
                try {
                    submit = driver.findElement(submitByText);
                } catch (NoSuchElementException ignored) {
                }
            }
            if (submit != null) {
                submit.click();
            } else {
                passEl.sendKeys(Keys.ENTER);
            }
        } catch (Exception e) {
            passEl.sendKeys(Keys.ENTER);
        }

        // Esperar a salir de /login
        wait.until(d -> !d.getCurrentUrl().contains("/login")
                && !d.getCurrentUrl().contains("/auth/login")
                && !d.getCurrentUrl().contains("/signin")
                && !d.getCurrentUrl().contains("/ingresar"));
    }
}
