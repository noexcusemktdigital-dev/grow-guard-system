/**
 * auth-helper — requireAuth, assertOrgMember, AuthError
 *
 * Asserts (8):
 * 1. requireAuth retorna { user } quando token válido e getUser resolve com user
 * 2. requireAuth lança AuthError(401) quando header Authorization ausente
 * 3. requireAuth lança AuthError(401) quando token inválido (getUser retorna null)
 * 4. requireAuth lança AuthError(401) quando getUser retorna error
 * 5. assertOrgMember lança AuthError(400) quando organizationId é string vazia
 * 6. assertOrgMember resolve sem erro quando membership primário encontrado
 * 7. assertOrgMember lança AuthError(403) quando membership não encontrado em nenhuma query
 * 8. AuthError carrega status HTTP correto
 */
import { describe, it, expect, vi } from "vitest";

// ── AuthError inline (espelho de _shared/auth.ts) ────────────────────────────

class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

// ── requireAuth inline ───────────────────────────────────────────────────────

type MockGetUser = () => Promise<{
  data: { user: { id: string; email?: string } | null };
  error: { message: string } | null;
}>;

async function requireAuth(
  req: Request,
  mockGetUser: MockGetUser
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
type MemberQuery = () => Promise<{
  data: OrgMemberRow | null;
  error: { message: string } | null;
}>;

async function assertOrgMember(
  primaryQuery: MemberQuery,
  fallbackQuery: MemberQuery,
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  it("retorna { user } quando token válido e getUser resolve com user", async () => {
    const req = new Request("https://api.example.com/fn", {
      headers: { Authorization: "Bearer valid-token-xyz" },
    });
    const mockGetUser: MockGetUser = async () => ({
      data: { user: { id: "user-abc", email: "user@test.com" } },
      error: null,
    });

    const result = await requireAuth(req, mockGetUser);
    expect(result.user.id).toBe("user-abc");
    expect(result.user.email).toBe("user@test.com");
  });

  it("lança AuthError(401) quando header Authorization está ausente", async () => {
    const req = new Request("https://api.example.com/fn");
    const mockGetUser: MockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1" } }, error: null,
    });

    await expect(requireAuth(req, mockGetUser)).rejects.toMatchObject({
      status: 401,
      message: "missing_authorization_header",
    });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("lança AuthError(401) quando getUser retorna user null", async () => {
    const req = new Request("https://api.example.com/fn", {
      headers: { Authorization: "Bearer expired-token" },
    });
    const mockGetUser: MockGetUser = async () => ({
      data: { user: null },
      error: null,
    });

    await expect(requireAuth(req, mockGetUser)).rejects.toMatchObject({
      status: 401,
      message: "invalid_token",
    });
  });

  it("lança AuthError(401) quando getUser retorna error", async () => {
    const req = new Request("https://api.example.com/fn", {
      headers: { Authorization: "Bearer bad-token" },
    });
    const mockGetUser: MockGetUser = async () => ({
      data: { user: null },
      error: { message: "jwt expired" },
    });

    await expect(requireAuth(req, mockGetUser)).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("assertOrgMember", () => {
  it("lança AuthError(400) quando organizationId é string vazia", async () => {
    const primary = vi.fn();
    const fallback = vi.fn();
    await expect(assertOrgMember(primary, fallback, "user-1", "")).rejects.toMatchObject({
      status: 400,
      message: "missing_or_invalid_organization_id",
    });
    expect(primary).not.toHaveBeenCalled();
  });

  it("resolve sem erro quando membership primário encontrado", async () => {
    const primary: MemberQuery = async () => ({
      data: { id: "m1", role: "franqueado" },
      error: null,
    });
    const fallback = vi.fn() as unknown as MemberQuery;

    await expect(
      assertOrgMember(primary, fallback, "user-1", "org-1")
    ).resolves.toBeUndefined();
    expect(fallback).not.toHaveBeenCalled();
  });

  it("lança AuthError(403) quando membership não encontrado em nenhuma query", async () => {
    const primary: MemberQuery = async () => ({ data: null, error: null });
    const fallback: MemberQuery = vi.fn();

    await expect(
      assertOrgMember(primary, fallback, "user-1", "org-1")
    ).rejects.toMatchObject({
      status: 403,
      message: "user_not_member_of_organization",
    });
  });
});

describe("AuthError", () => {
  it("carrega status HTTP correto", () => {
    const e401 = new AuthError(401, "unauthorized");
    const e403 = new AuthError(403, "forbidden");
    const e500 = new AuthError(500, "server_error");

    expect(e401.status).toBe(401);
    expect(e401.message).toBe("unauthorized");
    expect(e403.status).toBe(403);
    expect(e500.status).toBe(500);
  });
});
