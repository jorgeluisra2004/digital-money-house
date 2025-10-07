// /src/app/pagar-servicios/[slug]/pagar/page.jsx
"use client";

import Link from "next/link";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { isE2E } from "@/lib/isE2E";

const LIME = "var(--dmh-lime)";
const DARK = "var(--dmh-black)";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );

export default function PagarMediosPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();
  const sp = useSearchParams();
  const router = useRouter();
  const { slug } = useParams();

  const cta = (sp.get("cta") || "").replace(/\D/g, "");
  const monto = Number(sp.get("m") || 0) || 0;

  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id || (isE2E() ? "e2e-user" : null);

  useEffect(() => {
    const load = async () => {
      if ((!isE2E() && authLoading) || !userId) return;
      setLoading(true);
      try {
        const { data: t } = await supabase
          .from("tarjetas")
          .select("id, brand, last4")
          .eq("usuario_id", userId)
          .order("id", { ascending: true });

        const list = Array.isArray(t) ? t : [];
        setCards(list);
        setSelectedCard(list[0] || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, userId, supabase]);

  const shouldFail = (card) => {
    const last4 = String(card?.last4 || "");
    return last4 === "0000" || last4 === "4067";
  };

  const pagarConTarjeta = () => {
    if (!selectedCard) return;

    // siempre preservamos query params usados por los tests y pantallas
    const qp = new URLSearchParams();
    if (cta) qp.set("cta", cta);
    if (monto) qp.set("m", String(monto));
    if (isE2E()) qp.set("e2e", "1");

    if (shouldFail(selectedCard)) {
      router.push(`/pagar-servicios/${slug}/tarjeta-error?${qp.toString()}`);
      return;
    }

    // Caso ÉXITO → reutilizamos comprobante
    const params = new URLSearchParams({
      m: String(monto),
      // datos de comprobante (mock de negocio)
      deName: "Mauricio Brito",
      deCvu: "0000031000047630488114",
      toName: `Servicio ${String(slug || "").replace(/-/g, " ")}`,
      toBank: "Banco Galicia",
      toDoc: cta || "000013912847500027631",
      toType: "Cuenta de terceros",
      motivo: "Pago de servicio",
      cod: String(27900000000 + Math.floor(Math.random() * 999999)).slice(
        0,
        11
      ),
    });
    if (isE2E()) params.set("e2e", "1");

    router.push(`/pagar-servicios/${slug}/exito?${params.toString()}`);
  };

  const nombreProveedor = String(slug || "").replace(/-/g, " ");

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="bg-[#202124] text-white rounded-2xl shadow-sm border border-black/20 overflow-hidden">
        {/* Header oscuro como la maqueta */}
        <div className="px-6 py-5 flex items-start justify-between">
          <div>
            <div className="text-[22px] font-extrabold" style={{ color: LIME }}>
              {nombreProveedor.charAt(0).toUpperCase() +
                nombreProveedor.slice(1)}
            </div>
            <div className="mt-3 text-lg">Total a pagar</div>
          </div>
          <div className="text-right">
            <Link href="#" className="text-white/80 hover:underline text-sm">
              Ver detalles del pago
            </Link>
            <div className="mt-3 text-2xl font-extrabold">
              {fmtMoney(monto)}
            </div>
          </div>
        </div>

        {/* Tarjetas guardadas (único medio de pago en este sprint) */}
        <div className="bg-white text-black">
          <div className="px-6 pt-5 font-semibold">Tus tarjetas</div>

          <div className="px-6">
            <div
              className="mt-3 divide-y rounded-xl border"
              data-testid="pago-cards"
            >
              {cards.map((t) => {
                const checked = selectedCard?.id === t.id;
                return (
                  <label
                    key={t.id}
                    className="flex items-center justify-between gap-4 py-4 px-4 cursor-pointer select-none"
                    onClick={() => setSelectedCard(t)}
                    data-testid={`pago-card-${t.last4 || "0000"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-7 h-7 rounded-full"
                        style={{ background: LIME }}
                      />
                      <span className="text-[15px]" style={{ color: DARK }}>
                        Terminada en {t.last4 || "0000"}
                      </span>
                    </div>
                    <span
                      className={`relative inline-block w-[18px] h-[18px] rounded-full border ${
                        checked
                          ? "border-[color:var(--dmh-black)]"
                          : "border-[#c9c9c9]"
                      }`}
                      aria-checked={checked}
                      role="radio"
                    >
                      {checked && (
                        <span
                          className="absolute inset-[3px] rounded-full"
                          style={{
                            background: LIME,
                            outline: `2px solid var(--dmh-black)`,
                          }}
                        />
                      )}
                    </span>
                  </label>
                );
              })}
              {cards.length === 0 && (
                <div className="px-4 py-6 text-sm text-black/60">
                  No tenés tarjetas guardadas todavía.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <Link
                href="/tarjetas"
                className="inline-flex items-center gap-2 font-semibold"
                style={{ color: LIME }}
                data-testid="pago-nueva-tarjeta"
              >
                <span
                  className="inline-grid place-items-center w-7 h-7 rounded-full border"
                  style={{ borderColor: LIME }}
                >
                  +
                </span>
                Nueva tarjeta
              </Link>

              <button
                onClick={pagarConTarjeta}
                disabled={loading || !selectedCard}
                className="h-12 px-8 rounded-xl font-semibold shadow"
                style={{ background: LIME, color: DARK }}
                type="button"
                data-testid="btn-card-pay"
              >
                Pagar
              </button>
            </div>
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
