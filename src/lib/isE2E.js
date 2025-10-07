export function isE2E() {
  // 1) Build-time (var pública)
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_E2E) {
    const v = String(process.env.NEXT_PUBLIC_E2E).toLowerCase();
    if (v === "true" || v === "1") return true;
  }
  // 2) Runtime: flag de Playwright o query ?e2e=1
  if (typeof window !== "undefined") {
    if (window.__E2E__ === true) return true; // inyectado en addInitScript
    const p = new URLSearchParams(window.location.search);
    if ((p.get("e2e") || "").toLowerCase() === "1") return true;
  }
  return false;
}
