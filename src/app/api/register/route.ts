import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkServerEnv } from "@/lib/envCheck";

export async function POST(req: Request) {
  try {
    checkServerEnv();
    const supabaseAdmin = getSupabaseAdmin();

    const { nombre, apellido, dni, email, password, telefono } =
      await req.json();

    if (!nombre || !apellido || !dni || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos obligatorios deben estar completos" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const { data: userData, error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          id: userId,
          nombre,
          apellido,
          dni,
          email: normalizedEmail,
          password: hashedPassword,
          telefono: telefono || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { message: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Usuario creado correctamente ✅",
      user: userData,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error interno en el servidor";
    console.error("❌ Error en /api/register:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
