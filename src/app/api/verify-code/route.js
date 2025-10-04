import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, code: "MISSING_FIELDS", message: "Faltan campos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = String(code).trim();

    const { data: record, error } = await supabaseAdmin
      .from("email_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", normalizedCode)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !record) {
      return NextResponse.json(
        {
          success: false,
          code: "CODE_INVALID",
          message: "Código incorrecto o vencido",
        },
        { status: 401 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, code: "CODE_EXPIRED", message: "Código vencido" },
        { status: 401 }
      );
    }

    await supabaseAdmin
      .from("email_codes")
      .update({ used: true })
      .eq("id", record.id);
    await supabaseAdmin
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("email", normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Código verificado ✅",
    });
  } catch (err) {
    console.error("❌ Error en verify-code:", err);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL",
        message: "Error interno en el servidor",
      },
      { status: 500 }
    );
  }
}
