package com.dmh.selenium.smoke;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.TarjetasPage;
import org.junit.jupiter.api.Test;

public class SmokeTarjetasTest extends BaseTest {

  @Test
  void altaTarjetaVisaDetectada() {
    new LoginPage().login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
    TarjetasPage t = new TarjetasPage();
    t.openList();
    t.openForm();
    t.assertBrandShown("Visa");
    t.createVisaDemo();
    assertUrlContains("/tarjetas"); // vuelve al listado
  }
}
