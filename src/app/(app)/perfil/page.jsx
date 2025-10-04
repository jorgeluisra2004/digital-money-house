"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

/* util */
function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}
const Pencil = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...props}>
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"
      fill="currentColor"
    />
    <path
      d="m20.71 7.04-3.75-3.75-1.83 1.83 3.75 3.75 1.83-1.83Z"
      fill="currentColor"
    />
  </svg>
);
const ArrowRight = (props) => (
  <svg width="26" height="26" viewBox="0 0 24 24" {...props}>
    <path
      d="M9 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const CopyIcon = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
    <path
      d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"
      fill="currentColor"
    />
  </svg>
);

function Row({ label, value, editable = false }) {
  return (
    <li className="px-6">
      <div className="py-3.5 flex items-center justify-between gap-4">
        <span className="text-sm text-gray-700">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-900">{value}</span>
          {editable && <Pencil className="text-gray-400" />}
        </div>
      </div>
    </li>
  );
}

export default function PerfilPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState({ cvu: false, alias: false });

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

        setUsuario(u ?? null);
        setCuenta(cuentas?.[0] ?? { saldo: 0, cvu: "", alias: "" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, session?.user?.id, supabase]);

  const fullName = useMemo(
    () =>
      `${(usuario?.nombre || "").trim()} ${(
        usuario?.apellido || ""
      ).trim()}`.trim() || "—",
    [usuario?.nombre, usuario?.apellido]
  );

  const copy = async (txt, key) => {
    try {
      await navigator.clipboard.writeText(txt || "");
      setCopied((s) => ({ ...s, [key]: true }));
      setTimeout(() => setCopied((s) => ({ ...s, [key]: false })), 1200);
    } catch {}
  };

  if (authLoading || loading) {
    return (
      <div className="h-[60vh] grid place-items-center text-gray-600">
        Cargando tu perfil…
      </div>
    );
  }

  return (
    <div className="bg-[#efefef]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* SOLO contenido — el sidebar es global y fijo */}
        <section className="space-y-6">
          {/* Tus datos */}
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 font-semibold text-gray-900">
              Tus datos
            </div>
            <ul className="divide-y divide-gray-200">
              <Row label="Email" value={usuario?.email || "—"} />
              <Row label="Nombre y apellido" value={fullName} editable />
              <Row label="CUIT" value={usuario?.cuit || "—"} editable />
              <Row label="Teléfono" value={usuario?.telefono || "—"} editable />
              <Row label="Contraseña" value="******" editable />
            </ul>
          </div>

          {/* CTA medios de pago */}
          <Link
            href="/tarjetas"
            className="block rounded-xl"
            style={{ background: "var(--dmh-lime)" }}
          >
            <div className="px-6 py-5 md:py-6 flex items-center justify-between">
              <span className="font-semibold text-[#0f0f0f] text-lg">
                Gestioná los medios de pago
              </span>
              <ArrowRight className="text-[#0f0f0f]" />
            </div>
          </Link>

          {/* CVU / Alias */}
          <div className="bg-[#1f1f1f] text-white rounded-xl border border-black/10 shadow-sm">
            <div className="px-6 pt-5 pb-2 text-sm text-white/80 font-semibold">
              Copiá tu cvu o alias para ingresar o transferir dinero desde otra
              cuenta
            </div>

            {/* CVU */}
            <div className="px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--dmh-lime)" }}
                >
                  CVU
                </div>
                <div className="text-white/90 text-sm mt-1 break-all">
                  {cuenta?.cvu || "—"}
                </div>
              </div>
              <button
                onClick={() => copy(cuenta?.cvu, "cvu")}
                className="shrink-0 mt-1 text-[var(--dmh-lime)] hover:brightness-110"
                title="Copiar CVU"
              >
                <CopyIcon />
                <span className="sr-only">Copiar CVU</span>
              </button>
            </div>

            <div className="border-t border-white/10" />

            {/* Alias */}
            <div className="px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--dmh-lime)" }}
                >
                  Alias
                </div>
                <div className="text-white/90 text-sm mt-1 break-all">
                  {cuenta?.alias || "—"}
                </div>
              </div>
              <button
                onClick={() => copy(cuenta?.alias, "alias")}
                className="shrink-0 mt-1 text-[var(--dmh-lime)] hover:brightness-110"
                title="Copiar alias"
              >
                <CopyIcon />
                <span className="sr-only">Copiar alias</span>
              </button>
            </div>
          </div>

          {/* Toast mini */}
          <div className="h-0">
            <span
              className={cls(
                "fixed right-4 bottom-16 rounded-md px-3 py-2 text-sm bg-black/80 text-white transition-opacity",
                copied.cvu || copied.alias ? "opacity-100" : "opacity-0"
              )}
            >
              {copied.cvu ? "CVU copiado" : copied.alias ? "Alias copiado" : ""}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
