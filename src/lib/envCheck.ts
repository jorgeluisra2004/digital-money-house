// lib/envCheck.ts
export function checkEnv() {
  const requiredServerVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
  ];

  const requiredClientVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missingServerVars = requiredServerVars.filter(
    (v) => !process.env[v]
  );
  const missingClientVars = requiredClientVars.filter(
    (v) => !process.env[v]
  );

  if (missingServerVars.length) {
    throw new Error(
      `❌ Faltan variables de entorno SERVER: ${missingServerVars.join(", ")}`
    );
  }

  if (missingClientVars.length) {
    throw new Error(
      `❌ Faltan variables de entorno CLIENT: ${missingClientVars.join(", ")}`
    );
  }

  console.log("✅ Todas las variables críticas de entorno están definidas");
}
