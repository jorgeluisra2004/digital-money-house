export function isE2E(): boolean {
  // 1) Build time (si llegó)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_E2E) {
    const v = String(process.env.NEXT_PUBLIC_E2E).toLowerCase();
    if (v === 'true' || v === '1') return true;
  }
  // 2) Runtime: inyección desde Playwright o query param
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if (window.__E2E__ === true) return true;
    const p = new URLSearchParams(window.location.search);
    if ((p.get('e2e') || '').toLowerCase() === '1') return true;
  }
  return false;
}
