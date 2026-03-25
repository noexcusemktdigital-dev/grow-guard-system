

# Corrigir Chat da Equipe (Matriz)

## Problema identificado

O chat da equipe carrega mas não funciona corretamente por dois motivos:

1. **Cliente Supabase errado**: O hook `useTeamChat.ts` importa o Supabase de `@/integrations/supabase/client` (cliente genérico), enquanto todo o sistema de autenticação usa `@/lib/supabase` (cliente com sessão do portal correto). Isso faz com que as queries do chat rodem sem autenticação válida, e o RLS bloqueia tudo silenciosamente.

2. **Usuário não adicionado ao canal Geral**: A lógica de `ensureGeneralChannel` tenta fazer upsert mas falha silenciosamente pelo mesmo problema de cliente. O super_admin (davi.ttesch) não está na tabela `team_chat_members` do canal "Geral".

## Correções

### 1. Trocar import do Supabase em `useTeamChat.ts`
**Arquivo**: `src/hooks/useTeamChat.ts`

- Linha 2: trocar `import { supabase } from "@/integrations/supabase/client"` para `import { supabase } from "@/lib/supabase"`
- Isso garante que todas as queries usem a mesma sessão autenticada do portal franchise

### 2. Melhorar `ensureGeneralChannel` para adicionar todos os membros
**Arquivo**: `src/hooks/useTeamChat.ts`

- Quando o canal "Geral" já existe (bloco `else` na linha 103), além de adicionar o usuário atual, também adicionar todos os membros da org que ainda não estão no canal
- Isso resolve o caso de novos membros que entram na org depois da criação do canal

### 3. Adicionar tratamento de erros visíveis
**Arquivo**: `src/hooks/useTeamChat.ts`

- Adicionar `console.error` nos pontos de falha para facilitar debug futuro
- Mostrar toast de erro quando `ensureGeneralChannel` ou `sendMessage` falha

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/hooks/useTeamChat.ts` | Corrigir import do Supabase + melhorar lógica de membership |

