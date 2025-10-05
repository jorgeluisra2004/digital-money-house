package com.dmh.selenium.smoke;

import com.dmh.selenium.BaseTest;
import com.dmh.selenium.pages.HomePage;
import com.dmh.selenium.pages.LoginPage;
import com.dmh.selenium.pages.ActividadPage;
import org.junit.jupiter.api.Test;

public class SmokeActividadTest extends BaseTest {

  @Test
  void homeEnterRedirectsWithQuery() {
    new LoginPage().login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
    HomePage home = new HomePage();
    home.open();
    home.searchEnter("luz");
    assertUrlContains("/actividad?q=luz");
    new ActividadPage().assertLoaded();
  }

  @Test
  void actividadFiltersSyncWithUrl() {
    new LoginPage().login(System.getProperty("E2E_EMAIL"), System.getProperty("E2E_PASSWORD"));
    go("/actividad");
    ActividadPage act = new ActividadPage();
    act.assertLoaded();
    act.openFilters();
    act.choosePeriodo("ultimo_mes");
    act.chooseOperacion("egresos");
    act.applyFilters();
    assertUrlContains("period=ultimo_mes");
    assertUrlContains("op=egresos");
  }
}
