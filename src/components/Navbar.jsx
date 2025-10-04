"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const NAV = [
  { href: "/home", label: "Inicio" },
  { href: "/actividad", label: "Actividad" },
  { href: "/perfil", label: "Tu perfil" },
  { href: "/cargar-dinero", label: "Cargar dinero" },
  { href: "/pagar-servicios", label: "Pagar Servicios" },
  { href: "/tarjetas", label: "Tarjetas" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]); // cerrar al navegar
  if (loading) return null;

  return (
    <header
      className="w-full sticky top-0 z-40 h-16 bg-[#222] border-b border-black/20"
      role="banner"
    >
      <div className="h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
        {/* izquierda */}
        <div className="flex items-center gap-3">
          {/* botón menú mobile */}
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="md:hidden p-2 rounded-md text-white/90 hover:bg-white/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <BrandLogo size={40} />
        </div>

        {/* derecha */}
        {!user ? (
          <div className="flex gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 rounded-md border-2 text-sm sm:text-base"
              style={{
                borderColor: "var(--dmh-lime)",
                color: "var(--dmh-lime)",
              }}
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="px-3 sm:px-4 py-2 rounded-md font-semibold text-sm sm:text-base"
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
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-3 bg-[#2b2b2b] text-white rounded-full pl-2 pr-3 py-1">
              <div
                className="w-8 h-8 rounded-full grid place-items-center text-sm font-bold"
                style={{ background: "var(--dmh-lime)", color: "#111" }}
                title={`${(user?.nombre || "").trim()} ${(
                  user?.apellido || ""
                ).trim()}`.trim()}
              >
                {initialsFromName(user?.nombre, user?.apellido, user?.email)}
              </div>
              <span className="hidden lg:inline text-sm">
                Hola, {(user?.nombre || "").trim()}{" "}
                {(user?.apellido || "").trim()}
              </span>
            </div>

            <Link
              href="/home"
              className="hidden sm:inline px-4 py-2 rounded-md font-semibold"
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
              className="hidden sm:inline px-4 py-2 rounded-md border-2"
              style={{
                borderColor: "var(--dmh-lime)",
                color: "var(--dmh-lime)",
              }}
            >
              Cerrar sesión
            </button>

            {/* avatar en mobile */}
            <div
              className="md:hidden w-8 h-8 rounded-full grid place-items-center text-sm font-bold"
              style={{ background: "var(--dmh-lime)", color: "#111" }}
            >
              {initialsFromName(user?.nombre, user?.apellido, user?.email)}
            </div>
          </div>
        )}
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 top-0 bottom-0 w-[78%] max-w-[320px] bg-[var(--dmh-lime)] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <BrandLogo size={36} />
              <button
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-black/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <ul className="space-y-1">
              {NAV.map((i) => {
                const active = pathname === i.href;
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className={`block rounded-md px-3 py-2 ${
                        active
                          ? "bg-black/10 font-semibold"
                          : "hover:bg-black/10"
                      }`}
                    >
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* acciones */}
            <div className="mt-4 border-t border-black/15 pt-3 space-y-2">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md border-2 text-center"
                    style={{ borderColor: "#111", color: "#111" }}
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-md text-center font-semibold"
                    style={{ background: "#111", color: "var(--dmh-lime)" }}
                  >
                    Crear cuenta
                  </Link>
                </>
              ) : (
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 rounded-md border-2"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
