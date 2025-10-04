// /src/context/AuthContext.jsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null); // sesión de supabase
  const [user, setUser] = useState(null); // fila en "usuarios"
  const [loading, setLoading] = useState(true); // sólo para la carga inicial
  const inited = useRef(false);

  const fetchUsuario = async (authId) => {
    try {
      const { data, error, status } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authId)
        .single();
      if (error && status !== 406) {
        console.warn("fetchUsuario error:", error);
        return null;
      }
      return data ?? null;
    } catch (e) {
      console.warn("fetchUsuario exception:", e);
      return null;
    }
  };

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    let unsub;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("getSession error:", error);
        const current = data?.session ?? null;
        setSession(current);
        if (current?.user?.id) {
          const perfil = await fetchUsuario(current.user.id);
          setUser(perfil);
        }
      } finally {
        setLoading(false); // <- sólo acá, una vez
      }

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            return;
          }
          // Para SIGNED_IN / USER_UPDATED / TOKEN_REFRESHED
          if (newSession?.user?.id) {
            setSession((prev) => {
              // evita renders si no cambió el user.id
              return prev?.user?.id === newSession.user.id ? prev : newSession;
            });
            const perfil = await fetchUsuario(newSession.user.id);
            setUser(perfil);
          }
          // Importante: no tocamos `loading` acá
        }
      );

      unsub = sub?.subscription;
    })();

    // Rehidratá al volver a foco/visibilidad
    const rehydrate = async () => {
      if (document.visibilityState === "visible") {
        const { data } = await supabase.auth.getSession();
        const s = data?.session ?? null;
        if (s?.user?.id && !session?.user?.id) {
          setSession(s);
          const perfil = await fetchUsuario(s.user.id);
          setUser(perfil);
        }
      }
    };
    window.addEventListener("focus", rehydrate);
    document.addEventListener("visibilitychange", rehydrate);

    return () => {
      unsub?.unsubscribe?.();
      window.removeEventListener("focus", rehydrate);
      document.removeEventListener("visibilitychange", rehydrate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setSession(data?.session ?? null);
    if (data?.session?.user?.id) {
      const perfil = await fetchUsuario(data.session.user.id);
      setUser(perfil);
    }
    return data?.session ?? null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) return null;
    const perfil = await fetchUsuario(session.user.id);
    setUser(perfil);
    return perfil;
  };

  const value = useMemo(
    () => ({ session, user, loading, login, logout, refreshProfile }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
