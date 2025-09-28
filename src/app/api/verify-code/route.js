// app/api/verify-code/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ message: "Faltan campos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("email_codes")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("code", String(code).trim())
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ message: "Código inválido" }, { status: 400 });
    }

    const record = data[0];
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ message: "Código expirado" }, { status: 400 });
    }

    // Marcar código como usado
    await supabase
      .from("email_codes")
      .update({ used: true })
      .eq("id", record.id);

    // Intentar actualizar last_login en usuarios (si existe la columna)
    try {
      await supabase
        .from("usuarios")
        .update({ last_login: new Date().toISOString() })
        .eq("email", email.toLowerCase().trim());
    } catch (e) {
      console.warn(
        "No se pudo actualizar last_login tras verify-code:",
        e?.message || e
      );
      // no abortamos; la verificación ya fue exitosa
    }

    return NextResponse.json({ message: "Código verificado ✅" });
  } catch (err) {
    console.error("Error verify-code:", err);
    return NextResponse.json(
      { message: err.message || "Error" },
      { status: 500 }
    );
  }
}
