"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

function detectBrand(raw) {
  const n = (raw || "").replace(/\D/g, "");
  if (/^4\d{12,18}$/.test(n)) return "visa";
  if (
    /^(5[1-5]\d{14}|2(2[2-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720\d{2})\d{10})$/.test(
      n
    )
  )
    return "mastercard";
  return "desconocida";
}
function formatNumber(raw) {
  const n = (raw || "").replace(/\D/g, "").slice(0, 19);
  return n.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
function formatExpiry(raw) {
  const n = (raw || "").replace(/\D/g, "").slice(0, 4);
  return n.length <= 2 ? n : `${n.slice(0, 2)}/${n.slice(2)}`;
}
const last4 = (raw) => (raw || "").replace(/\D/g, "").slice(-4);

function CardPreview({ number, name, expiry }) {
  const brand = detectBrand(number);
  const THEMES = {
    visa: { bg1: "#0a1a2b", bg2: "#143a61", accent: "#1a73e8" },
    mastercard: { bg1: "#1e1413", bg2: "#3a1b17", accent: "#ff5f00" },
    desconocida: { bg1: "#151515", bg2: "#242424", accent: "#c9ff2a" },
  };
  const theme = THEMES[brand] || THEMES.desconocida;

  const pretty = formatNumber(number) || "**** **** **** ****";
  const holder = (name || "NOMBRE DEL TITULAR").toUpperCase();
  const exp = expiry || "MM/YY";

  return (
    <motion.div
      className="mx-auto w-[320px] h-[190px] rounded-xl text-white relative shadow-[0_10px_30px_rgba(0,0,0,.35)]"
      style={{
        background: "linear-gradient(135deg, var(--bg1), var(--bg2))",
        boxShadow: "0 10px 30px rgba(0,0,0,.35), 0 0 0 0 var(--accent)",
      }}
      animate={{
        ["--bg1"]: theme.bg1,
        ["--bg2"]: theme.bg2,
        ["--accent"]: theme.accent,
      }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
        duration: 0.5,
      }}
    >
      <motion.div
        className="absolute -inset-0.5 rounded-xl pointer-events-none"
        style={{
          background:
            "conic-gradient(from 120deg, transparent, var(--accent), transparent)",
        }}
        animate={{ opacity: brand === "desconocida" ? 0.15 : 0.25 }}
        transition={{ duration: 0.4 }}
      />
      <div
        className="absolute inset-[2px] rounded-[14px]"
        style={{ background: "rgba(0,0,0,.15)" }}
      />

      <div className="relative p-5 h-full flex flex-col justify-between">
        <div className="flex justify-end">
          <div className="w-12 h-8 rounded-md bg-white/20 grid place-items-center text-[10px] tracking-widest">
            {brand === "visa" ? "VISA" : brand === "mastercard" ? "MC" : ""}
          </div>
        </div>
        <div className="space-y-2">
          <div className="tracking-[0.25em] text-lg font-semibold">
            {pretty}
          </div>
          <div className="flex items-center justify-between text-xs text-white/80">
            <div>
              <div className="uppercase text-[10px] opacity-75">
                Nombre del titular
              </div>
              <div className="font-semibold">{holder}</div>
            </div>
            <div className="text-right">
              <div className="uppercase text-[10px] opacity-75">MM/YY</div>
              <div className="font-semibold">{exp}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TarjetasPage() {
  const supabase = getSupabaseClient();
  const { session } = useAuth();

  const [mode, setMode] = useState("list");
  const [cards, setCards] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [name, setName] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  const brand = useMemo(() => detectBrand(num), [num]);

  useEffect(() => {
    const fetchCards = async () => {
      if (!session?.user?.id) return;
      setLoadingList(true);
      const { data } = await supabase
        .from("medios_pago")
        .select(
          "id, tipo, numero_mascarado, banco, fecha_vencimiento, created_at"
        )
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false });
      setCards(data || []);
      setLoadingList(false);
    };
    fetchCards();
  }, [session?.user?.id, supabase]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    const raw = (num || "").replace(/\D/g, "");
    const expPretty = formatExpiry(exp);

    if (!/^\d{16,19}$/.test(raw)) return alert("Número de tarjeta inválido");
    if (!/^\d{2}\/\d{2}$/.test(expPretty))
      return alert("Fecha inválida (MM/YY)");
    if (!name.trim()) return alert("Nombre requerido");
    if (!/^\d{3,4}$/.test((cvv || "").trim())) return alert("CVV inválido");

    setSaving(true);
    try {
      const mask = "**** **** **** " + last4(raw);
      const brandStr =
        brand === "visa"
          ? "VISA"
          : brand === "mastercard"
          ? "MASTERCARD"
          : "DESCONOCIDO";
      const { error } = await supabase.from("medios_pago").insert([
        {
          usuario_id: session.user.id,
          tipo: brandStr.toLowerCase(),
          numero_mascarado: mask,
          banco: brandStr,
          fecha_vencimiento: expPretty,
        },
      ]);
      if (error) throw error;

      setNum("");
      setExp("");
      setName("");
      setCvv("");
      const { data } = await supabase
        .from("medios_pago")
        .select(
          "id, tipo, numero_mascarado, banco, fecha_vencimiento, created_at"
        )
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false });
      setCards(data || []);
      setMode("list");
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la tarjeta.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    await supabase.from("medios_pago").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* SOLO contenido — el sidebar es global y fijo */}
      {mode === "form" ? (
        <div className="bg-white/80 rounded-xl p-8 shadow border border-black/10">
          <div className="mb-8 grid place-items-center">
            <CardPreview number={num} name={name} expiry={formatExpiry(exp)} />
          </div>

          <form
            onSubmit={handleSave}
            className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <input
              value={formatNumber(num)}
              onChange={(e) => setNum(e.target.value)}
              placeholder="Número de la tarjeta*"
              className="bg-white text-[#111] placeholder:text-gray-500 border border-[#d8f3d1] focus:border-[var(--dmh-lime)] outline-none rounded-lg px-4 py-3"
            />
            <input
              value={formatExpiry(exp)}
              onChange={(e) => setExp(e.target.value)}
              placeholder="Fecha de vencimiento*"
              className="bg-white text-[#111] placeholder:text-gray-500 border border-[#d8f3d1] focus:border-[var(--dmh-lime)] outline-none rounded-lg px-4 py-3"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido*"
              className="bg-white text-[#111] placeholder:text-gray-500 border border-[#d8f3d1] focus:border-[var(--dmh-lime)] outline-none rounded-lg px-4 py-3"
            />
            <input
              value={cvv}
              onChange={(e) =>
                setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Código de seguridad*"
              className="bg-white text-[#111] placeholder:text-gray-500 border border-[#d8f3d1] focus:border-[var(--dmh-lime)] outline-none rounded-lg px-4 py-3"
            />

            <div className="md:col-span-2 flex justify-center mt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto min-w-[280px] h-12 rounded-lg font-semibold hover:brightness-95 transition"
                style={{ backgroundColor: "var(--dmh-lime)", color: "#111" }}
              >
                {saving ? "Guardando…" : "Continuar"}
              </button>
            </div>
            <div className="md:col-span-2 flex justify-center">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="text-sm text-gray-600 underline mt-1"
              >
                Volver al listado
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="rounded-xl p-6 flex items-center justify-between text-white"
            style={{ background: "#1f1f1f" }}
          >
            <div className="font-semibold">
              Agregá tu tarjeta de débito o crédito
            </div>
            <button
              onClick={() => setMode("form")}
              className="flex items-center gap-3 bg-[#2a2a2a] hover:bg-[#333] rounded-xl px-5 py-3 transition"
            >
              <span
                className="w-7 h-7 rounded-full grid place-items-center text-black"
                style={{ background: "var(--dmh-lime)" }}
              >
                +
              </span>
              <span className="text-[var(--dmh-lime)] font-semibold">
                Nueva tarjeta
              </span>
              <svg width="22" height="22" viewBox="0 0 24 24" className="ml-2">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow border border-black/10">
            <div className="px-6 py-4 font-semibold">Tus tarjetas</div>
            {loadingList ? (
              <div className="px-6 py-10 text-gray-500">Cargando…</div>
            ) : cards.length === 0 ? (
              <div className="px-6 py-10 text-gray-500">
                Aún no agregaste tarjetas.
              </div>
            ) : (
              <ul>
                {cards.map((c, idx) => {
                  const terminada = (c?.numero_mascarado || "").slice(-4);
                  return (
                    <li key={c.id}>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ background: "var(--dmh-lime)" }}
                          />
                          <div className="text-gray-800">
                            Terminada en {terminada}
                            {c?.banco ? (
                              <span className="text-gray-500">
                                {" "}
                                • {c.banco}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-[crimson] hover:underline text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                      {idx < cards.length - 1 && (
                        <hr className="border-t border-gray-200" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
