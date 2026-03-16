

## Plano: Sessões independentes por portal (Franquia vs SaaS)

### Problema
O sistema usa um único cliente Supabase com uma única chave de armazenamento no `localStorage`. Quando o usuário loga no portal Franquia (`/acessofranquia`) e no portal SaaS (`/app`) no mesmo navegador, a segunda sessão sobrescreve a primeira — impossibilitando uso simultâneo.

### Causa raiz
O arquivo `client.ts` (auto-gerado, não editável) cria um único `createClient` com o `storageKey` padrão. Todos os 108 arquivos do projeto importam `supabase` desse módulo. Resultado: uma sessão por navegador.

### Solução: Cliente com storageKey por portal

**1. Criar `src/lib/supabase.ts`** — novo módulo que detecta o portal pela URL e cria o cliente com um `storageKey` diferente:
- Rotas `/cliente/*`, `/app`, `/landing`, `/` → storageKey `noe-saas-auth`
- Rotas `/franqueadora/*`, `/franqueado/*`, `/acessofranquia` → storageKey `noe-franchise-auth`

```text
const isSaas = path.startsWith('/cliente') || path.startsWith('/app') || path === '/';
storageKey: isSaas ? 'noe-saas-auth' : 'noe-franchise-auth'
```

**2. Atualizar todos os imports** (~108 arquivos: 66 hooks, 30 pages, 11 components, 1 lib)
- De: `import { supabase } from "@/integrations/supabase/client"`
- Para: `import { supabase } from "@/lib/supabase"`
- Mudança mecânica sem lógica nova

**3. Tratar Google OAuth** — O `lovable/index.ts` (auto-gerado) usa `client.ts` para `setSession`. Após redirect do Google OAuth no SaaS, a sessão é salva na chave padrão do `client.ts`. No `AuthContext`, ao detectar portal SaaS sem sessão no cliente portal mas com sessão no cliente padrão, transferir a sessão automaticamente.

**4. AuthContext** — Importar de `@/lib/supabase` para que `onAuthStateChange` e `getSession` usem o cliente correto do portal.

### Resultado esperado
```text
Tab 1: /acessofranquia → login → sessão salva em 'noe-franchise-auth'
Tab 2: /app → login → sessão salva em 'noe-saas-auth'
→ Ambas funcionam independentemente, sem conflito
```

### Arquivos impactados
| Categoria | Qtd | Tipo de mudança |
|-----------|-----|-----------------|
| `src/lib/supabase.ts` | 1 | Novo arquivo |
| `src/contexts/AuthContext.tsx` | 1 | Import + lógica de transferência OAuth |
| `src/lib/portalRoleGuard.ts` | 1 | Trocar import |
| `src/hooks/*.ts` | 66 | Trocar import (mecânico) |
| `src/pages/*.tsx` | 30 | Trocar import (mecânico) |
| `src/components/*.tsx` | 11 | Trocar import (mecânico) |

Total: ~110 arquivos editados, sendo 108 apenas troca de import.

