// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock supabase
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: (...args: any[]) => {
        mockSelect(table, ...args);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return {
              single: () => mockSingle(),
            };
          },
        };
      },
      update: (updates: any) => {
        mockUpdate(table, updates);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  },
}));

// Mock AuthContext
const mockRefreshProfile = vi.fn();
const mockAuthValue = {
  user: null as any,
  session: null,
  profile: null,
  role: null,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: mockRefreshProfile,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

// Mock sonner
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

import { useUserProfile } from "../useUserProfile";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValue.user = null;
  });

  it("does not fetch when user is null", () => {
    mockAuthValue.user = null;
    const { result } = renderHook(() => useUserProfile(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("fetches profile when user is present", async () => {
    mockAuthValue.user = { id: "u1" };
    const profileData = { id: "u1", full_name: "Test User", phone: "123" };
    mockSingle.mockResolvedValue({ data: profileData, error: null });

    const { result } = renderHook(() => useUserProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profileData);
    expect(mockSelect).toHaveBeenCalledWith("profiles", "*");
  });

  it("handles fetch error", async () => {
    mockAuthValue.user = { id: "u1" };
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const { result } = renderHook(() => useUserProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: "Not found" });
  });

  it("update mutation calls supabase and shows toast on success", async () => {
    mockAuthValue.user = { id: "u1" };
    const profileData = { id: "u1", full_name: "Test User" };
    mockSingle.mockResolvedValue({ data: profileData, error: null });

    const { result } = renderHook(() => useUserProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.update.mutate({ full_name: "Updated Name" });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith("profiles", { full_name: "Updated Name" });
    expect(mockToastSuccess).toHaveBeenCalledWith("Perfil salvo com sucesso!");
    expect(mockRefreshProfile).toHaveBeenCalled();
  });

  it("update mutation shows error toast on failure", async () => {
    mockAuthValue.user = { id: "u1" };
    const profileData = { id: "u1", full_name: "Test User" };
    mockSingle.mockResolvedValue({ data: profileData, error: null });

    // Make update return an error
    mockUpdate.mockImplementationOnce(() => {
      // Override the default: make .eq() reject
    });

    const { result } = renderHook(() => useUserProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Override the from().update().eq() chain to throw
    const { supabase } = await import("@/lib/supabase");
    const originalFrom = supabase.from;
    vi.mocked(supabase as any).from = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: (...args: any[]) => ({
            eq: () => ({ single: () => Promise.resolve({ data: profileData, error: null }) }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: { message: "Update failed" } }),
          }),
        };
      }
      return (originalFrom as any)(table);
    });

    result.current.update.mutate({ full_name: "Bad" });

    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(mockToastError).toHaveBeenCalledWith("Update failed");
  });
});
