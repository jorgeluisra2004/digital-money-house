// Utilidad runtime/build-safe para detectar entorno E2E (Playwright)
export function isE2E() {
  // Build-time
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_E2E) {
    const v = String(process.env.NEXT_PUBLIC_E2E).toLowerCase();
    if (v === "true" || v === "1") return true;
  }
  // Runtime / query
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-underscore-dangle
    if (window.__E2E__ === true) return true;
    const p = new URLSearchParams(window.location.search);
    if ((p.get("e2e") || "").toLowerCase() === "1") return true;
  }
  return false;
}
