package com.dmh.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class Navbar {

    private final WebDriver driver;
    private final By greeting = By.cssSelector("[data-testid='navbar-user-greeting']");

    public Navbar(WebDriver driver) {
        this.driver = driver;
    }

    public void clickGreeting() {
        driver.findElement(greeting).click();
    }
}
