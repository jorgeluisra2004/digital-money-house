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
    // Ajustá estas 2 variables si cambiaste alturas:
    // --header-h: 64px (Navbar h-16)
    // --footer-h: 48px (Footer h-12)
    <section
      className="relative isolate overflow-hidden"
      style={{
        // el Hero ocupa exactamente el alto de la ventana menos header y footer
        minHeight:
          "calc(100svh - var(--header-h, 64px) - var(--footer-h, 48px))",
        // variables
        ["--header-h"]: "64px",
        ["--footer-h"]: "48px",
        ["--franja-h"]: "128px", // alto de la franja lima
        ["--cards-shift"]: "40px", // cuánto se montan las cards sobre la franja
      }}
    >
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

      {/* Contenido vertical: texto arriba, cards abajo */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-20 h-full flex flex-col">
        {/* Titular */}
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

        {/* Zona inferior (se pega al fondo) */}
        <div className="relative mt-auto">
          {/* Franja lima pegada al borde inferior del Hero */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-4 right-4 rounded-t-[22px]"
            style={{
              height: "var(--franja-h)",
              bottom: 0,
              background: "var(--dmh-lime)",
              boxShadow: "0 -8px 40px rgba(0,0,0,.25)",
              zIndex: 5,
            }}
          />

          {/* Orejas (quedan recortadas por overflow del section) */}
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 180,
              height: 180,
              background: "var(--dmh-lime)",
              left: -64,
              bottom: -48,
              zIndex: 4,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 180,
              height: 180,
              background: "var(--dmh-lime)",
              right: -64,
              bottom: -48,
              zIndex: 4,
            }}
          />

          {/* Cards: ancladas al fondo, montadas sobre la franja */}
          <div
            className="relative z-20"
            style={{ transform: "translateY(calc(-1 * var(--cards-shift)))" }}
          >
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              <article
                className="bg-white rounded-[28px] p-7 md:w-1/2"
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
                  Desde Digital Money House vas a poder transferir dinero a
                  otras cuentas, así como también recibir transferencias y
                  nuclear tu capital en nuestra billetera virtual
                </p>
              </article>

              <article
                className="bg-white rounded-[28px] p-7 md:w-1/2"
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
        </div>

        {/* (opcional) Cambiar imagen para preview */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs underline text-white/80 hover:text-white"
            title="Cambiar imagen de fondo"
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
