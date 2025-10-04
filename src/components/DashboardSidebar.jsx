"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* Fallback por si no existe la CSS var */
const LIME = "var(--dmh-lime, #c9ff2a)";

const NAV = [
  { href: "/home", label: "Inicio" },
  { href: "/actividad", label: "Actividad" },
  { href: "/perfil", label: "Tu perfil" },
  { href: "/cargar-dinero", label: "Cargar dinero" },
  { href: "/pagar-servicios", label: "Pagar Servicios" },
  { href: "/tarjetas", label: "Tarjetas" },
];

export default function DashboardSidebar() {
  const pathname = (usePathname() || "").replace(/\/+$/, "") || "/";
  const { logout } = useAuth() || {};

  const isActive = (href) => {
    const clean = href.replace(/\/+$/, "") || "/";
    return pathname === clean || pathname.startsWith(`${clean}/`);
  };

  return (
    <aside
      aria-label="Sidebar"
      className="
        hidden md:block fixed left-0 top-16 bottom-0 w-[280px]
        z-30 overflow-y-auto overscroll-contain
        border-r
      "
      style={{
        background: LIME, // fondo lima como en el diseño
        borderRightColor: "rgba(0,0,0,.20)", // sutil divisor con el contenido
      }}
    >
      <nav className="px-6 py-6">
        <ul className="space-y-3">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "block rounded-none",
                    "pl-4 pr-2 py-2", // misma separación que el modelo
                    "text-[16px] leading-6",
                    active
                      ? "font-semibold text-[#0f0f0f]" // activo en negrita, sin fondo
                      : "font-normal text-[#0f0f0f]",
                    "hover:bg-black/[.06]", // hover sutil (no visible en captura)
                    "transition-colors",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* separador y 'Cerrar sesión' desaturado como en la captura */}
        <div
          className="mt-4 pt-3 border-t"
          style={{ borderColor: "rgba(0,0,0,.15)" }}
        />

        <button
          type="button"
          onClick={() => logout?.()}
          className="w-full text-left pl-4 pr-2 py-2 text-[16px] leading-6 font-medium transition-colors"
          style={{ color: "rgba(0,0,0,.45)" }} // gris verdoso del diseño
        >
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
