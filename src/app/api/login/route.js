import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();
    const password = body.password || null;
    const code = body.code || null;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requerido" },
        { status: 400 }
      );
    }

    console.log("📩 Login attempt for:", email);

    // 🔹 Buscar usuario en tabla propia
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("id, email, password, last_login")
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.error("❌ Usuario no encontrado:", userError);
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Usuario encontrado:", user);

    // 🔹 LOGIN CON CÓDIGO (PRIMER INGRESO)
    if (code) {
      console.log("🔢 Validando código:", code);

      const { data: codeData, error: codeError } = await supabase
        .from("email_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (codeError || !codeData) {
        console.error("❌ Código inválido:", codeError);
        return NextResponse.json(
          { success: false, message: "Código incorrecto o vencido" },
          { status: 401 }
        );
      }

      if (new Date(codeData.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, message: "Código vencido" },
          { status: 401 }
        );
      }

      // Marcar código como usado
      await supabase
        .from("email_codes")
        .update({ used: true })
        .eq("id", codeData.id);

      // 🔹 Login definitivo con Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.session) {
        console.error("❌ Error Auth login with code:", authError);
        return NextResponse.json(
          { success: false, message: authError?.message || "Error de login" },
          { status: 401 }
        );
      }

      await supabase
        .from("usuarios")
        .update({ last_login: new Date().toISOString() })
        .eq("email", email);

      return NextResponse.json({
        success: true,
        needsVerification: false,
        message: "Código validado. Login correcto",
        token: authData.session.access_token,
        user: { id: authData.user?.id, email: authData.user?.email },
      });
    }

    // 🔹 LOGIN NORMAL (CON CONTRASEÑA)
    if (!password) {
      return NextResponse.json(
        { success: false, message: "Contraseña requerida" },
        { status: 400 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "Contraseña no registrada" },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const isFirstLogin = !user.last_login;

    // 🔹 Primera vez: enviar código
    if (isFirstLogin) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000);

      await supabase
        .from("email_codes")
        .insert([
          { email, code: String(verificationCode), expires_at, used: false },
        ]);

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Tu código de verificación",
        html: `
          <p>Hola,</p>
          <p>Tu código de verificación es:</p>
          <h2 style="font-size: 24px; letter-spacing: 4px; text-align: center;">
            ${verificationCode}
          </h2>
          <p>Este código vence en 10 minutos.</p>
        `,
      });

      return NextResponse.json({
        success: true,
        needsVerification: true,
        message: "Contraseña válida. Código enviado (primera vez).",
        userId: user.id,
      });
    }

    // 🔹 Login normal
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.session) {
      console.error("❌ Error Auth login normal:", authError);
      return NextResponse.json(
        { success: false, message: authError?.message || "Error de login" },
        { status: 401 }
      );
    }

    await supabase
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("email", email);

    return NextResponse.json({
      success: true,
      needsVerification: false,
      message: "Login correcto",
      token: authData.session.access_token,
      user: { id: authData.user?.id, email: authData.user?.email },
    });
  } catch (err) {
    console.error("💥 Error /api/login:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error interno" },
      { status: 500 }
    );
  }
}
