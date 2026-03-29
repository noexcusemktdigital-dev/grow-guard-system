// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock AuthContext
const mockAuthValue = {
  user: null as any,
  session: null,
  profile: null,
  role: null as string | null,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

import { useRoleAccess } from "../useRoleAccess";

describe("useRoleAccess", () => {
  beforeEach(() => {
    mockAuthValue.role = null;
  });

  describe("isAdmin", () => {
    it("returns true for super_admin", () => {
      mockAuthValue.role = "super_admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin).toBe(true);
    });

    it("returns true for admin", () => {
      mockAuthValue.role = "admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin).toBe(true);
    });

    it("returns true for cliente_admin", () => {
      mockAuthValue.role = "cliente_admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin).toBe(true);
    });

    it("returns false for cliente_user", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin).toBe(false);
    });

    it("returns false for franqueado", () => {
      mockAuthValue.role = "franqueado";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin).toBe(false);
    });

    it("returns false for null role", () => {
      mockAuthValue.role = null;
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe("getRouteAccess", () => {
    it("returns full for admin on any route", () => {
      mockAuthValue.role = "admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.getRouteAccess("/cliente/disparos")).toBe("full");
      expect(result.current.getRouteAccess("/cliente/dashboard")).toBe("full");
    });

    it("returns blocked for non-admin on admin-only routes", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.getRouteAccess("/cliente/disparos")).toBe("blocked");
      expect(result.current.getRouteAccess("/cliente/dashboard")).toBe("blocked");
      expect(result.current.getRouteAccess("/cliente/trafego-pago")).toBe("blocked");
      expect(result.current.getRouteAccess("/cliente/integracoes")).toBe("blocked");
      expect(result.current.getRouteAccess("/cliente/plano-creditos")).toBe("blocked");
    });

    it("returns read_only for non-admin on read-only routes", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.getRouteAccess("/cliente/plano-vendas")).toBe("read_only");
      expect(result.current.getRouteAccess("/cliente/plano-marketing")).toBe("read_only");
    });

    it("returns full for non-admin on unrestricted routes", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.getRouteAccess("/cliente/leads")).toBe("full");
    });
  });

  describe("canAccessRoute", () => {
    it("returns true for admin on blocked routes", () => {
      mockAuthValue.role = "admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canAccessRoute("/cliente/disparos")).toBe(true);
    });

    it("returns false for non-admin on blocked routes", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canAccessRoute("/cliente/disparos")).toBe(false);
    });

    it("returns true for non-admin on read-only routes (accessible but read only)", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canAccessRoute("/cliente/plano-vendas")).toBe(true);
    });
  });

  describe("canCreate", () => {
    it("admin can create any module", () => {
      mockAuthValue.role = "admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canCreate("agents")).toBe(true);
      expect(result.current.canCreate("scripts")).toBe(true);
      expect(result.current.canCreate("dispatches")).toBe(true);
      expect(result.current.canCreate("crm-config")).toBe(true);
      expect(result.current.canCreate("leads")).toBe(true);
    });

    it("non-admin cannot create restricted modules", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canCreate("agents")).toBe(false);
      expect(result.current.canCreate("scripts")).toBe(false);
      expect(result.current.canCreate("dispatches")).toBe(false);
      expect(result.current.canCreate("crm-config")).toBe(false);
    });

    it("non-admin can create unrestricted modules", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canCreate("leads")).toBe(true);
      expect(result.current.canCreate("contacts")).toBe(true);
    });
  });

  describe("convenience booleans", () => {
    it("admin has all permissions", () => {
      mockAuthValue.role = "admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canManageSettings).toBe(true);
      expect(result.current.canManageUsers).toBe(true);
      expect(result.current.canViewFinancials).toBe(true);
    });

    it("non-admin lacks management permissions", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.canManageSettings).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
      expect(result.current.canViewFinancials).toBe(false);
    });
  });

  describe("isReadOnly", () => {
    it("returns true for non-admin on read-only routes", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isReadOnly("/cliente/plano-vendas")).toBe(true);
    });

    it("returns false for admin on read-only routes", () => {
      mockAuthValue.role = "admin";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isReadOnly("/cliente/plano-vendas")).toBe(false);
    });

    it("returns false for non-admin on non-read-only routes", () => {
      mockAuthValue.role = "cliente_user";
      const { result } = renderHook(() => useRoleAccess());
      expect(result.current.isReadOnly("/cliente/leads")).toBe(false);
    });
  });
});
