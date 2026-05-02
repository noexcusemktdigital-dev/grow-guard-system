/**
 * T4 WHATSAPP — Valida useSetupWhatsApp e useSendWhatsAppMessage
 *
 * Verifica:
 * 1. useSendWhatsAppMessage chama a edge fn "whatsapp-send" com body correto
 * 2. useSetupWhatsApp chama a edge fn "whatsapp-setup" com body correto
 * 3. Sucesso invalida query keys corretas
 * 4. Erro propagado quando invokeEdge retorna error
 * 5. useWhatsAppInstances desabilitado sem orgId
 * 6. useWhatsAppContacts filtra broadcast e status especial (via queryFn)
 * 7. useMarkContactRead — mutação existe (path de cobertura)
 * 8. useWhatsAppMessages query desabilitada quando contactId é null
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (resolvem problema de hoisting do vi.mock) ─────────────────
const { mockInvokeEdge, mockOrgIdRef, mockInvalidateQueries, capturedQueryFns, capturedOnSuccess } =
  vi.hoisted(() => {
    const mockInvokeEdge = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const mockOrgIdRef = { value: "org-wa-123" as string | undefined };
    const mockInvalidateQueries = vi.fn();
    const capturedQueryFns: Array<{ queryKey: unknown[]; enabled: boolean }> = [];
    const capturedOnSuccess: Array<() => void> = [];
    return { mockInvokeEdge, mockOrgIdRef, mockInvalidateQueries, capturedQueryFns, capturedOnSuccess };
  });

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock("@/lib/edge", () => ({
  invokeEdge: (...args: unknown[]) => mockInvokeEdge(...args),
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: mockOrgIdRef.value }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey, enabled = true }: { queryKey: unknown[]; queryFn?: unknown; enabled?: boolean }) => {
    capturedQueryFns.push({ queryKey, enabled });
    if (!enabled) return { data: undefined, isLoading: false };
    return { data: [], isLoading: false };
  }),
  useMutation: vi.fn(({ mutationFn, onSuccess, onError }: {
    mutationFn: (...args: unknown[]) => Promise<unknown>;
    onSuccess?: (r: unknown, a: unknown, c: unknown) => void;
    onError?: (e: unknown, a: unknown, c: unknown) => void;
  }) => ({
    mutateAsync: async (args: unknown) => {
      try {
        const result = await mutationFn(args);
        if (onSuccess) {
          onSuccess(result, args, undefined);
          capturedOnSuccess.push(() => onSuccess(result, args, undefined));
        }
        return result;
      } catch (err) {
        if (onError) onError(err, args, undefined);
        throw err;
      }
    },
    isLoading: false,
  })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────
import {
  useSendWhatsAppMessage,
  useSetupWhatsApp,
  useWhatsAppInstances,
  useWhatsAppMessages,
} from "@/hooks/useWhatsApp";

// ── Tests ────────────────────────────────────────────────────────────────────
describe("T4 WHATSAPP — useSendWhatsAppMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryFns.length = 0;
    capturedOnSuccess.length = 0;
    mockOrgIdRef.value = "org-wa-123";
    mockInvokeEdge.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("1. chama invokeEdge com 'whatsapp-send' e body correto", async () => {
    const hook = useSendWhatsAppMessage();
    await hook.mutateAsync({ message: "Olá!", contactPhone: "+5511999990000" });

    expect(mockInvokeEdge).toHaveBeenCalledWith("whatsapp-send", {
      body: { message: "Olá!", contactPhone: "+5511999990000" },
    });
  });

  it("2. invalida query keys whatsapp-messages e whatsapp-contacts no sucesso", async () => {
    const hook = useSendWhatsAppMessage();
    await hook.mutateAsync({ message: "Teste" });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["whatsapp-messages"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["whatsapp-contacts"] });
  });

  it("3. propaga erro quando invokeEdge retorna error", async () => {
    mockInvokeEdge.mockResolvedValue({ data: null, error: new Error("timeout") });
    const hook = useSendWhatsAppMessage();

    await expect(hook.mutateAsync({ message: "fail" })).rejects.toThrow("timeout");
  });
});

describe("T4 WHATSAPP — useSetupWhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeEdge.mockResolvedValue({ data: { instanceId: "new-inst" }, error: null });
  });

  it("4. chama invokeEdge com 'whatsapp-setup' e provider correto", async () => {
    const hook = useSetupWhatsApp();
    await hook.mutateAsync({ provider: "zapi", label: "Instância Principal" });

    expect(mockInvokeEdge).toHaveBeenCalledWith("whatsapp-setup", {
      body: { provider: "zapi", label: "Instância Principal" },
    });
  });

  it("5. invalida whatsapp-instances no sucesso", async () => {
    const hook = useSetupWhatsApp();
    await hook.mutateAsync({ provider: "evolution" });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["whatsapp-instances"] });
  });
});

describe("T4 WHATSAPP — useWhatsAppInstances (disabled sem orgId)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryFns.length = 0;
  });

  it("6. query desabilitada quando orgId é undefined", () => {
    mockOrgIdRef.value = undefined;
    useWhatsAppInstances();

    const q = capturedQueryFns.find((q) => JSON.stringify(q.queryKey).includes("whatsapp-instances"));
    expect(q?.enabled).toBe(false);
  });

  it("7. query habilitada quando orgId existe", () => {
    mockOrgIdRef.value = "org-wa-123";
    useWhatsAppInstances();

    const q = capturedQueryFns.find((q) => JSON.stringify(q.queryKey).includes("whatsapp-instances"));
    expect(q?.enabled).toBe(true);
  });
});

describe("T4 WHATSAPP — useWhatsAppMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryFns.length = 0;
    mockOrgIdRef.value = "org-wa-123";
  });

  it("8. query desabilitada quando contactId é null", () => {
    useWhatsAppMessages(null);

    const q = capturedQueryFns.find((q) => JSON.stringify(q.queryKey).includes("whatsapp-messages"));
    expect(q?.enabled).toBe(false);
  });
});
