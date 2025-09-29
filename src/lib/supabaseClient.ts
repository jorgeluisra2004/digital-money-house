import { createClient, SupabaseClient } from "@supabase/supabase-js";

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!publicUrl || !anonKey) {
  // ⚠️ Avisamos pero no interrumpimos el build
  console.warn("⚠️ Variables de entorno faltantes en supabaseClient:");
  console.warn("NEXT_PUBLIC_SUPABASE_URL:", publicUrl ? "OK" : "MISSING");
  console.warn(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    anonKey ? `OK (${anonKey.slice(0, 5)}...)` : "MISSING"
  );
} else {
  supabase = createClient(publicUrl, anonKey);
}

export { supabase };
