"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AuthCtx = {
  session: any;
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsuario = async (authId: string) => {
    // Tu registro de /api/register inserta usuarios con id = auth.user.id
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authId)
      .single();
    if (error) {
      console.error("Error fetching usuario:", error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session:", error);
        setSession(data.session ?? null);

        if (data.session?.user?.id) {
          const usuarioData = await fetchUsuario(data.session.user.id);
          setUser(usuarioData);
        }
      } finally {
        setLoading(false);
      }

      const sub = supabase.auth.onAuthStateChange(
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

      unsub = sub.data.subscription;
    };

    initAuth();
    return () => {
      if (unsub) unsub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
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

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
