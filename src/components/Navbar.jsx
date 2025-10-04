"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import BrandLogo from "@/components/BrandLogo"; // ⬅️ nuevo

function initialsFromName(nombre = "", apellido = "", email = "") {
  const n = (nombre || "").trim();
  const a = (apellido || "").trim();
  if (n || a)
    return `${(n[0] || "").toUpperCase()}${(a[0] || "").toUpperCase()}` || "US";
  const user = (email || "").split("@")[0] || "US";
  return user.slice(0, 2).toUpperCase();
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  if (loading) return null;

  return (
    <header className="w-full bg-[#222] flex items-center justify-between px-6 py-4">
      {/* LOGO */}
      <BrandLogo size={32} /> {/* probá 32, 40 o 48 */}
      {!user ? (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-md border-2"
            style={{ borderColor: "var(--dmh-lime)", color: "var(--dmh-lime)" }}
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
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#2b2b2b] text-white rounded-full pl-2 pr-3 py-1">
            <div
              className="w-8 h-8 rounded-full grid place-items-center text-sm font-bold"
              style={{ background: "var(--dmh-lime)", color: "#111" }}
              title={`${user?.nombre || ""} ${user?.apellido || ""}`.trim()}
            >
              {initialsFromName(user?.nombre, user?.apellido, user?.email)}
            </div>
            <span className="hidden sm:inline text-sm">
              Hola, {(user?.nombre || "").trim()}{" "}
              {(user?.apellido || "").trim()}
            </span>
          </div>

          <Link
            href="/home"
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
            onClick={logout}
            className="px-4 py-2 rounded-md border-2"
            style={{ borderColor: "var(--dmh-lime)", color: "var(--dmh-lime)" }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
