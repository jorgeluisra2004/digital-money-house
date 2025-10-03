"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient"; // ⬅️ reemplaza este import
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const supabase = getSupabaseClient(); // ⬅️ crea el cliente en runtime (solo cliente)
  const { user, loading: authLoading } = useAuth();
  const [cuenta, setCuenta] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // esperar a que AuthContext cargue
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Usuario
        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();
        if (usuarioError) console.error("Error usuario:", usuarioError);

        // Cuenta
        const { data: cuentas, error: cuentasError } = await supabase
          .from("cuentas")
          .select("*")
          .eq("usuario_id", user.id);
        if (cuentasError) console.error("Error cuentas:", cuentasError);

        // Movimientos
        const { data: movimientosData, error: movimientosError } =
          await supabase
            .from("movimientos")
            .select("*")
            .eq("usuario_id", user.id)
            .order("fecha", { ascending: false });
        if (movimientosError)
          console.error("Error movimientos:", movimientosError);

        // Medios de pago
        const { data: mediosPagoData, error: mediosPagoError } = await supabase
          .from("medios_pago")
          .select("*")
          .eq("usuario_id", user.id);
        if (mediosPagoError)
          console.error("Error mediosPago:", mediosPagoError);

        setUsuario(usuario ?? null);
        setCuenta(cuentas?.[0] ?? null);
        setMovimientos(movimientosData ?? []);
        setMediosPago(mediosPagoData ?? []);
      } catch (err) {
        console.error("Error general fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, supabase]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-600">
        Cargando dashboard...
      </div>
    );
  }

  if (!user || !usuario) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-600">
        No se encontró usuario.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Saldo disponible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[var(--white)] shadow-lg rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-gray-700">
          Saldo disponible
        </h2>
        <p className="text-3xl font-bold text-[var(--blue-main)] mt-2">
          ${cuenta?.saldo?.toLocaleString("es-CO")}
        </p>
        <div className="flex gap-4 mt-4">
          <button className="bg-[var(--btn-primary)] text-white px-4 py-2 rounded-xl shadow hover:opacity-90 transition">
            Transferir dinero
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow hover:bg-gray-300 transition">
            Pago de servicios
          </button>
        </div>
      </motion.div>

      {/* Actividad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[var(--white)] shadow-lg rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Actividad</h2>
        <div className="divide-y divide-gray-200">
          {movimientos.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className="flex justify-between items-center py-3 text-sm"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {m.descripcion || m.tipo}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(m.fecha).toLocaleDateString("es-CO")}
                </p>
              </div>
              <p
                className={`font-semibold ${
                  m.monto > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {m.monto > 0 ? "+" : "-"}$
                {Math.abs(m.monto).toLocaleString("es-CO")}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Perfil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[var(--white)] shadow-lg rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Perfil</h2>
        <p className="text-gray-800 font-medium">
          {usuario.nombre} {usuario.apellido}
        </p>
        <p className="text-gray-600 text-sm">{usuario.email}</p>
        <p className="text-gray-600 text-sm mt-2">
          CVU: <span className="font-mono">{cuenta?.cvu}</span>
        </p>
        <p className="text-gray-600 text-sm">
          Alias: <span className="font-mono">{cuenta?.alias}</span>
        </p>
      </motion.div>

      {/* Medios de pago */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-[var(--white)] shadow-lg rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Medios de pago
        </h2>
        {mediosPago.length === 0 ? (
          <p className="text-sm text-gray-500">
            No tienes medios de pago registrados.
          </p>
        ) : (
          <div className="grid gap-4">
            {mediosPago.map((mp) => (
              <div
                key={mp.id}
                className="flex justify-between items-center bg-gray-100 p-3 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-800">{mp.tipo}</p>
                  <p className="text-sm text-gray-600">
                    {mp.numero_mascarado} • {mp.banco}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{mp.fecha_vencimiento}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
