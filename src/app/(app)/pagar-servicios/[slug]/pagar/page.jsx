"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );

const PROVEEDOR_NOMBRE = (slug) => {
  const s = String(slug || "").toLowerCase();
  if (s.includes("cable")) return "Cablevisión";
  if (s.includes("claro")) return "Claro";
  if (s.includes("personal")) return "Personal";
  return "Servicio";
};

export default function PagarPage() {
  const router = useRouter();
  const { slug } = useParams();
  const search = useSearchParams();
  const cuentaRef = search.get("cta") || "";
  const proveedor = PROVEEDOR_NOMBRE(slug);

  const supabase = getSupabaseClient();
  const { session } = useAuth();

  // datos
  const [tarjetas, setTarjetas] = useState([]);
  const [cuenta, setCuenta] = useState(null); // { id, saldo }
  const [monto] = useState(1153.75); // el de la maqueta
  const [showDetails, setShowDetails] = useState(false);

  // método seleccionado: "balance" | "card:<id>"
  const [method, setMethod] = useState("");
  const payingWithBalance = method === "balance";
  const selectedCardId = method.startsWith("card:")
    ? Number(method.split(":")[1])
    : null;

  // carga de tarjetas
  useEffect(() => {
    const fetchCards = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("medios_pago")
        .select("id, numero_mascarado, banco, tipo, created_at")
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false });
      setTarjetas(data || []);
    };
    fetchCards();
  }, [session?.user?.id, supabase]);

  // carga de cuenta (saldo)
  useEffect(() => {
    const fetchCuenta = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("cuentas")
        .select("id, saldo")
        .eq("usuario_id", session.user.id)
        .limit(1);
      setCuenta(data?.[0] || null);
    };
    fetchCuenta();
  }, [session?.user?.id, supabase]);

  // método por defecto cuando ya hay datos
  useEffect(() => {
    if (!method) {
      if ((cuenta?.saldo ?? 0) >= monto) {
        setMethod("balance");
      } else if (tarjetas?.length) {
        setMethod(`card:${tarjetas[0].id}`);
      }
    }
  }, [cuenta?.saldo, tarjetas, monto, method]);

  const tarjetaSel = useMemo(
    () => tarjetas.find((t) => t.id === selectedCardId),
    [tarjetas, selectedCardId]
  );

  const [processing, setProcessing] = useState(false);

  const onPagar = async () => {
    if (!method) return;

    try {
      setProcessing(true);

      // Pago con saldo de cuenta
      if (payingWithBalance) {
        // re-check saldo por seguridad
        const { data: row, error: e1 } = await supabase
          .from("cuentas")
          .select("id, saldo")
          .eq("id", cuenta.id)
          .single();
        if (e1) throw e1;
        if (!row || Number(row.saldo) < monto) {
          alert("Saldo insuficiente.");
          return;
        }

        // 1) descontar saldo
        const nuevoSaldo = Number(row.saldo) - monto;
        const { error: e2 } = await supabase
          .from("cuentas")
          .update({ saldo: nuevoSaldo })
          .eq("id", row.id);
        if (e2) throw e2;

        // 2) registrar movimiento
        const { error: e3 } = await supabase.from("movimientos").insert([
          {
            usuario_id: session.user.id,
            monto: -monto,
            tipo: "pago_servicio",
            descripcion: `Pago de ${proveedor}`,
            destinatario: proveedor,
            fecha: new Date().toISOString(),
          },
        ]);
        if (e3) throw e3;

        router.push(
          `/pagar-servicios/${slug}/exito?m=${monto}&b=${encodeURIComponent(
            "Dinero en cuenta"
          )}&mask=`
        );
        return;
      }

      // Pago con tarjeta
      if (!selectedCardId) {
        alert("Seleccioná una tarjeta.");
        return;
      }

      // Acá iría la llamada real al gateway. Simulación OK:
      router.push(
        `/pagar-servicios/${slug}/exito?m=${monto}&b=${encodeURIComponent(
          tarjetaSel?.banco || ""
        )}&mask=${encodeURIComponent(tarjetaSel?.numero_mascarado || "")}`
      );
    } catch (err) {
      console.error(err);
      alert("No pudimos procesar el pago. Intentá nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  const saldoInsuficiente = payingWithBalance && (cuenta?.saldo ?? 0) < monto;
  const payDisabled =
    processing ||
    !method ||
    (payingWithBalance && saldoInsuficiente) ||
    (!payingWithBalance && !selectedCardId);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header negro con total y link */}
      <div className="bg-[#1f1f1f] text-white rounded-2xl shadow-md border border-black/20 overflow-hidden">
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <h2
            className="text-2xl md:text-[28px] font-extrabold"
            style={{ color: "var(--dmh-lime)" }}
          >
            {proveedor}
          </h2>
          <button
            onClick={() => setShowDetails(true)}
            className="text-sm underline underline-offset-4 hover:text-white"
          >
            Ver detalles del pago
          </button>
        </div>
        <div className="h-px bg-white/10 mx-6" />
        <div className="px-6 py-5 flex items-center justify-between">
          <span className="text-lg font-semibold">Total a pagar</span>
          <span className="text-2xl md:text-[26px] font-extrabold">
            {fmtMoney(monto)}
          </span>
        </div>
      </div>

      {/* Medios de pago */}
      <div className="mt-5 bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 text-gray-800 font-semibold">
          Medios de pago
        </div>
        <ul className="divide-y divide-gray-200">
          {/* Dinero en cuenta */}
          <li className="px-6">
            <label className="py-4 flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{ background: "var(--dmh-lime)" }}
                />
                <div className="text-gray-800">
                  Dinero en cuenta{" "}
                  <span className="text-gray-500">
                    • Disponible {fmtMoney(cuenta?.saldo || 0)}
                  </span>
                  {saldoInsuficiente && (
                    <div className="text-[13px] text-red-600">
                      Saldo insuficiente para este pago
                    </div>
                  )}
                </div>
              </div>
              <input
                type="radio"
                name="method"
                className="w-5 h-5 accent-black"
                checked={payingWithBalance}
                onChange={() => setMethod("balance")}
                disabled={!cuenta}
              />
            </label>
          </li>

          {/* Tarjetas guardadas */}
          {tarjetas.map((t) => (
            <li key={t.id} className="px-6">
              <label className="py-4 flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ background: "var(--dmh-lime)" }}
                  />
                  <span className="text-gray-800">
                    Terminada en {(t?.numero_mascarado || "").slice(-4)}
                    {t?.banco ? (
                      <span className="text-gray-500"> • {t.banco}</span>
                    ) : null}
                  </span>
                </div>
                <input
                  type="radio"
                  name="method"
                  className="w-5 h-5 accent-black"
                  checked={method === `card:${t.id}`}
                  onChange={() => setMethod(`card:${t.id}`)}
                />
              </label>
            </li>
          ))}
          {tarjetas.length === 0 && (
            <li className="px-6 py-10 text-center text-gray-500">
              No tenés tarjetas cargadas.
            </li>
          )}
        </ul>
      </div>

      {/* CTA pagar */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onPagar}
          disabled={payDisabled}
          className="w-full md:w-[240px] h-12 rounded-xl font-semibold shadow-md hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
        >
          {processing ? "Procesando…" : "Pagar"}
        </button>
      </div>

      {/* Modal “Ver detalles del pago” */}
      {showDetails && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Detalle</h3>
              <button
                className="p-1.5 rounded hover:bg-black/5"
                onClick={() => setShowDetails(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-5 text-sm space-y-2">
              <p>
                <span className="text-gray-500">Servicio:</span>{" "}
                <span className="font-medium">{proveedor}</span>
              </p>
              {cuentaRef && (
                <p>
                  <span className="text-gray-500">Cuenta:</span>{" "}
                  <span className="font-medium">{cuentaRef}</span>
                </p>
              )}
              <p>
                <span className="text-gray-500">Importe:</span>{" "}
                <span className="font-medium">{fmtMoney(monto)}</span>
              </p>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                className="rounded-lg px-4 py-2 border"
                onClick={() => setShowDetails(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
