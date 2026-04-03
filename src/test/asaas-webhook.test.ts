/**
 * QA-003: Asaas webhook business logic tests
 * Covers: token validation (SEC-NOE-004), credit pack mapping, externalReference routing,
 *         valueToCreditAmount, chargeback credit reversal, balance floor at zero
 *
 * Edge functions run in Deno; these tests verify the pure business logic
 * extracted inline — same rules, no Deno imports.
 */
import { describe, it, expect } from "vitest";

// ── Pure functions mirrored from asaas-webhook/index.ts ──────────────────────
// Keep in sync with supabase/functions/asaas-webhook/index.ts

function valueToCreditAmount(value: number): number {
  if (value >= 997) return 50000;
  if (value >= 497) return 20000;
  if (value >= 197) return 5000;
  if (value >= 299) return 50000;
  if (value >= 149) return 20000;
  if (value >= 49) return 5000;
  return Math.round(value * 100);
}

const PACK_CREDITS_MAP: Record<string, number> = {
  "pack-200": 200,
  "pack-500": 500,
  "pack-1000": 1000,
  "pack-5000": 5000,
  "pack-20000": 20000,
  "pack-50000": 50000,
};

const PLAN_CREDITS: Record<string, number> = {
  starter: 500,
  pro: 1000,
  enterprise: 1500,
};

const STATUS_MAP: Record<string, string> = {
  PENDING: "pending",
  RECEIVED: "paid",
  CONFIRMED: "paid",
  OVERDUE: "overdue",
  REFUNDED: "refunded",
  RECEIVED_IN_CASH: "paid",
  REFUND_REQUESTED: "refund_requested",
  REFUND_IN_PROGRESS: "refund_in_progress",
  CHARGEBACK_REQUESTED: "chargeback",
  CHARGEBACK_DISPUTE: "chargeback",
  AWAITING_CHARGEBACK_REVERSAL: "chargeback",
  DUNNING_REQUESTED: "overdue",
  DUNNING_RECEIVED: "paid",
  AWAITING_RISK_ANALYSIS: "pending",
};

// ── Token validation (SEC-NOE-004) ────────────────────────────────────────────
describe("SEC-NOE-004: token validation — fail-closed", () => {
  function validateToken(headerToken: string | null, configuredToken: string | undefined): boolean {
    if (!configuredToken) return false; // no token configured → reject all
    return headerToken === configuredToken;
  }

  it("rejects when ASAAS_WEBHOOK_TOKEN is not configured", () => {
    expect(validateToken("any-token", undefined)).toBe(false);
  });

  it("rejects when header token does not match", () => {
    expect(validateToken("wrong-token", "correct-secret")).toBe(false);
  });

  it("rejects when header token is null (missing header)", () => {
    expect(validateToken(null, "correct-secret")).toBe(false);
  });

  it("accepts when header token matches configured token", () => {
    expect(validateToken("correct-secret", "correct-secret")).toBe(true);
  });
});

// ── valueToCreditAmount (legacy fallback) ─────────────────────────────────────
describe("valueToCreditAmount: legacy value→credits mapping", () => {
  it("maps R$997+ to 50000 credits", () => {
    expect(valueToCreditAmount(997)).toBe(50000);
    expect(valueToCreditAmount(1500)).toBe(50000);
  });

  it("maps R$497–996 to 20000 credits", () => {
    expect(valueToCreditAmount(497)).toBe(20000);
    expect(valueToCreditAmount(600)).toBe(20000);
  });

  it("maps R$197–496 to 5000 credits", () => {
    expect(valueToCreditAmount(197)).toBe(5000);
    expect(valueToCreditAmount(296)).toBe(5000);
  });

  it("maps small values via R$*100 formula", () => {
    expect(valueToCreditAmount(10)).toBe(1000);
    expect(valueToCreditAmount(5)).toBe(500);
  });
});

// ── Credit pack mapping ───────────────────────────────────────────────────────
describe("credit pack id → credit amount", () => {
  it("maps all unified packs correctly", () => {
    expect(PACK_CREDITS_MAP["pack-200"]).toBe(200);
    expect(PACK_CREDITS_MAP["pack-500"]).toBe(500);
    expect(PACK_CREDITS_MAP["pack-1000"]).toBe(1000);
  });

  it("maps legacy packs correctly", () => {
    expect(PACK_CREDITS_MAP["pack-5000"]).toBe(5000);
    expect(PACK_CREDITS_MAP["pack-20000"]).toBe(20000);
    expect(PACK_CREDITS_MAP["pack-50000"]).toBe(50000);
  });

  it("returns undefined for unknown pack id (caller should handle)", () => {
    expect(PACK_CREDITS_MAP["pack-unknown"]).toBeUndefined();
  });
});

// ── Plan credits (unified subscription) ──────────────────────────────────────
describe("subscription plan → credit amount", () => {
  it("starter plan grants 500 credits", () => {
    expect(PLAN_CREDITS["starter"]).toBe(500);
  });

  it("pro plan grants 1000 credits", () => {
    expect(PLAN_CREDITS["pro"]).toBe(1000);
  });

  it("enterprise plan grants 1500 credits", () => {
    expect(PLAN_CREDITS["enterprise"]).toBe(1500);
  });

  it("unknown plan falls back to 500 (caller: PLAN_CREDITS[slug] || 500)", () => {
    const credits = PLAN_CREDITS["mystery"] || 500;
    expect(credits).toBe(500);
  });
});

// ── externalReference routing ────────────────────────────────────────────────
describe("externalReference prefix routing", () => {
  function routeByRef(ref: string): string {
    if (ref.startsWith("system_fee|")) return "system_fee";
    if (ref.startsWith("client_payment|")) return "client_payment";
    if (ref.startsWith("franchisee_charge|")) return "franchisee_charge";
    const parts = ref.split("|");
    if (parts.length >= 3 && parts[1] === "sub") return "subscription";
    if (parts.length >= 3 && parts[1] === "credits") return "credit_pack";
    if (parts.length >= 2 && parts[1] === "extra_user") return "extra_user";
    return "legacy";
  }

  it("routes system_fee payments", () => {
    expect(routeByRef("system_fee|org-1|2026-04")).toBe("system_fee");
  });

  it("routes client_payment payments", () => {
    expect(routeByRef("client_payment|org-1|contract-1|2026-04")).toBe("client_payment");
  });

  it("routes franchisee_charge payments", () => {
    expect(routeByRef("franchisee_charge|franchisor|franchisee|2026-04")).toBe("franchisee_charge");
  });

  it("routes unified subscription renewal", () => {
    expect(routeByRef("org-1|sub|starter")).toBe("subscription");
  });

  it("routes credit pack purchase", () => {
    expect(routeByRef("org-1|credits|pack-1000")).toBe("credit_pack");
  });

  it("routes extra user charge", () => {
    expect(routeByRef("org-1|extra_user|")).toBe("extra_user");
  });

  it("falls back to legacy for unstructured ref", () => {
    expect(routeByRef("randomoldref")).toBe("legacy");
  });
});

// ── Balance floor (chargeback / refund) ──────────────────────────────────────
describe("balance floor: never goes below zero on reversal", () => {
  function applyReversal(currentBalance: number, creditsToRemove: number): number {
    return Math.max(0, currentBalance - creditsToRemove);
  }

  it("reversal does not go below zero when removal > balance", () => {
    expect(applyReversal(100, 500)).toBe(0);
  });

  it("reversal correctly reduces balance when enough credits exist", () => {
    expect(applyReversal(1000, 200)).toBe(800);
  });

  it("reversal on exactly-zero balance stays at zero", () => {
    expect(applyReversal(0, 100)).toBe(0);
  });
});

// ── Payment status mapping (PAYMENT_UPDATED) ──────────────────────────────────
describe("Asaas status → internal status mapping", () => {
  it("maps RECEIVED and CONFIRMED to paid", () => {
    expect(STATUS_MAP["RECEIVED"]).toBe("paid");
    expect(STATUS_MAP["CONFIRMED"]).toBe("paid");
  });

  it("maps OVERDUE correctly", () => {
    expect(STATUS_MAP["OVERDUE"]).toBe("overdue");
    expect(STATUS_MAP["DUNNING_REQUESTED"]).toBe("overdue");
  });

  it("maps all chargeback states to chargeback", () => {
    expect(STATUS_MAP["CHARGEBACK_REQUESTED"]).toBe("chargeback");
    expect(STATUS_MAP["CHARGEBACK_DISPUTE"]).toBe("chargeback");
    expect(STATUS_MAP["AWAITING_CHARGEBACK_REVERSAL"]).toBe("chargeback");
  });

  it("returns undefined for unknown statuses (caller: no-op)", () => {
    expect(STATUS_MAP["COMPLETELY_UNKNOWN"]).toBeUndefined();
  });
});
