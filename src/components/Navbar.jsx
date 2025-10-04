"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import BrandLogo from "@/components/BrandLogo";

function initialsFromName(nombre = "", apellido = "", email = "") {
  const n = (nombre || "").trim();
  const a = (apellido || "").trim();
  if (n || a)
    return `${(n[0] || "").toUpperCase()}${(a[0] || "").toUpperCase()}` || "US";
  const user = (email || "").split("@")[0] || "US";
  return user.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  if (loading) return null;

  return (
    <header
      className="w-full sticky top-0 z-40 h-16 bg-[#222] border-b border-black/20"
      role="banner"
    >
      <div className="h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <BrandLogo size={40} />
        {!user ? (
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-md border-2"
              style={{
                borderColor: "var(--dmh-lime)",
                color: "var(--dmh-lime)",
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
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-[#2b2b2b] text-white rounded-full pl-2 pr-3 py-1">
              <div
                className="w-8 h-8 rounded-full grid place-items-center text-sm font-bold"
                style={{ background: "var(--dmh-lime)", color: "#111" }}
                title={`${(user?.nombre || "").trim()} ${(
                  user?.apellido || ""
                ).trim()}`.trim()}
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
              style={{
                borderColor: "var(--dmh-lime)",
                color: "var(--dmh-lime)",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
