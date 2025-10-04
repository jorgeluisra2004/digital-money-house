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
  const pathname = usePathname();
  const { logout } = useAuth() || {};

  return (
    <aside
      className="
        hidden md:block fixed left-0 top-16 bottom-0 w-[260px]
        overflow-y-auto border-r border-black/10 z-30
      "
      style={{ backgroundColor: "var(--dmh-lime)" }}
      aria-label="Sidebar"
    >
      <nav className="px-5 py-6 text-[#0f0f0f] font-medium space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "block rounded-md px-3 py-2 transition " +
                (active
                  ? "bg-black/10 text-black font-semibold"
                  : "text-black/80 hover:bg-black/10")
              }
            >
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="mt-2 block text-left w-full rounded-md px-3 py-2 text-black/75 hover:text-black"
        >
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
