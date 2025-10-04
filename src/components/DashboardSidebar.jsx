"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
        hidden md:block fixed left-0 top-16 bottom-0 w-[260px]
        overflow-y-auto overscroll-contain z-30
        border-r border-black/20 bg-[#222]
      "
    >
      <nav className="px-4 py-6 text-sm">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex items-center rounded-md px-3 py-2 transition",
                    "text-white/85 hover:text-white hover:bg-white/5",
                    active
                      ? "text-white bg-white/5 border-l-4"
                      : "border-l-4 border-transparent",
                  ].join(" ")}
                  style={{
                    borderLeftColor: active ? "var(--dmh-lime)" : "transparent",
                  }}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 pt-3 border-t border-white/10" />

        <button
          type="button"
          onClick={() => logout?.()}
          className="w-full text-left rounded-md px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 transition"
        >
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
