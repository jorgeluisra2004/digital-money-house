// e2e/sprint2-regression.spec.ts
import { test, expect } from "@playwright/test";
import { freezeTime, stubSupabaseActividad } from "./utils/mockApi";

test.use({ viewport: { width: 1280, height: 720 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__E2E__ = true;
    const style = document.createElement("style");
    style.innerHTML = `
      [data-nextjs-devtools-root],
      [data-next-dev-toolbar],
      [aria-label="Open Next.js Dev Tools"],
      #__next-dev-tools, #nextjs-devtools {
        display:none!important;visibility:hidden!important;pointer-events:none!important;
      }
      *,*::before,*::after{transition:none!important;animation:none!important;}
    `;
    document.documentElement.appendChild(style);
  });
  await freezeTime(page);
  await stubSupabaseActividad(page);
})

// --- helper: stubs de Home (usuarios, cuentas, movimientos) ---
async function stubHome(page: import("@playwright/test").Page) {
  // usuarios (.single() → devolver objeto)
  await page.route("**/rest/v1/usuarios**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "e2e-user",
        nombre: "Mauricio",
        apellido: "Brito",
        email: "e2e@example.com",
        dni: "20123456",
        telefono: "1111111111",
      }),
    });
  });

  // cuentas (array con una)
  await page.route("**/rest/v1/cuentas**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "acc_e2e",
          usuario_id: "e2e-user",
          saldo: 12345.67,
          cvu: "0000031000047630488114",
          alias: "e2e.alias.prueba",
        },
      ]),
    });
  });

  // movimientos (últimos 10)
  await page.route("**/rest/v1/movimientos**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const base = new Date("2024-01-15T10:00:00.000Z").getTime();
    const rows = Array.from({ length: 10 }).map((_, i) => ({
      id: `mov_${i + 1}`,
      usuario_id: "e2e-user",
      tipo: i % 2 ? "Pago" : "Ingreso",
      descripcion: i % 2 ? "Pago de servicio" : "Ingreso por transferencia",
      destinatario: i % 2 ? "Cablevisión" : "Juan Pérez",
      monto: i % 2 ? -1000 * (i + 1) : 1500 * (i + 1),
      fecha: new Date(base - i * 86400000).toISOString(),
      referencia: `REF-${1000 + i}`,
    }));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rows),
    });
  });
}

// --- helper existente: stubs mínimos para /cargar-dinero ---
async function stubCuentaYTarjetas(page: import("@playwright/test").Page) {
  // cuentas
  await page.route("**/rest/v1/cuentas**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "acc_e2e",
          saldo: 0,
          cvu: "0000000000000000000000",
          alias: "estealiasnoexiste",
        },
      ]),
    });
  });
  // tarjetas
  await page.route("**/rest/v1/tarjetas**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "demo-1", brand: "Visa", last4: "0000" },
        { id: "demo-2", brand: "Mastercard", last4: "4067" },
      ]),
    });
  });
}

// 1) Home: saldo y acciones principales
test("Home muestra saldo/acciones principales", async ({ page }) => {
  await stubHome(page);
  await page.goto("/home?e2e=1", { waitUntil: "domcontentloaded" });

  // Texto del saldo
  await expect(page.getByText(/dinero disponible/i)).toBeVisible();

  // Acciones reales del componente Home
  await expect(
    page.getByRole("link", { name: /^Pago de servicios$/ })
  ).toBeVisible();

  // CTA para ir a actividad
  await expect(page.getByTestId("home-cta-actividad")).toBeVisible();
});

// 2) Cargar dinero (negativo): “cancelar” saliendo a /tarjetas
test("Cargar dinero: cancelar en paso de tarjeta (negativo)", async ({
  page,
}) => {
  await stubCuentaYTarjetas(page);
  await page.goto("/cargar-dinero?e2e=1", { waitUntil: "domcontentloaded" });

  // esperamos a que se rendericen las opciones (indica que no estamos en loading)
  await expect(page.getByTestId("cargar-options")).toBeVisible();

  // Ir a seleccionar tarjeta
  await page.getByTestId("btn-card").click();
  await expect(page.getByTestId("card-select-panel")).toBeVisible();

  // "Cancelar" saliendo del flujo vía "Nueva tarjeta"
  await page.getByRole("link", { name: /nueva tarjeta/i }).click();
  await expect(page).toHaveURL(/\/tarjetas$/);

  // Volver y comprobar que seguimos pudiendo abrir el flujo
  await page.goBack();
  await expect(page).toHaveURL(/\/cargar-dinero/);
  await expect(page.getByTestId("cargar-options")).toBeVisible();
});

// 3) Sidebar: Home -> Actividad -> Tarjetas
test("Sidebar navega: Home -> Actividad -> Tarjetas", async ({ page }) => {
  await stubHome(page); // para que /home renderice estable
  await page.goto("/home?e2e=1", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /^Actividad$/ }).click();
  await expect(page.getByText(/^tu actividad$/i).first()).toBeVisible();
  await page.getByRole("link", { name: /^Tarjetas$/ }).click();
  await expect(page).toHaveURL(/\/tarjetas$/);
});
