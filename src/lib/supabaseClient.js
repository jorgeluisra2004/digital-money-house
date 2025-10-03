"use client";

import { createClient} from "@supabase/supabase-js";

// Pequeño stub para SSR/prerender que evita romper el build.
function makeSSRStub() {
  // Lo mínimo para que tu UI pueda montar sin explotar en el servidor
  const noop = async () => ({ data, error });
  const sub = { subscription: { unsubscribe() {} } };

  return {
    // @ts-expect-error stub parcial solo para SSR
    from() {
      return {
        select: noop,
        insert: noop,
        update: noop,
        delete: noop,
        eq() {
          return this;
        },
        single: noop,
        order: noop,
      };
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: sub }),
      signInWithPassword: noop,
      signOut: async () => {},
      // @ts-expect-error otros métodos no usados en SSR
    },
    // @ts-expect-error resto del cliente no necesario en SSR
  };
}

let _client;

export function getSupabaseClient() {
  // Si estamos en build/prerender (no hay window), devolvemos stub
  if (typeof window === "undefined") {
    return makeSSRStub();
  }

  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // En navegador: si faltaran, no rompemos el build; avisamos y devolvemos stub
  if (!url || !anon) {
    console.warn(
      "⚠️ NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidas en runtime del navegador."
    );
    return makeSSRStub();
  }

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}
