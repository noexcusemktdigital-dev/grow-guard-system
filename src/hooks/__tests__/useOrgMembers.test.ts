import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock useUserOrgId
const mockOrgId = { data: null as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// Supabase mock with RPC
const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { useOrgMembers } from "../useOrgMembers";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useOrgMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useOrgMembers(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("fetches members via RPC when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const rawMembers = [
      {
        user_id: "u1",
        role: "admin",
        full_name: "Alice",
        email: "alice@example.com",
        avatar_url: null,
        job_title: "Manager",
        created_at: "2026-01-01",
      },
      {
        user_id: "u2",
        role: "franqueado",
        full_name: "Bob",
        email: "bob@example.com",
        avatar_url: "https://example.com/bob.jpg",
        job_title: null,
        created_at: "2026-01-02",
      },
    ];
    mockRpc.mockResolvedValue({ data: rawMembers, error: null });

    const { result } = renderHook(() => useOrgMembers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_org_members_with_email", { _org_id: "org-1" });
    expect(result.current.data).toHaveLength(2);
  });

  it("maps raw data to OrgMember shape correctly", async () => {
    mockOrgId.data = "org-1";
    const rawMembers = [
      {
        user_id: "u1",
        role: "admin",
        full_name: "Alice",
        email: "alice@example.com",
        avatar_url: null,
        job_title: "CTO",
        created_at: "2026-01-01",
      },
    ];
    mockRpc.mockResolvedValue({ data: rawMembers, error: null });

    const { result } = renderHook(() => useOrgMembers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const member = result.current.data![0];
    expect(member.user_id).toBe("u1");
    expect(member.role).toBe("admin");
    expect(member.full_name).toBe("Alice");
    expect(member.email).toBe("alice@example.com");
    expect(member.avatar_url).toBeNull();
    expect(member.job_title).toBe("CTO");
    expect(member.created_at).toBe("2026-01-01");
  });

  it("uses default role when role is missing", async () => {
    mockOrgId.data = "org-1";
    const rawMembers = [
      {
        user_id: "u1",
        role: undefined,
        full_name: null,
        email: "noname@example.com",
        avatar_url: null,
        job_title: null,
        created_at: "2026-01-01",
      },
    ];
    mockRpc.mockResolvedValue({ data: rawMembers, error: null });

    const { result } = renderHook(() => useOrgMembers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].role).toBe("cliente_user");
    expect(result.current.data![0].full_name).toBeNull();
    expect(result.current.data![0].email).toBe("noname@example.com");
  });

  it("returns empty array when no members exist", async () => {
    mockOrgId.data = "org-1";
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useOrgMembers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles RPC error", async () => {
    mockOrgId.data = "org-1";
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    const { result } = renderHook(() => useOrgMembers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
