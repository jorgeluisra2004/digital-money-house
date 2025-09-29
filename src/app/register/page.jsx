"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

/* --- Validación de campos --- */
const registerSchema = z
  .object({
    nombre: z.string().min(2, "Nombre requerido"),
    apellido: z.string().min(2, "Apellido requerido"),
    dni: z.string().min(6, "DNI inválido"),
    email: z.string().email("Correo inválido"),
    password: z
      .string()
      .min(6, "Mínimo 6 caracteres")
      .max(20)
      .regex(/[A-Z]/, "Debe contener una mayúscula")
      .regex(/[0-9]/, "Debe contener un número")
      .regex(/[^a-zA-Z0-9]/, "Debe contener un caracter especial"),
    confirmPassword: z.string(),
    telefono: z.string().min(8, "Teléfono inválido"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(registerSchema),
  });

  /* --- Submit: Crear cuenta --- */
  const handleSubmitForm = async (data) => {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast.success("Usuario creado con éxito ✅");
      setSuccess(true);

      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--dmh-black)] px-4">
      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form
              key="form"
              onSubmit={form.handleSubmit(handleSubmitForm)}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              <h2 className="text-xl font-semibold mb-2 text-white">
                Crear cuenta
              </h2>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Nombre"
                    {...form.register("nombre")}
                    className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Apellido"
                    {...form.register("apellido")}
                    className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
                  />
                  {form.formState.errors.apellido && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.apellido.message}
                    </p>
                  )}
                </div>
              </div>

              {/* DNI y Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="DNI"
                    {...form.register("dni")}
                    className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
                  />
                  {form.formState.errors.dni && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.dni.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    {...form.register("email")}
                    className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    {...form.register("password")}
                    className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
                  />
                  {form.formState.errors.password && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    {...form.register("confirmPassword")}
                    className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Teléfono */}
              <input
                type="text"
                placeholder="Teléfono"
                {...form.register("telefono")}
                className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
              />
              {form.formState.errors.telefono && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.telefono.message}
                </p>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-lg font-semibold bg-[var(--dmh-lime)] hover:bg-[var(--dmh-lime-dark)] text-black transition shadow-md disabled:opacity-60"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              <p className="text-xs text-gray-400 mt-2">
                Debes usar entre 6 y 20 caracteres, incluyendo al menos una mayúscula,
                un número y un carácter especial.
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-xl font-bold mb-4">Registro Exitoso 🎉</h2>
              <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center bg-[var(--dmh-lime)] shadow-md">
                <span className="text-black text-3xl">✔</span>
              </div>
              <p className="mb-6 text-gray-300 text-sm">
                Ya podés iniciar sesión con tu nueva cuenta.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 rounded-lg font-semibold bg-[var(--dmh-lime)] hover:bg-[var(--dmh-lime-dark)] text-black transition shadow-md"
              >
                Continuar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
