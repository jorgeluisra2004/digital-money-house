package com.dmh.selenium.smoke;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.PerfilPage;
import org.junit.jupiter.api.Test;

public class SmokePerfilTest extends BaseTest {

  @Test
  void editAliasToThreeWordsAndCopy() {
    new LoginPage().login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
    PerfilPage perfil = new PerfilPage();
    perfil.open();
    perfil.editAlias("uno.dos.tres");
    perfil.copyBoth(); // valida que los botones existan y no tiren error
  }
}
