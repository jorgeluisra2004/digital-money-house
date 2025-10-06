import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addStyleTag({
      content: `
        [data-nextjs-devtools-root],
        [data-next-dev-toolbar],
        [aria-label="Open Next.js Dev Tools"],
        #__next-dev-tools,
        #nextjs-devtools {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `,
    });
    await use(page);
  },
});
