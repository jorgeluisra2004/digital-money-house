"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

/* ---------------- helpers ---------------- */
const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n || 0)
  );
const fmtDay = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { weekday: "long" });
const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function getPeriodRange(period) {
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
      from.setDate(from.getDate() - 6); // últimos 7 días incl. hoy
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
    default:
      return [null, null];
  }
}

const PERIODS = [
  { key: "", label: "Todos" },
  { key: "hoy", label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "ultima_semana", label: "Última semana" },
  { key: "ultimos_15", label: "Últimos 15 días" },
  { key: "ultimo_mes", label: "Último mes" },
  { key: "ultimos_3_meses", label: "Últimos 3 meses" },
];

/* ---------------- page ---------------- */
export default function ActividadPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();

  const [movs, setMovs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // filtros
  const [period, setPeriod] = useState(""); // "" = todos
  const [op, setOp] = useState(""); // ""=todas | "ingresos" | "egresos"
  const [filtersOpen, setFiltersOpen] = useState(false);

  // detalle
  const [detail, setDetail] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // fetch
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

  // filtrar + ordenar
  const filtered = useMemo(() => {
    let rows = [...movs];

    // período
    const [from, to] = getPeriodRange(period);
    if (from && to) {
      rows = rows.filter((m) => {
        const d = new Date(m.fecha);
        return d >= from && d <= to;
      });
    }

    // operación
    if (op === "ingresos") rows = rows.filter((m) => Number(m.monto) > 0);
    if (op === "egresos") rows = rows.filter((m) => Number(m.monto) < 0);

    // búsqueda
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((m) =>
        [m.descripcion || "", m.tipo || "", m.destinatario || ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // ordenar por fecha desc
    rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return rows;
  }, [movs, period, op, query]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // reset page cuando cambian filtros/búsqueda
  useEffect(() => setPage(1), [query, period, op]);

  const anyFilter = Boolean(period || op || query);

  const clearFilters = () => {
    setQuery("");
    setPeriod("");
    setOp("");
    setPage(1);
  };

  /* --- accesibilidad/UX modal: lock scroll + ESC --- */
  useEffect(() => {
    if (filtersOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e) => e.key === "Escape" && setFiltersOpen(false);
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [filtersOpen]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-7">
      {/* Barra superior: buscador + botón filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-[var(--dmh-lime)]/30 shadow-sm px-3 py-2">
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
              className="w-full py-2 outline-none placeholder:text-gray-400"
              placeholder="Buscar en tu actividad"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-gray-600 hover:underline"
                title="Limpiar búsqueda"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold"
            style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
            onClick={() => setFiltersOpen(true)}
          >
            <span className="hidden xs:inline">Filtrar</span>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M3 6h18M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {anyFilter && (
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold bg-white border border-gray-300 text-gray-800"
              onClick={clearFilters}
              title="Borrar filtros"
            >
              Borrar filtros
            </button>
          )}
        </div>
      </div>

      {/* chips de filtros activos */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {period && (
          <span className="inline-flex items-center gap-2 bg-black/5 px-2.5 py-1 rounded-full">
            {PERIODS.find((p) => p.key === period)?.label}
            <button className="text-gray-600" onClick={() => setPeriod("")}>
              ×
            </button>
          </span>
        )}
        {op && (
          <span className="inline-flex items-center gap-2 bg-black/5 px-2.5 py-1 rounded-full capitalize">
            {op}
            <button className="text-gray-600" onClick={() => setOp("")}>
              ×
            </button>
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="mt-4 md:mt-5 bg-white rounded-2xl border border-black/10 shadow-sm">
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
          <div className="text-sm sm:text-base font-semibold text-gray-800">
            Tu actividad
          </div>
          <button
            className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-gray-700"
            onClick={() => setFiltersOpen(true)}
          >
            Filtrar
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M3 6h18M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="px-4 sm:px-5 py-10 text-gray-500">Cargando…</div>
        ) : pageItems.length === 0 ? (
          <div className="px-4 sm:px-5 py-10 text-gray-500">
            No hay movimientos
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pageItems.map((m) => {
              const negativo = Number(m.monto) < 0;
              return (
                <li
                  key={m.id}
                  className="px-4 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-black/[.02]"
                  onClick={() => setDetail(m)}
                  title="Ver detalle"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 flex items-start gap-3">
                      <span
                        className="inline-block w-3 h-3 mt-1.5 sm:mt-1 rounded-full"
                        style={{ background: "var(--dmh-lime)" }}
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] text-gray-800 truncate">
                          {m.descripcion || m.tipo}
                          {m.destinatario ? ` a ${m.destinatario}` : ""}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-500 capitalize">
                          {fmtDay(m.fecha)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-[15px] font-semibold ${
                          negativo ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {negativo ? "-" : "+"}
                        {fmtMoney(Math.abs(Number(m.monto)))}
                      </p>
                      <p className="block sm:hidden text-[11px] text-gray-500">
                        {new Date(m.fecha).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              const active = page === n;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 grid place-items-center rounded-md text-sm ${
                    active ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
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

      {/* atajo a actividad completa */}
      <div className="mt-4 sm:mt-5 text-right">
        <Link
          href="/actividad"
          className="text-sm font-semibold text-gray-800 hover:underline"
        >
          Ver toda tu actividad
        </Link>
      </div>

      {/* -------- Modal de filtros (centrado, sobre el footer) -------- */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-[92vw] max-w-2xl bg-white text-gray-900 rounded-2xl shadow-2xl border border-black/10
                       max-h-[85svh] overflow-hidden"
          >
            {/* header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Filtrar actividad</h3>
              <button
                className="p-2 rounded hover:bg-black/5"
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* contenido scrolleable */}
            <div className="p-5 overflow-auto max-h-[calc(85svh-56px-64px)] space-y-8">
              {/* Período */}
              <section>
                <p className="text-sm font-semibold mb-3">Período</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PERIODS.map((p) => {
                    const active = period === p.key;
                    return (
                      <button
                        key={p.key || "todos"}
                        onClick={() => setPeriod(p.key)}
                        className={`px-3.5 py-2 rounded-lg border text-sm transition
                          ${
                            active
                              ? "bg-[var(--dmh-lime)] border-[var(--dmh-lime)] text-[#0f0f0f] font-semibold"
                              : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
                          }`}
                        aria-pressed={active}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Operación */}
              <section>
                <p className="text-sm font-semibold mb-3">Operación</p>
                <div className="inline-grid grid-cols-3 rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { v: "", t: "Todas" },
                    { v: "ingresos", t: "Ingresos" },
                    { v: "egresos", t: "Egresos" },
                  ].map((o, i) => {
                    const active = op === o.v;
                    return (
                      <button
                        key={o.v || "todas"}
                        onClick={() => setOp(o.v)}
                        className={`px-4 py-2 text-sm transition ${
                          active
                            ? "bg-[var(--dmh-lime)] text-[#0f0f0f] font-semibold"
                            : "bg-white hover:bg-gray-50"
                        } ${i !== 0 ? "border-l border-gray-300" : ""}`}
                        aria-pressed={active}
                      >
                        {o.t}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* footer de acciones */}
            <div className="px-5 py-4 border-t flex gap-2">
              <button
                className="flex-1 rounded-lg px-4 py-2 border text-gray-800"
                onClick={clearFilters}
              >
                Borrar filtros
              </button>
              <button
                className="flex-1 rounded-lg px-4 py-2 font-semibold"
                style={{ background: "var(--dmh-lime)", color: "#0f0f0f" }}
                onClick={() => setFiltersOpen(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal detalle -------- */}
      {detail && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[92vw] max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Detalle de transacción</h3>
              <button
                className="p-1.5 rounded hover:bg-black/5"
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
              <Row label="Fecha" value={fmtDateTime(detail.fecha)} />
              <Row label="Monto" value={fmtMoney(Number(detail.monto || 0))} />
              {detail.destinatario && (
                <Row label="Contraparte" value={detail.destinatario} />
              )}
              {detail.referencia && (
                <Row label="Referencia" value={detail.referencia} />
              )}
              <Row label="ID" value={String(detail.id)} />
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                className="rounded-lg px-4 py-2 border"
                onClick={() => setDetail(null)}
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

/* ------- filas modal detalle ------- */
function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right break-words">{value}</span>
    </div>
  );
}
