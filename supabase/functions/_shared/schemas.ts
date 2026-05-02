// Schemas Zod compartilhados para edge functions.
// Padrão: schemas reutilizáveis em namespaces (Asaas, Credits, etc.)
//
// Uso:
//   import { AsaasSchemas, parseOrThrow, validationErrorResponse } from '../_shared/schemas.ts';
//   const body = parseOrThrow(AsaasSchemas.BuyCredits, await req.json());

import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// ──────────────────────────────────────────────
// Tipos primitivos reutilizáveis
// ──────────────────────────────────────────────
export const UUID = z.string().uuid();
export const PositiveInt = z.number().int().positive();
export const PositiveBRL = z.number().positive().multipleOf(0.01);
export const NonEmptyString = z.string().min(1).trim();
export const Email = z.string().email().toLowerCase();
export const PhoneBR = z.string().regex(/^\+?55?\d{10,11}$/, 'invalid_brazilian_phone');
export const CPF = z.string().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
export const CNPJ = z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);

export const BillingType = z.enum(['PIX', 'BOLETO', 'CREDIT_CARD']);

// ──────────────────────────────────────────────
// Asaas
// ──────────────────────────────────────────────
export const AsaasSchemas = {
  // asaas-buy-credits: { organization_id, pack_id, billing_type }
  BuyCredits: z.object({
    organization_id: UUID,
    pack_id: NonEmptyString,
    billing_type: BillingType,
  }),

  // asaas-create-charge: { organization_id, charge_type, billing_type, pack_id? }
  CreateCharge: z.object({
    organization_id: UUID,
    charge_type: z.enum(['credits', 'extra_user']),
    billing_type: BillingType,
    pack_id: NonEmptyString.optional(),
  }),
} as const;

// ──────────────────────────────────────────────
// Credits
// ──────────────────────────────────────────────
export const CreditsSchemas = {
  // recharge-credits: { organization_id, amount, description? }
  Recharge: z.object({
    organization_id: UUID,
    amount: PositiveInt,
    description: NonEmptyString.max(500).optional(),
  }),
} as const;

// ──────────────────────────────────────────────
// Helper: parse com erro padronizado
// ──────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Tenta parsear `data` com `schema`. Em erro, lança ValidationError.
 * Use no início do handler:
 *   const body = parseOrThrow(AsaasSchemas.BuyCredits, await req.json());
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ');
    throw new ValidationError(400, `validation_failed: ${errors}`);
  }
  return result.data;
}

/**
 * Se err for ValidationError, retorna Response 400 com JSON. Senão null.
 * Use no catch:
 *   const valResp = validationErrorResponse(err, corsHeaders);
 *   if (valResp) return valResp;
 */
export function validationErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string>,
): Response | null {
  if (!(err instanceof ValidationError)) return null;
  return new Response(
    JSON.stringify({ error: err.message }),
    {
      status: err.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
