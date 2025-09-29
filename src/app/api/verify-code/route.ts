// app/api/verify-code/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin(); // ✅ instancia segura en runtime
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: "Faltan campos" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = String(code).trim();

    // 🔹 Buscar código válido
    const { data, error } = await supabaseAdmin
      .from("email_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", normalizedCode)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ message: "Código inválido" }, { status: 400 });
    }

    const record = data[0];

    // 🔹 Verificar expiración
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ message: "Código expirado" }, { status: 400 });
    }

    // 🔹 Marcar código como usado
    await supabaseAdmin
      .from("email_codes")
      .update({ used: true })
      .eq("id", record.id);

    // 🔹 Actualizar last_login en usuarios
    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("email", normalizedEmail);

    if (updateError) {
      console.warn(
        "⚠️ No se pudo actualizar last_login tras verify-code:",
        updateError.message
      );
    }

    return NextResponse.json({ message: "Código verificado ✅" });
  } catch (err: any) {
    console.error("❌ Error en /api/verify-code:", err);
    return NextResponse.json(
      { message: err.message || "Error interno" },
      { status: 500 }
    );
  }
}
