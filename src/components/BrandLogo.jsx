// /src/components/BrandLogo.jsx
"use client";
import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({ size = 40 }) {
  // ratio del logo exportado (ancho/alto) ≈ 2.2 — ajustá si lo querés más ancho
  const width = Math.round(size * 2.2);
  const height = size;

  return (
    <Link
      href="/"
      aria-label="Digital Money House – Inicio"
      className="inline-flex items-center"
    >
      <Image
        src="/brand/dmh_logo.png" // poné aquí el archivo que copies a /public/brand/
        alt="DMH"
        width={width}
        height={height}
        priority
        style={{ height, width }}
      />
    </Link>
  );
}
