"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Todas las páginas que viven en (app) son privadas.
 * Si agregas nuevas rutas privadas, pon su prefijo acá.
 */
const PRIVATE_PREFIXES = [
  "/home",
  "/tarjetas",
  "/actividad",
  "/perfil",
  "/pagar-servicios",
  "/transferir",
  "/cargar-dinero",
];

export default function Shell({ children }) {
  const pathname = usePathname() || "/";
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <>
      {!isPrivate && <Header />}
      {/* El layout privado insertará su propio Header/Footer */}
      <div className="flex-1">{children}</div>
      {!isPrivate && <Footer />}
    </>
  );
}
