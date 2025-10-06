import { test, expect } from "@playwright/test";
import { freezeTime, stubSupabaseActividad } from "./utils/mockApi";

test.beforeEach(async ({ page }) => {
  // Fuerza modo E2E en runtime y limpia ruidos visuales (devtools/animaciones)
  await page.addInitScript(() => {
    // @ts-ignore
    window.__E2E__ = true;
    const style = document.createElement("style");
    style.innerHTML = `
      [data-nextjs-devtools-root],
      [data-next-dev-toolbar],
      [aria-label="Open Next.js Dev Tools"],
      #__next-dev-tools, #nextjs-devtools {
        display: none !important; visibility: hidden !important; pointer-events: none !important;
      }
      *, *::before, *::after { transition: none !important; animation: none !important; }
    `;
    document.documentElement.appendChild(style);
  });

  await freezeTime(page); // fija fecha/hora estable
  await stubSupabaseActividad(page); // intercepta /movimientos
});

test("Actividad: listado, filtros y paginación idénticos", async ({ page }) => {
  await page.goto("/actividad?e2e=1", { waitUntil: "domcontentloaded" });

  // Espera al root de la sección
  await page.getByTestId("actividad-root").waitFor({ state: "visible" });

  // ✅ Snapshot del CARD (no de toda la página) para evitar diferencias de viewport
  const card = page.getByTestId("actividad-card");
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot("actividad-lista.png", {
    maxDiffPixelRatio: 0.1,
  });

  // Abrir filtros y snapshot del POPOVER (tolerancia mayor por sombras/scrollbar)
  await page.getByRole("button", { name: "Filtrar" }).click();
  const pop = page.getByTestId("filter-popover");
  await expect(pop).toBeVisible();
  await expect(pop).toHaveScreenshot("actividad-filtros-abiertos.png", {
    maxDiffPixelRatio: 0.3,
  });

  // Elegir "Último año" y aplicar
  await page.getByText("Último año", { exact: true }).click();
  await page.getByRole("button", { name: "Aplicar" }).click();

  // Búsqueda y recálculo
  await page.getByPlaceholder("Buscar en tu actividad").fill("ingresaste");
  await page.keyboard.press("Enter");

  // Paginación: estilo caja gris en página 1
  const active = page.getByRole("button", { name: /^1$/ });
  await expect(active).toHaveCSS("background-color", "rgb(233, 233, 233)"); // ~#e9e9e9
});
