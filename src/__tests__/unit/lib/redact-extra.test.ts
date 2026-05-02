/**
 * T4 REDACT-EXTRA — Cobertura adicional de redact, maskEmail e maskPhone
 *
 * Verifica:
 * 1. redact recursivo em arrays de objetos
 * 2. redact em objeto aninhado (nested)
 * 3. redact preserva campos sem PII intactos
 * 4. maskEmail com email normal (>2 chars antes do @)
 * 5. maskEmail edge case: sem @ → retorna '***'
 * 6. maskEmail edge case: string vazia → retorna '***'
 * 7. maskPhone com formato BR com parênteses e hífen
 * 8. maskPhone com dígitos insuficientes (<4) → retorna '***'
 */
import { describe, it, expect } from "vitest";
import { redact, maskEmail, maskPhone } from "../../../../supabase/functions/_shared/redact";

// ── redact recursivo ─────────────────────────────────────────────────────────
describe("T4 REDACT-EXTRA — redact recursivo", () => {
  it("1. redact em array de objetos mascara PII em cada item", () => {
    const input = [
      { name: "Rafael", email: "rafael@lamadre.com.br" },
      { name: "Ana", email: "ana@test.com" },
    ];

    const result = redact(input) as Array<Record<string, unknown>>;

    expect(result).toHaveLength(2);
    expect(result[0].email).toMatch(/^\*\*\*/);
    expect(result[1].email).toMatch(/^\*\*\*/);
    // campos sem PII intactos
    expect(result[0].name).toBe("Rafael");
  });

  it("2. redact em objeto aninhado mascara PII em níveis profundos", () => {
    const input = {
      user: {
        profile: {
          phone: "11999990000",
          bio: "Corretor",
        },
      },
    };

    const result = redact(input) as { user: { profile: { phone: string; bio: string } } };

    expect(result.user.profile.phone).toMatch(/^\*\*\*/);
    expect(result.user.profile.bio).toBe("Corretor");
  });

  it("3. redact preserva campos sem PII (name, id, status)", () => {
    const input = { id: "uuid-123", status: "active", name: "Fulano" };
    const result = redact(input) as typeof input;

    expect(result.id).toBe("uuid-123");
    expect(result.status).toBe("active");
    expect(result.name).toBe("Fulano");
  });
});

// ── maskEmail ─────────────────────────────────────────────────────────────────
describe("T4 REDACT-EXTRA — maskEmail edge cases", () => {
  it("4. maskEmail com email normal mascara usuário mas mantém domínio", () => {
    const result = maskEmail("rafael@lamadre.com.br");
    expect(result).toBe("ra***@lamadre.com.br");
  });

  it("5. maskEmail sem @ retorna '***'", () => {
    expect(maskEmail("invalidemail")).toBe("***");
  });

  it("6. maskEmail com string vazia retorna '***'", () => {
    expect(maskEmail("")).toBe("***");
  });

  it("6b. maskEmail com null retorna '***'", () => {
    expect(maskEmail(null)).toBe("***");
  });
});

// ── maskPhone ─────────────────────────────────────────────────────────────────
describe("T4 REDACT-EXTRA — maskPhone formatos", () => {
  it("7. maskPhone com formato BR (11) 99999-0000 preserva últimos 4 dígitos", () => {
    const result = maskPhone("(11) 99999-0000");
    expect(result).toBe("***0000");
  });

  it("7b. maskPhone com formato +55 11 999990000", () => {
    const result = maskPhone("+55 11 999990000");
    expect(result).toBe("***0000");
  });

  it("8. maskPhone com menos de 4 dígitos retorna '***'", () => {
    expect(maskPhone("123")).toBe("***");
  });

  it("8b. maskPhone com undefined retorna '***'", () => {
    expect(maskPhone(undefined)).toBe("***");
  });
});
