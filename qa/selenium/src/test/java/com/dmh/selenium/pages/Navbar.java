package com.dmh.selenium.pages;

import com.dmh.selenium.BaseTest;
import org.openqa.selenium.By;

public class Navbar extends BaseTest {
  private final By greeting = By.cssSelector("[data-testid='navbar-user-greeting']");

  public void clickGreeting() {
    click(greeting);
  }
}
