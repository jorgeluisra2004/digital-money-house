// app/api/check-env/route.js
export async function GET() {
  return new Response(
    JSON.stringify({
      RESEND_API_KEY: process.env.RESEND_API_KEY || "NO DEFINIDA",
      SUPABASE_URL: process.env.SUPABASE_URL || "NO DEFINIDA",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}