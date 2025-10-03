import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkServerEnv } from "@/lib/envCheck";

export async function POST(req: Request) {
  try {
    checkServerEnv();
    const resendKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(resendKey);

    const body = await req.json();
    const email = body?.email?.toLowerCase().trim();
    const password = body?.password ?? null;
    const code = body?.code ?? null;

    if (!email) {
      return NextResponse.json({ success: false, message: "Email requerido" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Buscar usuario (para los tres modos)
    const { data: user, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("id, email, password, last_login")
      .eq("email", email)
      .single();

    // --- MODO SÓLO EMAIL: devolver exists/firstLogin ---
    if (!password && !code) {
      if (userError || !user) {
        return NextResponse.json({ exists: false });
      }
      return NextResponse.json({
        exists: true,
        userId: user.id,
        firstLogin: !user.last_login,
      });
    }

    // --- MODO CÓDIGO ---
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
        return NextResponse.json({ success: false, message: "Código incorrecto o vencido" }, { status: 401 });
      }

      if (new Date(codeData.expires_at) < new Date()) {
        return NextResponse.json({ success: false, message: "Código vencido" }, { status: 401 });
      }

      await supabaseAdmin.from("email_codes").update({ used: true }).eq("id", codeData.id);
      await supabaseAdmin.from("usuarios").update({ last_login: new Date().toISOString() }).eq("email", email);

      return NextResponse.json({
        success: true,
        needsVerification: false,
        message: "Código validado. Login correcto",
        user: { id: user?.id, email },
      });
    }

    // --- MODO PASSWORD ---
    if (!user || userError) {
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 404 });
    }
    if (!password) {
      return NextResponse.json({ success: false, message: "Contraseña requerida" }, { status: 400 });
    }
    if (!user.password) {
      return NextResponse.json({ success: false, message: "Contraseña no registrada" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ success: false, message: "Contraseña incorrecta" }, { status: 401 });
    }

    const isFirstLogin = !user.last_login;
    if (isFirstLogin) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000);

      await supabaseAdmin.from("email_codes").insert([
        { email, code: String(verificationCode), expires_at, used: false },
      ]);

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Tu código de verificación",
        html: `<p>Hola,</p><p>Tu código es:</p>
               <h2 style="font-size:24px;letter-spacing:4px;text-align:center;">${verificationCode}</h2>
               <p>Vence en 10 minutos.</p>`,
      });

      return NextResponse.json({
        success: true,
        needsVerification: true,
        message: "Contraseña válida. Código enviado (primera vez).",
        userId: user.id,
      });
    }

    await supabaseAdmin.from("usuarios").update({ last_login: new Date().toISOString() }).eq("email", email);

    return NextResponse.json({
      success: true,
      needsVerification: false,
      message: "Login correcto",
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    console.error("❌ Error en /api/login:", err);
    return NextResponse.json({ success: false, message: err?.message || "Error interno" }, { status: 500 });
  }
}
