"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );

// para mostrar miles en el input (sin decimales)
const fmtMiles = (n) =>
  new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

const CONTACTOS = [
  {
    id: "karent",
    nombre: "Karent Velásquez",
    banco: "Banco Nación",
    alias: "karent.velasquez.dmh",
  },
  {
    id: "lucas",
    nombre: "Lucas Pereyra",
    banco: "Banco Galicia",
    alias: "lucas.pereyra.gal",
  },
  {
    id: "valentina",
    nombre: "Valentina Suárez",
    banco: "Banco Santander",
    alias: "valen.suarez.san",
  },
];

export default function TransferirPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cuenta, setCuenta] = useState(null); // { id, saldo, ... }
  const [loading, setLoading] = useState(true);

  // ----- formulario -----
  const [destId, setDestId] = useState(CONTACTOS[0].id);
  const destinatario = useMemo(
    () => CONTACTOS.find((c) => c.id === destId),
    [destId]
  );

  // guardamos solo dígitos (pesos enteros)
  const [raw, setRaw] = useState("");
  const monto = useMemo(() => Number(raw || 0), [raw]);
  const [nota, setNota] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { nuevoSaldo, transferidoA, monto }

  const submitLock = useRef(false);

  // ----- guards / carga -----
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
        const { data, error } = await supabase
          .from("cuentas")
          .select("id, saldo, cvu, alias")
          .eq("usuario_id", session.user.id)
          .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
          // si no existe, la creo con saldo 0
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
          setCuenta(data[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, session?.user?.id, supabase]);

  // helpers
  const saldoActual = Number(cuenta?.saldo || 0);
  const saldoResultante = useMemo(
    () => (monto > 0 ? saldoActual - monto : saldoActual),
    [monto, saldoActual]
  );

  const onChangeMonto = (e) => {
    const onlyDigits = (e.target.value || "").replace(/\D+/g, "");
    setRaw(onlyDigits);
  };

  const setPreset = (n) => setRaw(String(n));

  const validar = () => {
    if (!destinatario) return "Elegí un destinatario.";
    if (!monto || monto <= 0) return "Ingresá un monto válido.";
    if (monto > saldoActual)
      return "Saldo insuficiente para realizar la transferencia.";
    return "";
  };

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
      const nuevoSaldo = saldoActual - monto;

      // 1) actualizo saldo
      const { error: upErr } = await supabase
        .from("cuentas")
        .update({ saldo: nuevoSaldo })
        .eq("id", cuenta.id);
      if (upErr) throw upErr;

      // 2) inserto movimiento (egreso -> monto negativo)
      const descripcionBase = `Transferiste a ${destinatario.nombre}`;
      const descripcion = nota
        ? `${descripcionBase} — ${nota}`
        : descripcionBase;

      const { error: movErr } = await supabase.from("movimientos").insert([
        {
          usuario_id: session.user.id,
          tipo: "egreso",
          descripcion,
          destinatario: destinatario.nombre,
          fecha: new Date().toISOString(),
          monto: -monto, // negativo
        },
      ]);
      if (movErr) throw movErr;

      // 3) refetch autoritativo de saldo
      const { data: refreshed, error: refErr } = await supabase
        .from("cuentas")
        .select("saldo")
        .eq("id", cuenta.id)
        .single();
      if (refErr) throw refErr;

      const saldoRef = Number(refreshed?.saldo ?? nuevoSaldo);
      setCuenta((c) => ({ ...(c || {}), saldo: saldoRef }));
      setSuccess({
        nuevoSaldo: saldoRef,
        transferidoA: destinatario.nombre,
        monto,
      });
      setRaw("");
      setNota("");
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la transferencia. Intentá nuevamente.");
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
            Transferir dinero
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
        <div className="px-6 py-5 space-y-6">
          {/* Destinatarios */}
          <section>
            <p className="text-gray-800 font-semibold mb-2">
              Elegí a quién transferir
            </p>
            <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
              {CONTACTOS.map((c) => (
                <li key={c.id} className="bg-white">
                  <label className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[.02]">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: "var(--dmh-lime)" }}
                      />
                      <div>
                        <p className="text-gray-900 font-medium">{c.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {c.banco} • {c.alias}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="contact"
                      className="w-5 h-5 accent-black"
                      checked={destId === c.id}
                      onChange={() => setDestId(c.id)}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {/* Monto y nota */}
          <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div>
              <p className="text-gray-800 font-semibold mb-2">Monto</p>
              <div className="flex items-center rounded-xl border border-[#d8f3d1] focus-within:border-[var(--dmh-lime)] px-4 py-3">
                <span className="text-gray-600 mr-2">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={raw ? fmtMiles(raw) : ""}
                  onChange={onChangeMonto}
                  placeholder="0"
                  className="w-full outline-none text-lg text-[#111] placeholder:text-gray-400"
                  aria-label="Monto a transferir"
                />
              </div>

              {/* chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[10000, 50000, 100000].map((p) => {
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
                  Saldo luego de transferir:{" "}
                  <b className="text-gray-900">{fmtMoney(saldoResultante)}</b>
                </span>
              </div>
            </div>

            <div className="md:pl-2">
              <p className="text-gray-800 font-semibold mb-2">
                Motivo (opcional)
              </p>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Alquiler de octubre"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[var(--dmh-lime)]"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-[220px] h-12 rounded-xl font-semibold shadow-md hover:brightness-95 transition disabled:opacity-60"
                style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
              >
                {saving ? "Enviando…" : "Transferir"}
              </button>
            </div>
          </section>

          {error && (
            <div className="text-red-600 font-medium -mt-2">{error}</div>
          )}
        </div>
      </form>

      {/* ÉXITO */}
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
                  ¡Transferiste {fmtMoney(success.monto)}!
                </p>
                <p className="text-[#0f0f0f]/80">
                  Para <b>{success.transferidoA}</b>. Tu nuevo saldo es{" "}
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
