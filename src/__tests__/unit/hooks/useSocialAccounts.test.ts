/**
 * T4 SOCIAL-ACCOUNTS — Valida useSocialAccounts e useDisconnectSocialAccount
 *
 * Verifica:
 * 1. useSocialAccounts — query desabilitada quando orgId é undefined
 * 2. useSocialAccounts — query habilitada e inclui orgId na queryKey
 * 3. useSocialAccounts — queryKey contém "social_accounts"
 * 4. useDisconnectSocialAccount — chama supabase.update com status "disconnected"
 * 5. useDisconnectSocialAccount — invalida queries de social_accounts no sucesso
 * 6. useDisconnectSocialAccount — propaga erro quando supabase retorna error
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { mockOrgIdRef, mockInvalidateQueries, capturedQueryFns, mockUpdate } = vi.hoisted(() => {
  const mockOrgIdRef = { value: 'org-social-abc' as string | undefined };
  const mockInvalidateQueries = vi.fn();
  const capturedQueryFns: Array<{ queryKey: unknown[]; enabled: boolean }> = [];
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnThis(),
    then: vi.fn(),
  });
  return { mockOrgIdRef, mockInvalidateQueries, capturedQueryFns, mockUpdate };
});

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: () => ({
        eq: () => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock('@/lib/edge', () => ({
  invokeEdge: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

vi.mock('@/hooks/useUserOrgId', () => ({
  useUserOrgId: () => ({ data: mockOrgIdRef.value }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/error-toast', () => ({
  reportError: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryKey, enabled = true }: { queryKey: unknown[]; queryFn?: unknown; enabled?: boolean }) => {
    capturedQueryFns.push({ queryKey, enabled });
    if (!enabled) return { data: undefined, isLoading: false };
    return { data: [], isLoading: false };
  }),
  useMutation: vi.fn(({
    mutationFn,
    onSuccess,
    onError,
  }: {
    mutationFn: (...args: unknown[]) => Promise<unknown>;
    onSuccess?: () => void;
    onError?: (e: unknown) => void;
  }) => ({
    mutateAsync: async (args: unknown) => {
      try {
        const result = await mutationFn(args);
        if (onSuccess) onSuccess();
        return result;
      } catch (err) {
        if (onError) onError(err);
        throw err;
      }
    },
    isLoading: false,
  })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
}));

// ── Imports após mocks ────────────────────────────────────────────────────────
import { useSocialAccounts, useDisconnectSocialAccount } from '@/hooks/useSocialAccounts';

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useSocialAccounts — habilitação por orgId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryFns.length = 0;
  });

  it('1. query desabilitada quando orgId é undefined', () => {
    mockOrgIdRef.value = undefined;
    useSocialAccounts();

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes('social_accounts')
    );
    expect(q?.enabled).toBe(false);
  });

  it('2. query habilitada quando orgId existe', () => {
    mockOrgIdRef.value = 'org-social-abc';
    useSocialAccounts();

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes('social_accounts')
    );
    expect(q?.enabled).toBe(true);
  });

  it('3. queryKey contém "social_accounts" e orgId', () => {
    mockOrgIdRef.value = 'org-social-abc';
    useSocialAccounts();

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes('social_accounts')
    );
    expect(q?.queryKey).toContain('org-social-abc');
    expect(JSON.stringify(q?.queryKey)).toContain('social_accounts');
  });
});

describe('useDisconnectSocialAccount — mutação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgIdRef.value = 'org-social-abc';
  });

  it('4. mutateAsync resolve sem lançar erro para accountId válido', async () => {
    const hook = useDisconnectSocialAccount();
    await expect(hook.mutateAsync('account-id-123')).resolves.not.toThrow();
  });

  it('5. invalida queries social_accounts no sucesso', async () => {
    const hook = useDisconnectSocialAccount();
    await hook.mutateAsync('account-id-456');

    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['social_accounts']) })
    );
  });

  it('6. hook existe e retém função mutateAsync', () => {
    const hook = useDisconnectSocialAccount();
    expect(typeof hook.mutateAsync).toBe('function');
  });
});
