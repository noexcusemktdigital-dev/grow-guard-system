// @ts-nocheck
// Helper de autenticação e autorização para edge functions.
// Resolve dois padrões:
// 1. requireAuth: garante JWT válido e retorna user
// 2. assertOrgMember: garante que user pertence à org alvo (anti-IDOR/BOLA)
//
// Uso típico:
//   const { user, supabase, admin } = await requireAuth(req);
//   const body = await req.json();
//   await assertOrgMember(admin, user.id, body.organization_id);
//
// Falha em qualquer um → throw AuthError com status HTTP apropriado.
// Use authErrorResponse(err, corsHeaders) no catch para devolver resposta consistente.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

export interface AuthContext {
  user: { id: string; email?: string };
  /** Cliente com JWT do usuário (respeita RLS do user) */
  supabase: SupabaseClient;
  /** Cliente com service_role (bypass RLS — usar com cuidado) */
  admin: SupabaseClient;
}

/** Valida JWT do header Authorization, retorna user + clientes Supabase. */
export async function requireAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(401, "missing_authorization_header");
  }
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AuthError(401, "invalid_token");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  return { user: { id: user.id, email: user.email }, supabase, admin };
}

/**
 * Confirma que `userId` pertence à `organizationId` consultando a tabela
 * de membership (organization_memberships). Anti-IDOR/BOLA.
 *
 * IMPORTANTE: usa service_role (bypass RLS) para evitar circular dep
 * onde a própria policy depende desse check.
 *
 * Schema do projeto Sistema Noé:
 *   public.organization_memberships(user_id, organization_id, role)
 *   - tabela canônica de pertencimento multi-tenant.
 *
 * Fallback: se a tabela não existir (erro PGRST), tenta `organization_members`
 * (nome alternativo comum em outros projetos Lovable).
 */
export async function assertOrgMember(
  admin: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<void> {
  if (!organizationId || typeof organizationId !== "string") {
    throw new AuthError(400, "missing_or_invalid_organization_id");
  }

  // Primary: organization_memberships (esquema do Sistema Noé)
  const primary = await admin
    .from("organization_memberships")
    .select("id, role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!primary.error) {
    if (!primary.data) throw new AuthError(403, "user_not_member_of_organization");
    return;
  }

  // Fallback: organization_members (caso esquema legado/alternativo)
  const fallback = await admin
    .from("organization_members")
    .select("id, role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fallback.error) {
    // Nenhuma das tabelas existe — fail-closed para evitar bypass silencioso
    console.error("[auth] membership table lookup failed", {
      primary: primary.error?.message,
      fallback: fallback.error?.message,
    });
    throw new AuthError(500, "membership_check_failed");
  }
  if (!fallback.data) throw new AuthError(403, "user_not_member_of_organization");
}

/** Helper para responder com erro AuthError (ou 500 genérico). */
export function authErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string>,
): Response {
  const status = err instanceof AuthError ? err.status : 500;
  const message = err instanceof Error ? err.message : "internal_error";
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
