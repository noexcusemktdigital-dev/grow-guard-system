/**
 * dsr-delete-account — confirm body validation + super_admin flow (Phase 19)
 *
 * Lógica inline: simula handler da edge fn dsr-delete-account com:
 *   - Falta confirm body → 400
 *   - confirm: 'wrong' → 400
 *   - confirm: 'DELETE_MY_ACCOUNT' + super_admin → 200
 *   - Insert em dsr_requests
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

interface DSRDeleteResult {
  status: number;
  body: object;
}

interface DSRRequest {
  user_id: string;
  request_type: string;
  status: string;
  requested_by?: string;
  requested_at: string;
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

// ── Handler inline (espelho de dsr-delete-account edge fn) ───────────────────

async function handleDSRDeleteAccount(
  req: Request,
  body: { confirm?: string; target_user_id?: string },
  mockUser: MockUser | null,
  supabaseAdmin: {
    from: (table: string) => {
      insert: (row: DSRRequest) => Promise<{ data?: DSRRequest; error: { message: string } | null }>;
    };
  }
): Promise<DSRDeleteResult> {
  // requireAuth
  let caller: MockUser;
  try {
    caller = requireAuth(req, mockUser);
  } catch (err: unknown) {
    const e = err as { status?: number; message: string };
    return { status: e.status ?? 500, body: { error: e.message } };
  }

  // Validate confirm string
  if (!body.confirm) {
    return { status: 400, body: { error: "missing_confirm_field" } };
  }
  if (body.confirm !== "DELETE_MY_ACCOUNT") {
    return { status: 400, body: { error: "invalid_confirm_value", expected: "DELETE_MY_ACCOUNT" } };
  }

  const isSuperAdmin = caller.app_metadata?.role === "super_admin";
  const targetUserId = isSuperAdmin && body.target_user_id ? body.target_user_id : caller.id;

  // Insert DSR request
  const dsrRecord: DSRRequest = {
    user_id: targetUserId,
    request_type: "account_deletion",
    status: "pending",
    requested_by: isSuperAdmin ? caller.id : undefined,
    requested_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("dsr_requests").insert(dsrRecord);
  if (error) {
    return { status: 500, body: { error: "failed_to_create_dsr_request", detail: error.message } };
  }

  return {
    status: 200,
    body: {
      message: "dsr_deletion_request_created",
      user_id: targetUserId,
      status: "pending",
    },
  };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeSupabaseMock(insertError: { message: string } | null = null) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: insertError }),
    }),
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const regularUser: MockUser = { id: "user-001", email: "user@test.com" };
const superAdmin: MockUser = {
  id: "admin-001",
  email: "admin@test.com",
  app_metadata: { role: "super_admin" },
};

function makeRequest(withAuth = true): Request {
  return new Request("https://fn.supabase.co/dsr-delete-account", {
    method: "POST",
    headers: withAuth ? { Authorization: "Bearer valid-jwt" } : {},
  });
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("dsr-delete-account — confirm body validation", () => {
  it("retorna 400 quando confirm está ausente", async () => {
    const req = makeRequest();
    const result = await handleDSRDeleteAccount(req, {}, regularUser, makeSupabaseMock());
    expect(result.status).toBe(400);
    expect((result.body as { error: string }).error).toBe("missing_confirm_field");
  });

  it("retorna 400 quando confirm é string errada ('wrong')", async () => {
    const req = makeRequest();
    const result = await handleDSRDeleteAccount(req, { confirm: "wrong" }, regularUser, makeSupabaseMock());
    expect(result.status).toBe(400);
    expect((result.body as { error: string }).error).toBe("invalid_confirm_value");
  });

  it("retorna 400 quando confirm é 'DELETE_MY_ACCOUNT' em minúsculas", async () => {
    const req = makeRequest();
    const result = await handleDSRDeleteAccount(req, { confirm: "delete_my_account" }, regularUser, makeSupabaseMock());
    expect(result.status).toBe(400);
  });

  it("retorna 401 sem Authorization header", async () => {
    const req = makeRequest(false);
    const result = await handleDSRDeleteAccount(req, { confirm: "DELETE_MY_ACCOUNT" }, regularUser, makeSupabaseMock());
    expect(result.status).toBe(401);
  });
});

describe("dsr-delete-account — super_admin flow + dsr_requests insert", () => {
  it("super_admin com confirm correto → 200", async () => {
    const req = makeRequest();
    const result = await handleDSRDeleteAccount(
      req,
      { confirm: "DELETE_MY_ACCOUNT" },
      superAdmin,
      makeSupabaseMock()
    );
    expect(result.status).toBe(200);
    expect((result.body as { message: string }).message).toBe("dsr_deletion_request_created");
  });

  it("insert em dsr_requests é chamado com user_id e request_type corretos", async () => {
    const req = makeRequest();
    const supabase = makeSupabaseMock();
    await handleDSRDeleteAccount(
      req,
      { confirm: "DELETE_MY_ACCOUNT" },
      regularUser,
      supabase
    );
    const insertFn = supabase.from("dsr_requests").insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: regularUser.id,
        request_type: "account_deletion",
        status: "pending",
      })
    );
  });

  it("super_admin pode solicitar deleção de outro user via target_user_id", async () => {
    const req = makeRequest();
    const supabase = makeSupabaseMock();
    const result = await handleDSRDeleteAccount(
      req,
      { confirm: "DELETE_MY_ACCOUNT", target_user_id: "user-999" },
      superAdmin,
      supabase
    );
    expect(result.status).toBe(200);
    expect((result.body as { user_id: string }).user_id).toBe("user-999");
  });

  it("retorna 500 quando insert em dsr_requests falha", async () => {
    const req = makeRequest();
    const result = await handleDSRDeleteAccount(
      req,
      { confirm: "DELETE_MY_ACCOUNT" },
      regularUser,
      makeSupabaseMock({ message: "connection timeout" })
    );
    expect(result.status).toBe(500);
    expect((result.body as { error: string }).error).toBe("failed_to_create_dsr_request");
  });
});
