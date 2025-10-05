package com.dmh.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Page Object de /actividad.
 *
 * • Localizadores tolerantes (placeholders en minúsculas/acentos). • Selección
 * de filtros por texto visible y también por atributos
 * (data-value/value/aria-label), para soportar valores como "ultimo_mes" y
 * textos "Último mes". • Clicks estables: espera -> scrollIntoView -> click
 * (con fallback JS) y reintento si el panel se cerró.
 */
public class ActividadPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String baseUrl;

    // Buscador en la pantalla de actividad
    private final By search = By.cssSelector("input[placeholder*='buscar' i]");
    private final By openFilters = By.xpath("//button[normalize-space()='Filtrar']");
    private final By applyFilters = By.xpath("//button[normalize-space()='Aplicar']");
    private final By clearFilters = By.xpath("//button[normalize-space()='Borrar filtros']");

    /* -------------------- Infra mínima -------------------- */
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

    private String abs(String p) {
        return p.startsWith("http") ? p : baseUrl + (p.startsWith("/") ? p : "/" + p);
    }

    /* -------------------- Navegación y estado -------------------- */
    /**
     * Abre /actividad y espera a que el buscador esté visible.
     */
    public void open() {
        driver.navigate().to(abs("/actividad"));
        wait.until(ExpectedConditions.visibilityOfElementLocated(search));
    }

    /**
     * Asegura que la pantalla cargó (buscador visible).
     */
    public void assertLoaded() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(search));
    }

    /**
     * Abre el panel de filtros.
     */
    public void openFilters() {
        wait.until(ExpectedConditions.elementToBeClickable(openFilters)).click();
    }

    /**
     * Aplica los filtros seleccionados.
     */
    public void applyFilters() {
        wait.until(ExpectedConditions.elementToBeClickable(applyFilters)).click();
    }

    /**
     * Limpia todos los filtros si el botón existe.
     */
    public void clearAll() {
        if (!driver.findElements(clearFilters).isEmpty()) {
            driver.findElement(clearFilters).click();
        }
    }

    /* -------------------- Selección de opciones -------------------- */
    /**
     * Construye un localizador para un botón dentro de una sección de filtros.
     * La búsqueda es insensible a acentos y mayúsculas en el título de la
     * sección. Coincide tanto por atributos (data-value/value/aria-label) como
     * por texto visible.
     *
     * @param sectionTitleNoAccent Título de sección normalizado (PERIODO /
     * OPERACION)
     * @param rawLabel Label tal como lo recibe el test (p.ej. "ultimo_mes" o
     * "Último mes")
     */
    private By optionInSection(String sectionTitleNoAccent, String rawLabel) {
        String label = rawLabel == null ? "" : rawLabel.trim();

        // Normalizamos acentos en XPath: translate(., 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')
        String sect = "translate(.,'ÁÉÍÓÚáéíóú','AEIOUaeiou')";
        String txt = "translate(normalize-space(.),'ÁÉÍÓÚáéíóú','AEIOUaeiou')";

        // También normalizamos en Java para comparación de texto visible
        String want = label
                .replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
                .replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u");

        // Sección por título (PERIODO / OPERACION) sin acentos
        String section = String.format("//section[.//p[contains(%s,'%s')]]", sect, sectionTitleNoAccent);

        // Botón por atributos o por texto visible (con y sin acentos)
        String button = String.format(
                "//button["
                + "@data-value='%s' or @value='%s' or @aria-label='%s' "
                + // por atributos
                "or %s='%s' or normalize-space(.)='%s'"
                + // por texto visible (normalizado y crudo)
                "]",
                label, label, label,
                txt, want, label
        );

        return By.xpath(section + button);
    }

    /**
     * Selecciona un período (acepta "ultimo_mes" o "Último mes").
     */
    public void choosePeriodo(String label) {
        By btn = optionInSection("PERIODO", label);
        clickWithRetry(btn);
    }

    /**
     * Selecciona una operación (p.ej. "egresos").
     */
    public void chooseOperacion(String label) {
        By btn = optionInSection("OPERACION", label);
        clickWithRetry(btn);
    }

    /* -------------------- Utilidades de click estables -------------------- */
    private void clickWithRetry(By locator) {
        try {
            WebElement el = wait.until(ExpectedConditions.elementToBeClickable(locator));
            scrollAndClick(el);
        } catch (TimeoutException e) {
            // Si el panel se cerró, lo reabrimos y reintentamos una vez.
            openFilters();
            WebElement el = wait.until(ExpectedConditions.elementToBeClickable(locator));
            scrollAndClick(el);
        }
    }

    private void scrollAndClick(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", el);
        try {
            el.click();
        } catch (Exception ex) {
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
        }
    }
}
