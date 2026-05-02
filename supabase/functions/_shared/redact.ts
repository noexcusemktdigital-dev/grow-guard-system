// Helper para mascarar PII em logs (LGPD-001)
// Uso: console.log('msg', redact(payload))  ou  console.log(redactString(rawText))
// Compativel com Deno (edge functions) e tambem importavel em ambiente Node-like.

const PII_KEYS = [
  'email',
  'cpf',
  'cnpj',
  'phone',
  'telefone',
  'whatsapp',
  'password',
  'senha',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'secret',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'asaas-access-token',
  'x-evolution-secret',
];

function maskValue(v: unknown): unknown {
  if (typeof v === 'string') {
    if (v.length <= 4) return '***';
    return `***${v.slice(-4)}`;
  }
  if (typeof v === 'number') return '***';
  return '***';
}

export function redact<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redact(item)) as unknown as T;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const keyLower = k.toLowerCase();
    if (PII_KEYS.some((pk) => keyLower.includes(pk))) {
      out[k] = maskValue(v);
    } else if (v !== null && typeof v === 'object') {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export function redactString(s: string): string {
  if (typeof s !== 'string') return s;
  return s
    // email
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '***@***')
    // CPF (with or without punctuation)
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '***.***.***-**')
    // CNPJ
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '**.***.***/****-**')
    // phone (10-13 digits, possibly with +/spaces)
    .replace(/\+?\d{10,13}\b/g, '***')
    // Bearer / Token / Key prefixed values
    .replace(/(Bearer|Token|Key|apikey)\s+[\w.\-_]{10,}/gi, '$1 ***');
}

// Mascara curta para emails que voce quer manter parcialmente legivel em logs
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '***';
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  const userMasked = user.length <= 2 ? '***' : `${user.slice(0, 2)}***`;
  return `${userMasked}@${domain}`;
}

// Mascara phone preservando os 4 ultimos digitos
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '***';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}
