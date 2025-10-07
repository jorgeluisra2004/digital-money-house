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

/** Detecta modo E2E con posibilidad de desactivar por override (dmh_e2e_off) */
function isE2E() {
  // 0) Override explícito OFF (tiene prioridad absoluta)
  if (typeof window !== "undefined") {
    try {
      const offLS = window.localStorage.getItem("dmh_e2e_off") === "1";
      const offCookie = document.cookie
        .split(";")
        .some((c) => c.trim().startsWith("dmh_e2e_off=1"));
      if (offLS || offCookie) return false;
    } catch {}
  }

  // 1) Build-time
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_E2E) {
    const v = String(process.env.NEXT_PUBLIC_E2E).toLowerCase();
    if (v === "1" || v === "true") return true;
  }

  // 2) Runtime/query/cookie/localStorage
  if (typeof window !== "undefined") {
    // @ts-ignore
    if (window.__E2E__ === true) return true;
    try {
      const p = new URLSearchParams(window.location.search);
      if ((p.get("e2e") || "").toLowerCase() === "1") return true;
    } catch {}
    try {
      const onCookie = document.cookie
        .split(";")
        .some((c) => c.trim().startsWith("dmh_e2e=1"));
      if (onCookie) return true;
    } catch {}
    try {
      if (window.localStorage.getItem("dmh_e2e") === "1") return true;
    } catch {}
  }
  return false;
}

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

  // Sesión fake para E2E (no toca red)
  const fakeE2ESession = useMemo(
    () => ({
      user: { id: "e2e-user", email: "e2e@local.test" },
    }),
    []
  );

  const fetchUsuario = async (authId) => {
    // En E2E devolvemos un perfil fake, evitando red
    if (isE2E())
      return { id: "e2e-user", nombre: "Usuario E2E", email: "e2e@local.test" };
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

  // Aplica sesión y sincroniza perfil
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
        const e2eNow = isE2E();
        if (e2eNow) {
          await applySession(fakeE2ESession);
        } else {
          // Fuera de E2E, intentamos rehidratar sesión real con timeout
          const timeout = new Promise((resolve) =>
            setTimeout(resolve, 3000, null)
          );
          const getSess = supabase.auth
            .getSession()
            .then(({ data }) => data?.session ?? null)
            .catch(() => null);
          const initial = await Promise.race([getSess, timeout]);
          if (!alive) return;
          await applySession(initial);
        }
      } finally {
        if (alive) setLoading(false);
      }

      // Si al montar está en E2E, no subscribimos eventos de supabase
      if (isE2E()) return;

      // Eventos reales de auth
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
              break;
          }
        }
      );
      unsub = cb?.subscription;
    })();

    const rehydrate = async () => {
      if (document.visibilityState !== "visible") return;
      if (isE2E()) {
        // Si sigue en E2E y no está “off”, rehidrata fake
        await applySession(fakeE2ESession);
        return;
      }
      const { data } = await supabase.auth.getSession();
      await applySession(data?.session ?? null);
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
    if (isE2E()) {
      await applySession(fakeE2ESession);
      return fakeE2ESession;
    }
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
      if (!isE2E()) await supabase.auth.signOut();
    } finally {
      clearAuthStorage();
      try {
        document.cookie = "dmh_e2e=; Max-Age=0; path=/";
        document.cookie = "dmh_e2e_off=1; Max-Age=31536000; path=/"; // 1 año
        window.localStorage.removeItem("dmh_e2e");
        window.localStorage.setItem("dmh_e2e_off", "1");
      } catch {}
      await applySession(null);
    }
  };

  const refreshProfile = async () => {
    const id = session?.user?.id || (isE2E() ? "e2e-user" : null);
    if (!id) return null;
    const perfil = await fetchUsuario(id);
    setUser(perfil);
    return perfil;
  };

  const value = useMemo(
    () => ({ session, user, loading, login, logout, refreshProfile }),
    [session, user, loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
