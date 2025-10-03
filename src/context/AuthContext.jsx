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
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // fila en "usuarios"
  const [loading, setLoading] = useState(true); // solo para la carga INICIAL
  const mountedRef = useRef(false); // evita dobles montajes en dev

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

  // Carga inicial + suscripción a cambios
  useEffect(() => {
    if (mountedRef.current) return; // evita doble init por HMR
    mountedRef.current = true;

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
        setLoading(false); // <- solo se libera acá
      }

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          // No volvemos a "loading" con cada evento.
          setSession(newSession ?? null);

          if (event === "SIGNED_IN" || event === "USER_UPDATED") {
            if (newSession?.user?.id) {
              const perfil = await fetchUsuario(newSession.user.id);
              setUser(perfil);
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null);
          } else if (event === "TOKEN_REFRESHED") {
            // Ignoramos para evitar parpadeos
          }
        }
      );

      unsub = sub?.subscription;
    })();

    return () => unsub?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers de acción
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
