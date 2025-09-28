// app/api/login/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();
    const password = body.password || null;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requerido" },
        { status: 400 }
      );
    }

    /* ---------- STEP 1: solo verificar email ---------- */
    if (!password) {
      const { data: user, error } = await supabase
        .from("usuarios")
        .select("id, email, created_at, last_login")
        .eq("email", email)
        .single(); // 👈 usar single()

      if (error && error.code === "PGRST116") {
        // No hay registros (usuario no encontrado)
        return NextResponse.json({
          success: true,
          exists: false,
          firstLogin: false,
          userId: null,
        });
      }
      if (error) throw error;

      return NextResponse.json({
        success: true,
        exists: true,
        firstLogin: !user.last_login,
        userId: user.id,
      });
    }

    /* ---------- STEP 2: login con contraseña ---------- */
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("id, email, password, last_login")
      .eq("email", email)
      .single(); // 👈 aquí también

    if (error && error.code === "PGRST116") {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    if (error) throw error;

    // comparar password (bcrypt o texto plano fallback)
    // comparar password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const isFirstLogin = !user.last_login;

    // 🔐 Primera vez: generar código
    if (isFirstLogin) {
      const code = Math.floor(100000 + Math.random() * 900000);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000);

      const { error: dbError } = await supabase
        .from("email_codes")
        .insert([{ email, code: String(code), expires_at, used: false }]);

      if (dbError) throw dbError;

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Tu código de verificación",
        html: `
          <p>Hola,</p>
          <p>Tu código de verificación es:</p>
          <h2 style="font-size: 24px; letter-spacing: 4px; text-align: center;">
            ${code}
          </h2>
          <p>Este código vence en 10 minutos.</p>
        `,
      });

      return NextResponse.json({
        success: true,
        exists: true,
        needsVerification: true,
        message: "Contraseña válida. Código enviado (primera vez).",
        userId: user.id,
      });
    }

    // 🚀 No es primera vez → login directo
    await supabase
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      exists: true,
      needsVerification: false,
      message: "Login correcto",
      userId: user.id,
    });
  } catch (err) {
    console.error("Error /api/login:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error interno" },
      { status: 500 }
    );
  }
}
