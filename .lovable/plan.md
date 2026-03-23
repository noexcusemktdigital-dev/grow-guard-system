

# Chat Interno da Matriz

## Resumo

Criar um sistema de chat em tempo real exclusivo para membros da organização Matriz (super_admin e admin). Permitira conversas diretas 1-a-1 e um canal geral da equipe.

## Estrutura

```text
┌──────────────────────────────────────────────────┐
│  Chat da Equipe                                  │
├─────────────┬────────────────────────────────────┤
│ Lista       │  Conversa                          │
│             │                                    │
│ #geral      │  [Mensagens em tempo real]         │
│ ──────────  │                                    │
│ DMs:        │                                    │
│  João       │                                    │
│  Maria      │  ┌─────────────────────────┐       │
│             │  │ Digite sua mensagem...  │       │
│             │  └─────────────────────────┘       │
└─────────────┴────────────────────────────────────┘
```

## Banco de Dados (2 tabelas novas)

### `team_chat_channels`
Canais de conversa (canal geral + DMs).

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK organizations | |
| type | text | 'group' ou 'direct' |
| name | text nullable | nome do canal (ex: "Geral") |
| created_at | timestamptz | |

### `team_chat_messages`
Mensagens enviadas nos canais.

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| channel_id | uuid FK team_chat_channels | |
| sender_id | uuid FK auth.users(id) | |
| content | text | |
| created_at | timestamptz | |

### `team_chat_members`
Membros de cada canal (para DMs e controle de acesso).

| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| channel_id | uuid FK team_chat_channels | |
| user_id | uuid FK auth.users(id) | |
| last_read_at | timestamptz | para badge de nao-lidas |

### Realtime
Habilitar realtime em `team_chat_messages` para atualizacao instantanea.

### RLS
- SELECT/INSERT em `team_chat_messages`: usuario autenticado que seja membro do canal (via `team_chat_members`)
- SELECT/INSERT em `team_chat_channels`: membro da organizacao com role super_admin ou admin
- Funcao `is_team_chat_member` (security definer) para evitar recursao

## Frontend (3 arquivos novos + 2 alteracoes)

### Novos
1. **`src/pages/franqueadora/FranqueadoraChat.tsx`** - Pagina principal com layout split (lista de canais + conversa)
2. **`src/hooks/useTeamChat.ts`** - Hook com queries/mutations para canais, mensagens e realtime subscription
3. **`src/components/teamchat/TeamChatConversation.tsx`** - Componente de conversa com input, bolhas de mensagem e scroll automatico

### Alteracoes
4. **`src/App.tsx`** - Adicionar rota `/franqueadora/chat`
5. **`src/components/FranqueadoraSidebar.tsx`** - Adicionar item "Chat da Equipe" na secao Principal

## Fluxo
1. Ao acessar a pagina, busca canais da org (cria canal "Geral" automaticamente se nao existir)
2. Lista membros da Matriz para iniciar DMs
3. Mensagens carregadas por canal com paginacao
4. Realtime: novas mensagens aparecem instantaneamente
5. Badge de nao-lidas na sidebar baseado em `last_read_at`

## Seguranca
- Rota protegida por `allowedRoles={["super_admin", "admin"]}` (ja existe no layout)
- RLS garante que apenas membros da mesma org acessam os canais
- Apenas roles da Matriz (super_admin/admin) podem acessar

