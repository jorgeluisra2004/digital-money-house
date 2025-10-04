import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkServerEnv } from "@/lib/envCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ===== helper =====
async function getLatestCodeRow(supabaseAdmin, email) {
  const { data, error } = await supabaseAdmin
    .from("email_codes")
    .select("*")
    .eq("email", email)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function POST(req) {
  try {
    checkServerEnv();

    const body = await req.json();
    const email = (body?.email || "").toLowerCase().trim();
    const password = body?.password ?? null;
    const code = body?.code ?? null;

    if (!email) {
      return NextResponse.json(
        { success: false, code: "MISSING_EMAIL", message: "Email requerido" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: user, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("id, email, password, last_login")
      .eq("email", email)
      .single();

    // Paso 1: sólo email (descubre si existe y si es primer login)
    if (!password && !code) {
      if (userError || !user) return NextResponse.json({ exists: false });
      return NextResponse.json({
        exists: true,
        userId: user.id,
        firstLogin: !user.last_login,
      });
    }

    // Paso 3: validar código (si te lo mandamos antes)
    if (code) {
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from("email_codes")
        .select("*")
        .eq("email", email)
        .eq("code", String(code).trim())
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (codeError || !codeData) {
        return NextResponse.json(
          {
            success: false,
            code: "CODE_INVALID",
            message: "Código incorrecto o vencido",
          },
          { status: 401 }
        );
      }

      if (new Date(codeData.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, code: "CODE_EXPIRED", message: "Código vencido" },
          { status: 401 }
        );
      }

      await supabaseAdmin
        .from("email_codes")
        .update({ used: true })
        .eq("id", codeData.id);
      await supabaseAdmin
        .from("usuarios")
        .update({ last_login: new Date().toISOString() })
        .eq("email", email);

      return NextResponse.json({
        success: true,
        needsVerification: false,
        message: "Código validado. Login correcto",
        user: { id: user?.id, email },
      });
    }

    // Paso 2: password
    if (!user || userError) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }
    if (!password) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PASSWORD",
          message: "Contraseña requerida",
        },
        { status: 400 }
      );
    }
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_PASSWORD",
          message: "Contraseña no registrada",
        },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PASSWORD",
          message: "Contraseña incorrecta",
        },
        { status: 401 }
      );
    }

    // ¿Es primer login? -> enviar código 2FA con rate limit
    const isFirstLogin = !user.last_login;
    if (isFirstLogin) {
      // Si hay un código válido emitido hace <60s, rate-limit (evitamos spam)
      const latest = await getLatestCodeRow(supabaseAdmin, email);
      const now = Date.now();
      if (latest) {
        const createdAt = new Date(latest.created_at).getTime();
        const ageSec = Math.floor((now - createdAt) / 1000);
        if (ageSec < 60) {
          return NextResponse.json(
            {
              success: true,
              needsVerification: true,
              code: "RATE_LIMITED",
              message: "Esperá para reenviar otro código",
              retryAfter: 60 - ageSec,
              userId: user.id,
            },
            { status: 200 }
          );
        }
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      const expires_at = new Date(now + 10 * 60 * 1000).toISOString();

      await supabaseAdmin
        .from("email_codes")
        .insert([
          { email, code: String(verificationCode), expires_at, used: false },
        ]);

      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const resend = new Resend(resendKey);
        try {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Tu código de verificación",
            html: `
              <p>Hola,</p>
              <p>Tu código de verificación es:</p>
              <h2 style="font-size:24px;letter-spacing:4px;text-align:center;">
                ${verificationCode}
              </h2>
              <p>Este código vence en 10 minutos.</p>
            `,
          });
        } catch (e) {
          console.error("Error enviando email de verificación:", e);
        }
      }

      return NextResponse.json({
        success: true,
        needsVerification: true,
        message: "Contraseña válida. Código enviado.",
        userId: user.id,
        retryAfter: 60,
      });
    }

    // Login normal (sin 2FA)
    await supabaseAdmin
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("email", email);

    return NextResponse.json({
      success: true,
      needsVerification: false,
      message: "Login correcto",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("❌ Error en /api/login:", err);
    const message = err?.message || "Error interno";
    return NextResponse.json(
      { success: false, code: "INTERNAL", message },
      { status: 500 }
    );
  }
}
