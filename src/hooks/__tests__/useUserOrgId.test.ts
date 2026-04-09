// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock supabase
const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  PORTAL_STORAGE_KEY: "noe-saas-auth",
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

// Mock AuthContext
const mockAuthValue = {
  user: null as any,
  session: null,
  profile: null,
  role: null,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

import { useUserOrgId } from "../useUserOrgId";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUserOrgId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValue.user = null;
    // Default path for tests that don't set it explicitly
    Object.defineProperty(window, "location", {
      value: { pathname: "/franqueadora/inicio" },
      writable: true,
    });
  });

  it("does not fetch when user is null", () => {
    const { result } = renderHook(() => useUserOrgId(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("fetches org id with franchise portal context", async () => {
    // /franqueadora paths are franchise portal (not saas)
    Object.defineProperty(window, "location", {
      value: { pathname: "/franqueadora/inicio" },
      writable: true,
    });
    mockAuthValue.user = { id: "u1" };
    mockRpc.mockResolvedValue({ data: "org-123", error: null });

    const { result } = renderHook(() => useUserOrgId(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe("org-123");
    expect(mockRpc).toHaveBeenCalledWith("get_user_org_id", {
      _user_id: "u1",
      _portal: "franchise",
    });
  });

  it("uses saas portal context for /cliente paths", async () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/cliente/dashboard" },
      writable: true,
    });
    mockAuthValue.user = { id: "u2" };
    mockRpc.mockResolvedValue({ data: "saas-org-1", error: null });

    const { result } = renderHook(() => useUserOrgId(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_user_org_id", {
      _user_id: "u2",
      _portal: "saas",
    });
  });

  it("uses saas portal context for /app paths", async () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/app/settings" },
      writable: true,
    });
    mockAuthValue.user = { id: "u3" };
    mockRpc.mockResolvedValue({ data: "saas-org-2", error: null });

    const { result } = renderHook(() => useUserOrgId(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_user_org_id", {
      _user_id: "u3",
      _portal: "saas",
    });
  });

  it("handles RPC error", async () => {
    mockAuthValue.user = { id: "u1" };
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    const { result } = renderHook(() => useUserOrgId(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "RPC failed" });
  });

  it("returns null when RPC returns null org id", async () => {
    mockAuthValue.user = { id: "u1" };
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useUserOrgId(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
