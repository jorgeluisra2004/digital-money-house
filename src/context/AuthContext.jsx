"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsuario = async (authId) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authId)
      .single();
    if (error) {
      console.error("Error fetching usuario:", error);
      return null;
    }
    return data ?? null;
  };

  useEffect(() => {
    let unsub;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session:", error);

        const current = data?.session ?? null;
        setSession(current);

        if (current?.user?.id) {
          const usuarioData = await fetchUsuario(current.user.id);
          setUser(usuarioData);
        }
      } finally {
        setLoading(false);
      }

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession ?? null);
          if (newSession?.user?.id) {
            const usuarioData = await fetchUsuario(newSession.user.id);
            setUser(usuarioData);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      unsub = sub?.subscription;
    })();

    return () => {
      if (unsub) unsub.unsubscribe?.();
    };
  }, [supabase]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data?.session?.user?.id) {
      const usuarioData = await fetchUsuario(data.session.user.id);
      setUser(usuarioData);
    }
    setSession(data?.session ?? null);
    return data?.session ?? null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value = { session, user, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
