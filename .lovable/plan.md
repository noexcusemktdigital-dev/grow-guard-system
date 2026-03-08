

## Plano: Reestruturar Módulo Gestão (Franqueadora + Franqueado)

### Resumo

Renomear "Administrativo" para "Gestão" na sidebar da Franqueadora. Reestruturar a Matriz para ter 3 abas: **Empresa**, **Equipe** (com conceito de times/funções) e remover "Perfis de Permissão". No Franqueado, a "Minha Unidade" já está funcional com 4 abas — necessita apenas ajustes finos.

---

### 1. Sidebar — Renomear "Administrativo" → "Gestão"

**Arquivo**: `src/components/FranqueadoraSidebar.tsx`
- Linha 325: trocar `title="Administrativo"` por `title="Gestão"`

---

### 2. Matriz — Reestruturar abas (Empresa + Equipe)

**Arquivo**: `src/pages/Matriz.tsx`

**Remover** a aba "Perfis de Permissão" e todo o código relacionado (`usePermissionProfiles`, `usePermissionMutations`).

**Aba Empresa** — já funciona via `MatrizEmpresa`. Sem alterações.

**Aba Equipe** — Reformular completamente:
- Ao convidar um membro, além de nome, email e papel (Super Admin / Admin / Usuário), o formulário deve incluir um campo **multi-select de funções/times**: Vendas, Marketing, Suporte, Jurídico, Operações, Financeiro
- Essas funções são salvas no perfil do usuário (campo `job_title` ou nova coluna) e definem a qual time ele pertence
- A listagem de membros mostra badges com os times de cada pessoa
- Os papéis definem o nível de acesso:
  - **Super Admin**: acesso total, pode editar tudo
  - **Admin**: acesso intermediário
  - **Usuário**: acesso operacional básico

**Necessidade de DB**: Criar tabela `org_team_memberships` para vincular usuários a múltiplos times:

```sql
CREATE TABLE public.org_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.org_team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES org_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);
```

RLS: membros da org podem ler; admins podem gerenciar.

Seed os times padrão ao criar a organização: Vendas, Marketing, Suporte, Jurídico, Operações, Financeiro.

---

### 3. Invite-user — Atualizar para receber times

**Arquivo**: `supabase/functions/invite-user/index.ts`
- Aceitar campo opcional `team_ids: string[]` no body
- Após criar o usuário e membership, inserir registros em `org_team_memberships`

---

### 4. Hooks novos

**`src/hooks/useOrgTeams.ts`** — CRUD de times da organização:
- `useOrgTeams()` — lista times
- `useTeamMembers(teamId)` — membros de um time
- `useTeamMutations()` — adicionar/remover membros de times

---

### 5. Franqueado — Minha Unidade

A página `FranqueadoMinhaUnidade.tsx` já possui as 4 abas corretas (Dados, Usuários, Documentos, Financeiro) e está funcional. Ajustes mínimos:
- Garantir que o limite de usuários (`maxUsers={2}`) esteja correto
- Confirmar que os dados são read-only onde necessário

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Renomear "Administrativo" → "Gestão" |
| `src/pages/Matriz.tsx` | Remover aba Perfis, reformular aba Equipe com times |
| `supabase/functions/invite-user/index.ts` | Aceitar `team_ids` |
| `src/hooks/useOrgTeams.ts` | Novo hook para times |
| Migration SQL | Criar `org_teams` + `org_team_memberships` + seed times padrão |

