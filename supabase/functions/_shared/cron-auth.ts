// Validação de Bearer CRON_SECRET para fns invocadas por pg_cron / scheduler externo.
//
// Uso típico no início do handler:
//   const authError = checkCronSecret(req);
//   if (authError) return authError;

const CRON_SECRET = Deno.env.get('CRON_SECRET');

export function checkCronSecret(req: Request): Response | null {
  if (!CRON_SECRET) {
    console.error('[cron-auth] CRON_SECRET not configured — refusing all cron requests');
    return new Response(
      JSON.stringify({ error: 'cron_secret_not_configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', reason: 'missing_authorization' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const expected = `Bearer ${CRON_SECRET}`;
  // Constant-time compare
  if (auth.length !== expected.length) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', reason: 'invalid_token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  let result = 0;
  for (let i = 0; i < auth.length; i++) result |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  if (result !== 0) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', reason: 'invalid_token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
