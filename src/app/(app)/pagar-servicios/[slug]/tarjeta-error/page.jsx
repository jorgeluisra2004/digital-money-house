"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";

const LIME = "var(--dmh-lime)";

export default function TarjetaErrorPage() {
  const { slug } = useParams();
  const sp = useSearchParams();
  const router = useRouter();

  const back = () => {
    const qp = new URLSearchParams();
    const cta = sp.get("cta");
    const m = sp.get("m");
    const e2e = sp.get("e2e");
    if (cta) qp.set("cta", cta);
    if (m) qp.set("m", m);
    if (e2e) qp.set("e2e", e2e);
    router.push(`/pagar-servicios/${slug}/pagar?${qp.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <section
        className="rounded-2xl bg-[#202124] text-white px-6 py-10 shadow-sm border border-black/20"
        data-testid="card-error-panel"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full grid place-items-center border-4 border-red-500 text-red-500 text-3xl">
            ×
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">
            Hubo un problema con tu pago
          </h1>
          <div
            className="h-px w-full my-5"
            style={{ background: "rgba(255,255,255,.1)" }}
          />
          <p className="text-white/80">Puede deberse a fondos insuficientes</p>
          <p className="text-white/80">
            Comunicate con la entidad emisora de la tarjeta
          </p>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button
          onClick={back}
          className="h-12 px-6 rounded-xl font-semibold shadow"
          style={{ background: LIME, color: "#0f0f0f" }}
          type="button"
          data-testid="btn-card-retry"
        >
          Volver a intentarlo
        </button>
      </div>
    </div>
  );
}
