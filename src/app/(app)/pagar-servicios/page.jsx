"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

const proveedores = [
  { slug: "claro", nombre: "Claro", logo: "/images/claro.webp" },
  { slug: "personal", nombre: "Personal", logo: "/images/personal.webp" },
  {
    slug: "cablevision",
    nombre: "Cablevisión",
    logo: "/images/cablevision.webp",
  },
  // opcionales para completar la grilla
  { slug: "claro-2", nombre: "Claro", logo: "/images/claro.webp" },
  { slug: "personal-2", nombre: "Personal", logo: "/images/personal.webp" },
  {
    slug: "cablevision-2",
    nombre: "Cablevisión",
    logo: "/images/cablevision.webp",
  },
];

export default function PagarServiciosPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return proveedores;
    return proveedores.filter((p) => p.nombre.toLowerCase().includes(t));
  }, [q]);

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
            data-testid="servicios-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full py-1.5 outline-none placeholder:text-gray-400"
            placeholder="Buscá entre más de 5.000 empresas"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 font-semibold text-gray-800">
          Más recientes
        </div>
        <ul data-testid="servicios-list" className="divide-y divide-gray-200">
          {filtered.map((p, i) => (
            <li key={i} className="px-5">
              <div className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-[64px] h-[28px] relative">
                    <Image
                      src={p.logo}
                      alt={p.nombre}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // si llegase a fallar la imagen, ocultamos el tag
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <span
                    className="text-gray-800 truncate"
                    data-testid={`servicio-${p.slug}`}
                  >
                    {p.nombre}
                  </span>
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
          {filtered.length === 0 && (
            <li className="px-5 py-6 text-sm text-gray-500">
              No encontramos servicios para “{q}”.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
