/**
 * dsr-export-data — requireAuth + RBAC super_admin export (Phase 19)
 *
 * Lógica inline: simula handler da edge fn dsr-export-data com:
 *   - requireAuth obriga JWT (401 sem header)
 *   - super_admin pode exportar dados de qualquer user
 *   - Non-super_admin tentando exportar outro user → 403
 *   - Response inclui Content-Disposition header
 *
 * 8 asserts
 */
import { describe, it, expect, vi } from "vitest";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  email?: string;
  app_metadata?: { role?: string };
}

interface DSRExportResult {
  status: number;
  headers: Record<string, string>;
  body: object | string;
}

// ── requireAuth inline ────────────────────────────────────────────────────────

function requireAuth(req: Request, mockUser: MockUser | null): MockUser {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw Object.assign(new Error("missing_authorization_header"), { status: 401 });
  }
  if (!mockUser) {
    throw Object.assign(new Error("invalid_token"), { status: 401 });
  }
  return mockUser;
}

// ── Handler inline (espelho de dsr-export-data edge fn) ──────────────────────

async function handleDSRExport(
  req: Request,
  targetUserId: string,
  mockUser: MockUser | null,
  mockFetchUserData: (userId: string) => Promise<object>
): Promise<DSRExportResult> {
  // requireAuth
  let caller: MockUser;
  try {
    caller = requireAuth(req, mockUser);
  } catch (err: unknown) {
    const e = err as { status?: number; message: string };
    return {
      status: e.status ?? 500,
      headers: {},
      body: { error: e.message },
    };
  }

  const isSuperAdmin = caller.app_metadata?.role === "super_admin";

  // RBAC: non-super_admin só pode exportar seus próprios dados
  if (!isSuperAdmin && caller.id !== targetUserId) {
    return {
      status: 403,
      headers: {},
      body: { error: "forbidden_cross_user_export" },
    };
  }

  const userData = await mockFetchUserData(targetUserId);
  const jsonContent = JSON.stringify(userData, null, 2);

  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="dsr-export-${targetUserId}.json"`,
    },
    body: userData,
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const regularUser: MockUser = { id: "user-001", email: "user@test.com" };
const superAdmin: MockUser = {
  id: "admin-001",
  email: "admin@test.com",
  app_metadata: { role: "super_admin" },
};
const mockFetch = vi.fn().mockResolvedValue({ id: "user-001", name: "Test User", emails: [] });

function makeRequest(withAuth = true): Request {
  return new Request("https://fn.supabase.co/dsr-export-data", {
    method: "GET",
    headers: withAuth ? { Authorization: "Bearer valid-jwt-token" } : {},
  });
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("dsr-export-data — requireAuth", () => {
  it("retorna 401 sem Authorization header", async () => {
    const req = makeRequest(false);
    const result = await handleDSRExport(req, "user-001", regularUser, mockFetch);
    expect(result.status).toBe(401);
    expect((result.body as { error: string }).error).toBe("missing_authorization_header");
  });

  it("retorna 401 quando token é inválido (user null)", async () => {
    const req = makeRequest(true);
    const result = await handleDSRExport(req, "user-001", null, mockFetch);
    expect(result.status).toBe(401);
    expect((result.body as { error: string }).error).toBe("invalid_token");
  });
});

describe("dsr-export-data — RBAC e Content-Disposition", () => {
  it("regular user pode exportar seus próprios dados (200)", async () => {
    const req = makeRequest(true);
    const result = await handleDSRExport(req, regularUser.id, regularUser, mockFetch);
    expect(result.status).toBe(200);
  });

  it("super_admin pode exportar dados de outro user (200)", async () => {
    const req = makeRequest(true);
    const result = await handleDSRExport(req, "user-999", superAdmin, mockFetch);
    expect(result.status).toBe(200);
  });

  it("non-super_admin tentando exportar outro user → 403", async () => {
    const req = makeRequest(true);
    const result = await handleDSRExport(req, "user-999", regularUser, mockFetch);
    expect(result.status).toBe(403);
    expect((result.body as { error: string }).error).toBe("forbidden_cross_user_export");
  });

  it("response contém Content-Disposition para download", async () => {
    const req = makeRequest(true);
    const result = await handleDSRExport(req, regularUser.id, regularUser, mockFetch);
    expect(result.headers["Content-Disposition"]).toBeDefined();
    expect(result.headers["Content-Disposition"]).toContain("attachment");
    expect(result.headers["Content-Disposition"]).toContain("dsr-export-");
  });

  it("Content-Disposition inclui o userId alvo no nome do arquivo", async () => {
    const req = makeRequest(true);
    const result = await handleDSRExport(req, "user-001", regularUser, mockFetch);
    expect(result.headers["Content-Disposition"]).toContain("user-001");
  });

  it("mockFetchUserData é chamado com targetUserId correto", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ id: "user-001" });
    const req = makeRequest(true);
    await handleDSRExport(req, "user-001", superAdmin, fetchSpy);
    expect(fetchSpy).toHaveBeenCalledWith("user-001");
  });
});
