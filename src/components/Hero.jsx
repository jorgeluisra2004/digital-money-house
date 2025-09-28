"use client";

import { useState, useRef } from "react";

export default function Hero() {
  // fondo por defecto: /public/landing-bg.png
  const [bg, setBg] = useState("/landing-bg.webp");
  const inputRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setBg(url);
  }

  return (
    <section className="relative min-h-[720px] lg:min-h-[780px] overflow-hidden">
      {/* Background image (se usa un div para permitir objectURL preview) */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: `url(${bg})`
        }}
      />

      {/* Dark overlay para contraste con texto */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.65) 100%)" }} />

      {/* Contenido */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-20 pt-12">
        <div className="pt-8 md:pt-12">
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight max-w-3xl">
            De ahora en adelante, hacés más con tu dinero
          </h1>
          <p className="mt-4 text-2xl md:text-2xl font-semibold" style={{ color: "var(--dmh-lime)" }}>
            Tu nueva <span className="font-bold">billetera virtual</span>
          </p>
        </div>

        {/* Tarjetas y franja verde */}
        <div className="mt-12 md:mt-20 relative">
          {/* FRANJA VERDE */}
          <div
            className="absolute left-6 right-6 h-28 rounded-tl-[22px] rounded-tr-[22px] -bottom-12"
            style={{
              background: "var(--dmh-lime)",
              zIndex: 5
            }}
          ></div>

          {/* CARDS */}
          <div className="relative z-20 -translate-y-16 md:-translate-y-10 flex flex-col md:flex-row gap-6 items-stretch">
            <div className="bg-white rounded-[28px] p-7 md:w-1/2" style={{ boxShadow: "0 16px 32px rgba(0,0,0,0.25)" }}>
              <h2 className="text-3xl font-bold text-[#111]">Transferí dinero</h2>
              <div className="w-20 h-1 mt-4 mb-4" style={{ background: "var(--dmh-lime)" }} />
              <p className="text-gray-700">
                Desde Digital Money House vas a poder transferir dinero a otras cuentas, así como también
                recibir transferencias y nuclear tu capital en nuestra billetera virtual
              </p>
            </div>

            <div className="bg-white rounded-[28px] p-7 md:w-1/2" style={{ boxShadow: "0 16px 32px rgba(0,0,0,0.25)" }}>
              <h2 className="text-3xl font-bold text-[#111]">Pago de servicios</h2>
              <div className="w-20 h-1 mt-4 mb-4" style={{ background: "var(--dmh-lime)" }} />
              <p className="text-gray-700">
                Pagá mensualmente los servicios en 3 simples clicks. Fácil, rápido y conveniente. Olvidate de las facturas en papel
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
