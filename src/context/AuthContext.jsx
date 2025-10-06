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

function clearAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    const ls = window.localStorage;
    for (const k of Object.keys(ls)) {
      if (
        k.startsWith("sb-") || // claves de supabase
        k.includes("supabase.auth.token") ||
        k === "dmh-auth" ||
        k === "dmh_token" ||
        k === "dmh_refresh" ||
        k === "dmh_user"
      ) {
        ls.removeItem(k);
      }
    }
  } catch {
    // no-op
  }
}

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inited = useRef(false);

  const fetchUsuario = async (authId) => {
    try {
      const { data, error, status } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authId)
        .single();
      if (error && status !== 406) return null;
      return data ?? null;
    } catch {
      return null;
    }
  };

  // Función centralizada para aplicar una sesión y sincronizar perfil
  const applySession = async (s) => {
    setSession(s ?? null);
    if (s?.user?.id) {
      const perfil = await fetchUsuario(s.user.id);
      setUser(perfil);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    let unsub;
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        await applySession(data?.session ?? null);
      } finally {
        if (alive) setLoading(false);
      }

      // ✅ Maneja TODOS los eventos relevantes y limpia storage al SIGNED_OUT
      const { data: cb } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!alive) return;
          switch (event) {
            case "SIGNED_IN":
            case "TOKEN_REFRESHED":
            case "USER_UPDATED":
            case "INITIAL_SESSION":
              await applySession(newSession ?? null);
              break;
            case "SIGNED_OUT":
              clearAuthStorage();
              await applySession(null);
              break;
            default:
              // otros eventos no requieren acción
              break;
          }
        }
      );
      unsub = cb?.subscription;
    })();

    // Rehidrata al volver el foco o pestaña visible (por si cambió en otra pestaña)
    const rehydrate = async () => {
      if (document.visibilityState === "visible") {
        const { data } = await supabase.auth.getSession();
        await applySession(data?.session ?? null);
      }
    };
    window.addEventListener("focus", rehydrate);
    document.addEventListener("visibilitychange", rehydrate);

    return () => {
      alive = false;
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
    await applySession(data?.session ?? null);
    return data?.session ?? null;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // También limpiamos si el signOut viene desde otro dispositivo/pestaña
      clearAuthStorage();
      await applySession(null);
    }
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
