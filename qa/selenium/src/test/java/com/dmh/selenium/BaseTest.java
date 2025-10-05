package com.dmh.selenium;

import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import io.github.bonigarcia.wdm.WebDriverManager;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseTest {

    protected WebDriver driver;
    protected WebDriverWait wait;
    protected String baseUrl;

    private static String resolveBaseUrl() {
        String prop = System.getProperty("BASE_URL");
        String env = System.getenv("BASE_URL");
        String url = (prop != null && !prop.isBlank()) ? prop
                : (env != null && !env.isBlank()) ? env
                : "http://localhost:3000";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    @BeforeAll
    void setupConfig() {
        WebDriverManager.chromedriver().setup();
        baseUrl = resolveBaseUrl();
    }

    @BeforeEach
    void openBrowser() {
        ChromeOptions options = new ChromeOptions();
        boolean headless = Boolean.parseBoolean(
                System.getProperty("HEADLESS",
                        String.valueOf(Boolean.parseBoolean(System.getenv("HEADLESS") == null ? "true" : System.getenv("HEADLESS"))))
        );
        if (headless) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--window-size=1366,900", "--disable-dev-shm-usage", "--no-sandbox");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(25));
    }

    @AfterEach
    void quit() {
        if (driver != null) {
            driver.quit();
        }
    }

    /* helpers */
    protected String abs(String path) {
        if (path == null || path.isBlank()) {
            return baseUrl;
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        String p = path.startsWith("/") ? path : "/" + path;
        return baseUrl + p;
    }

    protected void go(String path) {
        driver.navigate().to(abs(path));
    }

    protected WebElement el(By by) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(by));
    }

    /* ==== NUEVO: usado por todos los Smoke ==== */
    protected void assertUrlContains(String fragment) {
        wait.until(ExpectedConditions.urlContains(fragment));
    }
}
