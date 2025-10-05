package com.dmh.selenium.smoke;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.Navbar;
import org.junit.jupiter.api.Test;

public class SmokeNavigationTest extends BaseTest {

  @Test
  void greetingRedirectsToHome() {
    new LoginPage().login(
        System.getProperty("E2E_EMAIL"),
        System.getProperty("E2E_PASSWORD")
    );
    new Navbar().clickGreeting();
    assertUrlContains("/home");
  }
}
