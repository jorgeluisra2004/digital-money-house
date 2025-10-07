// /src/app/cargar-dinero/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

const MAX_CARGA = 1_500_000;
const LIME = "var(--dmh-lime)";
const DARK = "var(--dmh-black)";
const WHITE = "var(--white)";

function isE2E() {
  // Build-time
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_E2E) {
    const v = String(process.env.NEXT_PUBLIC_E2E).toLowerCase();
    if (v === "1" || v === "true") return true;
  }
  // Runtime/query
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-undef
    if (window.__E2E__ === true) return true;
    const p = new URLSearchParams(window.location.search);
    if ((p.get("e2e") || "").toLowerCase() === "1") return true;
  }
  return false;
}

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );
const fmtMiles = (n) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const VIEW = {
  OPTIONS: "options",
  TRANSFER: "transfer",
  CARD_SELECT: "card_select",
  CARD_AMOUNT: "card_amount",
  CARD_REVIEW: "card_review",
  SUCCESS: "success",
};

export default function CargarDineroPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [cuenta, setCuenta] = useState(null);
  const [tarjetas, setTarjetas] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [view, setView] = useState(VIEW.OPTIONS);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(true);

  const [raw, setRaw] = useState("");
  const monto = useMemo(() => Number(raw || 0), [raw]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const submitLock = useRef(false);

  useEffect(() => {
    if (isE2E()) {
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (!session?.user) {
      setLoading(false);
      router.replace("/login");
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    const load = async () => {
      const userId = session?.user?.id || (isE2E() ? "e2e-user" : null);
      // En E2E ignoramos authLoading para no bloquear la carga
      if ((!isE2E() && authLoading) || !userId) return;

      setLoading(true);
      try {
        const { data: row } = await supabase
          .from("cuentas")
          .select("id, saldo, cvu, alias")
          .eq("usuario_id", userId)
          .maybeSingle();

        let acc = row;
        if (!row) {
          const { data: created } = await supabase
            .from("cuentas")
            .insert([{ usuario_id: userId, saldo: 0, cvu: "", alias: "" }])
            .select("id, saldo, cvu, alias")
            .single();
          acc = created;
        }
        setCuenta(acc);

        const { data: cards, error: cardErr } = await supabase
          .from("tarjetas")
          .select("id, brand, last4")
          .eq("usuario_id", userId)
          .order("id", { ascending: true });

        if (!cardErr && Array.isArray(cards) && cards.length) {
          setTarjetas(cards);
          setSelectedCard(cards[0]);
        } else {
          const demo = [
            { id: "demo-1", brand: "Visa", last4: "0000" },
            { id: "demo-2", brand: "Mastercard", last4: "4067" },
          ];
          setTarjetas(demo);
          setSelectedCard(demo[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, session?.user?.id, supabase]);

  const canContinueAmount = monto > 0 && monto <= MAX_CARGA;
  const canSubmit = !saving && canContinueAmount && !!cuenta?.id;

  const onChangeMonto = (e) => {
    const onlyDigits = (e.target.value || "").replace(/\D+/g, "");
    setRaw(onlyDigits);
    if (error) setError("");
  };

  const validar = () => {
    if (!monto || monto <= 0) return "Ingresá un monto válido.";
    if (monto > MAX_CARGA)
      return `El máximo por carga es ${fmtMoney(MAX_CARGA)}.`;
    return "";
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(key);
      setTimeout(() => setCopied(""), 1100);
    } catch {}
  };

  const confirmarCarga = async () => {
    if (!canSubmit || submitLock.current) return;
    submitLock.current = true;
    setSaving(true);
    setError("");
    try {
      await supabase.rpc("fn_cargar_dinero", {
        p_cuenta: cuenta.id,
        p_monto: monto,
      });
      setSuccess({
        cargo: monto,
        fecha: new Date(),
        tarjeta: selectedCard
          ? `${selectedCard.brand} •••• ${selectedCard.last4}`
          : null,
      });
      setView(VIEW.SUCCESS);
      setRaw("");
    } catch {
      setError("No se pudo completar la carga. Intentá nuevamente.");
    } finally {
      setSaving(false);
      submitLock.current = false;
    }
  };

  const descargarComprobante = () => {
    if (!success) return;
    const W = 1400,
      H = 800;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--dmh-lime")
      .trim();
    roundRect(ctx, 40, 40, W - 80, 120, 20);
    ctx.fill();

    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--dmh-black")
      .trim();
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W / 2, 100, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 18, 100);
    ctx.lineTo(W / 2 - 2, 116);
    ctx.lineTo(W / 2 + 24, 86);
    ctx.stroke();

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--dmh-black")
      .trim();
    ctx.font = "700 42px Poppins, Arial";
    const header = "Ya cargamos el dinero en tu cuenta";
    ctx.fillText(header, W / 2 - ctx.measureText(header).width / 2, 124);

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--dmh-black")
      .trim();
    roundRect(ctx, 40, 200, W - 80, H - 260, 20);
    ctx.fill();

    ctx.fillStyle = "#c9c9c9";
    ctx.font = "500 26px Poppins, Arial";
    ctx.fillText(
      (success.fecha || new Date()).toLocaleString("es-AR", {
        dateStyle: "long",
        timeStyle: "short",
      }),
      70,
      260
    );

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--dmh-lime")
      .trim();
    ctx.font = "800 48px Poppins, Arial";
    ctx.fillText(fmtMoney(success.cargo), 70, 320);

    ctx.fillStyle = "#c9c9c9";
    ctx.font = "500 22px Poppins, Arial";
    ctx.fillText("Para", 70, 360);
    ctx.fillStyle = WHITE;
    ctx.font = "800 34px Poppins, Arial";
    ctx.fillText("Cuenta propia", 70, 405);

    ctx.fillStyle = "#c9c9c9";
    ctx.font = "600 24px Poppins, Arial";
    ctx.fillText("Brubank", 70, 450);
    ctx.font = "500 22px Poppins, Arial";
    ctx.fillText(`CVU  ${cuenta?.cvu || "0000000000000000000000"}`, 70, 485);

    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante-${Date.now()}.png`;
    a.click();
  };

  if (authLoading && !isE2E()) {
    return (
      <div className="h-[60vh] grid place-items-center text-white/70">
        Cargando…
      </div>
    );
  }
  if (loading) {
    return (
      <div className="h-[60vh] grid place-items-center text-white/70">
        Cargando…
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8"
      data-testid="cargar-root"
    >
      {view === VIEW.OPTIONS && (
        <div className="grid gap-6" data-testid="cargar-options">
          <OptionTile
            title="Transferencia bancaria"
            onClick={() => setView(VIEW.TRANSFER)}
            testId="btn-transfer"
          />
          <OptionTile
            title="Seleccionar tarjeta"
            onClick={() => setView(VIEW.CARD_SELECT)}
            card
            testId="btn-card"
          />
        </div>
      )}

      {view === VIEW.TRANSFER && (
        <section className="mt-2">
          <DarkCard>
            <p className="text-[16px] font-semibold text-white mb-6">
              Copia tu cvu o alias para ingresar o transferir dinero desde otra
              cuenta
            </p>

            <div className="space-y-9">
              <FieldCopy
                label="CVU"
                value={cuenta?.cvu || "0000000000000000000000"}
                copied={copied === "cvu"}
                onCopy={() => copy(cuenta?.cvu, "cvu")}
              />
              <FieldCopy
                label="Alias"
                value={cuenta?.alias || "estealiasnoexiste"}
                copied={copied === "alias"}
                onCopy={() => copy(cuenta?.alias, "alias")}
              />
            </div>
          </DarkCard>
        </section>
      )}

      {view === VIEW.CARD_SELECT && (
        <section className="mt-2">
          <DarkCard>
            <h3
              className="text-[26px] font-extrabold mb-5"
              style={{ color: LIME }}
            >
              Seleccionar tarjeta
            </h3>

            <div
              className="rounded-xl p-5 md:p-6 shadow-sm"
              style={{ background: WHITE }}
              data-testid="card-select-panel"
            >
              <p className="font-semibold text-[15px] text-[color:var(--dmh-black)]">
                Tus tarjetas
              </p>

              <div className="mt-3 divide-y">
                {tarjetas.map((t) => {
                  const checked = selectedCard?.id === t.id;
                  return (
                    <label
                      key={t.id}
                      className="flex items-center justify-between gap-4 py-4 cursor-pointer select-none"
                      onClick={() => setSelectedCard(t)}
                      data-testid={`card-radio-${t.last4 || "0000"}`}
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
                              outline: `2px solid ${getComputedStyle(
                                document.documentElement
                              )
                                .getPropertyValue("--dmh-black")
                                .trim()}`,
                            }}
                          />
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link
                href="/tarjetas"
                className="inline-flex items-center gap-2 font-semibold"
                style={{ color: LIME }}
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
                onClick={() => setView(VIEW.CARD_AMOUNT)}
                className="h-12 px-6 rounded-xl font-semibold shadow"
                style={{ background: LIME, color: DARK }}
                disabled={!selectedCard}
                type="button"
                data-testid="btn-card-continue"
              >
                Continuar
              </button>
            </div>
          </DarkCard>
        </section>
      )}

      {view === VIEW.CARD_AMOUNT && (
        <section className="mt-2">
          <DarkCard>
            <p
              className="text-[22px] md:text-[24px] font-extrabold mb-6"
              style={{ color: LIME }}
            >
              ¿Cuánto querés ingresar a la cuenta?
            </p>

            <div
              className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4"
              data-testid="amount-panel"
            >
              <div
                className="flex items-center rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.95)" }}
              >
                <span className="mr-2" style={{ color: DARK }}>
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={raw ? fmtMiles(raw) : ""}
                  onChange={onChangeMonto}
                  placeholder="0"
                  className="w-full outline-none text-lg"
                  style={{ color: DARK, background: "transparent" }}
                  aria-label="Monto en pesos"
                  data-testid="amount-input"
                />
              </div>

              <button
                onClick={() => {
                  const msg = validar();
                  if (msg) return setError(msg);
                  setView(VIEW.CARD_REVIEW);
                }}
                disabled={!canContinueAmount}
                className="h-12 rounded-xl font-semibold shadow"
                style={{
                  background: canContinueAmount
                    ? LIME
                    : "rgba(255,255,255,0.7)",
                  color: canContinueAmount ? DARK : "rgba(0,0,0,0.7)",
                }}
                type="button"
                data-testid="btn-amount-continue"
              >
                Continuar
              </button>
            </div>

            {error && (
              <div className="mt-3 text-[#ff8a8a] font-medium">{error}</div>
            )}
          </DarkCard>
        </section>
      )}

      {view === VIEW.CARD_REVIEW && (
        <section className="mt-2">
          <DarkCard>
            <h3
              className="text-[22px] md:text-[24px] font-extrabold mb-6"
              style={{ color: LIME }}
            >
              Revisá que está todo bien
            </h3>

            <div className="space-y-2 text-white/80" data-testid="review-panel">
              <div className="flex items-center gap-2">
                <span>Vas a transferir</span>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    fill="none"
                    stroke={LIME}
                    strokeWidth="2"
                  />
                  <path
                    d="M9 15l6-6 2 2-6 6H9v-2z"
                    fill="none"
                    stroke={LIME}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="text-[22px] font-extrabold text-[color:var(--white)]">
                {fmtMoney(monto)}
              </div>

              <div className="mt-5 text-white/60 text-sm">Para</div>
              <div className="text-white text-xl font-extrabold">
                Cuenta propia
              </div>

              <div className="mt-4 text-white">
                {selectedCard?.brand} •••• {selectedCard?.last4}
              </div>

              <div className="text-white/60 text-sm mt-5">CVU</div>
              <div className="text-white/90 tracking-wide">
                {cuenta?.cvu || "0000000000000000000000"}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={confirmarCarga}
                disabled={!canSubmit}
                className="h-12 px-6 rounded-xl font-semibold shadow"
                style={{
                  background: canSubmit ? LIME : "rgba(255,255,255,0.7)",
                  color: canSubmit ? DARK : "rgba(0,0,0,0.7)",
                }}
                type="button"
                data-testid="btn-review-continue"
              >
                {saving ? "Cargando…" : "Continuar"}
              </button>
            </div>

            {error && (
              <div className="mt-3 text-[#ff8a8a] font-medium">{error}</div>
            )}
          </DarkCard>
        </section>
      )}

      {view === VIEW.SUCCESS && success && (
        <section className="mt-2">
          <div
            className="rounded-2xl shadow-md"
            style={{ background: LIME }}
            data-testid="success-banner"
          >
            <div className="px-6 py-7 flex items-center justify-center gap-4">
              <div
                className="w-12 h-12 rounded-full grid place-items-center"
                style={{ background: "rgba(0,0,0,0.08)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="11"
                    fill="none"
                    stroke={DARK}
                    strokeWidth="2"
                  />
                  <path
                    d="m7 12 3 3 7-7"
                    fill="none"
                    stroke={DARK}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-lg font-extrabold" style={{ color: DARK }}>
                Ya cargamos el dinero en tu cuenta
              </p>
            </div>
          </div>

          <DarkCard className="mt-4" data-testid="success-panel">
            <div className="text-white/70">
              {success.fecha.toLocaleString("es-AR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </div>

            <div className="mt-2" style={{ color: LIME }}>
              <span className="text-[26px] font-extrabold">
                {fmtMoney(success.cargo)}
              </span>
            </div>

            <div className="mt-5 text-white/60 text-sm">Para</div>
            <div className="text-[22px] font-extrabold" style={{ color: LIME }}>
              Cuenta propia
            </div>

            <div className="mt-4 text-white">Brubank</div>
            <div className="text-white/60 text-sm mt-1">CVU</div>
            <div className="text-white/90 tracking-wide">
              {cuenta?.cvu || "0000000000000000000000"}
            </div>
          </DarkCard>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/home"
              className="h-12 rounded-xl font-semibold grid place-items-center shadow-sm"
              style={{ background: "rgba(255,255,255,0.85)", color: DARK }}
            >
              Ir al inicio
            </Link>
            <button
              onClick={descargarComprobante}
              className="h-12 rounded-xl font-semibold grid place-items-center shadow"
              style={{ background: LIME, color: DARK }}
              type="button"
            >
              Descargar comprobante
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function OptionTile({ title, onClick, card = false, testId }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="w-full text-left rounded-2xl px-6 py-8 shadow-md border transition"
      style={{ background: DARK, borderColor: "rgba(0,0,0,0.5)" }}
      type="button"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span
            className="grid place-items-center w-10 h-10 rounded-full border"
            style={{ borderColor: LIME, color: LIME }}
          >
            {card ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
            )}
          </span>
          <span className="font-semibold text-[18px]" style={{ color: LIME }}>
            {title}
          </span>
        </div>
        <span className="text-[18px]" style={{ color: LIME }}>
          →
        </span>
      </div>
    </button>
  );
}

function DarkCard({ children, className = "", ...props }) {
  return (
    <div
      {...props}
      className={`rounded-2xl border p-6 md:p-8 ${className}`}
      style={{
        background: DARK,
        borderColor: "rgba(0,0,0,0.35)",
        color: WHITE,
      }}
    >
      {children}
    </div>
  );
}

function FieldCopy({ label, value, onCopy, copied }) {
  return (
    <div>
      <div className="text-[22px] font-extrabold" style={{ color: LIME }}>
        {label}
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-white/90 tracking-wide text-[15px]">{value}</p>
        <CopyButton onClick={onCopy} active={copied} />
      </div>
    </div>
  );
}

function CopyButton({ onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="grid place-items-center w-9 h-9 rounded-md"
      style={{ border: `2px solid ${LIME}`, color: LIME }}
      title={active ? "¡Copiado!" : "Copiar"}
      type="button"
    >
      {active ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
        >
          <path d="m20 6-11 11-5-5" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + w - radius.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
  ctx.lineTo(x + w, y + h - radius.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
  ctx.lineTo(x + radius.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}
