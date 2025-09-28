"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual
    const fetchUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();

    // Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return null; // O un skeleton mientras carga
  }

  return (
    <header className="w-full bg-[#222] flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-8 rounded-sm flex items-center justify-center"
            style={{ background: "linear-gradient(90deg,#bff21a,#d4ff2b)" }}
          >
            <span
              className="font-bold text-black text-lg tracking-tight"
              style={{ letterSpacing: "-1px" }}
            >
              DMH
            </span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        {!user ? (
          <>
            <Link
              href="/login"
              className="px-4 py-2 rounded-md border-2"
              style={{
                borderColor: "var(--dmh-lime)",
                color: "var(--dmh-lime)",
                transition: "all .15s",
              }}
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-md font-semibold"
              style={{
                backgroundColor: "var(--dmh-lime)",
                color: "#000",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              Crear cuenta
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md font-semibold"
              style={{
                backgroundColor: "var(--dmh-lime)",
                color: "#000",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              Dashboard
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null); // actualizar estado inmediatamente
              }}
              className="px-4 py-2 rounded-md border-2"
              style={{
                borderColor: "var(--dmh-lime)",
                color: "var(--dmh-lime)",
                transition: "all .15s",
              }}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </header>
  );
}
