import { createClient } from "@supabase/supabase-js";

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!publicUrl || !anonKey) {
  console.error("❌ Variables de entorno faltantes en supabaseClient:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", publicUrl ? "OK" : "MISSING");
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    anonKey ? `OK (${anonKey.slice(0, 5)}...)` : "MISSING"
  );
  throw new Error(
    "❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(publicUrl, anonKey);
