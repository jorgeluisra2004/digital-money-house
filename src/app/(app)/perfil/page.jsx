// /src/app/perfil/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

/* Color con fallback si --dmh-lime no está definido */
const LIME = "var(--dmh-lime, #c9ff2a)";

/* Iconos */
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

/* util */
function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ----- Fila genérica en modo lectura (con lápiz a la derecha) ----- */
function ReadRow({ label, children, editable = false, onEdit }) {
  return (
    <li className="px-6">
      <div className="h-12 flex items-center border-t border-gray-200 first:border-t-0">
        <div className="w-56 shrink-0 text-sm text-gray-800">{label}</div>
        <div className="flex-1 text-sm text-gray-500">{children}</div>
        {editable && (
          <button
            onClick={onEdit}
            className="ml-3 text-gray-400 hover:text-gray-600"
            aria-label={`Editar ${label}`}
            title={`Editar ${label}`}
          >
            <Pencil />
          </button>
        )}
      </div>
    </li>
  );
}

/* ----- Acciones de editor inline ----- */
function InlineActions({ onSave, onCancel, saving }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1.5 rounded-md text-sm font-semibold disabled:opacity-60"
        style={{ background: LIME, color: "#0f0f0f" }}
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-md text-sm font-semibold border border-black/10 hover:bg-black/[.03]"
      >
        Cancelar
      </button>
    </div>
  );
}

export default function PerfilPage() {
  const supabase = getSupabaseClient();
  const { session, loading: authLoading } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);

  // edición por-fila
  const [editing, setEditing] = useState(null); // 'nombre' | 'cuit' | 'telefono'
  const [saving, setSaving] = useState(false);
  const [errorFila, setErrorFila] = useState("");

  // states de editor
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cuit, setCuit] = useState("");
  const [telefono, setTelefono] = useState("");

  // alias editor
  const [editAlias, setEditAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState("");
  const [savingAlias, setSavingAlias] = useState(false);
  const [errorAlias, setErrorAlias] = useState("");

  // toast copy
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
        setUsuario(u ?? null);

        const { data: row, error } = await supabase
          .from("cuentas")
          .select("id, usuario_id, saldo, cvu, alias")
          .eq("usuario_id", session.user.id)
          .maybeSingle();
        if (error) throw error;

        let acc = row;
        if (!acc) {
          const { data: created, error: insErr } = await supabase
            .from("cuentas")
            .insert([
              { usuario_id: session.user.id, saldo: 0, cvu: "", alias: "" },
            ])
            .select("id, usuario_id, saldo, cvu, alias")
            .single();
          if (insErr) throw insErr;
          acc = created;
        }

        // generar CVU/alias si faltan
        const missing =
          !acc?.cvu ||
          acc.cvu.trim() === "" ||
          !acc?.alias ||
          acc.alias.trim() === "";
        if (missing) {
          const { data: payload, error: rpcErr } = await supabase.rpc(
            "fn_generar_cvu_alias",
            { p_cuenta: acc.id }
          );
          if (rpcErr) throw rpcErr;
          acc = {
            ...acc,
            cvu: payload?.cvu ?? acc.cvu,
            alias: payload?.alias ?? acc.alias,
          };
        }
        setCuenta(acc);

        // rellenar editores
        setNombre((u?.nombre || "").trim());
        setApellido((u?.apellido || "").trim());
        setCuit((u?.cuit || "").trim());
        setTelefono((u?.telefono || "").trim());
        setAliasInput(acc?.alias || "");
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

  /* copiar al portapapeles con mini toast */
  const copy = async (txt, key) => {
    try {
      await navigator.clipboard.writeText(txt || "");
      setCopied((s) => ({ ...s, [key]: true }));
      setTimeout(() => setCopied((s) => ({ ...s, [key]: false })), 1200);
    } catch {}
  };

  const telValido = (t) => !t || /^[0-9+\-()\s]{6,20}$/.test(t);

  // ✅ Alias: exactamente 3 palabras (letras/números) separadas por puntos => x.x.x
  const alias3Words = (a) => /^[a-z0-9]+(\.[a-z0-9]+){2}$/.test(a || "");
  const aliasValido = (a) => {
    const s = (a || "").toLowerCase();
    return s.length >= 3 && s.length <= 32 && alias3Words(s);
  };

  const saveField = async (field) => {
    setErrorFila("");
    setSaving(true);
    try {
      if (field === "nombre") {
        if (!nombre.trim() || !apellido.trim()) {
          setErrorFila("Nombre y apellido son obligatorios.");
          return;
        }
        const { data, error } = await supabase
          .from("usuarios")
          .update({ nombre: nombre.trim(), apellido: apellido.trim() })
          .eq("id", session.user.id)
          .select("*")
          .single();
        if (error) throw error;
        setUsuario(data);
      } else if (field === "cuit") {
        const { data, error } = await supabase
          .from("usuarios")
          .update({ cuit: cuit.trim() || null })
          .eq("id", session.user.id)
          .select("*")
          .single();
        if (error) throw error;
        setUsuario(data);
      } else if (field === "telefono") {
        if (!telValido(telefono)) {
          setErrorFila("Teléfono inválido.");
          return;
        }
        const { data, error } = await supabase
          .from("usuarios")
          .update({ telefono: telefono.trim() || null })
          .eq("id", session.user.id)
          .select("*")
          .single();
        if (error) throw error;
        setUsuario(data);
      }
      setEditing(null);
    } catch {
      setErrorFila("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const onSaveAlias = async () => {
    setErrorAlias("");
    const next = (aliasInput || "").trim().toLowerCase();

    if (!aliasValido(next)) {
      setErrorAlias(
        "Alias inválido. Debe tener 3 palabras (letras o números) separadas por puntos, ej.: micuenta.personal.banco"
      );
      return;
    }
    if (!cuenta?.id) return;

    setSavingAlias(true);
    try {
      const { data, error } = await supabase
        .from("cuentas")
        .update({ alias: next })
        .eq("id", cuenta.id)
        .select("id, alias")
        .single();
      if (error) {
        if (error.code === "23505")
          setErrorAlias("Ese alias ya está en uso. Probá con otro.");
        else setErrorAlias("No se pudo actualizar el alias.");
        return;
      }
      setCuenta((c) => ({ ...(c || {}), alias: data.alias }));
      setEditAlias(false);
    } finally {
      setSavingAlias(false);
    }
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
        <section className="space-y-6">
          {/* ===== Card: Tus datos ===== */}
          <div className="bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="text-xl px-6 py-4 font-bold text-gray-900">
              Tus datos
            </div>

            {/* Lista de filas */}
            <ul className="divide-y divide-gray-200">
              {/* Email - solo lectura */}
              <ReadRow label="Email">{usuario?.email || "—"}</ReadRow>

              {/* Nombre y apellido */}
              {editing === "nombre" ? (
                <li className="px-6">
                  <div className="py-3.5 border-t border-gray-200 flex items-center gap-3">
                    <div className="w-56 shrink-0 text-sm text-gray-800">
                      Nombre y apellido
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 outline-none focus:border-[var(--dmh-lime)]"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre"
                      />
                      <input
                        className="rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 outline-none focus:border-[var(--dmh-lime)]"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        placeholder="Apellido"
                      />
                    </div>
                    <InlineActions
                      onSave={() => saveField("nombre")}
                      onCancel={() => {
                        setEditing(null);
                        setNombre((usuario?.nombre || "").trim());
                        setApellido((usuario?.apellido || "").trim());
                        setErrorFila("");
                      }}
                      saving={saving}
                    />
                  </div>
                  {errorFila && (
                    <div className="px-6 pb-2 text-sm text-red-600">
                      {errorFila}
                    </div>
                  )}
                </li>
              ) : (
                <ReadRow
                  label="Nombre y apellido"
                  editable
                  onEdit={() => setEditing("nombre")}
                >
                  {fullName}
                </ReadRow>
              )}

              {/* CUIT */}
              {editing === "cuit" ? (
                <li className="px-6">
                  <div className="py-3.5 border-t border-gray-200 flex items-center gap-3">
                    <div className="w-56 shrink-0 text-sm text-gray-800">
                      CUIT
                    </div>
                    <div className="flex-1">
                      <input
                        className="w-full max-w-md rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 outline-none focus:border-[var(--dmh-lime)]"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value)}
                        placeholder="20xxxxxxxxx"
                      />
                    </div>
                    <InlineActions
                      onSave={() => saveField("cuit")}
                      onCancel={() => {
                        setEditing(null);
                        setCuit((usuario?.cuit || "").trim());
                        setErrorFila("");
                      }}
                      saving={saving}
                    />
                  </div>
                </li>
              ) : (
                <ReadRow
                  label="CUIT"
                  editable
                  onEdit={() => setEditing("cuit")}
                >
                  {usuario?.cuit || "—"}
                </ReadRow>
              )}

              {/* Teléfono */}
              {editing === "telefono" ? (
                <li className="px-6">
                  <div className="py-3.5 border-t border-gray-200 flex items-center gap-3">
                    <div className="w-56 shrink-0 text-sm text-gray-800">
                      Teléfono
                    </div>
                    <div className="flex-1">
                      <input
                        className="w-full max-w-md rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 outline-none focus:border-[var(--dmh-lime)]"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+54 11 1234 5678"
                      />
                    </div>
                    <InlineActions
                      onSave={() => saveField("telefono")}
                      onCancel={() => {
                        setEditing(null);
                        setTelefono((usuario?.telefono || "").trim());
                        setErrorFila("");
                      }}
                      saving={saving}
                    />
                  </div>
                </li>
              ) : (
                <ReadRow
                  label="Teléfono"
                  editable
                  onEdit={() => setEditing("telefono")}
                >
                  {usuario?.telefono || "—"}
                </ReadRow>
              )}

              {/* Contraseña => navegación a cambio de clave */}
              <ReadRow
                label="Contraseña"
                editable
                onEdit={() => (window.location.href = "/cambiar-password")}
              >
                ****** {/* Invisible por requerimiento */}
              </ReadRow>
            </ul>
          </div>

          {/* CTA medios de pago */}
          <Link
            href="/tarjetas"
            className="block rounded-xl"
            style={{ background: LIME }}
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
              Copiá tu CVU o alias para ingresar o transferir dinero desde otra
              cuenta
            </div>

            {/* CVU */}
            <div className="px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: LIME }}
                >
                  CVU
                </div>
                <div className="text-white/90 text-sm mt-1 break-all">
                  {cuenta?.cvu || "—"}
                </div>
              </div>
              <button
                data-testid="perfil-copy-cvu"
                onClick={() => copy(cuenta?.cvu, "cvu")}
                className="shrink-0 mt-1 hover:brightness-110"
                style={{ color: LIME }}
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
                  style={{ color: LIME }}
                >
                  Alias
                </div>
                {!editAlias ? (
                  <div className="text-white/90 text-sm mt-1 break-all">
                    {cuenta?.alias || "—"}
                  </div>
                ) : (
                  <input
                    data-testid="perfil-alias-input"
                    className="mt-1 w-full max-w-md rounded-md border border-white/20 bg-black/30 text-white placeholder-white/50 px-3 py-2 outline-none focus:border-[var(--dmh-lime)]"
                    value={aliasInput}
                    onChange={(e) =>
                      setAliasInput(e.target.value.toLowerCase())
                    }
                    placeholder="mi.alias.cuenta"
                    style={{ WebkitTextFillColor: "#fff" }}
                    onKeyDown={(e) => e.key === "Enter" && onSaveAlias()}
                  />
                )}
              </div>

              {!editAlias ? (
                <div className="flex items-center gap-2">
                  <button
                    data-testid="perfil-copy-alias"
                    onClick={() => copy(cuenta?.alias, "alias")}
                    className="shrink-0 mt-1 hover:brightness-110"
                    style={{ color: LIME }}
                    title="Copiar alias"
                  >
                    <CopyIcon />
                    <span className="sr-only">Copiar alias</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditAlias(true);
                      setErrorAlias("");
                    }}
                    className="ml-1 px-3 py-1.5 rounded-md text-sm font-semibold border border-white/15 hover:bg-white/5 text-white"
                  >
                    Editar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onSaveAlias}
                    disabled={savingAlias}
                    className="px-3 py-1.5 rounded-md text-sm font-semibold disabled:opacity-60"
                    style={{ background: LIME, color: "#0f0f0f" }}
                  >
                    {savingAlias ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    onClick={() => {
                      setEditAlias(false);
                      setAliasInput(cuenta?.alias || "");
                      setErrorAlias("");
                    }}
                    className="px-3 py-1.5 rounded-md text-sm font-semibold border border-white/15 hover:bg-white/5 text-white"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            {errorAlias && (
              <div className="px-6 -mt-2 pb-3 text-sm text-red-300">
                {errorAlias}
              </div>
            )}
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
