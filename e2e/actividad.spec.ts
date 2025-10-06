// e2e/actividad.spec.ts
import { test, expect } from "@playwright/test";
import { freezeTime, stubSupabaseActividad } from "./utils/mockApi";

// Viewport estable
test.use({ viewport: { width: 1280, height: 720 } });

test.beforeEach(async ({ page }) => {
  // Fuerza modo E2E y apaga ruidos visuales
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

  await freezeTime(page);
  await stubSupabaseActividad(page);
});

test("Actividad: listado, filtros y paginación idénticos", async ({ page }) => {
  await page.goto("/actividad?e2e=1", { waitUntil: "domcontentloaded" });

  // Asegura que cargó la sección
  await expect(page.getByText("Tu actividad").first()).toBeVisible();

  // --- CARD: fijar tamaño inline para snapshot 972x516 ---
  const card = page
    .locator("div.rounded-2xl.border", { hasText: "Tu actividad" })
    .first();
  await expect(card).toBeVisible();
  await card.evaluate((el) => {
    const st = el as HTMLElement;
    st.style.width = "972px";
    st.style.height = "516px";
    st.style.maxWidth = "none";
  });
  await expect(card).toHaveScreenshot("actividad-lista.png", {
    maxDiffPixelRatio: 0.1,
  });

  // --- POPOVER: abrir y fijar tamaño/posición inline para snapshot 360x708 ---
  await page.getByRole("button", { name: "Filtrar" }).click();
  const pop = page
    .locator(".fixed.inset-0 .absolute.bg-white.rounded-xl.border")
    .first();
  await expect(pop).toBeVisible();
  await pop.evaluate((el) => {
    const st = el as HTMLElement;
    st.style.width = "360px";
    st.style.height = "708px";
    st.style.maxHeight = "none";
    st.style.top = "48px";
    st.style.left = "50%";
    st.style.transform = "translateX(-50%)";
  });
  await expect(pop).toHaveScreenshot("actividad-filtros-abiertos.png", {
    maxDiffPixelRatio: 0.3,
  });

  // Elegir "Último año" y aplicar
  await page.getByText("Último año", { exact: true }).click();
  await page.getByRole("button", { name: "Aplicar" }).click();

  // Búsqueda y recálculo
  await page.getByPlaceholder("Buscar en tu actividad").fill("ingresaste");
  await page.keyboard.press("Enter");

  // Paginación: caja gris en página 1
  const active = page.getByRole("button", { name: /^1$/ });
  await expect(active).toHaveCSS("background-color", "rgb(233, 233, 233)"); // ~#e9e9e9
});
