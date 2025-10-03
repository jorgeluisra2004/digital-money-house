// src/lib/envCheck.js
export function checkServerEnv() {
  const missing = [];
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) missing.push("SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ Falta RESEND_API_KEY: el envío de códigos por email no funcionará."
    );
  }
}
