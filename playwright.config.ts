import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Más holgado para el primer arranque y screenshots
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    viewport: { width: 1280, height: 800 },
  },
  // Servidor estable: build + start (sin dev overlay)
  webServer: {
    command:
      "cross-env NEXT_PUBLIC_E2E=true NEXT_PUBLIC_ENV=e2e NEXT_TELEMETRY_DISABLED=1 npm run build && cross-env NEXT_PUBLIC_E2E=true NEXT_PUBLIC_ENV=e2e NEXT_TELEMETRY_DISABLED=1 npx next start -p 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_E2E: "true",
      NEXT_PUBLIC_ENV: "e2e",
      NODE_ENV: "production",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
