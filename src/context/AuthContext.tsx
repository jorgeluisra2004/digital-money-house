"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

type DBUsuario = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password?: string | null;
  telefono?: string | null;
  created_at?: string | null;
  last_login?: string | null;
};

type AuthCtx = {
  session: Session | null;
  user: DBUsuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Session | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<DBUsuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsuario = async (authId: string): Promise<DBUsuario | null> => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authId) // tu /api/register guarda id = auth.user.id
      .single();

    if (error) {
      console.error("Error fetching usuario:", error);
      return null;
    }
    return (data as DBUsuario) ?? null;
  };

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session:", error);

        const current = data.session ?? null;
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

      unsub = sub.subscription;
    })();

    return () => {
      if (unsub) unsub.unsubscribe();
    };
  }, [supabase]);

  const login = async (
    email: string,
    password: string
  ): Promise<Session | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.session?.user?.id) {
      const usuarioData = await fetchUsuario(data.session.user.id);
      setUser(usuarioData);
    }
    setSession(data.session);
    return data.session;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const value: AuthCtx = { session, user, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
