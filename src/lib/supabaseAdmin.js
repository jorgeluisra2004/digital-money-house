import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("❌ Variables de entorno faltantes en supabaseAdmin:");
  console.error("SUPABASE_URL:", url ? "OK" : "MISSING");
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY:",
    serviceRoleKey ? `OK (${serviceRoleKey.slice(0, 5)}...)` : "MISSING"
  );
  throw new Error("❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}
export const supabaseAdmin = createClient(url, serviceRoleKey);
