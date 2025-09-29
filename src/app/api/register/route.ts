import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // ⚠️ Cambiado desde getSupabaseAdmin
import bcrypt from "bcryptjs";

/**
 * POST /api/register
 * Crea un usuario en Supabase Auth y en la tabla "usuarios"
 * ⚠️ Seguro para deployment aunque falten variables
 */
export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Servicio temporalmente no disponible ⚠️" },
        { status: 503 }
      );
    }

    const { nombre, apellido, dni, email, password, telefono } =
      await req.json();

    // Validación de campos obligatorios
    if (!nombre || !apellido || !dni || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos obligatorios deben estar completos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Crear usuario en Supabase Auth sin confirmación de email
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true, // Salta confirmación de email
      });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Hashear contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insertar usuario en la tabla "usuarios"
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
      // Si falla la inserción, eliminamos el usuario de Auth
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
    console.error("❌ Error en /api/register:", err);

    const message =
      err instanceof Error ? err.message : "Error interno en el servidor";

    return NextResponse.json({ message }, { status: 500 });
  }
}
