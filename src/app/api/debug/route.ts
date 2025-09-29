// export async function GET() {
//   return new Response(JSON.stringify({
//     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
//     anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
//     resendKey: process.env.RESEND_API_KEY ? 'OK' : 'MISSING'
//   }));
// }

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