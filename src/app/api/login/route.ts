import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

// Cliente público (solo para casos mínimos, no login)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Cliente con service role (para login, usuarios, etc.)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string | null = body.email?.toLowerCase().trim() || null;
    const password: string | null = body.password || null;
    const code: string | null = body.code || null;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requerido" },
        { status: 400 }
      );
    }

    console.log("📩 Login attempt for:", email);

    // Buscar usuario en la tabla
    const { data: user, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("id, email, password, last_login")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // LOGIN CON CÓDIGO (PRIMER INGRESO)
    if (code) {
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from("email_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (codeError || !codeData) {
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

      // Marcar como usado
      await supabaseAdmin
        .from("email_codes")
        .update({ used: true })
        .eq("id", codeData.id);

      // Hacer login definitivo
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password: password!,
        });

      if (authError || !authData.session) {
        return NextResponse.json(
          { success: false, message: authError?.message || "Error de login" },
          { status: 401 }
        );
      }

      await supabaseAdmin
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

    // LOGIN NORMAL
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

    // Primera vez → enviar código
    if (isFirstLogin) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000);

      await supabaseAdmin
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

    // Login normal
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.session) {
      return NextResponse.json(
        { success: false, message: authError?.message || "Error de login" },
        { status: 401 }
      );
    }

    await supabaseAdmin
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
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, message: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
