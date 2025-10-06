package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class Navbar {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final By greeting = By.cssSelector("[data-testid='navbar-user-greeting']");

    public Navbar(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    public void clickGreeting() {
        WebElement el = wait.until(ExpectedConditions.visibilityOfElementLocated(greeting));
        new Actions(driver).moveToElement(el).pause(Duration.ofMillis(100)).perform();
        try {
            el.click();
        } catch (WebDriverException ex) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
        }
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/home"));
    }
}
