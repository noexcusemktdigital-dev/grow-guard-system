

## Diagnóstico

O backend está correto: existem 10 candidatos na tabela, as políticas RLS estão configuradas (admin/super_admin + membros da org podem visualizar), e os dados estão acessíveis.

O problema provável é uma **race condition**: o hook `useFranchiseCandidates` executa a query imediatamente sem verificar se o usuário está autenticado. Se a query dispara antes da sessão de autenticação estar pronta, o Supabase retorna uma lista vazia (RLS bloqueia anônimos) e o React Query cacheia esse resultado vazio.

## Correção

**Arquivo: `src/hooks/useFranchiseCandidates.ts`**

Adicionar dependência de autenticação ao hook:

1. Importar `useAuth` do contexto de autenticação
2. Adicionar `enabled: !!user` à query para garantir que só executa quando o usuário está logado
3. Incluir `user?.id` no `queryKey` para invalidar o cache quando o usuário muda

Isso garante que a consulta só ocorre após a sessão estar ativa, permitindo que o RLS identifique o usuário corretamente.

