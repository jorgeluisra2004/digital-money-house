// src/lib/supabaseClient.js
"use client";

import { createClient } from "@supabase/supabase-js";

function makeSSRStub() {
  const resp = { data: null, error: null };
  const noop = async () => resp;
  const subscription = { unsubscribe() {} };

  return {
    from() {
      const chain = {
        select: async () => resp,
        insert: noop,
        update: noop,
        delete: noop,
        eq() {
          return chain;
        },
        single: async () => resp,
        order() {
          return chain;
        },
      };
      return chain;
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription } }),
      signInWithPassword: noop,
      signOut: async () => {},
    },
  };
}

let _client = null;

export function getSupabaseClient() {
  if (typeof window === "undefined") return makeSSRStub();
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn(
      "⚠️ NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidas."
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
