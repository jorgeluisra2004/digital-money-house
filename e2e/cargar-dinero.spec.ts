import { test, expect } from "@playwright/test";
import { freezeTime, stubSupabaseCarga } from "./utils/mockApi";

test.beforeEach(async ({ page }) => {
  await freezeTime(page);
  await stubSupabaseCarga(page);
});

test("Flujo completo con tarjeta hasta éxito (visual idéntico)", async ({
  page,
}) => {
  await page.goto("/cargar-dinero");

  // Tiles iniciales
  await expect(page).toHaveScreenshot("cargar-tiles.png");

  await page.getByTestId("btn-card").click();

  // Selección de tarjeta (radio aro negro + punto lima)
  await expect(page).toHaveScreenshot("cargar-seleccionar-tarjeta.png");
  await page.getByTestId("card-radio-0000").click();
  await page.getByTestId("btn-card-continue").click();

  // Monto (sin presets, input oscuro)
  const input = page.getByTestId("amount-input");
  await expect(page).toHaveScreenshot("cargar-monto.png");
  await input.fill("300");
  await page.getByTestId("btn-amount-continue").click();

  // Review
  await expect(page).toHaveScreenshot("cargar-review.png");
  await page.getByTestId("btn-review-continue").click();

  // Éxito
  await expect(page.getByTestId("success-banner")).toBeVisible();
  await expect(page).toHaveScreenshot("cargar-exito.png");
});
