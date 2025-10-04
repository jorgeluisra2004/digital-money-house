"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabaseClient";

/* --- Schemas --- */
const emailSchema = z.object({ email: z.string().email("Correo inválido") });
const passwordSchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
});

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1=email, 2=password, 3=código
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [firstLogin, setFirstLogin] = useState(false);
  const [serverError, setServerError] = useState(""); // muestra debajo del campo
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });
  const codeForm = useForm({ resolver: zodResolver(codeSchema) });

  useEffect(() => {
    if (!resendCooldown) return;
    const t = setInterval(
      () => setResendCooldown((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  /* -------- Paso 1: sólo email -------- */
  const handleEmailSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error");

      setEmail(data.email);
      if (!result.exists) {
        setServerError("No existe una cuenta con ese e-mail.");
        return;
      }
      setFirstLogin(Boolean(result.firstLogin));
      setStep(2);
    } catch (err) {
      setServerError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  /* -------- Paso 2: password -------- */
  const handlePasswordSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error al iniciar sesión");

      if (result.needsVerification) {
        setPwd(data.password);
        toast.success("Contraseña correcta. Te enviamos un código 📧");
        if (typeof result.retryAfter === "number")
          setResendCooldown(result.retryAfter);
        setStep(3);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });
        if (error) throw error;
        toast.success("Login exitoso 🎉");
        router.push("/home");
      }
    } catch (err) {
      // Mensajes útiles desde el backend: "Contraseña incorrecta", etc.
      setServerError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  /* -------- Paso 3: verificar código -------- */
  const handleCodeSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Código incorrecto");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error) throw error;

      toast.success("Código verificado. Bienvenido 🎉");
      router.push("/home");
    } catch (err) {
      setServerError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  /* -------- Reenviar código -------- */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "No se pudo reenviar el código");
      toast.success("Te enviamos un nuevo código 📧");
      setResendCooldown(result.retryAfter || 60);
    } catch (err) {
      toast.error(err.message || "Error reenviando el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--dmh-black)] px-4">
      <div className="w-full max-w-sm text-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-4"
            >
              <h2 className="text-base font-semibold mb-2 text-white">
                ¡Hola! Ingresá tu e-mail
              </h2>
              <input
                type="email"
                placeholder="Correo electrónico"
                {...emailForm.register("email")}
                className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
              />
              {emailForm.formState.errors.email && (
                <p className="text-red-500 text-sm">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
              {serverError && (
                <p className="text-red-500 text-sm">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold bg-[var(--dmh-lime)] hover:bg-[var(--dmh-lime-dark)] text-black transition shadow-md disabled:opacity-60"
              >
                {loading ? "Comprobando..." : "Continuar"}
              </button>

              <Link href="/register" className="w-full">
                <button
                  type="button"
                  className="w-full mt-2 py-3 rounded-lg font-semibold bg-gray-300 text-black transition shadow-sm"
                >
                  Crear cuenta
                </button>
              </Link>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-3"
            >
              <h2 className="text-base font-semibold mb-2 text-white">
                Ingresá tu contraseña
              </h2>
              <p className="text-sm text-gray-400 mb-1">
                {firstLogin
                  ? "Es tu primer ingreso: después de la contraseña te pediremos un código."
                  : "Ingresá tu contraseña para continuar."}
              </p>

              <input
                type="password"
                placeholder="Contraseña"
                {...passwordForm.register("password")}
                className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)]"
              />
              {passwordForm.formState.errors.password && (
                <p className="text-red-500 text-sm">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
              {serverError && (
                <p className="text-red-500 text-sm">{serverError}</p>
              )}

              <div className="w-full flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold bg-[var(--dmh-lime)] hover:bg-[var(--dmh-lime-dark)] text-black transition shadow-md disabled:opacity-60"
                >
                  {loading ? "Verificando..." : "Continuar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServerError("");
                    setStep(1);
                  }}
                  className="w-full py-3 rounded-lg font-medium bg-transparent border border-gray-600 text-white"
                >
                  Volver
                </button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              onSubmit={codeForm.handleSubmit(handleCodeSubmit)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-3"
            >
              <h2 className="text-base font-semibold mb-2 text-white">
                Ingresá el código que te enviamos
              </h2>
              <p className="text-sm text-gray-400 mb-1">
                Revisá tu correo ({email}). El código vence en 10 minutos.
              </p>

              <input
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                type="text"
                placeholder="Código de 6 dígitos"
                {...codeForm.register("code")}
                className="w-full p-3 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--dmh-lime)] tracking-widest text-center"
              />
              {codeForm.formState.errors.code && (
                <p className="text-red-500 text-sm">
                  {codeForm.formState.errors.code.message}
                </p>
              )}
              {serverError && (
                <p className="text-red-500 text-sm">{serverError}</p>
              )}

              <div className="w-full flex items-center justify-between text-xs text-gray-300">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="underline disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `Reenviar código (${resendCooldown}s)`
                    : "Reenviar código"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServerError("");
                    setStep(2);
                  }}
                  className="underline"
                >
                  Volver
                </button>
              </div>

              <div className="w-full flex flex-col gap-2 mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold bg-[var(--dmh-lime)] hover:bg-[var(--dmh-lime-dark)] text-black transition shadow-md disabled:opacity-60"
                >
                  {loading ? "Verificando..." : "Verificar"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
