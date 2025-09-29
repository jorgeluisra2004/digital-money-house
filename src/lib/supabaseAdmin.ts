import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      // ⚠️ Solo mostramos un warning en vez de romper el build
      console.warn("⚠️ Variables de entorno faltantes en supabaseAdmin:");
      console.warn("SUPABASE_URL:", url ? "OK" : "MISSING");
      console.warn(
        "SUPABASE_SERVICE_ROLE_KEY:",
        serviceRoleKey ? `OK (${serviceRoleKey.slice(0, 5)}...)` : "MISSING"
      );

      // Retornamos null para que el código que lo use pueda manejarlo
      return null;
    }

    supabaseAdmin = createClient(url, serviceRoleKey);
  }

  return supabaseAdmin;
}
