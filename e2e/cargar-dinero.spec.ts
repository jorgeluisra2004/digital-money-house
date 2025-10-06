import { test, expect } from "@playwright/test";
import { freezeTime, stubSupabaseCarga } from "./utils/mockApi";

test.describe.configure({ timeout: 90_000 });

test.beforeEach(async ({ page, context }) => {
  await context.addCookies([
    {
      name: "dmh_e2e",
      value: "1",
      url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    },
  ]);

  await page.addInitScript(() => {
    // @ts-ignore
    window.__E2E__ = true;
    const style = document.createElement("style");
    style.innerHTML = `
      [data-nextjs-devtools-root],[data-next-dev-toolbar],
      [aria-label="Open Next.js Dev Tools"],#__next-dev-tools,#nextjs-devtools { display:none !important; }
      *,*::before,*::after { transition:none !important; animation:none !important; }
      html,body,* { letter-spacing:0 !important; }
    `;
    document.documentElement.appendChild(style);
  });

  await freezeTime(page);
  await stubSupabaseCarga(page);
});

test("Flujo completo con tarjeta hasta éxito (visual idéntico)", async ({
  page,
}) => {
  await page.goto("/cargar-dinero?e2e=1", { waitUntil: "domcontentloaded" });

  // Tiles iniciales – snapshot del grid de opciones
  await expect(page.getByTestId("cargar-options")).toHaveScreenshot(
    "cargar-tiles.png",
    {
      maxDiffPixelRatio: 0.1,
    }
  );

  const btnCard = page.getByTestId("btn-card");
  await btnCard.waitFor({ state: "visible" });
  await btnCard.click();

  // Selección de tarjeta (panel blanco)
  await expect(page.getByTestId("card-select-panel")).toHaveScreenshot(
    "cargar-seleccionar-tarjeta.png",
    { maxDiffPixelRatio: 0.1 }
  );
  await page.getByTestId("card-radio-0000").click();
  await page.getByTestId("btn-card-continue").click();

  // Monto (contenedor del formulario)
  await expect(page.getByTestId("amount-panel")).toHaveScreenshot(
    "cargar-monto.png",
    {
      maxDiffPixelRatio: 0.1,
    }
  );
  await page.getByTestId("amount-input").fill("300");
  await page.getByTestId("btn-amount-continue").click();

  // Review
  await expect(page.getByTestId("review-panel")).toHaveScreenshot(
    "cargar-review.png",
    {
      maxDiffPixelRatio: 0.1,
    }
  );
  await page.getByTestId("btn-review-continue").click();

  // Éxito
  await expect(page.getByTestId("success-banner")).toBeVisible();
  await expect(page.getByTestId("success-panel")).toHaveScreenshot(
    "cargar-exito.png",
    {
      maxDiffPixelRatio: 0.1,
    }
  );
});
