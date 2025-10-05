package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
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
        WebElement g = wait.until(ExpectedConditions.visibilityOfElementLocated(greeting));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", g);
        try {
            wait.until(ExpectedConditions.elementToBeClickable(greeting)).click();
        } catch (Exception e) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", g);
        }
    }
}
