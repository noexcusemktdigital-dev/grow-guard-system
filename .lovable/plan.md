

## Plano — 2 Frentes: Limites de Funis + Arquitetura Multi-Workspace

---

### Frente 1: Corrigir limites de funis por plano

**Problema:** O `CrmFunnelManager` usa lógica hardcoded `plan === "basic" ? 2 : 999` que não reflete os limites corretos. O campo `maxPipelines` no `plans.ts` também está errado.

**Limites corretos:**
| Plano | Funis |
|-------|-------|
| Trial | 3 |
| Starter | 10 |
| Pro | 20 |
| Enterprise | 50 |

**Mudanças:**

1. **`src/constants/plans.ts`** — Atualizar `maxPipelines` em cada plano:
   - Starter: `maxPipelines: 10`
   - Pro: `maxPipelines: 20`
   - Enterprise: `maxPipelines: 50`
   - `TRIAL_PLAN.maxPipelines: 3`

2. **`src/components/crm/CrmFunnelManager.tsx`** — Substituir a lógica hardcoded (linha 37) por:
   - Importar `getEffectiveLimits` de `plans.ts`
   - Usar `subscription?.plan` e `subscription?.status === 'trial'` para calcular `maxFunnels` via `getEffectiveLimits(plan, isTrial).maxPipelines`
   - Atualizar a mensagem de limite para mostrar o plano real

---

### Frente 2: Arquitetura Multi-Workspace (Seletor de Organização)

**Contexto:** Hoje o `get_user_org_id` retorna `LIMIT 1`, ou seja, se um usuário pertence a 2+ organizações do tipo `cliente`, ele sempre entra na primeira. Não há UI para trocar.

**Arquitetura proposta:**

O banco de dados já suporta isso — `organization_memberships` permite N vínculos por usuário. Só falta:

1. **Hook `useUserOrganizations`** — Nova query que retorna TODAS as orgs do usuário (não apenas a primeira), filtrando por portal (`saas`/`franchise`).

2. **Componente `WorkspaceSwitcher`** — Dropdown no `ClienteSidebar` que:
   - Mostra o nome da org atual
   - Lista todas as orgs do usuário
   - Ao trocar, salva a org selecionada em `localStorage` e invalida as queries

3. **Atualizar `useUserOrgId`** — Checar primeiro se há uma org salva em `localStorage` antes de usar o `get_user_org_id` RPC. Se o usuário só tem 1 org, comportamento inalterado.

4. **Nova RPC `get_user_organizations`** — Retorna todas as orgs do usuário com nome, tipo e logo:
   ```sql
   CREATE FUNCTION get_user_organizations(_user_id uuid, _portal text DEFAULT NULL)
   RETURNS TABLE(org_id uuid, org_name text, org_type text, logo_url text)
   ```

**Arquivos afetados:**

| Arquivo | Mudança |
|---------|---------|
| `src/constants/plans.ts` | maxPipelines corretos |
| `src/components/crm/CrmFunnelManager.tsx` | Usar limites do plano |
| `src/hooks/useUserOrganizations.ts` | Novo hook — lista orgs |
| `src/hooks/useUserOrgId.ts` | Respeitar org salva em localStorage |
| `src/components/WorkspaceSwitcher.tsx` | Novo componente seletor |
| `src/components/ClienteSidebar.tsx` | Integrar WorkspaceSwitcher |
| Migration SQL | Nova RPC `get_user_organizations` |

### Detalhes técnicos do WorkspaceSwitcher

- Posicionado no topo do sidebar, acima do menu
- Mostra avatar/inicial da org + nome
- Dropdown com as outras orgs disponíveis
- Ao clicar, salva `selectedOrgId` no `localStorage` com chave `noe_active_org_{userId}`
- Invalida todas as queries que dependem de `orgId` via `queryClient.invalidateQueries()`
- Se o usuário só tem 1 org, o switcher aparece sem dropdown (apenas informativo)

