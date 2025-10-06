import { Page } from "@playwright/test";

// Marca el runtime del browser en modo E2E y oculta toolbars de Next Dev Tools
export async function primeE2E(page: Page) {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__E2E__ = true;
    // Ocultar overlays / devtools que ensucian snapshots
    const style = document.createElement('style');
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
}
