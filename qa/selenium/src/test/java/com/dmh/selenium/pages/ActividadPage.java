package com.dmh.selenium.pages;

import com.dmh.selenium.BaseTest;
import org.openqa.selenium.By;

public class ActividadPage extends BaseTest {
  private final By list = By.cssSelector("[data-testid='actividad-list']");
  private final By search = By.cssSelector("[data-testid='actividad-search-input']");
  private final By btnFilter = By.xpath("//button[normalize-space()='Filtrar']");
  private final By btnApply = By.cssSelector("[data-testid='filters-apply']");
  private final By btnClear = By.cssSelector("[data-testid='filters-clear']");
  private By periodBtn(String key) { // ej: ultimo_mes
    return By.cssSelector("button[aria-pressed='true'], button");
  }

  public void assertLoaded() { el(list); }

  public void openFilters() { click(btnFilter); }

  public void choosePeriodo(String key) {
    // usamos el texto visible que está en PERIODS
    click(By.xpath("//section[.//p[contains(text(),'Período')]]//button[.='"+ labelFor(key) +"']"));
  }

  public void chooseOperacion(String v) {
    click(By.xpath("//section[.//p[contains(text(),'Operación')]]//button[.='"+ textOp(v) +"']"));
  }

  public void applyFilters() { click(btnApply); }

  public void clearFilters() { click(btnClear); }

  private String labelFor(String key) {
    return switch (key) {
      case "hoy" -> "Hoy";
      case "ayer" -> "Ayer";
      case "ultima_semana" -> "Última semana";
      case "ultimos_15" -> "Últimos 15 días";
      case "ultimo_mes" -> "Último mes";
      case "ultimos_3_meses" -> "Últimos 3 meses";
      default -> "Todos";
    };
  }
  private String textOp(String v){
    return switch (v) {
      case "ingresos" -> "Ingresos";
      case "egresos" -> "Egresos";
      default -> "Todas";
    };
  }
}
