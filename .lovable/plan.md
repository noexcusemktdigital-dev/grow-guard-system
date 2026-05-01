Objetivo
Restaurar o acesso ao sistema e separar o problema atual de infraestrutura/backend do problema já tratado de otimização de queries no app.

Diagnóstico atual
- O frontend ainda abre e renderiza a tela de login, então o app não está “quebrado” na camada React.
- O backend está com sintoma de indisponibilidade mais amplo do que apenas performance do CRM:
  - a tela de Users do Cloud aparece sem dados e com erro de chart;
  - até uma leitura mínima no banco (`select 1`) está expirando com timeout;
  - sem banco/auth saudáveis, o login não consegue validar conta, restaurar sessão nem carregar roles.
- Portanto, neste momento, não é mais um problema isolado de JOIN pesado. As otimizações anteriores ajudam, mas não resolvem sozinhas um backend que ainda responde com timeout.

Plano
1. Confirmar e estabilizar o backend primeiro
- Verificar o estado real do backend gerenciado antes de mexer mais no app.
- Se ainda estiver em recuperação após resize/pressão de disco, aguardar a instância voltar ao estado saudável.
- Se permanecer com timeout mesmo após o aumento de disco/instância, tratar como incidente de backend e não como bug do login.

2. Tornar o login tolerante a banco lento
- Ajustar `AuthContext` para separar “sessão autenticada” de “perfil/role carregados”.
- Não deixar o login parecer inválido quando o problema real for timeout ao buscar role/perfil.
- Se `signInWithPassword` passar, preservar a sessão e mostrar estado de “acesso em preparação” em vez de derrubar o usuário por falha temporária do banco.

3. Remover pontos de bloqueio síncrono logo após autenticar
- Revisar o fluxo de pós-login em:
  - `src/pages/SaasAuth.tsx`
  - `src/pages/Auth.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/lib/portalRoleGuard.ts`
- Evitar que validação de portal e busca de role imediatamente após login transformem lentidão do banco em falso “usuário errado”.
- Fazer fallback seguro: manter sessão, tentar resolver role em background e só bloquear acesso quando houver resposta definitiva de permissão negada.

4. Reduzir dependência do banco no primeiro carregamento
- Revisar `ProtectedRoute` para não prender toda a navegação numa única busca de role quando o backend estiver lento.
- Exibir mensagens específicas:
  - “autenticação indisponível temporariamente”
  - “não foi possível carregar permissões agora”
  - “credenciais inválidas” apenas quando o backend realmente devolver esse caso.

5. Validar os fluxos de recuperação
- Conferir os fluxos já existentes de:
  - login SaaS
  - login franquia
  - redefinição de senha
  - login Google
- Garantir que, quando o backend normalizar, cada fluxo volte a responder com mensagens corretas sem mascarar timeout como erro de credencial.

6. Reavaliar a carga depois da recuperação
- Com o backend estável novamente, revisar se ainda existem consultas críticas que podem continuar pressionando I/O/memória.
- Se necessário, ampliar as otimizações já iniciadas nos hooks mais pesados, mas somente depois de separar o que é gargalo estrutural do que é indisponibilidade temporária.

Detalhes técnicos
- Evidência principal: até consulta simples de banco expirou por timeout, o que indica problema de disponibilidade/saúde do backend, não apenas erro de tela de login.
- Arquivos principais a ajustar na implementação:
  - `src/contexts/AuthContext.tsx`
  - `src/pages/SaasAuth.tsx`
  - `src/pages/Auth.tsx`
  - `src/components/ProtectedRoute.tsx`
  - `src/lib/portalRoleGuard.ts`
- Estratégia de código:
  - session-first
  - role/profile deferred
  - bloqueio apenas com negação explícita
  - mensagens de erro distintas para timeout, indisponibilidade e credencial inválida

Resultado esperado
- O sistema deixa de transformar indisponibilidade do backend em “usuário errado”.
- Quando o backend voltar ao normal, o login volta a funcionar sem travar na carga inicial.
- Se o backend continuar falhando, fica claro que a ação necessária é estabilização da instância/backend, e não mais otimização cega do app.