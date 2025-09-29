export async function GET() {
  return new Response(JSON.stringify({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
    resendKey: process.env.RESEND_API_KEY ? 'OK' : 'MISSING'
  }));
}
