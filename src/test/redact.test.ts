/**
 * Tests para supabase/functions/_shared/redact.ts (PR #7)
 * Roda com: npm test src/test/redact.test.ts
 *
 * Código do helper copiado inline pois o helper ainda não existe no main.
 * Quando PR #7 for mergeado, substituir inline pelo import do helper.
 */
import { describe, it, expect } from "vitest";

// ── Helper inline (espelho de redact.ts — PR #7) ─────────────────────────────

const PII_KEYS = new Set([
  "email",
  "phone",
  "cpf",
  "cnpj",
  "rg",
  "password",
  "senha",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "access_token",
  "refresh_token",
  "private_key",
  "card_number",
  "cvv",
  "ssn",
  "passport",
  "birth_date",
  "data_nascimento",
  "nome_completo",
  "full_name",
]);

function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object" && !Array.isArray(obj)) return obj;

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

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
  // Email
  { re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: "***@***" },
  // CPF formatado (000.000.000-00)
  { re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, replacement: "***" },
  // CPF sem formatacao (11 digits)
  { re: /\b\d{11}\b/g, replacement: "***" },
  // Phone BR (10-11 digits, com/sem DDI)
  { re: /(?:\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g, replacement: "***" },
  // Bearer token
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

describe("redact", () => {
  it("mascara campos com chave PII — email e cpf", () => {
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

  it("e recursivo em objetos aninhados", () => {
    const input = {
      user: { email: "a@b.com" },
      items: [{ token: "abc123xyz" }],
    };
    const out = redact(input) as typeof input;
    expect(out.user.email).not.toBe("a@b.com");
    expect(out.items[0].token).not.toBe("abc123xyz");
  });

  it("handles null como valor", () => {
    expect(redact(null)).toBe(null);
  });

  it("handles primitivos nao-objetos (passthrough)", () => {
    expect(redact("string")).toBe("string");
    expect(redact(42)).toBe(42);
    expect(redact(true)).toBe(true);
  });

  it("mantem os ultimos 4 chars de string longa em campos PII", () => {
    const out = redact({ token: "abcdef1234" }) as { token: string };
    expect(out.token).toMatch(/1234$/);
    expect(out.token).toMatch(/^\*\*\*/);
  });

  it("mascara strings de 4 chars ou menos como '***'", () => {
    const out = redact({ token: "ab" }) as { token: string };
    expect(out.token).toBe("***");
  });

  it("mascara todos os campos PII conhecidos", () => {
    const input = {
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
      expect(out[key]).not.toBe((input as Record<string, string>)[key]);
      expect(out[key]).toContain("*");
    }
  });

  it("preserva chaves nao-PII mesmo em objetos com chaves PII", () => {
    const input = { id: "uuid-123", email: "a@b.com", org_id: "org-456" };
    const out = redact(input) as typeof input;
    expect(out.id).toBe("uuid-123");
    expect(out.org_id).toBe("org-456");
    expect(out.email).not.toBe("a@b.com");
  });
});

// ── redactString() ────────────────────────────────────────────────────────────

describe("redactString", () => {
  it("mascara email em string livre", () => {
    expect(redactString("contato: joao@example.com por favor")).toBe(
      "contato: ***@*** por favor",
    );
  });

  it("mascara CPF formatado (000.000.000-00)", () => {
    expect(redactString("CPF: 123.456.789-01")).toContain("***");
    expect(redactString("CPF: 123.456.789-01")).not.toContain("123.456.789-01");
  });

  it("mascara CPF sem formatacao (11 digitos consecutivos)", () => {
    expect(redactString("cpf 12345678901")).toContain("***");
  });

  it("mascara Bearer token", () => {
    const out = redactString("Authorization: Bearer abc123def456ghi789");
    expect(out).toMatch(/Bearer \*\*\*/);
    expect(out).not.toContain("abc123def456");
  });

  it("string sem PII retorna intacta", () => {
    const clean = "Status: active | org: empresa-ltda | count: 42";
    expect(redactString(clean)).toBe(clean);
  });
});

// ── maskEmail() ───────────────────────────────────────────────────────────────

describe("maskEmail", () => {
  it("formato: primeiro char + *** @ primeiro char do domain + ***", () => {
    const out = maskEmail("joao@gmail.com");
    expect(out).toMatch(/^j\*{3}@/);
    expect(out).not.toContain("joao@gmail");
  });

  it("sem @ retorna ***@***", () => {
    expect(maskEmail("invalidemail")).toBe("***@***");
  });

  it("preserva o primeiro caractere do local", () => {
    const out = maskEmail("rafael@grupolamadre.com.br");
    expect(out.startsWith("r")).toBe(true);
  });
});

// ── maskPhone() ───────────────────────────────────────────────────────────────

describe("maskPhone", () => {
  it("mantem exatamente os ultimos 4 digitos", () => {
    const out = maskPhone("11987654321");
    expect(out).toMatch(/4321$/);
    expect(out).toMatch(/^\*{3}/);
  });

  it("funciona com formatacao (parens, hifen, espaco)", () => {
    const out = maskPhone("(11) 98765-4321");
    expect(out).toMatch(/4321$/);
  });

  it("strings de 4 digitos ou menos retornam '***'", () => {
    expect(maskPhone("1234")).toBe("***");
    expect(maskPhone("12")).toBe("***");
  });
});
