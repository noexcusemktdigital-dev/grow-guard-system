/**
 * T3 PII-SCRUB — Valida helper supabase/functions/_shared/redact.ts
 *
 * Código do helper copiado inline pois Vitest não roda imports Deno nativos.
 * Quando _shared/redact.ts for importável via bundle, substituir inline por:
 *   import { redact, redactString, maskEmail, maskPhone } from "@/lib/redact";
 */
import { describe, it, expect } from "vitest";

// ── Helper inline (espelho de _shared/redact.ts) ─────────────────────────────

const PII_KEYS = new Set([
  "email", "phone", "cpf", "cnpj", "rg",
  "password", "senha", "token", "secret",
  "apikey", "api_key", "authorization",
  "access_token", "refresh_token", "private_key",
  "card_number", "cvv", "ssn", "passport",
  "birth_date", "data_nascimento", "nome_completo", "full_name",
]);

function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object" && !Array.isArray(obj)) return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(redact);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const keyLower = k.toLowerCase();
    if (PII_KEYS.has(keyLower)) {
      if (typeof v === "string" && v.length > 4) {
        result[k] = `***${v.slice(-4)}`;
      } else {
        result[k] = "***";
      }
    } else if (typeof v === "object" && v !== null) {
      result[k] = redact(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

const PII_PATTERNS = [
  { re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "***@***" },
  { re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, replacement: "***" },
  { re: /\b\d{11}\b/g, replacement: "***" },
  { re: /(?:\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g, replacement: "***" },
  { re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, replacement: "Bearer ***" },
];

function redactString(s: string): string {
  let result = s;
  for (const { re, replacement } of PII_PATTERNS) {
    result = result.replace(re, replacement);
  }
  return result;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const maskedLocal = local[0] + "***";
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0][0] + "***";
  return `${maskedLocal}@${maskedDomain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `***${digits.slice(-4)}`;
}

// ── redact() ──────────────────────────────────────────────────────────────────

describe("T3 PII-SCRUB — redact()", () => {
  it("mascara email e cpf, preserva name", () => {
    const input = { name: "Joao", email: "joao@example.com", cpf: "12345678901" };
    const out = redact(input) as typeof input;
    expect(out.name).toBe("Joao");
    expect(out.email).not.toBe("joao@example.com");
    expect(out.cpf).not.toBe("12345678901");
  });

  it("preserva todos os valores nao-PII intactos", () => {
    const input = { id: 1, status: "active", count: 42, flag: true };
    expect(redact(input)).toEqual(input);
  });

  it("é recursivo em objetos aninhados (email dentro de user)", () => {
    const input = { user: { email: "a@b.com" }, items: [{ token: "abc123xyz" }] };
    const out = redact(input) as typeof input;
    expect(out.user.email).not.toBe("a@b.com");
    expect(out.items[0].token).not.toBe("abc123xyz");
  });

  it("retorna null para null (passthrough)", () => {
    expect(redact(null)).toBe(null);
  });

  it("retorna undefined para undefined (passthrough)", () => {
    expect(redact(undefined)).toBe(undefined);
  });

  it("primitivos passam sem alteração", () => {
    expect(redact("texto")).toBe("texto");
    expect(redact(42)).toBe(42);
    expect(redact(true)).toBe(true);
  });

  it("mantém últimos 4 chars de string PII longa", () => {
    const out = redact({ token: "abcdef1234" }) as { token: string };
    expect(out.token).toMatch(/1234$/);
    expect(out.token).toMatch(/^\*\*\*/);
  });

  it("strings PII <= 4 chars retornam exatamente '***'", () => {
    const out = redact({ token: "ab" }) as { token: string };
    expect(out.token).toBe("***");
  });

  it("mascara todos os campos PII conhecidos (8 campos)", () => {
    const input: Record<string, string> = {
      email: "x@y.com",
      phone: "11999990000",
      cpf: "12345678901",
      cnpj: "12345678000100",
      password: "mysecret123",
      token: "Bearer xyz123",
      api_key: "sk-abc123def456",
      secret: "supersecret",
    };
    const out = redact(input) as Record<string, string>;
    for (const key of Object.keys(input)) {
      expect(out[key]).not.toBe(input[key]);
      expect(out[key]).toContain("*");
    }
  });

  it("preserva chaves nao-PII em objeto com chaves PII misturadas", () => {
    const input = { id: "uuid-123", email: "a@b.com", org_id: "org-456" };
    const out = redact(input) as typeof input;
    expect(out.id).toBe("uuid-123");
    expect(out.org_id).toBe("org-456");
    expect(out.email).not.toBe("a@b.com");
  });

  it("processa array de objetos com PII", () => {
    const input = [
      { id: "1", email: "user1@x.com" },
      { id: "2", email: "user2@x.com" },
    ];
    const out = redact(input) as typeof input;
    expect(out[0].email).not.toBe("user1@x.com");
    expect(out[1].email).not.toBe("user2@x.com");
    expect(out[0].id).toBe("1");
  });

  it("mascara nome_completo e data_nascimento (LGPD crítico)", () => {
    const input = {
      nome_completo: "Rafael Macagnan",
      data_nascimento: "1990-01-15",
    };
    const out = redact(input) as Record<string, string>;
    expect(out.nome_completo).not.toBe("Rafael Macagnan");
    expect(out.data_nascimento).not.toBe("1990-01-15");
  });
});

// ── redactString() ────────────────────────────────────────────────────────────

describe("T3 PII-SCRUB — redactString()", () => {
  it("mascara email em texto livre", () => {
    expect(redactString("contato: joao@example.com por favor")).toBe(
      "contato: ***@*** por favor"
    );
  });

  it("mascara CPF formatado (000.000.000-00)", () => {
    const out = redactString("CPF: 123.456.789-01");
    expect(out).not.toContain("123.456.789-01");
    expect(out).toContain("***");
  });

  it("mascara CPF sem formatação (11 dígitos)", () => {
    expect(redactString("cpf 12345678901")).toContain("***");
  });

  it("mascara Bearer token no Authorization header", () => {
    const out = redactString("Authorization: Bearer abc123def456ghi789");
    expect(out).toMatch(/Bearer \*\*\*/);
    expect(out).not.toContain("abc123def456");
  });

  it("string sem PII retorna intacta (no false positives)", () => {
    const clean = "Status: active | org: empresa-ltda | count: 42";
    expect(redactString(clean)).toBe(clean);
  });
});

// ── maskEmail() ───────────────────────────────────────────────────────────────

describe("T3 PII-SCRUB — maskEmail()", () => {
  it("formato: priChar + *** @ priChar_domínio + ***", () => {
    const out = maskEmail("joao@gmail.com");
    expect(out).toMatch(/^j\*{3}@/);
    expect(out).not.toContain("joao");
    expect(out).not.toContain("gmail");
  });

  it("sem @ retorna ***@***", () => {
    expect(maskEmail("invalidemail")).toBe("***@***");
  });

  it("preserva apenas o primeiro caractere do local", () => {
    const out = maskEmail("rafael@grupolamadre.com.br");
    expect(out.startsWith("r")).toBe(true);
    expect(out).not.toContain("afael");
  });
});

// ── maskPhone() ───────────────────────────────────────────────────────────────

describe("T3 PII-SCRUB — maskPhone()", () => {
  it("mantém exatamente os últimos 4 dígitos", () => {
    const out = maskPhone("11987654321");
    expect(out).toMatch(/4321$/);
    expect(out).toMatch(/^\*{3}/);
  });

  it("funciona com formatação brasileira: (11) 98765-4321", () => {
    const out = maskPhone("(11) 98765-4321");
    expect(out).toMatch(/4321$/);
  });

  it("strings de 4 dígitos ou menos retornam '***'", () => {
    expect(maskPhone("1234")).toBe("***");
    expect(maskPhone("12")).toBe("***");
    expect(maskPhone("")).toBe("***");
  });
});
