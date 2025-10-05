package com.dmh.selenium.smoke;

import org.junit.jupiter.api.Test;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.TarjetasPage;

public class SmokeTarjetasTest extends BaseTest {

    @Test
    void altaTarjetaVisaDetectada() {
        new LoginPage(driver, wait, baseUrl)
                .login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
        TarjetasPage t = new TarjetasPage(driver);
        t.openList(baseUrl);
        t.openForm();
        t.assertBrandShown("Visa");
        t.createVisaDemo();
        assertUrlContains("/tarjetas");
    }
}
