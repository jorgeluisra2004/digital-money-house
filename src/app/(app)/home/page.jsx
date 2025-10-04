"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fmtMoney = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(n || 0));
  const fmtDateDay = (iso) =>
    new Date(iso).toLocaleDateString("es-AR", { weekday: "long" });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return movimientos.filter((m) =>
      [m.descripcion || "", m.tipo || "", m.destinatario || ""].some((t) =>
        t.toLowerCase().includes(q)
      )
    );
  }, [query, movimientos]);

  const saldoMostrado = useMemo(() => {
    if (!cuenta) return 0;
    const s = Number(cuenta.saldo ?? 0);
    if (Math.abs(s) > 0.0001) return s;
    return movimientos.reduce((acc, m) => acc + Number(m.monto || 0), 0);
  }, [cuenta, movimientos]);

  useEffect(() => {
    const load = async () => {
      if (authLoading || !session?.user?.id) return;
      setLoading(true);
      try {
        const { data: u } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", session.user.id)
          .single();
        const { data: cuentas } = await supabase
          .from("cuentas")
          .select("*")
          .eq("usuario_id", session.user.id)
          .limit(1);
        const { data: movs } = await supabase
          .from("movimientos")
          .select("*")
          .eq("usuario_id", session.user.id)
          .order("fecha", { ascending: false });

        setUsuario(u ?? null);
        setCuenta(cuentas?.[0] ?? { saldo: 0, cvu: "", alias: "" });
        setMovimientos(Array.isArray(movs) ? movs : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, session?.user?.id, supabase]);

  if (authLoading || loading) {
    return (
      <div className="h-[60vh] grid place-items-center text-gray-600">
        Cargando tu cuenta…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8">
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col rounded-xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--dmh-lime)" }}
      >
        <nav className="px-6 py-8 text-[#0f0f0f] font-medium space-y-2">
          <NavItem href="/home" active>
            Inicio
          </NavItem>
          <NavItem href="/actividad">Actividad</NavItem>
          <NavItem href="/perfil">Tu perfil</NavItem>
          <NavItem href="/cargar-dinero">Cargar dinero</NavItem>
          <NavItem href="/pagar-servicios">Pagar Servicios</NavItem>
          <NavItem href="/tarjetas">Tarjetas</NavItem>
          <Link
            href="/login"
            onClick={async (e) => {
              e.preventDefault();
              await supabase.auth.signOut();
              window.location.replace("/login");
            }}
            className="mt-2 inline-block text-black/75 hover:text-black"
          >
            Cerrar sesión
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <section className="w-full space-y-6 md:space-y-7">
        {/* Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#1e1e1e] text-white rounded-xl shadow-md p-5 md:p-7 border border-black/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/70 mb-2">Dinero disponible</p>
              <div
                className="inline-flex items-center rounded-lg px-4 py-2 text-[26px] md:text-[32px] font-extrabold tracking-tight"
                style={{
                  color: "#c9ff2a",
                  border: "2px solid #c9ff2a",
                  boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)",
                }}
              >
                {fmtMoney(saldoMostrado)}
              </div>
            </div>
            <div className="flex gap-5 text-sm text-white/80 underline underline-offset-4">
              <Link href="/tarjetas" className="hover:text-white">
                Ver tarjetas
              </Link>
              <button
                className="hover:text-white"
                onClick={() =>
                  window.alert(
                    `CVU: ${cuenta?.cvu || "-"}\nAlias: ${cuenta?.alias || "-"}`
                  )
                }
              >
                Ver CVU
              </button>
            </div>
          </div>
        </motion.div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <ActionLink href="/transferir" label="Transferir dinero" />
          <ActionLink href="/pagar-servicios" label="Pago de servicios" />
        </div>

        {/* Buscador */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-black/10"
        >
          <div className="flex items-center gap-3 px-4 py-3">
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
          </div>
        </motion.div>

        {/* Actividad */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white rounded-xl shadow-md border border-black/10"
        >
          <div className="px-5 py-4 text-gray-800 font-semibold">
            Tu actividad
          </div>
          <ul className="divide-y divide-gray-200">
            {filtered.slice(0, 8).map((m) => {
              const negativo = Number(m.monto) < 0;
              return (
                <li key={m.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: "var(--dmh-lime)" }}
                      />
                      <div>
                        <p className="text-[15px] text-gray-800">
                          {m.descripcion || m.tipo}
                          {m.destinatario ? ` a ${m.destinatario}` : ""}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {fmtDateDay(m.fecha)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-[15px] font-semibold ${
                        negativo ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {negativo ? "-" : "+"}
                      {fmtMoney(Math.abs(Number(m.monto)))}
                    </p>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-8 text-sm text-gray-500">
                No hay movimientos para tu búsqueda.
              </li>
            )}
          </ul>

          <div className="px-5 py-4 flex items-center justify-between">
            <Link
              href="/actividad"
              className="text-sm font-semibold text-gray-800 hover:underline"
            >
              Ver toda tu actividad
            </Link>
            <span className="text-gray-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function NavItem({ href, children, active = false }) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 transition ${
        active ? "bg-black/10 text-black" : "text-black/80 hover:bg-black/10"
      }`}
    >
      {children}
    </Link>
  );
}

function ActionLink({ href, label }) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99 }}
        className="bg-[var(--dmh-lime)] text-black font-semibold rounded-lg h-16 grid place-items-center shadow-md"
      >
        {label}
      </motion.div>
    </Link>
  );
}
