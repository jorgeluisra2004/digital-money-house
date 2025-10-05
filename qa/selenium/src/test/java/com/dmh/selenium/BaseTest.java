package com.dmh.selenium;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseTest {

  protected WebDriver driver;
  protected WebDriverWait wait;
  protected String baseUrl = System.getProperty("BASE_URL", "http://localhost:3000");

  @BeforeAll
  void setupDriver() {
    WebDriverManager.chromedriver().setup();
  }

  @BeforeEach
  void openBrowser() {
    ChromeOptions options = new ChromeOptions();
    if (Boolean.parseBoolean(System.getProperty("HEADLESS", "true"))) {
      options.addArguments("--headless=new");
    }
    options.addArguments("--window-size=1366,900");
    options.addArguments("--disable-dev-shm-usage", "--no-sandbox");
    driver = new ChromeDriver(options);
    wait = new WebDriverWait(driver, Duration.ofSeconds(15));
  }

  @AfterEach
  void quit() {
    if (driver != null) driver.quit();
  }

  protected void go(String path) {
    driver.navigate().to(baseUrl + path);
  }

  protected WebElement el(By by) {
    return wait.until(ExpectedConditions.visibilityOfElementLocated(by));
  }

  protected void click(By by) {
    wait.until(ExpectedConditions.elementToBeClickable(by)).click();
  }

  protected void type(By by, String text) {
    WebElement e = el(by);
    e.clear();
    e.sendKeys(text);
  }

  protected void pressEnter(By by) {
    el(by).sendKeys(Keys.ENTER);
  }

  protected void assertUrlContains(String fragment) {
    wait.until(ExpectedConditions.urlContains(fragment));
    Assertions.assertTrue(driver.getCurrentUrl().contains(fragment),
        "URL debería contener: " + fragment + " pero es: " + driver.getCurrentUrl());
  }
}
