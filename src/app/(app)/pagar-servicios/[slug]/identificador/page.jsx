"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function IdentificadorPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [value, setValue] = useState("");

  const goNext = () => {
    // validación simple: 11 dígitos (sin espacios) — sin el “2” inicial
    const digits = value.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 11) {
      alert("Ingresá entre 6 y 11 dígitos (sin el '2' inicial).");
      return;
    }
    router.push(`/pagar-servicios/${slug}/pagar?cta=${digits}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="bg-[#1f1f1f] text-white rounded-2xl shadow-md border border-black/10 overflow-hidden">
        <div className="px-6 py-5">
          <h2
            className="text-2xl md:text-[28px] font-extrabold"
            style={{ color: "var(--dmh-lime)" }}
          >
            Número de cuenta sin el primer 2
          </h2>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
            <div>
              <input
                inputMode="numeric"
                value={value}
                onChange={(e) =>
                  setValue(e.target.value.replace(/[^\d]/g, "").slice(0, 11))
                }
                className="w-full h-12 rounded-lg px-4 text-black outline-none focus:ring-2 ring-[var(--dmh-lime)]"
                placeholder="37289701912"
              />
              <p className="text-sm text-white/70 mt-2">
                Son 11 números sin espacios, sin el “2” inicial. Agregá ceros
                adelante si tenés menos.
              </p>
            </div>

            <button
              onClick={goNext}
              className="w-full lg:w-[320px] h-12 rounded-xl font-semibold shadow-md hover:brightness-95 transition"
              style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
