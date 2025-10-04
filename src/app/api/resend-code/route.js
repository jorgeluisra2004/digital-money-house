import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    const { email } = await req.json();
    const normalizedEmail = (email || "").toLowerCase().trim();
    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, code: "MISSING_EMAIL", message: "Email requerido" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Throttle: si hay un código no usado creado hace <60s, bloquea
    const { data: latest } = await supabaseAdmin
      .from("email_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const now = Date.now();
    if (latest?.[0]) {
      const ageSec = Math.floor(
        (now - new Date(latest[0].created_at).getTime()) / 1000
      );
      if (ageSec < 60) {
        return NextResponse.json(
          {
            success: false,
            code: "RATE_LIMITED",
            message: "Esperá para reenviar otro código",
            retryAfter: 60 - ageSec,
          },
          { status: 429 }
        );
      }
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const expires_at = new Date(now + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("email_codes")
      .insert([
        {
          email: normalizedEmail,
          code: String(verificationCode),
          expires_at,
          used: false,
        },
      ]);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: normalizedEmail,
          subject: "Tu código de verificación",
          html: `
            <p>Hola,</p>
            <p>Tu nuevo código de verificación es:</p>
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
      message: "Código reenviado",
      retryAfter: 60,
    });
  } catch (err) {
    console.error("❌ Error en /api/resend-code:", err);
    return NextResponse.json(
      { success: false, code: "INTERNAL", message: "Error interno" },
      { status: 500 }
    );
  }
}
