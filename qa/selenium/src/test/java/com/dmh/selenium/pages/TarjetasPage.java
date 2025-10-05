package com.dmh.selenium.pages;

import com.dmh.selenium.BaseTest;
import org.openqa.selenium.By;

public class TarjetasPage extends BaseTest {
  private final By alta = By.cssSelector("[data-testid='btn-alta-tarjeta']");
  private final By brandInfo = By.cssSelector("[data-testid='tarjetas-brand-detect']");
  private final By limitBanner = By.cssSelector("[data-testid='tarjetas-limit-banner']");

  private final By number = By.xpath("//input[contains(@placeholder,'Número')]");
  private final By expiry = By.xpath("//input[contains(@placeholder,'vencimiento') or contains(@placeholder,'MM/YY')]");
  private final By name = By.xpath("//input[contains(@placeholder,'Nombre')]");
  private final By cvv = By.xpath("//input[contains(@placeholder,'Código')]");
  private final By submit = By.xpath("//button[normalize-space()='Continuar']");

  public void openList() { go("/tarjetas"); }
  public void openForm() { click(alta); }

  public void assertBrandShown(String brand) {
    String txt = el(brandInfo).getText().toLowerCase();
    if (!txt.contains(brand.toLowerCase())) {
      throw new AssertionError("Se esperaba marca "+brand+" en '"+txt+"'");
    }
  }

  public void createVisaDemo() {
    type(number, "4111 1111 1111 1111");
    type(expiry, "12/30");
    type(name, "QA Tester");
    type(cvv, "123");
    click(submit);
  }

  public boolean isLimitBannerVisible() {
    try { el(limitBanner); return true; } catch (Exception e) { return false; }
  }
}
