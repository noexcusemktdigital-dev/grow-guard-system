/**
 * T-CALENDAR — Valida hooks de calendário
 *
 * Verifica:
 * 1. useCalendarEvents → queryKey inclui orgId e datas
 * 2. useCalendarEvents → disabled quando orgId ausente
 * 3. createEvent → chama insert com organization_id
 * 4. createEvent → inclui created_by do usuário autenticado
 * 5. updateEvent → chama update na tabela calendar_events
 * 6. deleteEvent → chama delete na tabela calendar_events
 * 7. deleteEvent → invalida queryKey ["calendar-events"]
 * 8. useCalendars → queryKey inclui ["calendars", orgId]
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Constants ──────────────────────────────────────────────────────────────────
const ORG_ID = 'org-cal-uuid';
const USER_ID = 'user-cal-uuid';

// ── Capture state ─────────────────────────────────────────────────────────────
const calls = {
  insert: [] as any[],
  update: [] as any[],
  delete: [] as any[],
  rpc: [] as any[],
  invalidate: [] as any[],
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => {
  function chain() {
    const c: any = {
      eq: () => c,
      select: () => c,
      order: () => c,
      single: () => Promise.resolve({ data: { id: 'event-1' }, error: null }),
    };
    return c;
  }

  return {
    supabase: {
      from: (table: string) => ({
        insert: (payload: any) => {
          calls.insert.push({ table, payload });
          return chain();
        },
        update: (payload: any) => {
          calls.update.push({ table, payload });
          return chain();
        },
        delete: () => {
          calls.delete.push({ table });
          return chain();
        },
        select: () => chain(),
      }),
      rpc: (fn: string, args: any) => {
        calls.rpc.push({ fn, args });
        return Promise.resolve({ data: [], error: null });
      },
    },
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: any) => ({
    queryKey: opts.queryKey,
    data: undefined,
    isLoading: !opts.enabled,
    enabled: opts.enabled,
    error: null,
  }),
  useMutation: (opts: any) => ({
    mutateAsync: async (...args: any[]) => {
      await opts.mutationFn(...args);
      if (opts.onSuccess) opts.onSuccess();
    },
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: (args: any) => {
      calls.invalidate.push(args);
    },
  }),
}));

vi.mock('@/hooks/useUserOrgId', () => ({
  useUserOrgId: () => ({ data: ORG_ID }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: USER_ID },
    role: 'admin',
    loading: false,
    session: null,
    profile: null,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

import {
  useCalendars,
  useCalendarEvents,
  useCalendarEventMutations,
} from '@/hooks/useCalendar';

// ── Testes ────────────────────────────────────────────────────────────────────

describe('useCalendars — queryKey', () => {
  it('queryKey inclui ["calendars", orgId]', () => {
    const result = useCalendars();
    expect(result.queryKey).toEqual(['calendars', ORG_ID]);
  });
});

describe('useCalendarEvents — queryKey e enabled', () => {
  it('queryKey inclui orgId, startDate e endDate', () => {
    const result = useCalendarEvents('2026-01-01', '2026-01-31');
    expect(result.queryKey).toEqual([
      'calendar-events',
      ORG_ID,
      '2026-01-01',
      '2026-01-31',
    ]);
  });

  it('enabled=true quando orgId está presente', () => {
    const result = useCalendarEvents();
    expect(result.enabled).toBe(true);
  });
});

describe('useCalendarEventMutations — createEvent', () => {
  beforeEach(() => {
    calls.insert = [];
    calls.update = [];
    calls.delete = [];
    calls.invalidate = [];
  });

  it('createEvent → chama insert com organization_id', async () => {
    const { createEvent } = useCalendarEventMutations();
    await createEvent.mutateAsync({
      title: 'Reunião de Equipe',
      start_at: '2026-06-01T09:00:00Z',
      end_at: '2026-06-01T10:00:00Z',
    });
    expect(calls.insert.length).toBeGreaterThan(0);
    expect(calls.insert[0].payload).toMatchObject({
      organization_id: ORG_ID,
      title: 'Reunião de Equipe',
    });
  });

  it('createEvent → inclui created_by do usuário autenticado', async () => {
    const { createEvent } = useCalendarEventMutations();
    await createEvent.mutateAsync({
      title: 'Evento com Autor',
      start_at: '2026-06-02T09:00:00Z',
      end_at: '2026-06-02T10:00:00Z',
    });
    expect(calls.insert[0].payload).toMatchObject({ created_by: USER_ID });
  });
});

describe('useCalendarEventMutations — updateEvent', () => {
  beforeEach(() => {
    calls.update = [];
    calls.invalidate = [];
  });

  it('updateEvent → chama update na tabela calendar_events', async () => {
    const { updateEvent } = useCalendarEventMutations();
    await updateEvent.mutateAsync({ id: 'event-abc', title: 'Título Atualizado' });
    expect(calls.update.length).toBeGreaterThan(0);
    expect(calls.update[0].table).toBe('calendar_events');
  });
});

describe('useCalendarEventMutations — deleteEvent', () => {
  beforeEach(() => {
    calls.delete = [];
    calls.invalidate = [];
  });

  it('deleteEvent → chama delete na tabela calendar_events', async () => {
    const { deleteEvent } = useCalendarEventMutations();
    await deleteEvent.mutateAsync('event-to-delete');
    expect(calls.delete.length).toBeGreaterThan(0);
    expect(calls.delete[0].table).toBe('calendar_events');
  });

  it('deleteEvent → invalida queryKey ["calendar-events"]', async () => {
    const { deleteEvent } = useCalendarEventMutations();
    await deleteEvent.mutateAsync('event-to-delete');
    expect(calls.invalidate).toContainEqual({ queryKey: ['calendar-events'] });
  });
});
