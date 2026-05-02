# Scripts CI/lint customizados

## gen-supabase-types.sh

Regera types TypeScript do schema Supabase (projeto `gxrhdpbbxfipeopdyygn`).

**Quando rodar:**
- Apos CADA migration que adiciona/altera tabela, coluna ou enum
- Antes de PR que toca hooks ou edge functions que usam tipos do banco
- Ao integrar um novo modulo que acessa o Supabase

**Como rodar:**

```bash
# Requer login previo
npx supabase login

npm run types:supabase
# Output: src/integrations/supabase/types.ts (autogerado — nao editar manualmente)
```

Ou com token direto (CI/CD):

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npm run types:supabase
```

**Helpers de tipo** — importar de `@/integrations/supabase/typed`:

```ts
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/typed';

type Lead       = Tables<'crm_leads'>;
type LeadInsert = TablesInsert<'crm_leads'>;
type Stage      = Enums<'lead_stage'>;
```

**Verificar tipos sem build:**

```bash
npm run types:check
```

**CI — drift detection (recomendado):**

```yaml
- name: Check types drift
  run: |
    npm run types:supabase
    git diff --exit-code src/integrations/supabase/types.ts
```

Falha se `types.ts` no commit estiver desatualizado em relacao ao schema real.

---

## check-stale-time.ts

Detecta `useQuery({...})` sem `staleTime` configurado.

Sem `staleTime`, React Query usa default `0` (refetch agressivo), causando:
- Carga desnecessária no Supabase
- Re-renders com flicker para o usuário
- Custo maior de requisições

Modos:

- `diff` (default): só arquivos alterados vs `origin/main`
- `all`: todos arquivos `src/`

Uso:

```bash
npm run check:stale-time         # PR-mode (rapido)
npm run check:stale-time:all     # Audit completo
```

Adicionar ao CI:

```yaml
- name: Check stale-time
  run: npm run check:stale-time
```

### Valores recomendados de staleTime

| Tipo de dado | staleTime |
|---|---|
| Listas (mudam pouco) | `5 * 60 * 1000` (5 min) |
| Detalhes de entidade | `60 * 1000` (1 min) |
| Tempo real (chat, notificacoes) | `0` |
