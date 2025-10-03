import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkServerEnv } from "@/lib/envCheck";

export async function POST(req: Request) {
  try {
    checkServerEnv();
    const supabaseAdmin = getSupabaseAdmin();

    const { email, code } = await req.json();
    if (!email || !code)
      return NextResponse.json({ message: "Faltan campos" }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = String(code).trim();

    const { data: codes, error } = await supabaseAdmin
      .from("email_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", normalizedCode)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !codes?.length) {
      return NextResponse.json({ message: "Código inválido" }, { status: 400 });
    }

    const record = codes[0];
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ message: "Código expirado" }, { status: 400 });
    }

    await supabaseAdmin
      .from("email_codes")
      .update({ used: true })
      .eq("id", record.id);
    await supabaseAdmin
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("email", normalizedEmail);

    return NextResponse.json({ message: "Código verificado ✅" });
  } catch (err: any) {
    console.error("❌ Error en verify-code:", err);
    return NextResponse.json(
      { message: err?.message || "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
