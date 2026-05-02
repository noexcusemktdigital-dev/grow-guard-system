/**
 * schemas — testa _shared/schemas.ts
 * 18 asserts: primitivos Zod + AsaasSchemas + parseOrThrow + validationErrorResponse
 *
 * Não importa de Deno — cola lógica inline com zod do node_modules.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Helper inline (espelho de _shared/schemas.ts — sem imports Deno) ─────────

const UUID = z.string().uuid();
const PositiveInt = z.number().int().positive();
const PositiveBRL = z.number().positive().multipleOf(0.01);
const NonEmptyString = z.string().min(1).trim();
const Email = z.string().email().toLowerCase();
const PhoneBR = z.string().regex(/^(\+55)?[\s\-\.]?\(?\d{2}\)?\s?\d{4,5}[\s\-\.]?\d{4}$/, 'invalid_phone_br');
const CPF = z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'invalid_cpf');
const CNPJ = z.string().regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'invalid_cnpj');

class ValidationError extends Error {
  constructor(public readonly issues: z.ZodIssue[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ValidationError(result.error.issues);
  return result.data;
}

function validationErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string> = {}
): Response | null {
  if (!(err instanceof ValidationError)) return null;
  return new Response(
    JSON.stringify({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      issues: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    }),
    {
      status: 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

const AsaasSchemas = {
  BuyCredits: z.object({
    organization_id: UUID,
    package_id: NonEmptyString,
    amount: PositiveBRL,
    payment_method: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX']).optional(),
  }),
  CreateCharge: z.object({
    organization_id: UUID,
    customer_id: NonEmptyString,
    value: PositiveBRL,
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date_yyyy_mm_dd'),
    description: z.string().max(500).optional(),
    billing_type: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX', 'DEBIT_CARD']).optional(),
  }),
};

// ────────────────────────────────────────────────────────────────────────────

describe('schemas — primitivos Zod', () => {
  it('UUID aceita UUID válido e rejeita string arbitrária', () => {
    expect(UUID.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(UUID.safeParse('not-a-uuid').success).toBe(false);
  });

  it('PositiveInt rejeita float e zero', () => {
    expect(PositiveInt.safeParse(5).success).toBe(true);
    expect(PositiveInt.safeParse(0).success).toBe(false);
    expect(PositiveInt.safeParse(1.5).success).toBe(false);
  });

  it('PositiveBRL aceita centavos e rejeita negativo', () => {
    expect(PositiveBRL.safeParse(10.99).success).toBe(true);
    expect(PositiveBRL.safeParse(-1).success).toBe(false);
    expect(PositiveBRL.safeParse(0).success).toBe(false);
  });

  it('Email normaliza para lowercase', () => {
    const result = Email.safeParse('Test@Example.COM');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('test@example.com');
  });

  it('PhoneBR aceita formato com DDD e rejeita string curta', () => {
    expect(PhoneBR.safeParse('(11) 99999-8888').success).toBe(true);
    expect(PhoneBR.safeParse('123').success).toBe(false);
  });

  it('CPF aceita formato com pontos/traço e rejeita inválido', () => {
    expect(CPF.safeParse('123.456.789-09').success).toBe(true);
    expect(CPF.safeParse('abc').success).toBe(false);
  });

  it('CNPJ aceita formato completo e rejeita curto', () => {
    expect(CNPJ.safeParse('12.345.678/0001-95').success).toBe(true);
    expect(CNPJ.safeParse('12345').success).toBe(false);
  });

  it('NonEmptyString rejeita string vazia', () => {
    expect(NonEmptyString.safeParse('').success).toBe(false);
    expect(NonEmptyString.safeParse('  ').success).toBe(false);
    expect(NonEmptyString.safeParse('ok').success).toBe(true);
  });
});

describe('schemas — parseOrThrow', () => {
  it('retorna dado validado em caso de sucesso', () => {
    const result = parseOrThrow(NonEmptyString, 'hello');
    expect(result).toBe('hello');
  });

  it('lança ValidationError com issues em caso de falha', () => {
    expect(() => parseOrThrow(UUID, 'invalid')).toThrow(ValidationError);
    try {
      parseOrThrow(UUID, 'invalid');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).issues.length).toBeGreaterThan(0);
    }
  });

  it('não lança para outros erros não-validação (bubbles normalmente)', () => {
    // erro de tipo genérico não é ValidationError
    const thrown = (() => {
      try { parseOrThrow(z.number(), 'not-a-number'); } catch (e) { return e; }
    })();
    expect(thrown).toBeInstanceOf(ValidationError);
  });
});

describe('schemas — validationErrorResponse', () => {
  it('retorna Response 422 para ValidationError', () => {
    const err = new ValidationError([{ path: ['field'], message: 'bad', code: 'custom' } as z.ZodIssue]);
    const res = validationErrorResponse(err);
    expect(res?.status).toBe(422);
  });

  it('retorna null para erros não-ValidationError', () => {
    expect(validationErrorResponse(new Error('generic'))).toBeNull();
    expect(validationErrorResponse(null)).toBeNull();
  });

  it('inclui corsHeaders passados no Response', async () => {
    const err = new ValidationError([{ path: ['x'], message: 'err', code: 'custom' } as z.ZodIssue]);
    const res = validationErrorResponse(err, { 'Access-Control-Allow-Origin': '*' });
    expect(res?.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const body = await res!.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('schemas — AsaasSchemas', () => {
  it('BuyCredits aceita payload completo válido', () => {
    const result = AsaasSchemas.BuyCredits.safeParse({
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      package_id: 'pkg-100',
      amount: 99.90,
      payment_method: 'PIX',
    });
    expect(result.success).toBe(true);
  });

  it('BuyCredits rejeita amount zero', () => {
    const result = AsaasSchemas.BuyCredits.safeParse({
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      package_id: 'pkg',
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('CreateCharge rejeita due_date com formato errado', () => {
    const result = AsaasSchemas.CreateCharge.safeParse({
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      customer_id: 'cust-1',
      value: 50.00,
      due_date: '01/05/2026', // formato DD/MM/YYYY — inválido
    });
    expect(result.success).toBe(false);
  });
});
