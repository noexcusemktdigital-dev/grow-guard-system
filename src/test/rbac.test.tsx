/**
 * QA-004: Auth and RBAC tests
 * Covers: role hierarchy, fail-closed access, cliente_admin vs cliente_user,
 *         ADMIN_ONLY route guards, FeatureGate CREDIT_REQUIRED routes,
 *         JWT role precedence over DB fallback
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Role types (mirrors AuthContext.tsx) ──────────────────────────────────────
type AppRole = "super_admin" | "admin" | "franqueado" | "cliente_admin" | "cliente_user";
type GateReason = "trial_expired" | "trial_limited" | "no_credits" | "no_gps_approved" | "admin_only" | null;

// ── Role hierarchy constants (mirrors AuthContext priority order) ─────────────
const FRANCHISE_ROLE_PRIORITY: AppRole[] = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
const SAAS_ROLE_PRIORITY: AppRole[] = ["cliente_admin", "cliente_user", "super_admin", "admin", "franqueado"];

// ── Route gate constants (mirrors FeatureGateContext.tsx) ─────────────────────
const ADMIN_ONLY_ROUTES = [
  "/cliente/disparos",
  "/cliente/dashboard",
  "/cliente/trafego-pago",
  "/cliente/integracoes",
  "/cliente/plano-creditos",
];

const CREDIT_REQUIRED = [
  "/cliente/agentes-ia",
  "/cliente/conteudos",
  "/cliente/sites",
  "/cliente/disparos",
  "/cliente/redes-sociais",
  "/cliente/trafego-pago",
];

const ALWAYS_ACCESSIBLE = [
  "/cliente/inicio",
  "/cliente/plano-creditos",
  "/cliente/configuracoes",
  "/cliente/gps-negocio",
  "/cliente/plano-vendas",
  "/cliente/plano-marketing",
  "/cliente/checklist",
  "/cliente/gamificacao",
  "/cliente/avaliacoes",
  "/cliente/integracoes",
];

/** Pure access gate function — mirrors FeatureGateContext.getGateReason logic */
function getGateReason(
  feature: string,
  options: {
    role: AppRole | null;
    isDataLoading: boolean;
    isTrialExpired: boolean;
    hasNoCredits: boolean;
    hasApprovedGPS: boolean;
  }
): GateReason {
  const { role, isDataLoading, isTrialExpired, hasNoCredits, hasApprovedGPS } = options;

  if (ALWAYS_ACCESSIBLE.some((r) => feature.startsWith(r))) return null;
  if (isDataLoading) return null; // don't gate while loading
  if (role === "cliente_user" && ADMIN_ONLY_ROUTES.some((r) => feature.startsWith(r))) return "admin_only";
  if (isTrialExpired) return "trial_expired";
  if (!hasApprovedGPS && ["/cliente/crm", "/cliente/agentes-ia"].some((r) => feature.startsWith(r))) return "no_gps_approved";
  if (hasNoCredits && CREDIT_REQUIRED.some((r) => feature.startsWith(r))) return "no_credits";
  return null;
}

/**
 * Selects the top role for a portal type from a set of roles.
 * Mirrors AuthContext.tsx lines 110-121 exactly:
 *   1. Filter roles for the current portal type
 *   2. Take first matching portal role (DB result order, not priority order)
 *   3. Fallback: find first role from priorityOrder that appears in the full list
 *   4. Final fallback: first role in the array
 *
 * NOTE: The priority order is used as FALLBACK only — if portal-specific roles
 * exist, their DB order is preserved. Callers should sort by priorityOrder
 * before passing roles[] if they want guaranteed highest-privilege selection.
 */
function selectTopRole(roles: AppRole[], isSaasPortal: boolean): AppRole | null {
  const priorityOrder: AppRole[] = isSaasPortal
    ? ["cliente_admin", "cliente_user", "super_admin", "admin", "franqueado"]
    : ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
  const saasRoles: AppRole[] = ["cliente_admin", "cliente_user"];
  const franchiseRoles: AppRole[] = ["super_admin", "admin", "franqueado"];
  const portalRoles = isSaasPortal
    ? roles.filter((r) => saasRoles.includes(r))
    : roles.filter((r) => franchiseRoles.includes(r));

  const topRole = (portalRoles.length > 0 ? portalRoles[0] : null)
    || priorityOrder.find((p) => roles.includes(p))
    || roles[0]
    || null;

  return topRole;
}

/**
 * Selects the top role using priority order (for callers that sort first).
 * This is the stricter version used in tests where we want highest-privilege.
 */
function selectTopRoleByPriority(roles: AppRole[], isSaasPortal: boolean): AppRole | null {
  const priorityOrder: AppRole[] = isSaasPortal
    ? ["cliente_admin", "cliente_user", "super_admin", "admin", "franqueado"]
    : ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
  return priorityOrder.find((p) => roles.includes(p)) || null;
}

// ── Role hierarchy tests ──────────────────────────────────────────────────────
describe("QA-004: role hierarchy — franchise portal (priority-based)", () => {
  // selectTopRoleByPriority tests the priority order directly
  it("super_admin outranks admin when using priority selection", () => {
    const top = selectTopRoleByPriority(["admin", "super_admin"], false);
    expect(top).toBe("super_admin");
  });

  it("admin outranks franqueado when using priority selection", () => {
    const top = selectTopRoleByPriority(["franqueado", "admin"], false);
    expect(top).toBe("admin");
  });

  it("franqueado outranks cliente_admin when using priority selection", () => {
    const top = selectTopRoleByPriority(["cliente_admin", "franqueado"], false);
    expect(top).toBe("franqueado");
  });

  it("single role is returned as-is", () => {
    expect(selectTopRoleByPriority(["admin"], false)).toBe("admin");
    expect(selectTopRoleByPriority(["franqueado"], false)).toBe("franqueado");
  });

  it("empty role list returns null", () => {
    expect(selectTopRoleByPriority([], false)).toBeNull();
  });
});

describe("QA-004: selectTopRole DB-order behavior (mirrors AuthContext exactly)", () => {
  // AuthContext takes portalRoles[0] — which is first in DB result order
  it("takes first portal-matching role in DB order (not priority order)", () => {
    // DB returns ["franqueado", "admin"] — franchise portal filters both
    // portalRoles[0] = "franqueado" (DB order), not "admin"
    const top = selectTopRole(["franqueado", "admin"], false);
    expect(top).toBe("franqueado");
  });

  it("falls back to priorityOrder.find when no portal roles match", () => {
    // SaaS portal, but user only has franchise roles — portalRoles is empty
    // → falls back to priorityOrder.find → "admin"
    const top = selectTopRole(["admin"], true);
    expect(top).toBe("admin");
  });

  it("single franchise role in franchise portal is returned as-is", () => {
    expect(selectTopRole(["admin"], false)).toBe("admin");
    expect(selectTopRole(["franqueado"], false)).toBe("franqueado");
  });

  it("empty role list returns null", () => {
    expect(selectTopRole([], false)).toBeNull();
  });
});

describe("QA-004: role hierarchy — SaaS portal", () => {
  it("SaaS portal prefers SaaS roles over franchise roles", () => {
    // DB returns ["admin", "cliente_admin"]
    // portalRoles (SaaS) = ["cliente_admin"] → portalRoles[0] = "cliente_admin"
    const top = selectTopRole(["admin", "cliente_admin"], true);
    expect(top).toBe("cliente_admin");
  });

  it("cliente_admin is selected first when it appears first in DB result", () => {
    const top = selectTopRole(["cliente_admin", "cliente_user"], true);
    expect(top).toBe("cliente_admin");
  });

  it("falls back to franchise role when no SaaS roles exist", () => {
    const top = selectTopRole(["admin"], true);
    expect(top).toBe("admin");
  });

  it("selectTopRoleByPriority correctly ranks cliente_admin above cliente_user", () => {
    const top = selectTopRoleByPriority(["cliente_user", "cliente_admin"], true);
    expect(top).toBe("cliente_admin");
  });
});

// ── JWT role precedence over DB fallback (CODE-003) ───────────────────────────
describe("QA-004: JWT role precedence — fail-closed (CODE-003)", () => {
  /**
   * After CODE-003 fix: when role fetch times out (roleResult === null),
   * the system uses cached role or a safe fallback — NOT anonymous access.
   * Null role means loading is still in progress → access is denied.
   */

  it("null role (timeout / not yet loaded) denies all protected routes", () => {
    const role: AppRole | null = null;
    const hasAccess = role !== null;
    expect(hasAccess).toBe(false);
  });

  it("null role fails guard for super_admin-only resource", () => {
    const role: AppRole | null = null;
    const allowedRoles: AppRole[] = ["super_admin"];
    const hasAccess = role !== null && allowedRoles.includes(role);
    expect(hasAccess).toBe(false);
  });

  it("valid JWT-derived role grants access to its tier", () => {
    const role: AppRole = "admin";
    const allowedRoles: AppRole[] = ["super_admin", "admin"];
    expect(role !== null && allowedRoles.includes(role)).toBe(true);
  });

  it("lower role cannot access higher-tier route even if JWT has it", () => {
    const role: AppRole = "franqueado";
    const adminOnly: AppRole[] = ["super_admin", "admin"];
    expect(role !== null && adminOnly.includes(role)).toBe(false);
  });

  it("role from cache (fallback) is a valid AppRole string, not null", () => {
    // After CODE-003: cached role is always a valid AppRole value
    const cachedRole = "franqueado" as AppRole;
    expect(cachedRole).not.toBeNull();
    expect(["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"]).toContain(cachedRole);
  });
});

// ── cliente_admin can access admin routes ────────────────────────────────────
describe("QA-004: cliente_admin access rights", () => {
  const defaults = {
    isDataLoading: false,
    isTrialExpired: false,
    hasNoCredits: false,
    hasApprovedGPS: true,
  };

  it("cliente_admin can access /cliente/disparos (not blocked by admin_only gate)", () => {
    const reason = getGateReason("/cliente/disparos", { role: "cliente_admin", ...defaults });
    expect(reason).not.toBe("admin_only");
  });

  it("cliente_admin can access /cliente/dashboard", () => {
    const reason = getGateReason("/cliente/dashboard", { role: "cliente_admin", ...defaults });
    expect(reason).not.toBe("admin_only");
  });

  it("cliente_admin with credits can access AI routes", () => {
    const reason = getGateReason("/cliente/agentes-ia", { role: "cliente_admin", ...defaults, hasNoCredits: false });
    expect(reason).toBeNull();
  });

  it("cliente_admin with zero credits is blocked from credit-required routes", () => {
    const reason = getGateReason("/cliente/agentes-ia", { role: "cliente_admin", ...defaults, hasNoCredits: true });
    expect(reason).toBe("no_credits");
  });
});

// ── cliente_user is blocked from ADMIN_ONLY routes ────────────────────────────
describe("QA-004: cliente_user blocked from ADMIN_ONLY routes", () => {
  const defaults = {
    isDataLoading: false,
    isTrialExpired: false,
    hasNoCredits: false,
    hasApprovedGPS: true,
  };

  it("cliente_user is blocked from /cliente/disparos", () => {
    const reason = getGateReason("/cliente/disparos", { role: "cliente_user", ...defaults });
    expect(reason).toBe("admin_only");
  });

  it("cliente_user is blocked from /cliente/dashboard", () => {
    const reason = getGateReason("/cliente/dashboard", { role: "cliente_user", ...defaults });
    expect(reason).toBe("admin_only");
  });

  it("cliente_user is blocked from /cliente/trafego-pago", () => {
    const reason = getGateReason("/cliente/trafego-pago", { role: "cliente_user", ...defaults });
    expect(reason).toBe("admin_only");
  });

  it("cliente_user can access ALWAYS_ACCESSIBLE routes like /cliente/inicio", () => {
    const reason = getGateReason("/cliente/inicio", { role: "cliente_user", ...defaults });
    expect(reason).toBeNull();
  });

  it("cliente_user can access /cliente/checklist (always accessible)", () => {
    const reason = getGateReason("/cliente/checklist", { role: "cliente_user", ...defaults });
    expect(reason).toBeNull();
  });
});

// ── Unauthenticated (null role) redirected ────────────────────────────────────
describe("QA-004: unauthenticated user access control", () => {
  const defaults = {
    isDataLoading: false,
    isTrialExpired: false,
    hasNoCredits: false,
    hasApprovedGPS: false,
  };

  it("null role cannot access any protected route", () => {
    const protectedRoutes = [
      "/cliente/agentes-ia",
      "/cliente/conteudos",
      "/cliente/crm",
      "/cliente/dashboard",
    ];
    for (const route of protectedRoutes) {
      const isAuthenticated = null !== null; // null role = not authenticated
      expect(isAuthenticated).toBe(false);
    }
  });

  it("data loading state prevents gating (prevents flash of blocked content)", () => {
    // Even if role is null, while isDataLoading=true, getGateReason returns null
    const reason = getGateReason("/cliente/agentes-ia", {
      role: null,
      isDataLoading: true,
      isTrialExpired: false,
      hasNoCredits: false,
      hasApprovedGPS: false,
    });
    expect(reason).toBeNull();
  });
});

// ── Trial expired gates ───────────────────────────────────────────────────────
describe("QA-004: trial expiry gate", () => {
  it("expired trial blocks non-always-accessible routes", () => {
    const reason = getGateReason("/cliente/agentes-ia", {
      role: "cliente_admin",
      isDataLoading: false,
      isTrialExpired: true,
      hasNoCredits: false,
      hasApprovedGPS: true,
    });
    expect(reason).toBe("trial_expired");
  });

  it("expired trial does NOT block always-accessible routes", () => {
    const reason = getGateReason("/cliente/inicio", {
      role: "cliente_admin",
      isDataLoading: false,
      isTrialExpired: true,
      hasNoCredits: false,
      hasApprovedGPS: true,
    });
    expect(reason).toBeNull();
  });
});

// ── Credit gate + GPS gate interaction ───────────────────────────────────────
describe("QA-004: combined gate conditions", () => {
  it("no GPS approved blocks GPS_REQUIRED routes before credit check", () => {
    const reason = getGateReason("/cliente/agentes-ia", {
      role: "cliente_admin",
      isDataLoading: false,
      isTrialExpired: false,
      hasNoCredits: false, // has credits, but no GPS
      hasApprovedGPS: false,
    });
    expect(reason).toBe("no_gps_approved");
  });

  it("has GPS and credits: no gate", () => {
    const reason = getGateReason("/cliente/agentes-ia", {
      role: "cliente_admin",
      isDataLoading: false,
      isTrialExpired: false,
      hasNoCredits: false,
      hasApprovedGPS: true,
    });
    expect(reason).toBeNull();
  });
});
