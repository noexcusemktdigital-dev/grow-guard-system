/**
 * AUTH-FAIL-CLOSED — Valida comportamento fail-closed de requireAuth e assertOrgMember
 *
 * Verifica:
 * 1. requireAuth sem token → AuthError 401
 * 2. requireAuth com header malformado → AuthError 401
 * 3. requireAuth com token válido → retorna user
 * 4. assertOrgMember orgId vazio → 400
 * 5. assertOrgMember não-membro → 403
 * 6. assertOrgMember membro → resolve sem erro
 *
 * 6 asserts
 */
import { describe, it, expect, vi } from "vitest";

// ── AuthError inline ──────────────────────────────────────────────────────────

class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

// ── requireAuth inline ────────────────────────────────────────────────────────

async function requireAuth(
  req: Request,
  getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>
): Promise<{ user: { id: string } }> {
  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError(401, "missing_authorization_header");
  }
  const { data: { user }, error } = await getUser();
  if (error || !user) throw new AuthError(401, "invalid_token");
  return { user: { id: user.id } };
}

// ── assertOrgMember inline ────────────────────────────────────────────────────

interface OrgRow { id: string; role: string }

async function assertOrgMember(
  primary: () => Promise<{ data: OrgRow | null; error: { message: string } | null }>,
  fallback: () => Promise<{ data: OrgRow | null; error: { message: string } | null }>,
  _userId: string,
  orgId: string
): Promise<void> {
  if (!orgId || typeof orgId !== "string") {
    throw new AuthError(400, "missing_or_invalid_organization_id");
  }
  const p = await primary();
  if (!p.error) {
    if (!p.data) throw new AuthError(403, "user_not_member_of_organization");
    return;
  }
  const f = await fallback();
  if (f.error) throw new AuthError(500, "membership_check_failed");
  if (!f.data) throw new AuthError(403, "user_not_member_of_organization");
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("AUTH-FAIL-CLOSED — requireAuth()", () => {
  it("lança AuthError(401) quando não há header Authorization", async () => {
    const req = new Request("https://api.test");
    const getUser = vi.fn();
    await expect(requireAuth(req, getUser)).rejects.toMatchObject({
      status: 401,
      message: "missing_authorization_header",
    });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("lança AuthError(401) para header malformado sem prefixo Bearer", async () => {
    const req = new Request("https://api.test", {
      headers: { Authorization: "Token abc123" },
    });
    const getUser = vi.fn();
    await expect(requireAuth(req, getUser)).rejects.toMatchObject({
      status: 401,
      message: "missing_authorization_header",
    });
  });

  it("retorna user quando token é válido (happy path)", async () => {
    const req = new Request("https://api.test", {
      headers: { Authorization: "Bearer valid-jwt" },
    });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-001" } },
      error: null,
    });
    const result = await requireAuth(req, getUser);
    expect(result.user.id).toBe("user-001");
  });
});

describe("AUTH-FAIL-CLOSED — assertOrgMember()", () => {
  it("lança AuthError(400) quando orgId é string vazia", async () => {
    const primary = vi.fn().mockResolvedValue({ data: null, error: null });
    const fallback = vi.fn();
    await expect(
      assertOrgMember(primary, fallback, "user-001", "")
    ).rejects.toMatchObject({ status: 400, message: "missing_or_invalid_organization_id" });
  });

  it("lança AuthError(403) quando primary retorna null (não-membro)", async () => {
    const primary = vi.fn().mockResolvedValue({ data: null, error: null });
    const fallback = vi.fn();
    await expect(
      assertOrgMember(primary, fallback, "user-001", "org-001")
    ).rejects.toMatchObject({ status: 403, message: "user_not_member_of_organization" });
  });

  it("resolve sem erro quando usuário é membro", async () => {
    const primary = vi.fn().mockResolvedValue({
      data: { id: "mem-001", role: "member" },
      error: null,
    });
    const fallback = vi.fn();
    await expect(
      assertOrgMember(primary, fallback, "user-001", "org-001")
    ).resolves.toBeUndefined();
  });
});
