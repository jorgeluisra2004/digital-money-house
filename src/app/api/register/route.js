import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { nombre, apellido, dni, email, password, telefono } =
      await req.json();

    if (!nombre || !apellido || !dni || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos obligatorios deben estar completos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const { data: userData, error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          nombre,
          apellido,
          dni,
          email: normalizedEmail,
          password: hashedPassword,
          telefono,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Usuario creado ✅",
      user: userData,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
