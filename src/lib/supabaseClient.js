// src/lib/supabaseClient.js
"use client";

import { createClient } from "@supabase/supabase-js";

function makeSSRStub() {
  const ok = (data = null, error = null) => Promise.resolve({ data, error });

  // Builder de filtros (encadenable)
  const filter = {
    eq() {
      return filter;
    },
    match() {
      return filter;
    },
    order() {
      return filter;
    },
    limit() {
      return filter;
    },
    range() {
      return filter;
    },
    in() {
      return filter;
    },
    is() {
      return filter;
    },
    not() {
      return filter;
    },
    // Métodos “terminales”
    single: () => ok(),
    maybeSingle: () => ok(),
  };

  // Builder por tabla
  const table = {
    select() {
      return filter;
    },
    insert: () => ok(),
    update: () => ok(),
    delete: () => ok(),
  };

  const subscription = { unsubscribe() {} };

  return {
    from() {
      return table;
    },
    rpc: () => ok(),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription } }),
      signInWithPassword: () => ok(),
      signOut: () => ok(),
    },
    storage: {
      from() {
        return {
          getPublicUrl: () => ({ data: { publicUrl: "" }, error: null }),
          upload: () => ok(),
          remove: () => ok(),
        };
      },
    },
  };
}

let _client = null;

export function getSupabaseClient() {
  // En SSR devolvemos el stub para evitar llamadas de red
  if (typeof window === "undefined") return makeSSRStub();
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn(
      "⚠️ Falta NEXT_PUBLIC_SUPABASE_URL/ANON_KEY; usando stub local."
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
