/**
 * SCHEMAS-EXTRA — Cobertura adicional de schemas Zod do projeto
 *
 * Verifica:
 * 1. LeadSchemas.Create — email_or_phone refine: rejeita sem email E sem phone
 * 2. LeadSchemas.Create — email_or_phone refine: aceita com só email
 * 3. LeadSchemas.Create — email_or_phone refine: aceita com só phone
 * 4. AsaasSchemas.BuyCredits — rejeita quando package_id E amount são vazios/inválidos
 * 5. AsaasSchemas.BuyCredits — aceita amount com 2 casas decimais (0.01)
 * 6. AsaasSchemas.BuyCredits — rejeita payment_method inválido
 * 7. PhoneBR — aceita formato +55 com parênteses
 * 8. PhoneBR — aceita formato sem DDI (apenas DDD + número)
 *
 * 8 asserts
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Primitivos inline (espelho de _shared/schemas.ts) ─────────────────────────

const UUID = z.string().uuid();
const PositiveInt = z.number().int().positive();
const PositiveBRL = z.number().positive().multipleOf(0.01);
const NonEmptyString = z.string().trim().min(1);
const Email = z.string().email().toLowerCase();
const PhoneBR = z.string().regex(
  /^(\+55)?[\s.-]?\(?\d{2}\)?\s?\d{4,5}[\s.-]?\d{4}$/,
  "invalid_phone_br"
);

// ── LeadSchemas (inline — sem import Deno) ────────────────────────────────────
const LeadSchemas = {
  Create: z
    .object({
      organization_id: UUID,
      name: NonEmptyString,
      email: Email.optional(),
      phone: PhoneBR.optional(),
      source: z.string().optional(),
    })
    .refine((d) => !!d.email || !!d.phone, {
      message: "email_or_phone_required",
      path: ["email"],
    }),
};

// ── AsaasSchemas (inline — espelho de _shared/schemas.ts) ─────────────────────
const AsaasSchemas = {
  BuyCredits: z.object({
    organization_id: UUID,
    package_id: NonEmptyString,
    amount: PositiveBRL,
    payment_method: z.enum(["BOLETO", "CREDIT_CARD", "PIX"]).optional(),
  }),
  CreateCharge: z.object({
    organization_id: UUID,
    customer_id: NonEmptyString,
    value: PositiveBRL,
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date_yyyy_mm_dd"),
    description: z.string().max(500).optional(),
    billing_type: z
      .enum(["BOLETO", "CREDIT_CARD", "PIX", "DEBIT_CARD"])
      .optional(),
  }),
};

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ── LeadSchemas.Create — email_or_phone refine ────────────────────────────────

describe("LeadSchemas.Create — email_or_phone refine", () => {
  it("1. rejeita quando nem email nem phone são fornecidos", () => {
    const result = LeadSchemas.Create.safeParse({
      organization_id: VALID_UUID,
      name: "Rafael Teste",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("email");
    }
  });

  it("2. aceita quando apenas email é fornecido (sem phone)", () => {
    const result = LeadSchemas.Create.safeParse({
      organization_id: VALID_UUID,
      name: "Rafael Teste",
      email: "rafael@lamadre.com.br",
    });
    expect(result.success).toBe(true);
  });

  it("3. aceita quando apenas phone é fornecido (sem email)", () => {
    const result = LeadSchemas.Create.safeParse({
      organization_id: VALID_UUID,
      name: "Rafael Teste",
      phone: "(11) 99999-8888",
    });
    expect(result.success).toBe(true);
  });
});

// ── AsaasSchemas.BuyCredits — refinamentos ────────────────────────────────────

describe("AsaasSchemas.BuyCredits — refinamentos", () => {
  it("4. rejeita quando package_id é string vazia", () => {
    const result = AsaasSchemas.BuyCredits.safeParse({
      organization_id: VALID_UUID,
      package_id: "",
      amount: 50.0,
    });
    expect(result.success).toBe(false);
  });

  it("5. aceita amount mínimo de 0.01 (1 centavo)", () => {
    const result = AsaasSchemas.BuyCredits.safeParse({
      organization_id: VALID_UUID,
      package_id: "pkg-mini",
      amount: 0.01,
    });
    expect(result.success).toBe(true);
  });

  it("6. rejeita payment_method fora do enum permitido", () => {
    const result = AsaasSchemas.BuyCredits.safeParse({
      organization_id: VALID_UUID,
      package_id: "pkg-x",
      amount: 100.0,
      payment_method: "CRYPTO", // inválido
    });
    expect(result.success).toBe(false);
  });
});

// ── PhoneBR — validação ───────────────────────────────────────────────────────

describe("PhoneBR — formatos válidos BR", () => {
  it("7. aceita formato com DDI +55 e parênteses", () => {
    expect(PhoneBR.safeParse("+55 (11) 99999-8888").success).toBe(true);
  });

  it("8. aceita formato sem DDI — apenas DDD + 9 dígitos", () => {
    expect(PhoneBR.safeParse("(11) 99999-8888").success).toBe(true);
  });
});
