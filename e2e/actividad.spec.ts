import { test, expect } from "@playwright/test";
import { freezeTime, stubSupabaseActividad } from "./utils/mockApi";

test.beforeEach(async ({ page }) => {
  await freezeTime(page); // fija fecha/hora
  await stubSupabaseActividad(page); // intercepta /movimientos
});

test("Actividad: listado, filtros y paginación idénticos", async ({ page }) => {
  await page.goto("/actividad");

  // Snapshot de la lista (baseline)
  await expect(page).toHaveScreenshot("actividad-lista.png");

  // Panel de filtros “idéntico”
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveScreenshot("actividad-filtros-abiertos.png");

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
