import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import { checkEnv } from "@/lib/envCheck";


export async function POST(req: Request) {
  checkEnv(); 
  try {
    const supabaseAdmin = getSupabaseAdmin(); // ✅ instancia segura en runtime

    const { nombre, apellido, dni, email, password, telefono } =
      await req.json();

    // ✅ Validar campos
    if (!nombre || !apellido || !dni || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos obligatorios deben estar completos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 🔹 Crear usuario en Supabase Auth sin confirmación de email
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true, // ⚡ Salta confirmación de email
      });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    const userId = authData.user.id; // UUID generado por Auth

    // 🔹 Hashear la contraseña antes de guardarla
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 🔹 Insertar datos del usuario en la tabla "usuarios"
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
          telefono,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      // Si falla la inserción en la tabla, borramos el usuario creado en Auth
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

    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
