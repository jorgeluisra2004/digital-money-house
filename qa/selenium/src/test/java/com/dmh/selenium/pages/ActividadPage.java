package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class ActividadPage {
  private final WebDriver driver;
  private final WebDriverWait wait;
  private final String baseUrl;

  private final By search = By.cssSelector("input[placeholder*='Buscar']");
  private final By openFilters = By.xpath("//button[normalize-space()='Filtrar']");
  private final By applyFilters = By.xpath("//button[normalize-space()='Aplicar']");
  private final By clearFilters = By.xpath("//button[normalize-space()='Borrar filtros']");

  private static String resolveBaseUrl() {
    String prop = System.getProperty("BASE_URL");
    String env = System.getenv("BASE_URL");
    String url = (prop != null && !prop.isBlank()) ? prop
            : (env != null && !env.isBlank()) ? env
            : "http://localhost:3000";
    return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
  }

  public ActividadPage(WebDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    this.baseUrl = resolveBaseUrl();
  }

  private String abs(String p){ return p.startsWith("http") ? p : baseUrl + (p.startsWith("/")?p:"/"+p); }

  public void open() {
    driver.navigate().to(abs("/actividad"));
    wait.until(ExpectedConditions.visibilityOfElementLocated(search));
  }

  /* Nombres que esperan los smoke tests */
  public void assertLoaded() {
    wait.until(ExpectedConditions.visibilityOfElementLocated(search));
  }

  public void openFilters() {
    wait.until(ExpectedConditions.elementToBeClickable(openFilters)).click();
  }

  public void choosePeriodo(String label) {
    By btn = By.xpath("//section[.//p[contains(.,'Período')]]//button[normalize-space()='"+label+"']");
    wait.until(ExpectedConditions.elementToBeClickable(btn)).click();
  }

  public void chooseOperacion(String label) {
    By btn = By.xpath("//section[.//p[contains(.,'Operación')]]//button[normalize-space()='"+label+"']");
    wait.until(ExpectedConditions.elementToBeClickable(btn)).click();
  }

  public void applyFilters() {
    wait.until(ExpectedConditions.elementToBeClickable(applyFilters)).click();
  }

  public void clearAll() {
    if (!driver.findElements(clearFilters).isEmpty()) {
      driver.findElement(clearFilters).click();
    }
  }
}
