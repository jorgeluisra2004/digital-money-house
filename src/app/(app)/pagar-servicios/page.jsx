"use client";

import Link from "next/link";
import Image from "next/image";

const proveedores = [
  { slug: "claro", nombre: "Claro", logo: "/providers/claro.svg" },
  { slug: "personal", nombre: "Personal", logo: "/providers/personal.svg" },
  {
    slug: "cablevision",
    nombre: "Cablevisión",
    logo: "/providers/cablevision.svg",
  },
  { slug: "claro-2", nombre: "Claro", logo: "/providers/claro.svg" },
  { slug: "personal-2", nombre: "Personal", logo: "/providers/personal.svg" },
  {
    slug: "cablevision-2",
    nombre: "Cablevisión",
    logo: "/providers/cablevision.svg",
  },
];

export default function PagarServiciosPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Buscador */}
      <div className="mb-4">
        <div className="flex items-center gap-3 bg-white rounded-xl border border-[var(--dmh-lime)]/30 shadow-sm px-4 py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="text-gray-500"
          >
            <path
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            className="w-full py-1.5 outline-none placeholder:text-gray-400"
            placeholder="Buscá entre más de 5.000 empresas"
          />
        </div>
      </div>

      {/* Lista “Más recientes” */}
      <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 font-semibold text-gray-800">
          Más recientes
        </div>
        <ul className="divide-y divide-gray-200">
          {proveedores.map((p, i) => (
            <li key={i} className="px-5">
              <div className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  {/* logo (si el archivo no existe, se muestra solo el texto) */}
                  <div className="shrink-0 w-[64px] h-[28px] relative">
                    <Image
                      src={p.logo}
                      alt={p.nombre}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-gray-800 truncate">{p.nombre}</span>
                </div>
                <Link
                  href={`/pagar-servicios/${p.slug}/identificador`}
                  className="text-[var(--dmh-lime)] font-semibold hover:underline"
                >
                  Seleccionar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
