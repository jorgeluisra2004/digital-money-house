// /src/components/Hero.jsx
"use client";

import { useRef, useState } from "react";

export default function Hero() {
  const [bg, setBg] = useState("/landing-bg.webp");
  const inputRef = useRef(null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBg(URL.createObjectURL(f));
  };

  return (
    // 64px = alto aprox. del header. Si el tuyo mide otro valor, cámbialo aquí.
    <section className="relative isolate overflow-hidden min-h-[calc(100svh-64px)]">
      {/* Fondo */}
      <div
        aria-hidden
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${bg})` }}
      />
      {/* Overlay */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,.35) 40%, rgba(0,0,0,.65) 100%)",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-20 pt-12">
        <div className="pt-8 md:pt-12">
          <h1 className="text-white font-semibold leading-tight max-w-3xl text-[34px] md:text-5xl lg:text-6xl">
            De ahora en
            <br className="hidden md:block" /> adelante, hacés
            <br className="hidden md:block" /> más con tu dinero
          </h1>

          <p
            className="mt-4 text-2xl md:text-2xl font-semibold"
            style={{ color: "var(--dmh-lime)" }}
          >
            Tu nueva <span className="font-extrabold">billetera virtual</span>
          </p>
        </div>

        {/* Cards + franja */}
        <div className="mt-12 md:mt-20 relative">
          {/* FRANJA LIMA pegada al borde inferior */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-4 right-4 h-28 md:h-32 rounded-t-[22px]"
            style={{
              background: "var(--dmh-lime)",
              zIndex: 5,
              boxShadow: "0 -8px 40px rgba(0,0,0,.25)",
            }}
          />
          {/* Orejas (recortadas por overflow del section) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-16 w-40 h-40 md:w-48 md:h-48 rounded-full"
            style={{ background: "var(--dmh-lime)", zIndex: 4 }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -right-16 w-40 h-40 md:w-48 md:h-48 rounded-full"
            style={{ background: "var(--dmh-lime)", zIndex: 4 }}
          />

          {/* CARDS */}
          <div className="relative z-20 -translate-y-16 md:-translate-y-10 flex flex-col md:flex-row gap-6 items-stretch">
            <article
              className="bg-white rounded-[28px] p-7 md:w-1/2 shadow-xl"
              style={{ boxShadow: "0 16px 32px rgba(0,0,0,.25)" }}
            >
              <h2 className="text-3xl font-extrabold text-[#111]">
                Transferí dinero
              </h2>
              <div
                className="w-20 h-1 mt-4 mb-4"
                style={{ background: "var(--dmh-lime)" }}
              />
              <p className="text-gray-700 leading-relaxed">
                Desde Digital Money House vas a poder transferir dinero a otras
                cuentas, así como también recibir transferencias y nuclear tu
                capital en nuestra billetera virtual
              </p>
            </article>

            <article
              className="bg-white rounded-[28px] p-7 md:w-1/2 shadow-xl"
              style={{ boxShadow: "0 16px 32px rgba(0,0,0,.25)" }}
            >
              <h2 className="text-3xl font-extrabold text-[#111]">
                Pago de servicios
              </h2>
              <div
                className="w-20 h-1 mt-4 mb-4"
                style={{ background: "var(--dmh-lime)" }}
              />
              <p className="text-gray-700 leading-relaxed">
                Pagá mensualmente los servicios en 3 simples clicks. Fácil,
                rápido y conveniente. Olvidate de las facturas en papel
              </p>
            </article>
          </div>
        </div>

        {/* Botón opcional para cambiar imagen (solo para preview) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs underline text-white/80 hover:text-white"
            title="Cambiar imagen de fondo (solo preview)"
          >
            Cambiar imagen
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>
      </div>
    </section>
  );
}
