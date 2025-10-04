import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_USER!;
const PASS = process.env.E2E_PASS!;

test.describe("Auth (smoke)", () => {
  test.skip(!EMAIL || !PASS, "Configura E2E_USER y E2E_PASS en el entorno");

  test("la sesión persiste al recargar", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(EMAIL);
    await page.getByLabel(/contraseña|password/i).fill(PASS);
    await page.getByRole("button", { name: /ingresar/i }).click();

    await page.waitForURL("**/home");
    await page.reload();
    await expect(page).toHaveURL(/\/home/);
  });

  test("logout -> landing y tokens limpiados", async ({ page }) => {
    // asume que venimos logueados de la prueba previa:
    if (!/\/home/.test(page.url())) await page.goto("/home");

    // botón 'Cerrar sesión' (sidebar/navbar). Ajusta si tu selector cambia:
    await page.getByRole("button", { name: /cerrar sesión/i }).click();

    // debe ir a landing/promo ("/")
    await page.waitForURL("**/");

    // No deben quedar tokens de supabase ni claves propias:
    const leftovers = await page.evaluate(() =>
      Object.keys(window.localStorage).filter(
        (k) =>
          k.startsWith("sb-") ||
          k.includes("supabase.auth.token") ||
          ["dmh-auth", "dmh_token", "dmh_refresh"].includes(k)
      )
    );
    expect(
      leftovers,
      `Quedaron claves en localStorage: ${leftovers.join(",")}`
    ).toHaveLength(0);
  });
});
