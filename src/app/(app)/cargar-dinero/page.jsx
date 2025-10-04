"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const MAX_CARGA = 1_500_000;

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );

// Mostrar miles sin decimales en el input
const fmtMiles = (n) =>
  new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

export default function CargarDineroPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- Form ----
  // Guardamos solo dígitos (pesos enteros). Ej: "50000"
  const [raw, setRaw] = useState("");
  const monto = useMemo(() => Number(raw || 0), [raw]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Anti doble-submit
  const submitLock = useRef(false);

  // Guard & carga de cuenta
  useEffect(() => {
    if (authLoading) return;
    if (!session?.user) {
      setLoading(false);
      router.replace("/login");
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    const load = async () => {
      if (authLoading || !session?.user?.id) return;

      setLoading(true);
      try {
        const { data: row, error } = await supabase
          .from("cuentas")
          .select("id, saldo, cvu, alias")
          .eq("usuario_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!row) {
          const { data: created, error: insErr } = await supabase
            .from("cuentas")
            .insert([
              { usuario_id: session.user.id, saldo: 0, cvu: "", alias: "" },
            ])
            .select("id, saldo, cvu, alias")
            .single();
          if (insErr) throw insErr;
          setCuenta(created);
        } else {
          setCuenta(row);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, session?.user?.id, supabase]);

  const saldoActual = Number(cuenta?.saldo || 0);
  const saldoResultante = useMemo(
    () => (monto > 0 ? saldoActual + monto : saldoActual),
    [monto, saldoActual]
  );

  const setPreset = (n) => setRaw(String(n));

  const validar = () => {
    if (!monto || monto <= 0) return "Ingresá un monto válido.";
    if (monto > MAX_CARGA)
      return `El máximo por carga es ${fmtMoney(MAX_CARGA)}.`;
    return "";
  };

  const onChangeMonto = (e) => {
    // Solo dígitos; quitamos separadores/espacios/letras
    const onlyDigits = (e.target.value || "").replace(/\D+/g, "");
    setRaw(onlyDigits);
  };

  const canSubmit = !saving && monto > 0 && monto <= MAX_CARGA;

  const onSubmit = async (e) => {
    e?.preventDefault();
    if (!cuenta?.id || !session?.user?.id) return;

    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    if (submitLock.current) return;
    submitLock.current = true;

    setSaving(true);
    setError("");
    try {
      // ✅ ÚNICA operación: RPC atómica en la DB
      const { data: newSaldo, error: rpcErr } = await supabase.rpc(
        "fn_cargar_dinero",
        { p_cuenta: cuenta.id, p_monto: monto }
      );
      if (rpcErr) throw rpcErr;

      const saldoRef = Number(newSaldo);
      setCuenta((c) => ({ ...(c || {}), saldo: saldoRef }));
      setSuccess({ nuevoSaldo: saldoRef, cargo: monto });
      setRaw(""); // limpiar input
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la carga. Intentá nuevamente.");
    } finally {
      setSaving(false);
      submitLock.current = false;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-[60vh] grid place-items-center text-gray-600">
        Cargando…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header negro con saldo */}
      <div className="bg-[#1f1f1f] text-white rounded-2xl shadow-md border border-black/20 overflow-hidden">
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <h2
            className="text-2xl md:text-[28px] font-extrabold"
            style={{ color: "var(--dmh-lime)" }}
          >
            Cargar dinero
          </h2>
          <div className="text-right">
            <p className="text-white/80 text-sm">Saldo disponible</p>
            <p className="text-[22px] md:text-[24px] font-extrabold">
              {fmtMoney(saldoActual)}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={onSubmit}
        noValidate
        autoComplete="off"
        className="mt-5 bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5">
          <p className="text-gray-800 font-semibold mb-2">Monto a cargar</p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            {/* Input: pesos enteros con miles en vivo */}
            <div className="flex items-center rounded-xl border border-[#d8f3d1] focus-within:border-[var(--dmh-lime)] px-4 py-3">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={raw ? fmtMiles(raw) : ""}
                onChange={onChangeMonto}
                placeholder="0"
                className="w-full outline-none text-lg text-[#111] placeholder:text-gray-400"
                aria-label="Monto en pesos"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 rounded-xl font-semibold shadow-md hover:brightness-95 transition disabled:opacity-60"
              style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
            >
              {saving ? "Cargando…" : "Cargar"}
            </button>
          </div>

          {/* Presets (chips) */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[1000, 5000, 10000, 50000].map((p) => {
              const active = monto === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={`px-3 py-2 rounded-full text-sm font-semibold border transition
                    ${
                      active
                        ? "bg-[var(--dmh-lime)] border-[var(--dmh-lime)] text-[#0f0f0f] shadow"
                        : "border-[var(--dmh-lime)] text-[var(--dmh-lime)] hover:bg-[var(--dmh-lime)]/10"
                    }`}
                  title={`Usar ${fmtMoney(p)}`}
                >
                  {fmtMoney(p)}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-gray-500">
              Límite por carga: {fmtMoney(MAX_CARGA)}
            </span>
          </div>

          {/* Preview + errores */}
          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm">
            <div className="text-gray-600">
              Saldo luego de la carga:&nbsp;
              <span className="font-semibold text-gray-900">
                {fmtMoney(saldoResultante)}
              </span>
            </div>
            {error && <div className="text-red-600 font-medium">{error}</div>}
          </div>
        </div>
      </form>

      {/* Éxito */}
      {success && (
        <div className="mt-6">
          <div
            className="rounded-2xl shadow-md border border-lime-200/40"
            style={{ background: "var(--dmh-lime)" }}
          >
            <div className="px-6 py-6 flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-black/10 grid place-items-center">
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path
                    d="m20 6-11 11-5-5"
                    fill="none"
                    stroke="#111"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0f0f0f]">
                  ¡Cargaste {fmtMoney(success.cargo)}!
                </p>
                <p className="text-[#0f0f0f]/80">
                  Tu nuevo saldo es{" "}
                  <span className="font-extrabold">
                    {fmtMoney(success.nuevoSaldo)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/actividad"
              className="h-12 rounded-xl bg-white border border-black/10 text-gray-900 font-semibold grid place-items-center hover:bg-black/[.03] shadow-sm"
            >
              Ver actividad
            </Link>
            <Link
              href="/home"
              className="h-12 rounded-xl font-semibold grid place-items-center hover:brightness-95 shadow"
              style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
