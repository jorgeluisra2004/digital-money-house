"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

/* --- helpers --- */
const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );

export default function ExitoPage() {
  const { slug } = useParams();
  const sp = useSearchParams();

  /* Datos que llegan por query (con fallbacks para que siempre se vea bien) */
  const importe = Number(sp.get("m") || 0);

  // Emisor (De)
  const deNombre = sp.get("deName") || "Mauricio Brito";
  const deCVU = sp.get("deCvu") || "0000031000047630488114";
  const deCuenta = "Cuenta Digital House Money";

  // Receptor (Para)
  const paraNombre = sp.get("toName") || "Gerardo Riera";
  const paraBanco = sp.get("toBank") || "Banco Galicia";
  const paraDoc = sp.get("toDoc") || "000013912847500027631";
  const paraTipo = sp.get("toType") || "Caja de ahorro";

  const motivo = sp.get("motivo") || "Varios";
  const codigo = sp.get("cod") || "27903047281";

  const fecha = new Date();
  const fechaTxt = fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const horaTxt = fecha
    .toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    .replace(" ", "");

  const onPrint = () => window.print();

  return (
    <div className="max-w-[560px] mx-auto px-4 md:px-6 py-6 md:py-8 print:px-0 print:py-0">
      {/* Cinta superior verde con logo textual */}
      <header
        className="rounded-t-2xl md:rounded-2xl px-5 py-3 print:rounded-none"
        style={{ background: "var(--dmh-lime)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[#111] font-extrabold text-2xl leading-none">
            DIGITAL
          </span>
          <span className="bg-[#111] text-white rounded-md px-2 py-0.5 font-extrabold text-xl leading-none">
            MONEY HOUSE
          </span>
        </div>
      </header>

      {/* Contenido principal sobre fondo oscuro (como la maqueta) */}
      <section className="bg-[#1f1f1f] text-white rounded-b-2xl md:rounded-2xl -mt-[1px] shadow-md border border-black/25 print:rounded-none print:border-0">
        {/* Título + fecha */}
        <div className="px-6 pt-5">
          <h1
            className="text-[22px] font-extrabold"
            style={{ color: "var(--dmh-lime)" }}
          >
            Comprobante de transferencia
          </h1>
          <p className="text-white/80 mt-1">
            {fechaTxt} a las {horaTxt} hs.
          </p>
        </div>

        {/* Tarjeta del detalle como en la imagen */}
        <div className="px-4 md:px-6 pb-6">
          <div className="mt-4 bg-[#202020] rounded-2xl border border-white/10 overflow-hidden">
            {/* Monto */}
            <div className="px-5 md:px-6 pt-4">
              <p className="text-white/70 text-sm">Transferencia</p>
              <p className="text-[24px] font-extrabold mt-1">
                {fmtMoney(importe)}
              </p>
            </div>
            <div className="h-px bg-white/10 my-4 mx-5 md:mx-6" />

            {/* Línea temporal De / Para */}
            <div className="px-5 md:px-6 pb-1">
              <div className="relative border-l-2 border-white/15 pl-6">
                {/* nodo 1 */}
                <span className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-white" />
                <p className="text-white/70 text-sm">De</p>
                <p className="text-xl font-extrabold mt-1">{deNombre}</p>
                <p className="text-white/70 text-sm mt-1">CVU: {deCVU}</p>
                <p className="text-white/70 text-sm">{deCuenta}</p>

                {/* nodo 2 */}
                <div className="relative mt-6">
                  <span className="absolute -left-[21px] top-2 w-2 h-2 rounded-full bg-white" />
                  <p className="text-white/70 text-sm">Para</p>
                  <p className="text-xl font-extrabold mt-1">{paraNombre}</p>
                  <p className="text-white/70 text-sm mt-1">{paraBanco}</p>
                  <p className="text-white/70 text-sm">CUIT/CUIL: {paraDoc}</p>
                  <p className="text-white/70 text-sm">{paraTipo}</p>
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="h-px bg-white/10 my-3 mx-5 md:mx-6" />
            <div className="px-5 md:px-6 pb-3">
              <p className="text-white/70">
                <span className="font-medium">Motivo:</span>{" "}
                <span>{motivo}</span>
              </p>
            </div>

            {/* Código */}
            <div className="h-px bg-white/10 my-3 mx-5 md:mx-6" />
            <div className="px-5 md:px-6 pb-5">
              <p className="text-white/70">Código de transferencia</p>
              <p className="mt-1">{codigo}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Botones de acción (ocultos en impresión) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <Link
          href="/home"
          className="h-12 rounded-xl bg-[#e6e6e6] text-black font-semibold grid place-items-center hover:brightness-95 shadow"
        >
          Ir al inicio
        </Link>
        <button
          onClick={onPrint}
          className="h-12 rounded-xl font-semibold grid place-items-center hover:brightness-95 shadow"
          style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
        >
          Descargar comprobante
        </button>
      </div>

      {/* Estilos de impresión para que salga tal cual en PDF */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #111 !important;
          }
          header,
          section {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
