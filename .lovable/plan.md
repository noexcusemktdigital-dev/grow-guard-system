

## Plano: Integracao Franqueadora-Franqueado e Provisionamento Real

### Problema Atual

O sistema tem 3 niveis de organizacao (`franqueadora`, `franqueado`, `cliente`) mas falta a "cola" entre eles:

1. **Atendimento da franqueadora nao ve chamados dos franqueados** — `useSupportTickets` filtra apenas pela `organization_id` do usuario logado
2. **Cadastro de unidades nao provisiona organizacao real** — ao criar unidade em `/franqueadora/unidades`, nao cria `organization` do tipo `franqueado` nem vincula via `parent_org_id`
3. **Convite de membros so aceita roles `cliente_admin`/`cliente_user`** — a edge function `invite-user` ignora roles `super_admin`, `admin`, `franqueado`
4. **Nenhum vinculo `parent_org_id`** entre orgs franqueadora e franqueado

---

### Arquitetura de Integracao

```text
FRANQUEADORA (org type: franqueadora)
  |
  |-- Matriz: cadastro de membros internos (super_admin, admin)
  |-- Unidades: cada unidade cria org tipo "franqueado" com parent_org_id
  |-- Atendimento: agrega tickets de TODAS as orgs filhas
  |-- Comunicados: vistos por todas as orgs filhas
  |-- Financeiro Receitas: ve pagamentos de sistema e clientes de todas as unidades
  |
  +-- UNIDADE A (org type: franqueado, parent_org_id -> franqueadora)
  |     |-- Suporte: cria tickets na propria org, franqueadora le via parent_org_id
  |     |-- Comunicados: le comunicados da franqueadora
  |     |-- CRM: leads e contratos da unidade
  |     |-- Financeiro: pagamentos dos clientes da unidade
  |
  +-- UNIDADE B (org type: franqueado, parent_org_id -> franqueadora)
        |-- (mesma estrutura)
```

---

### Mudanca 1: Edge Function `provision-unit` (Nova)

Quando a franqueadora cadastra uma unidade, chamar esta function que:
1. Cria `organization` do tipo `franqueado` com `parent_org_id` = org da franqueadora
2. Cria usuario do franqueado (email/senha temporaria) com role `franqueado`
3. Vincula usuario a nova org via `organization_memberships`
4. Atualiza o registro `units` com `unit_org_id` = nova org
5. Retorna credenciais temporarias para compartilhar com o franqueado

---

### Mudanca 2: Fluxo de Cadastro de Unidade (Unidades.tsx)

Substituir o botao "Nova Unidade" simples por um Dialog/Wizard completo:
- **Passo 1**: Dados da unidade (nome, cidade, estado, endereco, telefone)
- **Passo 2**: Dados do responsavel (nome, email) — este sera o admin da unidade
- **Passo 3**: Configuracoes financeiras (% repasse, royalties, mensalidade sistema)

Ao confirmar, chama `provision-unit` que cria tudo automaticamente. Exibe senha temporaria para o responsavel.

---

### Mudanca 3: Matriz — Cadastro de Membros da Franqueadora

Expandir o modulo Matriz para incluir aba de **Membros da Equipe** alem dos perfis de permissao:
- Lista membros da org franqueadora (`useOrgMembers`)
- Botao "Convidar Membro" que chama `invite-user` com roles `super_admin` ou `admin`
- Exibe role, nome, cargo de cada membro

---

### Mudanca 4: Corrigir `invite-user` para aceitar todos os roles

Atualmente a linha 96 faz: `const validRole = role === "cliente_admin" ? "cliente_admin" : "cliente_user"` — isso ignora `super_admin`, `admin` e `franqueado`.

Corrigir para aceitar todos os roles validos do enum `app_role`.

---

### Mudanca 5: Atendimento da Franqueadora — Agregar tickets de todas as unidades

Criar um novo hook `useSupportTicketsNetwork` que:
1. Busca todas as orgs onde `parent_org_id` = org do usuario logado
2. Busca tickets de TODAS essas orgs + da propria org
3. Inclui nome da unidade em cada ticket para identificacao

Alternativamente, criar uma database function `get_network_tickets` que faz isso em uma unica query.

---

### Mudanca 6: Comunicados — Franqueados veem comunicados da franqueadora

Verificar se `useAnnouncements` ja filtra por `parent_org_id` ou se precisa ajuste para que franqueados leiam comunicados da org pai.

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/provision-unit/index.ts` | Criar: provisiona org + usuario + membership para nova unidade |
| `supabase/functions/invite-user/index.ts` | Editar: aceitar todos os roles validos |
| `src/pages/Unidades.tsx` | Editar: Dialog de cadastro completo com wizard |
| `src/pages/Matriz.tsx` | Reescrever: adicionar aba Membros com lista e convite |
| `src/hooks/useSupportTicketsNetwork.ts` | Criar: agrega tickets de toda a rede |
| `src/pages/Atendimento.tsx` | Editar: usar `useSupportTicketsNetwork` ao inves de `useSupportTickets` |
| Migration SQL | Criar function `get_network_tickets` para query eficiente |

### Sequencia

1. Migration (function `get_network_tickets`)
2. Edge function `provision-unit`
3. Corrigir `invite-user` (roles)
4. Unidades (wizard de cadastro)
5. Matriz (aba membros)
6. Atendimento (agregar tickets da rede)

