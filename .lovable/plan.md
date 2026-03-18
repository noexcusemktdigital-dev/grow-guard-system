

# Fix: Scripts page flickering

## Root cause

The page flickers because of a **query dependency chain** causing multiple re-render cycles:

1. `useUserOrgId()` fetches orgId (async RPC call)
2. While orgId is `undefined`, `useClienteScripts()` has `enabled: false` → `isLoading: true` → **skeleton shows**
3. orgId resolves → scripts query starts → still loading → skeleton continues
4. Scripts arrive → page renders
5. Meanwhile `useStrategyData()` is called **twice** (once in `ClienteScripts`, once inside `StrategyBanner`), each triggering `useActiveStrategy()` + `useSalesPlan()` → additional re-renders cascade

The skeleton flash happens every time the component mounts because there's no `staleTime` on the scripts query and `isLoading` is true while the orgId query resolves.

## Fix

1. **`useClienteScripts.ts`**: Add `staleTime` to prevent unnecessary refetches and use `placeholderData: keepPreviousData` to keep previous data visible during refetches
2. **`ClienteScripts.tsx`**: Change the loading guard to only show skeleton when there's truly no data yet (not during background refetches). Use `isPending && !data` pattern instead of bare `isLoading`
3. **Remove duplicate `useStrategyData` call** — `ClienteScripts` calls it for `dores, objecoes, gatilhosCompra, propostaValor` but these are only used in `handleImproveWithAI` (which doesn't actually use them — the edge function receives them via `briefing`). Remove the unused destructured values to eliminate an extra render source

## Files to change

- `src/hooks/useClienteScripts.ts` — add `staleTime: 1000 * 60 * 2` 
- `src/pages/cliente/ClienteScripts.tsx` — change loading condition to `isLoading && !scripts`, remove unused `useStrategyData` destructuring (keep only what's needed by StrategyBanner, which handles its own hook)

