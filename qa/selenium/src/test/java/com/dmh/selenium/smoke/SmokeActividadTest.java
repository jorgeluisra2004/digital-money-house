package com.dmh.selenium.smoke;

import org.junit.jupiter.api.Test;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.ActividadPage;
import com.dmh.selenium.pages.HomePage;
import com.dmh.selenium.pages.LoginPage;

public class SmokeActividadTest extends BaseTest {

    @Test
    void homeEnterRedirectsWithQuery() {
        new LoginPage(driver, wait, baseUrl)
                .login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
        HomePage home = new HomePage(driver, wait, baseUrl);
        home.open();
        home.searchEnter("luz");
        assertUrlContains("/actividad?q=luz");
        new ActividadPage(driver).assertLoaded();
    }

    @Test
    void actividadFiltersSyncWithUrl() {
        new LoginPage(driver, wait, baseUrl)
                .login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
        driver.navigate().to(baseUrl + "/actividad");
        ActividadPage act = new ActividadPage(driver);
        act.assertLoaded();
        act.openFilters();
        act.choosePeriodo("ultimo_mes");
        act.chooseOperacion("egresos");
        act.applyFilters();
        assertUrlContains("period=ultimo_mes");
        assertUrlContains("op=egresos");
    }
}
