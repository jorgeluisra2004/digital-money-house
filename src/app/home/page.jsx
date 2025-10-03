"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function HomePage() {
  const supabase = getSupabaseClient();

  const [session, setSession] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // ===== helpers de UI
  const fmtMoney = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  const fmtDateDay = (iso) =>
    new Date(iso).toLocaleDateString("es-AR", { weekday: "long" });

  const filtered = useMemo(() => {
    if (!query) return movimientos;
    const q = query.toLowerCase();
    return movimientos.filter((m) => {
      const s1 = (m.descripcion || "").toLowerCase();
      const s2 = (m.tipo || "").toLowerCase();
      const s3 = (m.destinatario || "").toLowerCase();
      return s1.includes(q) || s2.includes(q) || s3.includes(q);
    });
  }, [query, movimientos]);

  // saldo calculado desde movimientos (fallback si la cuenta no lo tiene actualizado)
  const saldoMovimientos = useMemo(
    () =>
      (Array.isArray(movimientos) ? movimientos : []).reduce(
        (acc, m) => acc + Number(m.monto || 0),
        0
      ),
    [movimientos]
  );

  // preferimos el saldo de la tabla si es distinto de 0; si está en 0 (o null), usamos el de movimientos
  const saldoMostrado = useMemo(() => {
    const s = Number(cuenta?.saldo ?? 0);
    if (Number.isFinite(s) && Math.abs(s) > 0.0001) return s;
    return saldoMovimientos;
  }, [cuenta, saldoMovimientos]);

  // ===== Generadores por si faltan datos (bootstrap)
  const genAlias = (email) => {
    const base = (email?.split("@")[0] || "dmh")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const suf = Math.random().toString(36).slice(2, 6);
    return `${base}.${suf}`;
  };
  const genCVU = () => {
    let s = "";
    while (s.length < 22) s += Math.floor(Math.random() * 10);
    return s.slice(0, 22);
  };

  const bootstrapIfMissing = async (authUser) => {
    // usuarios
    const { data: u } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!u) {
      await supabase.from("usuarios").insert([
        {
          id: authUser.id,
          email: authUser.email,
          nombre: authUser.user_metadata?.name || "",
          apellido: "",
        },
      ]);
    }

    // cuentas
    const { data: cuentas } = await supabase
      .from("cuentas")
      .select("*")
      .eq("usuario_id", authUser.id)
      .limit(1);

    if (!cuentas || cuentas.length === 0) {
      await supabase.from("cuentas").insert([
        {
          usuario_id: authUser.id,
          saldo: 0,
          alias: genAlias(authUser.email),
          cvu: genCVU(),
        },
      ]);
    }
  };

  // ===== sesión y suscripción a cambios
  useEffect(() => {
    let unsub;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);

      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s ?? null);
      });
      unsub = sub?.subscription;
    })();
    return () => unsub?.unsubscribe?.();
  }, [supabase]);

  // ===== carga de datos (y auto-fix de saldo si está desincronizado)
  useEffect(() => {
    const load = async () => {
      if (session === null) return; // iniciando auth
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await bootstrapIfMissing(session.user);

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

        // ---- auto-fix opcional: si el saldo guardado difiere del calculado, actualizamos
        const guardado = Number(cuentas?.[0]?.saldo ?? 0);
        const calculado = (Array.isArray(movs) ? movs : []).reduce(
          (acc, m) => acc + Number(m.monto || 0),
          0
        );
        if (Math.abs(guardado - calculado) > 0.0001) {
          await supabase
            .from("cuentas")
            .update({ saldo: calculado })
            .eq("usuario_id", session.user.id);
          // reflejar inmediatamente en UI
          setCuenta((c) => ({ ...(c || {}), saldo: calculado }));
        }
      } catch (e) {
        console.error("fetch home error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-lg text-gray-600">
        Cargando tu cuenta…
      </div>
    );
  }

  if (!session?.user?.id) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-lg text-gray-600">
        No se encontró usuario.
      </div>
    );
  }

  // ===== UI
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#ededed]">
      <div className="max-w-6xl mx-auto grid grid-cols-[240px_1fr] gap-8 px-4 md:px-6 py-8">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col rounded-xl shadow-sm"
          style={{ backgroundColor: "var(--dmh-lime)" }}
        >
          <nav className="px-6 py-8 text-[#0f0f0f] font-medium space-y-3">
            <span className="block text-black/80">Inicio</span>
            <span className="block text-black/80">Actividad</span>
            <span className="block text-black/80">Tu perfil</span>
            <span className="block text-black/80">Cargar dinero</span>
            <span className="block text-black/80">Pagar Servicios</span>
            <span className="block text-black/80">Tarjetas</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="mt-2 text-black/70 text-left hover:underline"
            >
              Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Main */}
        <section className="w-full space-y-6">
          {/* Card saldo */}
          <div className="bg-[#1e1e1e] text-white rounded-xl shadow-md p-6 md:p-7 border border-black/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/70 mb-2">Dinero disponible</p>
                <div
                  className="inline-flex items-center rounded-lg px-4 py-2 text-3xl md:text-[32px] font-extrabold tracking-tight"
                  style={{
                    color: "#c9ff2a",
                    border: "2px solid #c9ff2a",
                    boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)",
                    background:
                      "linear-gradient(180deg, rgba(201,255,42,0.05), transparent)",
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
                      `CVU: ${cuenta?.cvu || "-"}\nAlias: ${
                        cuenta?.alias || "-"
                      }`
                    )
                  }
                >
                  Ver CVU
                </button>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/transferir"
              className="bg-[var(--dmh-lime)] text-black font-semibold rounded-lg h-16 grid place-items-center shadow hover:brightness-95 transition"
            >
              Transferir dinero
            </Link>
            <Link
              href="/pagar-servicios"
              className="bg-[var(--dmh-lime)] text-black font-semibold rounded-lg h-16 grid place-items-center shadow hover:brightness-95 transition"
            >
              Pago de servicios
            </Link>
          </div>

          {/* Buscador */}
          <div className="bg-white rounded-lg shadow-sm border border-black/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
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
          </div>

          {/* Actividad */}
          <div className="bg-white rounded-xl shadow-md border border-black/10">
            <div className="px-5 py-4 text-gray-800 font-semibold">
              Tu actividad
            </div>
            <ul className="divide-y divide-gray-200">
              {filtered.slice(0, 8).map((m) => {
                const negativo = Number(m.monto) < 0;
                const color = negativo ? "text-red-600" : "text-gray-900";
                return (
                  <li key={m.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: "var(--dmh-lime)" }}
                        />
                        <div>
                          <p className="text-sm md:text-[15px] text-gray-800">
                            {m.descripcion || m.tipo}
                            {m.destinatario ? ` a ${m.destinatario}` : ""}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {fmtDateDay(m.fecha)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm md:text-[15px] font-semibold ${color}`}
                      >
                        {negativo ? "-" : "+"}
                        {fmtMoney(Math.abs(Number(m.monto)))}
                      </p>
                    </div>
                  </li>
                );
              })}
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
          </div>

          <div className="h-6" />
        </section>
      </div>
    </div>
  );
}
