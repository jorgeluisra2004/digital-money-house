// lib/envCheck.ts
export function checkServerEnv() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
  ];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length) {
    throw new Error(
      `❌ Faltan variables de entorno SERVER: ${missing.join(", ")}`
    );
  }
}

export function checkClientEnv() {
  // Úsalo SOLO en código cliente si querés validar antes de usar supabase público
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length) {
    // En cliente no tires un error fatal; logueá/avisa si querés.
    // console.warn(`❌ Faltan variables CLIENT: ${missing.join(", ")}`);
  }
}
