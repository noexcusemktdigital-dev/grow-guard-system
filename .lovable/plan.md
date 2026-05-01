Objetivo
Restaurar o login sem mudar funcionalidades do sistema e separar definitivamente o que é problema de autenticação do que é problema de performance/carga.

Leitura atual
- Subir recursos não resolveu porque o sintoma atual mudou: agora o erro aparece no próprio login como usuário/senha inválidos.
- Isso indica que o bloqueio atual não está mais no I/O das queries pesadas do CRM/dashboard.
- No código, o login acontece antes de qualquer query pesada:
  - `src/pages/SaasAuth.tsx`
  - `src/pages/Auth.tsx`
  Ambos chamam `signInWithPassword(...)` e, se qualquer erro vier do backend, exibem quase sempre a mesma mensagem genérica: `Credenciais inválidas`.
- Ou seja: hoje o app está mascarando a causa real. Pode ser senha errada, e-mail não confirmado, conta criada só via Google, conta de convite ainda sem senha, bloqueio de portal, ou outro erro de auth.
- O warning atual do console sobre `GoogleButton`/`ref` é secundário e não explica falha de login por e-mail e senha.

Conclusão prática
- Não: o problema atual não parece mais ser espaço nem otimização de query.
- As otimizações ajudam o sistema a parar de travar depois do login, mas não corrigem `invalid credentials`.
- A próxima ação correta é depurar o fluxo de autenticação e expor o erro real.

Plano
1. Instrumentar o login para revelar a causa real
- Ajustar `SaasAuth` e `Auth` para não tratar todo erro como “credenciais inválidas”.
- Mapear mensagens/status distintos para casos reais:
  - e-mail não confirmado
  - conta sem senha definida
  - conta de provedor social tentando entrar por senha
  - sessão/bloqueio temporário
  - credencial realmente inválida
- Registrar o erro técnico no logger sem expor detalhes inseguros na UI.

2. Validar os estados reais das contas no backend
- Verificar, para os usuários afetados, se a conta existe e em qual estado está:
  - confirmada ou não
  - criada por senha ou por Google
  - conta de convite aguardando definição de senha
  - bloqueada/desabilitada
- Conferir se o fluxo de criação atual (`signup-saas`) e o fluxo de convite geram usuários coerentes com o tipo de login esperado.

3. Revisar coerência entre os três fluxos de entrada
- Fluxo SaaS (`/`)
- Fluxo Franquia (`/acessofranquia`)
- Fluxo de convite/boas-vindas (`/welcome`) e redefinição (`/reset-password`)
- Garantir que cada tipo de conta termina com um método de acesso válido:
  - usuário SaaS com senha
  - convidado com senha criada no primeiro acesso
  - usuário Google orientado a entrar com Google

4. Corrigir mensagens e fallback de UX
- Exibir mensagens úteis sem confundir o usuário final.
- Se a conta existir mas estiver sem confirmação/senha, direcionar para a ação correta:
  - reenviar confirmação
  - redefinir senha
  - usar Google
- Evitar falso diagnóstico de “usuário errado” quando o problema for outro.

5. Validar ponta a ponta
- Testar login por senha no SaaS
- Testar login por senha na Franquia
- Testar conta não confirmada
- Testar recuperação de senha
- Testar conta Google
- Confirmar que, após autenticar, as otimizações de performance mantêm o sistema responsivo

Detalhes técnicos
- Arquivos principais envolvidos:
  - `src/pages/SaasAuth.tsx`
  - `src/pages/Auth.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/lib/portalRoleGuard.ts`
  - `supabase/functions/signup-saas/index.ts`
  - `supabase/functions/request-password-reset/index.ts`
- Evidência central do diagnóstico:
  - o `signInWithPassword` falha antes de qualquer carregamento pesado do CRM;
  - portanto, o erro atual não é explicado por JOIN, cache, cron ou tamanho da instância.

Resultado esperado
- Saber exatamente por que o login está falhando.
- Corrigir a causa real no fluxo de auth.
- Manter as otimizações de performance como melhoria separada, sem confundir com o problema de acesso.