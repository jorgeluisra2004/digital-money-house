import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "NO DEFINIDA",
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NO DEFINIDA",
  });
}