// @ts-nocheck
/**
 * _shared/schemas.ts — Zod primitives + domain schemas for GGS edge functions.
 *
 * Usage:
 *   import { parseOrThrow, validationErrorResponse, ValidationError, MemberSchemas } from '../_shared/schemas.ts';
 *
 * parseOrThrow throws ValidationError on bad input — validationErrorResponse
 * converts it to a 422 Response. All other errors bubble normally.
 */
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// ────────────────────────────────────────
// Primitives
// ────────────────────────────────────────
export const UUID = z.string().uuid();
export const PositiveInt = z.number().int().positive();
export const PositiveBRL = z.number().positive().multipleOf(0.01);
export const NonEmptyString = z.string().trim().min(1);
export const Email = z.string().email().toLowerCase();
export const PhoneBR = z.string().regex(/^(\+55)?[\s.-]?\(?\d{2}\)?\s?\d{4,5}[\s.-]?\d{4}$/, "invalid_phone_br");
export const CPF = z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "invalid_cpf");
export const CNPJ = z.string().regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, "invalid_cnpj");

// ────────────────────────────────────────
// Validation helpers
// ────────────────────────────────────────
export class ValidationError extends Error {
  constructor(public readonly issues: z.ZodIssue[]) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

/** Parse data against schema or throw ValidationError. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ValidationError(result.error.issues);
  return result.data;
}

/** Convert ValidationError into a 422 Response; returns null for non-validation errors. */
export function validationErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string> = {}
): Response | null {
  if (!(err instanceof ValidationError)) return null;
  return new Response(
    JSON.stringify({
      error: "Validation error",
      code: "VALIDATION_ERROR",
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    }),
    {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ────────────────────────────────────────
// Asaas
// ────────────────────────────────────────
export const AsaasSchemas = {
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
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date_yyyy_mm_dd"),
    description: z.string().max(500).optional(),
    billing_type: z.enum(["BOLETO", "CREDIT_CARD", "PIX", "DEBIT_CARD"]).optional(),
  }),
} as const;

// ────────────────────────────────────────
// Credits
// ────────────────────────────────────────
export const CreditsSchemas = {
  Recharge: z.object({
    organization_id: UUID,
    amount: PositiveBRL,
    payment_method: z.enum(["BOLETO", "CREDIT_CARD", "PIX"]).optional(),
    description: z.string().max(500).optional(),
  }),
} as const;

// ────────────────────────────────────────
// Members / Invitations
// ────────────────────────────────────────
export const MemberSchemas = {
  Invite: z.object({
    organization_id: UUID,
    email: Email,
    role: z.enum(["admin", "franqueado", "cliente_admin", "cliente_user"]).optional().default("cliente_user"),
    full_name: NonEmptyString.max(200).optional(),
    team_ids: z.array(UUID).optional(),
  }),

  Update: z.object({
    user_id: UUID,
    organization_id: UUID,
    action: z.enum(["update", "remove", "accept_invitation"]).optional().default("update"),
    role: z.enum(["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"]).optional(),
    full_name: z.string().max(200).optional(),
    job_title: z.string().max(200).optional(),
    email: Email.optional(),
  }),
} as const;

// ────────────────────────────────────────
// CRM Leads
// ────────────────────────────────────────
export const LeadSchemas = {
  Webhook: z.object({
    name: NonEmptyString.max(200),
    email: Email.optional(),
    phone: z.string().max(30).optional(),
    company: z.string().max(200).optional(),
    source: z.string().max(100).optional(),
    value: z.number().nonnegative().optional(),
    tags: z.array(z.string().max(100)).optional(),
    custom_fields: z.record(z.unknown()).optional(),
    funnel_id: UUID.optional(),
  }).refine((d) => d.email || d.phone, { message: "email_or_phone_required" }),

  Create: z.object({
    organization_id: UUID,
    name: NonEmptyString.max(200),
    email: Email.optional(),
    phone: PhoneBR.optional(),
    segment: z.string().max(100).optional(),
    source: z.string().max(100).optional(),
    notes: z.string().max(5000).optional(),
  }).refine((d) => d.email || d.phone, { message: "email_or_phone_required" }),

  Update: z.object({
    lead_id: UUID,
    name: NonEmptyString.max(200).optional(),
    email: Email.optional(),
    phone: PhoneBR.optional(),
    stage: z.string().max(50).optional(),
    notes: z.string().max(5000).optional(),
  }),
} as const;

// ────────────────────────────────────────
// AI Generation
// ────────────────────────────────────────
export const GenerateSchemas = {
  Content: z.object({
    organization_id: UUID.optional(),
    topic: NonEmptyString.max(500).optional(),
    tone: z.enum(["amigável", "formal", "motivacional", "consultivo", "direto"]).optional(),
    platform: z.enum(["instagram", "linkedin", "facebook", "twitter", "tiktok"]).optional(),
    max_chars: z.number().int().positive().max(2200).optional(),
    // allow all other legacy fields through
    quantidade: z.number().int().positive().optional(),
    formatos: z.array(z.object({}).passthrough()).optional(),
    objetivos: z.array(z.string()).optional(),
    tema: z.string().max(500).optional(),
    plataforma: z.string().max(50).optional(),
    tom: z.string().max(100).optional(),
    publico: z.string().max(500).optional(),
    estrategia: z.unknown().optional(),
    funilMomento: z.string().optional(),
    contextoEspecial: z.string().optional(),
    contextoDetalhe: z.string().optional(),
    estiloLote: z.string().optional(),
    nomeEmpresa: z.string().max(200).optional(),
    produto: z.string().max(500).optional(),
    diferencial: z.string().max(500).optional(),
    doresPublico: z.string().max(1000).optional(),
    desejosPublico: z.string().max(1000).optional(),
  }),

  Prospection: z.object({
    organization_id: UUID.optional(),
    regiao: NonEmptyString.max(200),
    nicho: NonEmptyString.max(200),
    porte: z.string().max(100).optional(),
    desafio: z.string().max(500).optional(),
    objetivo: z.string().max(500).optional(),
    nome_empresa: z.string().max(200).optional(),
    site: z.string().max(300).optional(),
    redes_sociais: z.string().max(300).optional(),
    conhecimento_previo: z.string().max(1000).optional(),
    nivel_contato: z.enum(["frio", "morno", "quente"]).optional(),
    contato_decisor: z.string().max(200).optional(),
    cargo_decisor: z.string().max(200).optional(),
    lead_name: z.string().max(200).optional(),
    segment: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    challenges: z.array(z.string().max(200)).max(10).optional(),
    budget_brl: PositiveBRL.optional(),
  }),
} as const;

// ────────────────────────────────────────
// WhatsApp
// ────────────────────────────────────────
export const WhatsAppSchemas = {
  Send: z.object({
    organization_id: UUID.optional(),
    instance_id: z.string().optional(),
    phone: PhoneBR.optional(),
    contactPhone: z.string().max(30).optional(),
    contactId: UUID.optional(),
    message: z.string().max(4096).optional(),
    type: z.string().max(50).optional(),
    mediaUrl: z.string().url().optional(),
    quotedMessageId: UUID.optional(),
    action: z.string().max(50).optional(),
    templateName: z.string().max(200).optional(),
    templateLanguage: z.string().max(20).optional(),
    templateComponents: z.array(z.object({}).passthrough()).optional(),
  }),

  BulkSend: z.object({
    organization_id: UUID,
    dispatch_id: z.string().min(1),
  }),
} as const;

// ────────────────────────────────────────
// Subscriptions
// ────────────────────────────────────────
export const SubscriptionSchemas = {
  Create: z.object({
    organization_id: UUID,
    plan_id: UUID.optional(),
    plan: z.string().max(100).optional(),
    sales_plan: z.string().max(100).optional(),
    marketing_plan: z.string().max(100).optional(),
    billing_type: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]).default("PIX"),
    coupon_code: z.string().max(50).optional().nullable(),
  }),

  Cancel: z.object({
    organization_id: UUID,
    reason: z.string().max(500).optional(),
  }),
} as const;

// ────────────────────────────────────────
// Generic CRM operations
// ────────────────────────────────────────
export const CrmSchemas = {
  RunAutomations: z.object({
    organization_id: UUID.optional(),
    lead_id: UUID.optional(),
    trigger: z.string().max(100).optional(),
    event_id: z.string().optional(),
  }),
} as const;

// ────────────────────────────────────────
// Generate AI (extended)
// ────────────────────────────────────────
export const GenerateExtendedSchemas = {
  Followup: z.object({
    organization_id: UUID.optional(),
    strategy_result: z.unknown().optional(),
    month_ref: z.string().max(20).optional(),
    analise_parcial: z.unknown().optional(),
    ciclos_anteriores: z.unknown().optional(),
  }),

  Script: z.object({
    organization_id: UUID.optional(),
    stage: NonEmptyString.max(100),
    briefing: z.string().max(5000).optional(),
    context: z.unknown().optional(),
    mode: z.string().max(50).optional(),
    existingScript: z.string().max(10000).optional(),
    referenceLinks: z.array(z.string().url()).optional(),
    additionalContext: z.string().max(2000).optional(),
    from_gps: z.boolean().optional(),
  }),

  Strategy: z.object({
    organization_id: UUID.optional(),
    answers: z.unknown(),
    section: z.string().max(100).optional(),
  }),
} as const;

// ────────────────────────────────────────
// Webhooks (signature de payload — passthrough para novos campos de provedores)
// ────────────────────────────────────────
export const WebhookSchemas = {
  AsaasEvent: z.object({
    id: z.string().optional(),
    event: NonEmptyString,
    payment: z.object({}).passthrough().optional(),
    subscription: z.object({}).passthrough().optional(),
  }).passthrough(),

  MetaLeadgen: z.object({
    object: z.string().optional(),
    entry: z.array(
      z.object({
        id: z.string(),
        changes: z.array(
          z.object({
            field: z.string().optional(),
            value: z.object({}).passthrough(),
          })
        ).optional(),
      })
    ).optional(),
  }).passthrough(),
} as const;
