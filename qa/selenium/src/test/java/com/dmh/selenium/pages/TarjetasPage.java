package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class TarjetasPage {
  private final WebDriver driver;
  private final WebDriverWait wait;
  private final String baseUrl;

  private final By nuevaTarjeta = By.xpath("//span[contains(.,'Nueva tarjeta')]/ancestor::button");
  private final By number = By.cssSelector("input[placeholder^='Numero']");
  private final By expiry = By.cssSelector("input[placeholder^='Fecha']");
  private final By name = By.cssSelector("input[placeholder^='Nombre']");
  private final By cvv = By.cssSelector("input[placeholder^='Codigo']");
  private final By continuar = By.xpath("//button[normalize-space()='Continuar']");

  /* En la card preview aparece un badge con 'VISA' o 'MC' */
  private By brandBadge(String txtUpper) {
    return By.xpath("//div[@class='w-12 h-8 rounded-md bg-white/20 grid place-items-center text-[10px] tracking-widest' and normalize-space()='"+txtUpper+"']");
  }

  private static String resolveBaseUrl() {
    String prop = System.getProperty("BASE_URL");
    String env = System.getenv("BASE_URL");
    String url = (prop != null && !prop.isBlank()) ? prop
            : (env != null && !env.isBlank()) ? env
            : "http://localhost:3000";
    return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
  }

  public TarjetasPage(WebDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    this.baseUrl = resolveBaseUrl();
  }

  private String abs(String p){ return p.startsWith("http") ? p : baseUrl + (p.startsWith("/")?p:"/"+p); }

  public void open() {
    driver.navigate().to(abs("/tarjetas"));
    wait.until(ExpectedConditions.elementToBeClickable(nuevaTarjeta));
  }

  /* Wrappers con los nombres que usa el Smoke test */
  public void openList(String ignored) { open(); }

  public void openForm() {
    wait.until(ExpectedConditions.elementToBeClickable(nuevaTarjeta)).click();
    wait.until(ExpectedConditions.visibilityOfElementLocated(number));
  }

  public void assertBrandShown(String brand) {
    String b = brand == null ? "" : brand.toLowerCase();
    String expected = b.contains("visa") ? "VISA" : (b.contains("master") ? "MC" : "");
    if (!expected.isEmpty()) {
      wait.until(ExpectedConditions.visibilityOfElementLocated(brandBadge(expected)));
    }
  }

  public void createVisaDemo() {
    wait.until(ExpectedConditions.visibilityOfElementLocated(number)).sendKeys("4111 1111 1111 1111");
    driver.findElement(expiry).sendKeys("12/30");
    driver.findElement(name).sendKeys("Smoke Tester");
    driver.findElement(cvv).sendKeys("123");
    wait.until(ExpectedConditions.elementToBeClickable(continuar)).click();

    // Listado con "Terminada en 1111"
    By terminada = By.xpath("//*[contains(text(),'Terminada en 1111')]");
    wait.until(ExpectedConditions.visibilityOfElementLocated(terminada));
  }
}
