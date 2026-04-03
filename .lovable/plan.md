

## Plano — Salvar hierarquia na memória + Corrigir erros de build

### 1. Memória: Hierarquia completa do sistema

A seguinte estrutura será registrada como memória permanente do projeto:

```text
NOE SYSTEM — HIERARQUIA DE PAPÉIS E ORGANIZAÇÕES

PORTAL FRANQUIA (/acessofranquia)
├── MATRIZ (org_type: "franqueadora")
│   ├── super_admin — Controle total do sistema, billing, matriz, academy
│   ├── admin — Gestão operacional da rede, unidades, comunicados
│   └── Usuários vinculados via org_memberships + teams
│
└── FRANQUEADO (org_type: "franqueado", parent_org_id → matriz)
    ├── franqueado (papel único, permissão via org_memberships)
    ├── Admin da Unidade — gestão local, prospects, estratégia
    └── Operador — execução operacional, acesso restrito

PORTAL SAAS (/app)
└── CLIENTE (org_type: "cliente")
    ├── Workspace = 1 organização com subscription + credit_wallet
    ├── cliente_admin — CRM, GPS, Ads, Billing, Equipe, Integrações
    └── cliente_user — Leads, WhatsApp, tarefas; sem billing/equipe/config
```

**Relações**: `organizations.parent_org_id` liga franqueado→matriz. `org_memberships` vincula usuários a orgs. `user_roles` define papel global (portal-aware via `get_user_role`).

### 2. Corrigir erros de build nas Edge Functions

Há erros de TypeScript em 7+ edge functions. O padrão é o mesmo em todas:

| Erro | Correção |
|------|----------|
| `'err' is of type 'unknown'` | `catch (err: unknown)` + `err instanceof Error ? err.message : String(err)` |
| `Property X does not exist on type 'never'` (asaas-customer) | Adicionar type assertion `as any` nos retornos de `.select().single()` |
| `Property X does not exist on type '{}'` (ai-agent-reply) | Tipar corretamente os objetos de configuração |
| `Argument not assignable to 'never'` | Type assertions nos `.update()`, `.insert()`, `.rpc()` |

#### Arquivos a corrigir

| Arquivo | Tipo de erro |
|---------|-------------|
| `supabase/functions/ai-agent-simulate/index.ts` | `err` unknown |
| `supabase/functions/ai-generate-agent-config/index.ts` | `err` unknown |
| `supabase/functions/_shared/asaas-customer.ts` | Properties on `never` |
| `supabase/functions/asaas-buy-credits/index.ts` | SupabaseClient type mismatch |
| `supabase/functions/ai-agent-reply/index.ts` | Múltiplos: `{}` types, `never`, Intl overload |

A correção segue o mesmo padrão já aplicado em `ads-disconnect`, `ads-analyze` etc: type assertions e tipagem explícita de catch blocks.

