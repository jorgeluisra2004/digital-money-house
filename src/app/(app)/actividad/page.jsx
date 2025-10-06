// /src/app/actividad/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

/* ---------- helpers ---------- */
const LIME = "var(--dmh-lime)";
const DARK = "var(--dmh-black)";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );
const fmtDay = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { weekday: "long" });

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function getPresetRange(period) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (period) {
    case "hoy":
      return [todayStart, todayEnd];
    case "ayer": {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return [startOfDay(y), endOfDay(y)];
    }
    case "ultima_semana": {
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return [startOfDay(from), todayEnd];
    }
    case "ultimos_15": {
      const from = new Date();
      from.setDate(from.getDate() - 14);
      return [startOfDay(from), todayEnd];
    }
    case "ultimo_mes": {
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      from.setDate(from.getDate() + 1);
      return [startOfDay(from), todayEnd];
    }
    case "ultimos_3_meses": {
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      from.setDate(from.getDate() + 1);
      return [startOfDay(from), todayEnd];
    }
    case "ultimo_anio": {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      from.setDate(from.getDate() + 1);
      return [startOfDay(from), todayEnd];
    }
    default:
      return [null, null];
  }
}

const PERIODS = [
  { key: "hoy", label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "ultima_semana", label: "Última semana" },
  { key: "ultimos_15", label: "Últimos 15 días" },
  { key: "ultimo_mes", label: "Último mes" },
  { key: "ultimo_anio", label: "Último año" },
  { key: "ultimos_3_meses", label: "Últimos 3 meses" },
];

/* ---------- page ---------- */
export default function ActividadPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros (desde URL)
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("");
  const [op, setOp] = useState(""); // "" | "ingresos" | "egresos"

  // rango custom
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // UI filtros (popover)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterBtnRef = useRef(null);

  // detalle
  const [detail, setDetail] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* ---- fetch movimientos ---- */
  useEffect(() => {
    const load = async () => {
      if (authLoading || !session?.user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("movimientos")
          .select("*")
          .eq("usuario_id", session.user.id)
          .order("fecha", { ascending: false });
        if (error) throw error;
        setMovs(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, session?.user?.id, supabase]);

  /* ---- URL -> filtros ---- */
  useEffect(() => {
    const qParam = (searchParams.get("q") || "").trim();
    const opParam = (searchParams.get("op") || "").toLowerCase();
    const pParam = (searchParams.get("period") || "").toLowerCase();

    setQuery(qParam);
    setOp(opParam === "ingresos" || opParam === "egresos" ? opParam : "");
    setPeriod(PERIODS.some((p) => p.key === pParam) ? pParam : "");
    setCustomFrom(searchParams.get("from") || "");
    setCustomTo(searchParams.get("to") || "");
    setCustomOpen(Boolean(searchParams.get("from") || searchParams.get("to")));
    setPage(1);
  }, [searchParams]);

  /* ---- filtrar/ordenar ---- */
  const filtered = useMemo(() => {
    let rows = [...movs];

    if (customFrom || customTo) {
      const from = customFrom ? startOfDay(new Date(customFrom)) : null;
      const to = customTo ? endOfDay(new Date(customTo)) : null;
      rows = rows.filter((m) => {
        const d = new Date(m.fecha);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    } else {
      const [from, to] = getPresetRange(period);
      if (from && to) {
        rows = rows.filter((m) => {
          const d = new Date(m.fecha);
          return d >= from && d <= to;
        });
      }
    }

    if (op === "ingresos") rows = rows.filter((m) => Number(m.monto) > 0);
    if (op === "egresos") rows = rows.filter((m) => Number(m.monto) < 0);

    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((m) =>
        [m.descripcion || "", m.tipo || "", m.destinatario || ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return rows;
  }, [movs, period, op, query, customFrom, customTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [query, period, op, customFrom, customTo]);

  const pushFiltersToURL = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (op) params.set("op", op);
    if (period) params.set("period", period);
    if (customFrom) params.set("from", customFrom);
    if (customTo) params.set("to", customTo);
    router.replace(params.toString() ? `${pathname}?${params}` : pathname);
  };

  const clearAll = () => {
    setQuery("");
    setPeriod("");
    setOp("");
    setCustomFrom("");
    setCustomTo("");
    setCustomOpen(false);
    setPage(1);
    router.replace(pathname);
  };

  /* ---- lock scroll cuando popover abierto ---- */
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setFiltersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-6 md:py-8">
      {/* Top: search + filter */}
      <div className="relative flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex-1">
          <div
            className="flex items-center gap-3 rounded-[14px] px-4 py-3 bg-white
                       border border-[rgba(0,0,0,0.08)]
                       shadow-[0_8px_18px_rgba(0,0,0,0.12)]
                       focus-within:ring-2 focus-within:ring-[rgba(192,253,53,0.35)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className="text-gray-500"
            >
              <path
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushFiltersToURL()}
              className="w-full outline-none text-black placeholder:text-gray-400"
              placeholder="Buscar en tu actividad"
            />
          </div>
        </div>

        <div className="shrink-0 relative">
          <button
            ref={filterBtnRef}
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center justify-between gap-3 rounded-xl px-6 py-3 font-semibold
                       shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
            style={{ background: LIME, color: DARK }}
          >
            Filtrar
            {/* icono sliders (idéntico a las capturas) */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M4 7h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="17" cy="7" r="2" fill="currentColor" />
              <path
                d="M4 12h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="13" cy="12" r="2" fill="currentColor" />
              <path
                d="M4 17h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="19" cy="17" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tarjeta lista */}
      <div className="mt-5 bg-white rounded-2xl border border-black/10 shadow-[0_12px_22px_rgba(0,0,0,0.12)]">
        <div className="px-7 pt-5 pb-3">
          <div className="text-gray-900 font-semibold">Tu actividad</div>
        </div>
        {/* línea bajo encabezado como en la maqueta */}
        <div className="border-t border-[#d7d3d1]" />

        {loading ? (
          <div className="px-7 py-10 text-gray-500">Cargando…</div>
        ) : pageItems.length === 0 ? (
          <div className="px-7 py-10 text-gray-500">No hay movimientos</div>
        ) : (
          <ul className="divide-y divide-[#d7d3d1]">
            {pageItems.map((m) => {
              const monto = Number(m.monto || 0);
              const isNeg = monto < 0;
              const abs = Math.abs(monto);
              return (
                <li
                  key={m.id}
                  className="px-7 py-5 cursor-pointer hover:bg-black/[.02]"
                  onClick={() => setDetail(m)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0 flex items-start gap-5">
                      <span
                        className="inline-block w-7 h-7 rounded-full mt-1.5"
                        style={{ background: LIME }}
                      />
                      <div className="min-w-0">
                        <p className="text-gray-900 text-[15px] truncate">
                          {m.descripcion || m.tipo}
                          {m.destinatario ? ` a ${m.destinatario}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 leading-5">
                      <p className="text-[15px] text-gray-900 font-medium">
                        {isNeg ? "-" : ""}
                        {fmtMoney(abs)}
                      </p>
                      {/* SIN capitalize para respetar “sábado” */}
                      <p className="text-[12px] text-gray-500">
                        {fmtDay(m.fecha)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* paginación exacta: números separados y activo en cajita gris-beige */}
        {totalPages > 1 && (
          <div className="px-7 py-5 flex flex-wrap items-center gap-6 text-black">
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              const active = page === n;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-[32px] min-w-[32px] grid place-items-center rounded-[4px] text-[15px]
                    ${
                      active
                        ? "bg-[#e8e2de] font-semibold"
                        : "hover:bg-gray-100"
                    }`}
                  aria-current={active ? "page" : undefined}
                >
                  {n}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- Filtros (popover anclado) ---------- */}
      {filtersOpen && (
        <FilterPopover
          anchorRef={filterBtnRef}
          onClose={() => setFiltersOpen(false)}
          period={period}
          setPeriod={(v) => {
            setPeriod(v);
            setCustomFrom("");
            setCustomTo("");
            setCustomOpen(false);
          }}
          op={op}
          setOp={setOp}
          customOpen={customOpen}
          setCustomOpen={setCustomOpen}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
          onClear={clearAll}
          onApply={() => {
            pushFiltersToURL();
            setFiltersOpen(false);
          }}
        />
      )}

      {/* ---------- Detalle ---------- */}
      {detail && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-black font-semibold">
                Detalle de transacción
              </h3>
              <button
                className="p-1.5 rounded text-black hover:bg-black/5"
                onClick={() => setDetail(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Row
                label="Título"
                value={detail.descripcion || detail.tipo || "—"}
              />
              <Row
                label="Fecha"
                value={new Date(detail.fecha).toLocaleString("es-AR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <Row label="Monto" value={fmtMoney(Number(detail.monto || 0))} />
              {detail.destinatario && (
                <Row label="Contraparte" value={detail.destinatario} />
              )}
              {detail.referencia && (
                <Row label="Referencia" value={detail.referencia} />
              )}
              <Row label="ID" value={String(detail.id)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right break-words">{value}</span>
    </div>
  );
}

/** Popover idéntico al screenshot: panel blanco a la derecha con radios, “Borrar filtros”, “Aplicar” lima, título “Período ▾” */
function FilterPopover({
  anchorRef,
  onClose,
  period,
  setPeriod,
  op,
  setOp,
  customOpen,
  setCustomOpen,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  onClear,
  onApply,
}) {
  // posicionar junto al botón
  const [pos, setPos] = useState({ top: 0, left: 0, minLeft: 0 });
  useEffect(() => {
    const b = anchorRef.current?.getBoundingClientRect();
    if (b) {
      setPos({
        top: b.bottom + 10,
        left: b.right - 360, // ancho del panel
        minLeft: 12,
      });
    }
  }, [anchorRef]);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="absolute w-[360px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden"
        style={{
          top: Math.max(pos.top, 12),
          left: Math.max(pos.left, pos.minLeft),
        }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold inline-flex items-center gap-1">
            Período
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <button
            onClick={onClear}
            className="text-sm font-medium text-gray-700 hover:underline"
            title="Borrar filtros"
          >
            Borrar filtros
          </button>
        </div>

        <div className="divide-y">
          {/* presets */}
          <div className="py-1">
            {PERIODS.map((p) => {
              const active = period === p.key && !customOpen;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setPeriod(p.key);
                    setCustomOpen(false);
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="text-gray-800">{p.label}</span>
                  <Radio checked={active} />
                </button>
              );
            })}

            {/* otro período (abre rango) */}
            <button
              onClick={() => setCustomOpen((v) => !v)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <span className="text-gray-800">Otro período</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="text-gray-500"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </button>

            {customOpen && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs text-gray-600">
                    Desde
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="mt-1 block w-full border rounded-md px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    Hasta
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="mt-1 block w-full border rounded-md px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* operación */}
          <div className="py-1">
            <div className="px-4 py-2 text-sm font-semibold text-gray-700">
              Operación
            </div>
            {[
              { v: "", t: "Todas" },
              { v: "ingresos", t: "Ingresos" },
              { v: "egresos", t: "Egresos" },
            ].map((o) => (
              <button
                key={o.v || "todas"}
                onClick={() => setOp(o.v)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <span className="text-gray-800">{o.t}</span>
                <Radio checked={op === o.v} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={onApply}
            className="w-full h-11 rounded-xl font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.15)]"
            style={{ background: LIME, color: DARK }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Radio idéntico: punto lima con aro negro */
function Radio({ checked }) {
  return (
    <span
      className={`relative inline-block w-[18px] h-[18px] rounded-full border ${
        checked ? "border-[color:var(--dmh-black)]" : "border-[#cfcfcf]"
      }`}
      role="radio"
      aria-checked={checked}
    >
      {checked && (
        <span
          className="absolute inset-[3px] rounded-full"
          style={{
            background: LIME,
            outline: `2px solid ${getComputedStyle(document.documentElement)
              .getPropertyValue("--dmh-black")
              .trim()}`,
          }}
        />
      )}
    </span>
  );
}
