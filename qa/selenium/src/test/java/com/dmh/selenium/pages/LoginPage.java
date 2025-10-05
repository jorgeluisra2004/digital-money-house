package com.dmh.selenium.pages;

import java.time.Duration;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Login robusto: - Soporta 1-paso y 2-pasos (email -> continuar -> password) -
 * Detecta y entra en iframes si el proveedor los usa - Intenta "usar
 * contraseña" si el proveedor propone magic link/SSO - En headless, si el
 * password no está "clickable", lo rellena vía JS (presencia>click) - Detecta
 * "magic link enviado" y falla con mensaje claro (para ajustar entorno de QA)
 */
public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    // Campos tolerantes (case-insensitive [i])
    private final By emailCss = By.cssSelector(
            "input[type='email' i], input[name*='mail' i], input[autocomplete='username'], input[placeholder*='correo' i], input[placeholder*='email' i]"
    );
    private final By passCss = By.cssSelector(
            "input[type='password' i], input[name*='pass' i], input[autocomplete='current-password'], input[placeholder*='contraseña' i], input[aria-label*='contraseña' i]"
    );

    // Alternativa: buscar por label "Contraseña" y tomar el input siguiente
    private final By passViaLabel = By.xpath(
            "//label[contains(translate(normalize-space(.),'CONTRASEÑA','contraseña'),'contraseña')]"
            + "/following::input[1]"
    );

    private final By submitCss = By.cssSelector(
            "button[type='submit'], button[data-testid*='login' i], [data-testid='login-submit']"
    );

    private final By usePasswordBtn = By.xpath(
            "//button[contains(translate(.,'CONTRASEÑA','contraseña'),'contraseña') or "
            + "        contains(translate(.,'PASSWORD','password'),'password') or "
            + "        @data-testid='use-password' or @data-action='use-password']"
    );

    private final By continueBtn = By.xpath(
            "//button[@data-testid='continue' or @data-action='continue' or "
            + "        normalize-space()='Continuar' or normalize-space()='Siguiente' or "
            + "        contains(translate(.,'CONTINUAR','continuar'),'continuar') or "
            + "        contains(translate(.,'SIGUIENTE','siguiente'),'siguiente')]"
    );

    // Indicadores de "magic link enviado"
    private final By magicLinkNotice = By.xpath(
            "//*[contains(translate(.,'TE ENVIAMOS','te enviamos'),'te enviamos') or "
            + "   contains(translate(.,'REVISA TU CORREO','revisa tu correo'),'revisa tu correo') or "
            + "   contains(translate(.,'CHECK YOUR EMAIL','check your email'),'check your email') or "
            + "   contains(translate(.,'LINK','link'),'link') or "
            + "   contains(translate(.,'ENLACE','enlace'),'enlace')]"
    );

    private final By navbarGreeting = By.cssSelector("[data-testid='navbar-user-greeting']");

    public LoginPage(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.driver = driver;
        this.wait = (wait != null) ? wait : new WebDriverWait(driver, Duration.ofSeconds(35));
        String url = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : "http://localhost:3000";
        this.baseUrl = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String abs(String path) {
        return path.startsWith("http") ? path : baseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    private boolean present(By by) {
        return !driver.findElements(by).isEmpty();
    }

    private WebElement waitClickable(By by, long seconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(seconds))
                    .until(ExpectedConditions.elementToBeClickable(by));
        } catch (TimeoutException e) {
            return null;
        }
    }

    private WebElement waitPresent(By by, long seconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(seconds))
                    .until(ExpectedConditions.presenceOfElementLocated(by));
        } catch (TimeoutException e) {
            return null;
        }
    }

    private void jsScroll(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", el);
    }

    private void safeClick(WebElement el) {
        try {
            el.click();
        } catch (Exception e) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
        }
    }

    private void jsSetValue(WebElement el, String value) {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript(
                "arguments[0].value = arguments[1];"
                + "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));"
                + "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
                el, value
        );
    }

    private void switchIntoAuthFrameIfNeeded() {
        // Si ya vemos inputs en el root, no hace falta
        if (present(emailCss) || present(passCss)) {
            return;
        }

        List<WebElement> frames = driver.findElements(By.tagName("iframe"));
        for (WebElement f : frames) {
            try {
                driver.switchTo().frame(f);
                if (present(emailCss) || present(passCss)) {
                    return;
                }
                driver.switchTo().defaultContent();
            } catch (Exception ignore) {
                try {
                    driver.switchTo().defaultContent();
                } catch (Exception ignored) {
                }
            }
        }
    }

    public void open() {
        driver.navigate().to(abs("/login"));

        if (driver.getCurrentUrl().contains("/home") || present(navbarGreeting)) {
            return;
        }

        if (!present(emailCss) && !present(passCss)) {
            driver.navigate().to(abs("/auth/login"));
        }

        switchIntoAuthFrameIfNeeded();

        wait.until(d -> present(emailCss) || present(passCss));
    }

    public void login(String user, String pass) {
        open();

        driver.switchTo().defaultContent();
        switchIntoAuthFrameIfNeeded();

        // Forzar "usar contraseña" si aparece
        WebElement maybeUsePwd = waitClickable(usePasswordBtn, 2);
        if (maybeUsePwd != null) {
            jsScroll(maybeUsePwd);
            safeClick(maybeUsePwd);
            driver.switchTo().defaultContent();
            switchIntoAuthFrameIfNeeded();
        }

        // EMAIL
        WebElement emailField = wait.until(ExpectedConditions.elementToBeClickable(emailCss));
        jsScroll(emailField);
        emailField.clear();
        emailField.sendKeys(user);

        // ¿Password visible ya?
        WebElement passField = waitClickable(passCss, 2);
        if (passField == null) {
            // Intentar botón Continuar/Siguiente
            WebElement cont = waitClickable(continueBtn, 2);
            if (cont != null) {
                jsScroll(cont);
                safeClick(cont);
            } else {
                // ENTER en email
                emailField.sendKeys(Keys.ENTER);
            }

            // Cambio de vista/iframe posible
            driver.switchTo().defaultContent();
            switchIntoAuthFrameIfNeeded();

            // Esperar alguna de las 3 condiciones: password, greeting/home, magic link
            long deadline = System.currentTimeMillis() + 12000;
            while (System.currentTimeMillis() < deadline) {
                if (present(passCss) || present(passViaLabel)) {
                    break;
                }
                if (present(navbarGreeting) || driver.getCurrentUrl().contains("/home")) {
                    return; // ya adentro
                }
                if (present(magicLinkNotice)) {
                    throw new IllegalStateException(
                            "El login está en modo 'magic link' en este entorno. "
                            + "Para E2E, habilitá 'email + contraseña' o un usuario de pruebas sin magic link."
                    );
                }
                try {
                    Thread.sleep(300);
                } catch (InterruptedException ignored) {
                }
            }

            // Si sigue sin aparecer el pass y no estamos logueados: último intento (por label)
            passField = driver.findElements(passCss).stream().findFirst().orElse(null);
            if (passField == null) {
                passField = driver.findElements(passViaLabel).stream().findFirst().orElse(null);
            }
        }

        if (passField == null) {
            throw new TimeoutException("No se encontró el campo de contraseña tras continuar. "
                    + "Verificá si el entorno exige magic link/OTP y usá un usuario apto para E2E.");
        }

        jsScroll(passField);

        // En headless a veces no queda "clickable": set por JS si falla el sendKeys
        try {
            passField.clear();
            passField.sendKeys(pass);
        } catch (Exception e) {
            jsSetValue(passField, pass);
        }

        // SUBMIT (o ENTER)
        WebElement submit = waitClickable(submitCss, 1);
        if (submit != null) {
            jsScroll(submit);
            safeClick(submit);
        } else {
            passField.sendKeys(Keys.ENTER);
        }

        try {
            driver.switchTo().defaultContent();
        } catch (Exception ignore) {
        }

        new WebDriverWait(driver, Duration.ofSeconds(35)).until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(navbarGreeting),
                ExpectedConditions.urlContains("/home")
        ));
    }
}
