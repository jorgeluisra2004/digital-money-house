package com.dmh.selenium.pages;

import com.dmh.selenium.BaseTest;
import org.openqa.selenium.By;

public class HomePage extends BaseTest {
  private final By search = By.cssSelector("[data-testid='home-search-input']");
  private final By ctaActividad = By.cssSelector("[data-testid='home-cta-actividad']");

  public void open() { go("/home"); }

  public void searchEnter(String q) {
    type(search, q);
    pressEnter(search);
  }

  public void clickVerTodaActividad() { click(ctaActividad); }
}
