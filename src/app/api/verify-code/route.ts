// app/api/verify-code/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Servicio temporalmente no disponible ⚠️" },
        { status: 503 }
      );
    }

    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: "Faltan campos" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = String(code).trim();

    // Buscar código válido
    const { data: codes, error } = await supabaseAdmin
      .from("email_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", normalizedCode)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !codes || codes.length === 0) {
      return NextResponse.json({ message: "Código inválido" }, { status: 400 });
    }

    const record = codes[0];

    // Verificar expiración
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ message: "Código expirado" }, { status: 400 });
    }

    // Marcar código como usado (no bloqueante)
    const { error: markUsedError } = await supabaseAdmin
      .from("email_codes")
      .update({ used: true })
      .eq("id", record.id);

    if (markUsedError) {
      console.warn(
        "⚠️ No se pudo marcar el código como usado:",
        markUsedError.message
      );
    }

    // Actualizar last_login en usuarios (opcional, no bloqueante)
    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ last_login: new Date().toISOString() })
      .eq("email", normalizedEmail);

    if (updateError) {
      console.warn(
        "No se pudo actualizar last_login tras verify-code:",
        updateError.message
      );
    }

    return NextResponse.json({ message: "Código verificado ✅" });
  } catch (err: unknown) {
    console.error("❌ Error en verify-code:", err);

    const message =
      err instanceof Error ? err.message : "Error interno en el servidor";

    return NextResponse.json({ message }, { status: 500 });
  }
}
