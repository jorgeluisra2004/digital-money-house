package com.dmh.selenium.smoke;

import org.junit.jupiter.api.Test;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.PerfilPage;

public class SmokePerfilTest extends BaseTest {

    @Test
    void editAliasToThreeWordsAndCopy() {
        new LoginPage(driver, wait, baseUrl)
                .login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
        PerfilPage perfil = new PerfilPage(driver);
        perfil.open();
        perfil.editAlias("uno.dos.tres");
        perfil.copyBoth();
    }
}
