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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  if (loading) return null;

  const DARK = "var(--dmh-dark, #232326)";
  const LIME = "var(--dmh-lime, #c7ff23)";
  const fullName = `${(user?.nombre || "").trim()} ${(
    user?.apellido || ""
  ).trim()}`.trim();
  const initials = initialsFromName(user?.nombre, user?.apellido, user?.email);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full border-b border-white/10"
      style={{ backgroundColor: DARK }}
    >
      {/* 👇 sin max-w; padding mínimo a la izquierda */}
      <div className="flex h-16 w-full items-center justify-between pl-3 pr-4 md:pl-4 md:pr-6">
        {/* Izquierda */}
        <div className="flex items-center ml-5">
          <BrandLogo size={30} />
        </div>

        {/* Derecha desktop */}
        {user ? (
          <div className="hidden md:flex items-center">
            <div
              className="flex items-center rounded-xl pl-2 pr-3 py-1"
              style={{ backgroundColor: "#2b2b2c" }}
            >
              <div
                className="grid h-8 w-10 place-items-center rounded-lg text-sm font-extrabold tracking-wide"
                style={{ backgroundColor: LIME, color: "#111" }}
                title={fullName || undefined}
              >
                {initials}
              </div>
              <span className="ml-3 text-[15px] font-semibold text-white">
                Hola, {fullName || "Usuario"}
              </span>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md border-2 px-4 py-2 text-sm font-semibold"
              style={{ borderColor: LIME, color: LIME }}
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: LIME, color: "#111" }}
            >
              Crear cuenta
            </Link>
          </div>
        )}

        {/* Derecha móvil */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <div
              className="grid h-8 w-10 place-items-center rounded-lg text-sm font-extrabold"
              style={{ backgroundColor: LIME, color: "#111" }}
              title={fullName || undefined}
            >
              {initials}
            </div>
          ) : null}
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="p-2"
            style={{ color: LIME }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer móvil (derecha) */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[78%] max-w-[340px] translate-x-full transform transition-transform duration-300 ${
            open ? "!translate-x-0" : ""
          }`}
          style={{ backgroundColor: LIME }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ backgroundColor: DARK }}
          >
            <div className="text-white">
              <div className="text-sm opacity-80">Hola,</div>
              <div className="text-[15px] font-semibold">
                {fullName || "Usuario"}
              </div>
            </div>
            <button
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="p-2"
              style={{ color: LIME }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <nav className="px-5 py-3">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-md px-3 py-3 text-[15px] ${
                        active ? "font-semibold" : ""
                      }`}
                      style={{
                        color: "#1b1b1b",
                        backgroundColor: active
                          ? "rgba(0,0,0,0.08)"
                          : "transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {user ? (
              <button
                onClick={logout}
                className="mt-3 w-full rounded-md px-3 py-3 text-left text-[15px]"
                style={{ color: "rgba(0,0,0,0.6)" }}
              >
                Cerrar sesión
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                <Link
                  href="/login"
                  className="block rounded-md border-2 px-3 py-3 text-center font-semibold"
                  style={{ borderColor: "#1b1b1b", color: "#1b1b1b" }}
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="block rounded-md px-3 py-3 text-center font-semibold"
                  style={{ backgroundColor: "#1b1b1b", color: LIME }}
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </nav>
        </aside>
      </div>
    </header>
  );
}
