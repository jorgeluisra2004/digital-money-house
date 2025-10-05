package com.dmh.selenium.smoke;

import org.junit.jupiter.api.Test;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.Navbar;

public class SmokeNavigationTest extends BaseTest {

    @Test
    void greetingRedirectsToHome() {
        new LoginPage(driver, wait, baseUrl)
                .login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
        new Navbar(driver).clickGreeting();
        assertUrlContains("/home");
    }
}
