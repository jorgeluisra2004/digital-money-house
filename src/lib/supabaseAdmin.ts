// lib/supabaseAdmin.ts
import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;

  // Usa SIEMPRE vars de servidor. Fallback sólo por compatibilidad por ahora.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // NO lances en import; sólo aquí cuando realmente se pide el cliente.
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  _admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  return _admin;
}
