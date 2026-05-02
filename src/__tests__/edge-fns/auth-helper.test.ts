/**
 * AUTH — Valida _shared/auth.ts (SEC-002 / anti-IDOR/BOLA)
 *
 * Código inline pois Vitest não roda Deno/ESM imports de https://esm.sh.
 * Testa: requireAuth (401 sem header), assertOrgMember (400/403/500),
 * authErrorResponse (mapeamento de status).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── AuthError inline ─────────────────────────────────────────────────────────

class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

// ── requireAuth inline (sem Deno env / createClient) ─────────────────────────

async function requireAuthMock(
  req: Request,
  mockGetUser: () => Promise<{ data: { user: { id: string; email?: string } | null }; error: unknown }>
): Promise<{ user: { id: string; email?: string } }> {
  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(401, "missing_authorization_header");
  }
  const { data: { user }, error } = await mockGetUser();
  if (error || !user) throw new AuthError(401, "invalid_token");
  return { user: { id: user.id, email: user.email } };
}

// ── assertOrgMember inline ───────────────────────────────────────────────────

interface OrgMemberRow { id: string; role: string }

async function assertOrgMemberMock(
  primaryQuery: () => Promise<{ data: OrgMemberRow | null; error: { message: string } | null }>,
  fallbackQuery: () => Promise<{ data: OrgMemberRow | null; error: { message: string } | null }>,
  userId: string,
  organizationId: string
): Promise<void> {
  if (!organizationId || typeof organizationId !== "string") {
    throw new AuthError(400, "missing_or_invalid_organization_id");
  }

  const primary = await primaryQuery();
  if (!primary.error) {
    if (!primary.data) throw new AuthError(403, "user_not_member_of_organization");
    return;
  }

  const fallback = await fallbackQuery();
  if (fallback.error) {
    throw new AuthError(500, "membership_check_failed");
  }
  if (!fallback.data) throw new AuthError(403, "user_not_member_of_organization");
}

// ── authErrorResponse inline ─────────────────────────────────────────────────

function authErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string>
): Response {
  const status = err instanceof AuthError ? err.status : 500;
  const message = err instanceof Error ? err.message : "internal_error";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Testes: requireAuth ───────────────────────────────────────────────────────

describe("AUTH — requireAuth()", () => {
  const validUser = { id: "user-uuid-001", email: "user@test.com" };
  const validGetUser = vi.fn().mockResolvedValue({ data: { user: validUser }, error: null });

  beforeEach(() => {
    validGetUser.mockResolvedValue({ data: { user: validUser }, error: null });
  });

  it("lança AuthError(401) sem header Authorization", async () => {
    const req = new Request("https://x.com");
    await expect(requireAuthMock(req, validGetUser)).rejects.toMatchObject({
      status: 401,
      message: "missing_authorization_header",
    });
  });

  it("lança AuthError(401) quando header não começa com 'Bearer '", async () => {
    const req = new Request("https://x.com", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    await expect(requireAuthMock(req, validGetUser)).rejects.toMatchObject({
      status: 401,
      message: "missing_authorization_header",
    });
  });

  it("lança AuthError(401) quando getUser retorna erro (token inválido/expirado)", async () => {
    const req = new Request("https://x.com", {
      headers: { Authorization: "Bearer token-invalido" },
    });
    const failGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "JWT expired" },
    });
    await expect(requireAuthMock(req, failGetUser)).rejects.toMatchObject({
      status: 401,
      message: "invalid_token",
    });
  });

  it("retorna user quando JWT válido (happy path)", async () => {
    const req = new Request("https://x.com", {
      headers: { Authorization: "Bearer valid-jwt-token" },
    });
    const ctx = await requireAuthMock(req, validGetUser);
    expect(ctx.user.id).toBe("user-uuid-001");
    expect(ctx.user.email).toBe("user@test.com");
  });

  it("aceita header 'authorization' (lowercase) sem falhar", async () => {
    const req = new Request("https://x.com", {
      headers: { authorization: "Bearer valid-jwt-token" },
    });
    const ctx = await requireAuthMock(req, validGetUser);
    expect(ctx.user.id).toBe("user-uuid-001");
  });
});

// ── Testes: assertOrgMember ───────────────────────────────────────────────────

describe("AUTH — assertOrgMember()", () => {
  const USER_ID = "user-uuid-001";
  const ORG_ID = "org-uuid-001";
  const memberRow: OrgMemberRow = { id: "mem-001", role: "member" };

  it("lança AuthError(400) quando organizationId está vazio", async () => {
    const primary = vi.fn().mockResolvedValue({ data: null, error: null });
    const fallback = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(
      assertOrgMemberMock(primary, fallback, USER_ID, "")
    ).rejects.toMatchObject({ status: 400, message: "missing_or_invalid_organization_id" });
  });

  it("lança AuthError(403) quando usuário não é membro (primary retorna null)", async () => {
    const primary = vi.fn().mockResolvedValue({ data: null, error: null });
    const fallback = vi.fn();
    await expect(
      assertOrgMemberMock(primary, fallback, USER_ID, ORG_ID)
    ).rejects.toMatchObject({ status: 403, message: "user_not_member_of_organization" });
  });

  it("resolve sem erro quando usuário é membro (happy path)", async () => {
    const primary = vi.fn().mockResolvedValue({ data: memberRow, error: null });
    const fallback = vi.fn();
    await expect(
      assertOrgMemberMock(primary, fallback, USER_ID, ORG_ID)
    ).resolves.toBeUndefined();
  });

  it("tenta fallback quando primary retorna erro de schema (PGRST)", async () => {
    const primary = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "relation organization_memberships does not exist" },
    });
    const fallback = vi.fn().mockResolvedValue({ data: memberRow, error: null });
    await expect(
      assertOrgMemberMock(primary, fallback, USER_ID, ORG_ID)
    ).resolves.toBeUndefined();
    expect(fallback).toHaveBeenCalled();
  });

  it("lança AuthError(403) quando fallback também não encontra membership", async () => {
    const primary = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "schema error" },
    });
    const fallback = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(
      assertOrgMemberMock(primary, fallback, USER_ID, ORG_ID)
    ).rejects.toMatchObject({ status: 403 });
  });

  it("lança AuthError(500) quando ambas as tabelas retornam erro", async () => {
    const primary = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "error-primary" },
    });
    const fallback = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "error-fallback" },
    });
    await expect(
      assertOrgMemberMock(primary, fallback, USER_ID, ORG_ID)
    ).rejects.toMatchObject({ status: 500, message: "membership_check_failed" });
  });
});

// ── Testes: authErrorResponse ─────────────────────────────────────────────────

describe("AUTH — authErrorResponse()", () => {
  it("retorna 401 para AuthError(401)", () => {
    const err = new AuthError(401, "missing_authorization_header");
    const res = authErrorResponse(err, {});
    expect(res.status).toBe(401);
  });

  it("retorna 403 para AuthError(403)", () => {
    const err = new AuthError(403, "user_not_member_of_organization");
    const res = authErrorResponse(err, {});
    expect(res.status).toBe(403);
  });

  it("retorna 500 para erros genéricos não-AuthError", () => {
    const err = new Error("conexão falhou");
    const res = authErrorResponse(err, {});
    expect(res.status).toBe(500);
  });

  it("body tem campo 'error' com a mensagem", async () => {
    const err = new AuthError(401, "invalid_token");
    const res = authErrorResponse(err, {});
    const body = await res.json();
    expect(body.error).toBe("invalid_token");
  });

  it("propaga corsHeaders na response", () => {
    const err = new AuthError(401, "test");
    const res = authErrorResponse(err, {
      "Access-Control-Allow-Origin": "https://grupolamadre.com.br",
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://grupolamadre.com.br"
    );
  });
});
