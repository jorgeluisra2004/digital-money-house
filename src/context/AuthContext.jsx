"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsuario = async (authId) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (error) {
      console.error("Error fetching usuario:", error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.error(error);
      setSession(session);

      if (session?.user?.id) {
        const usuarioData = await fetchUsuario(session.user.id);
        setUser(usuarioData);
      }
      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user?.id) {
          const usuarioData = await fetchUsuario(newSession.user.id);
          setUser(usuarioData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
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
  return useContext(AuthContext);
}
