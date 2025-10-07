// /src/components/DashboardSidebar.jsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  const router = useRouter();
  const { logout } = useAuth() || {};

  const isActive = (href) => {
    const clean = href.replace(/\/+$/, "") || "/";
    return pathname === clean || pathname.startsWith(`${clean}/`);
  };

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <aside
      aria-label="Sidebar"
      // 👇 SIEMPRE visible (sin 'hidden md:block'), z-index alto y sin que nada lo tape
      className="fixed left-0 top-16 bottom-0 w-[280px] z-50 overflow-y-auto border-r pointer-events-auto"
      style={{
        background: LIME,
        borderRightColor: "rgba(0,0,0,.20)",
      }}
    >
      <nav
        className="px-6 py-6"
        role="navigation"
        aria-label="Navegación principal"
      >
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
                    "pl-4 pr-2 py-2",
                    "text-[16px] leading-6",
                    active
                      ? "font-semibold text-[#0f0f0f]"
                      : "font-normal text-[#0f0f0f]",
                    "hover:bg-black/[.06]",
                    "transition-colors",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div
          className="mt-4 pt-3 border-t"
          style={{ borderColor: "rgba(0,0,0,.15)" }}
        />

        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left pl-4 pr-2 py-2 text-[16px] leading-6 font-medium transition-colors"
          style={{ color: "rgba(0,0,0,.45)" }}
        >
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
