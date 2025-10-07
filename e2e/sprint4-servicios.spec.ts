import { test, expect } from "@playwright/test";
import {
  freezeTime,
  stubSupabaseActividad,
  stubSupabaseCuentasTarjetas,
} from "./utils/mockApi";

test.use({ viewport: { width: 1280, height: 720 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error e2e flag
    window.__E2E__ = true;
    const style = document.createElement("style");
    style.innerHTML = `
      [data-nextjs-devtools-root],
      [data-next-dev-toolbar],
      [aria-label="Open Next.js Dev Tools"],
      #__next-dev-tools, #nextjs-devtools { display:none!important; visibility:hidden!important; pointer-events:none!important; }
      *, *::before, *::after { transition:none!important; animation:none!important; }
    `;
    document.documentElement.appendChild(style);
  });
  await freezeTime(page);
  await stubSupabaseActividad(page);
});

/* ────────────────────────────────────────────────────────────────────────── */
/* 1) Listado sin paginar + buscador                                          */
/* ────────────────────────────────────────────────────────────────────────── */
test("Servicios: listado sin paginar + buscador", async ({ page }) => {
  await page.goto("/pagar-servicios?e2e=1", { waitUntil: "domcontentloaded" });

  const search = page.getByTestId("servicios-search");
  await expect(search).toBeVisible();
  await search.fill("cable");

  await expect(page.getByTestId("servicio-cablevision")).toBeVisible();
  await expect(page.getByTestId("servicio-personal")).toHaveCount(0);
});

/* ────────────────────────────────────────────────────────────────────────── */
/* 2) Pago con tarjeta → muestra error idéntico y permite reintentar          */
/*    (NO hay pago con dinero en cuenta)                                      */
/* ────────────────────────────────────────────────────────────────────────── */
test("Pago con tarjeta → muestra error idéntico y permite reintentar", async ({
  page,
}) => {
  // saldo 0 para que no aparezca ninguna alternativa de dinero en cuenta
  await stubSupabaseCuentasTarjetas(page, { saldo: 0 });

  // 1) Selección de servicio -> identificador -> medios de pago
  await page.goto("/pagar-servicios/cablevision/identificador?e2e=1", {
    waitUntil: "domcontentloaded",
  });
  await page.getByTestId("ident-input").fill("37289701912");
  await page.getByTestId("ident-continue").click();

  await page.waitForURL(/\/pagar-servicios\/cablevision\/pagar/i);

  // 2) Cabecera visible (total a pagar / UI del paso)
  await expect(page.getByText(/total a pagar/i).first()).toBeVisible();

  // 3) Confirmamos que NO exista la opción de pagar con saldo en cuenta
  await expect(page.getByTestId("pago-saldo-btn")).toHaveCount(0);

  // 4) Pagar con tarjeta → debe aparecer el panel de error del diseño
  const pagarBtn = page.getByRole("button", { name: /^Pagar$/ });
  await expect(pagarBtn).toBeVisible();
  await pagarBtn.click();

  // Panel de error (localizado por el copy exacto del diseño)
  const panel = page
    .locator("section,div")
    .filter({ hasText: "Hubo un problema con tu pago" })
    .first();
  await expect(panel).toBeVisible();

  // fijamos tamaño para snapshot nítido
  await panel.evaluate((el) => {
    const st = el as HTMLElement;
    st.style.width = "972px";
    st.style.height = "240px";
    st.style.maxWidth = "none";
  });
  await expect(panel).toHaveScreenshot("pago-card-error.png", {
    maxDiffPixelRatio: 0.1,
  });

  // 5) CTA "Volver a intentarlo" regresa al paso de selección (botón Pagar visible)
  await page.getByRole("button", { name: /volver a intentarlo/i }).click();
  await expect(page.getByRole("button", { name: /^Pagar$/ })).toBeVisible();
});
