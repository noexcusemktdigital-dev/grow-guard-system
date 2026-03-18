
Diagnóstico que eu fecharia agora:

- O login em si está funcionando no backend. Há `POST /auth/v1/token` com status `200` para `cliente.teste@noexcuse.com`.
- O usuário existe, tem `role = cliente_admin` e tem membership em uma organização `cliente`.
- As políticas de acesso permitem ler `profiles`, `user_roles`, `organization_memberships` e `organizations` para esse usuário.
- Então o problema mais provável não é credencial nem permissão de login: ele está no bootstrap pós-login do frontend.

Erro mais provável:
- `AuthContext` faz o app esperar a resolução de perfil/papel logo após o login.
- Esse fluxo hoje não tem proteção contra erro/timeout em `fetchProfileAndRole`.
- Se qualquer consulta falhar ou ficar pendurada, o `role` permanece `null` e o `ProtectedRoute` fica mostrando spinner indefinidamente.
- Isso explica exatamente o sintoma: autentica, “fica carregando”, mas nunca entra.

Sinais que reforçam isso:
- `SaasAuth` chama `signInWithPassword` com sucesso e depois tenta redirecionar.
- O gargalo real vem depois, quando o contexto tenta resolver sessão/perfil/role.
- O warning do `GoogleButton` com `ref` é ruído visual, mas não explica o travamento.
- Existe ainda um risco secundário no projeto: há duas versões da função `get_user_org_id`, o que pode causar comportamento inconsistente depois que o usuário entra, mas isso parece ser problema secundário, não o bloqueio principal do login.

Plano de correção:
1. Fortalecer `src/contexts/AuthContext.tsx`
   - Envolver `fetchProfileAndRole` em `try/catch/finally`.
   - Buscar `profile` e `user_roles` em paralelo com tolerância a falha.
   - Garantir que `loading` sempre seja desligado, mesmo se alguma query falhar.
   - Se falhar a leitura do perfil, não bloquear login.
   - Se falhar a leitura do papel, registrar erro claro e aplicar fallback controlado em vez de deixar `role = null` para sempre.

2. Remover a dependência de corrida entre login e redirect
   - Em `src/pages/SaasAuth.tsx` e `src/pages/Auth.tsx`, parar de depender do redirecionamento imediato logo após `signInWithPassword`.
   - Deixar o redirecionamento acontecer quando `AuthContext` confirmar `user + role` prontos.
   - Isso elimina a disputa entre “login handler”, `onAuthStateChange` e `ProtectedRoute`.

3. Melhorar recuperação no `ProtectedRoute`
   - Manter loader enquanto o contexto resolve.
   - Mas impedir spinner infinito: se houver sessão autenticada sem `role` por tempo demais, mostrar erro de sessão e rota de recuperação em vez de travar para sempre.

4. Corrigir a causa secundária de inconsistência
   - Consolidar o uso de `get_user_org_id` para uma única assinatura portal-aware.
   - Isso reduz risco de hooks internos carregarem errado após o login.

Arquivos que eu alteraria:
- `src/contexts/AuthContext.tsx`
- `src/pages/SaasAuth.tsx`
- `src/pages/Auth.tsx`
- `src/components/ProtectedRoute.tsx`
- possivelmente um ajuste de backend/migração para unificar `get_user_org_id`

Resumo objetivo:
- O erro não está no login do usuário teste.
- O erro está no fluxo de inicialização da sessão no frontend, que não trata falha/timeout e deixa o app preso esperando `role`.
- Eu corrigiria primeiro o `AuthContext`, depois alinharia o redirecionamento ao estado real da sessão, e por fim limparia a RPC duplicada para evitar novos travamentos depois da entrada.
