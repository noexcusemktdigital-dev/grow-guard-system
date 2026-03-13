

## Plano: Separar criação de unidade da criação de usuário + Editar membros dos franqueados pela Matriz

### Problema atual

A Edge Function `provision-unit` cria automaticamente um usuário (auth + membership + role) no momento do provisionamento da unidade. O fluxo correto é: criar a unidade primeiro, e depois convidar usuários separadamente pela aba "Usuários" da unidade.

Além disso, a Matriz não consegue editar os membros das unidades filhas — precisa poder alterar nome, cargo, papel e remover membros.

### Mudanças

#### 1. Edge Function `provision-unit` — remover criação automática de usuário

- Remover steps 2–5 (createUser, update profile, membership, role)
- Remover campos `manager_email` e `manager_name` como obrigatórios (manter opcionais apenas para registro na tabela `units`)
- Retorno não inclui mais `temp_password` ou `user_id`

#### 2. Wizard de criação (Unidades.tsx) — simplificar para 2 passos

- **Passo 1**: Dados da unidade (nome, cidade, estado, endereço, telefone) + dados do responsável (nome, email — apenas informativos, salvos na tabela `units`)
- **Passo 2**: Configuração financeira (royalties, mensalidade)
- Remover passo de "credenciais temporárias" (step 4) — substituir por mensagem de sucesso orientando a convidar membros pela aba Usuários
- Unificar manager_name/email no passo 1 como campos opcionais

#### 3. Aba Usuários da unidade (UnidadeUsuariosReal.tsx) — adicionar edição pela Matriz

- Quando `isFranqueadoView` é `false` (visão da Matriz), adicionar botão de editar em cada linha da tabela
- Ao clicar, abrir o `EditMemberDialog` já existente, passando o `unitOrgId` como `organizationId`
- Permite alterar nome, cargo, papel e remover o membro

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/provision-unit/index.ts` | Remover criação automática de usuário |
| `src/pages/Unidades.tsx` | Simplificar wizard (2 passos + sucesso) |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Adicionar botão editar + integrar `EditMemberDialog` |

