

## Plano: Adicionar Edição Completa de Usuários nos 3 Portais

### Problema
Atualmente, os 3 portais (Matriz, Franqueado, SaaS/Cliente) só permitem **convidar** e **editar times**. Não há como editar o **papel (role)**, **nome**, **cargo** ou **remover** um membro existente.

### Solução

#### 1. Nova Edge Function `update-member`
Criar `supabase/functions/update-member/index.ts` que:
- Recebe `{ user_id, organization_id, role?, full_name?, job_title?, action? }`
- Valida que o chamador é membro (ou pai) da org via `is_member_or_parent_of_org`
- Valida que o chamador tem role admin/super_admin (não permite que `cliente_user` edite outros)
- Suporta ações:
  - **update**: Atualiza `profiles.full_name`, `profiles.job_title`, e `user_roles.role`
  - **remove**: Remove o membro de `organization_memberships`, `org_team_memberships` e `user_roles`
- Não permite remover a si mesmo nem rebaixar o último super_admin

#### 2. Matriz (`src/pages/Matriz.tsx`)
- Trocar o botão "Editar Times" por "Editar" que abre um dialog completo
- Dialog de edição com: Nome, Cargo, Papel (Super Admin / Admin / Usuário), Times
- Botão "Remover Membro" com confirmação
- Chamar `update-member` edge function

#### 3. Franqueado (`src/pages/franqueado/FranqueadoConfiguracoes.tsx`)
- Adicionar botão "Editar" em cada membro da equipe da unidade
- Dialog para editar nome, cargo, papel (Admin / Operador)
- Botão remover com confirmação

#### 4. SaaS/Cliente (`src/pages/cliente/ClienteConfiguracoes.tsx`)
- Adicionar botão "Editar" em cada membro (visível apenas para admins via `useRoleAccess`)
- Dialog para editar nome, cargo, papel (Admin / Usuário), times
- Botão remover com confirmação

#### 5. Config TOML
- Adicionar `[functions.update-member]` com `verify_jwt = false`

### Escopo de cada dialog de edição
| Campo | Matriz | Franqueado | SaaS |
|-------|--------|-----------|------|
| Nome | ✓ | ✓ | ✓ |
| Cargo | ✓ | ✓ | ✓ |
| Papel | super_admin/admin/cliente_user | franqueado/cliente_user | cliente_admin/cliente_user |
| Times | ✓ | — | ✓ |
| Remover | ✓ | ✓ | ✓ |

