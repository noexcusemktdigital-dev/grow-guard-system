
Problema real identificado: o erro não está mais na tela `/welcome` em si. O convite está chegando com um link que já consome o token no clique (`action_link` gerado por `generateLink({ type: "recovery" })`). Nos logs de autenticação há `GET /verify` com `403: Email link is invalid or has expired` e `One-time token not found`, o que indica que o OTP já foi invalidado antes do app conseguir abrir a sessão. Isso é compatível com consumo único do token por pré-leitura/escaneamento do link do e-mail. Além disso, a tela `Welcome.tsx` hoje trata qualquer `422` do `updateUser` como “convite expirado”, mascarando a causa real.

Plano de correção:

1. Corrigir o fluxo de convite para não depender do `action_link` consumível
- Arquivo: `supabase/functions/invite-user/index.ts`
- Em vez de mandar no e-mail o `linkData.properties.action_link`, passar a montar um link próprio para `/welcome`.
- Esse link próprio deve carregar os dados necessários para a tela concluir a autenticação de forma explícita, em vez de depender do `/verify` automático.
- Objetivo: evitar que scanners de e-mail “gastem” o token antes do usuário real abrir.

2. Tornar a página `/welcome` responsável por validar o convite explicitamente
- Arquivo: `src/pages/Welcome.tsx`
- Adicionar tratamento do cenário em que a URL chega com erro no hash (`error=access_denied`, `error_code=otp_expired`), mostrando mensagem correta.
- Adicionar lógica explícita de troca/validação do token na chegada, antes de renderizar o formulário.
- Só liberar `updateUser({ password })` quando a sessão de recuperação/convite estiver realmente confirmada.
- Separar estados:
  - link inválido/consumido
  - sessão pronta
  - erro de senha fraca / senha igual / outra falha de atualização

3. Parar de mascarar erro 422 como “convite expirado”
- Arquivo: `src/pages/Welcome.tsx`
- Hoje:
  - `422` => “Link de convite expirado...”
- Ajuste:
  - inspecionar `error.message` / `error.code`
  - mapear apenas erro real de sessão/token para “convite expirado”
  - manter erros de validação de senha com mensagem apropriada
- Isso melhora o diagnóstico e evita falso positivo.

4. Revisar o template/CTA do e-mail de convite
- Arquivo: `supabase/functions/invite-user/index.ts`
- O botão “Criar minha conta” deve apontar para o novo link seguro do onboarding, e não para o link direto de verificação consumível.
- Manter branding atual, mas trocar a URL de destino.

5. Manter e reforçar o status de convite pendente
- Arquivos:
  - `supabase/functions/invite-user/index.ts`
  - `src/hooks/useOrgMembers.ts`
  - tela de configurações de usuários, se necessário
- Garantir que convites novos continuem gravando `pending_invitations` com `accepted_at: null`
- Quando o onboarding concluir com sucesso, `accepted_at` é preenchido
- Se o link falhar antes disso, o convite continua aparecendo como pendente para reenvio

6. Validar a política de update da tabela de convites
- Arquivo: migração SQL
- A policy criada recentemente usa subquery em `auth.users`; vou revisar para garantir que ela realmente permite ao convidado marcar `accepted_at` sem criar bloqueios de RLS.
- Se necessário, ajustar a policy para ficar compatível com o fluxo real de aceite.

Arquivos envolvidos:
- `supabase/functions/invite-user/index.ts`
- `src/pages/Welcome.tsx`
- `src/hooks/useOrgMembers.ts`
- `src/pages/cliente/ClienteConfiguracoes.tsx` (se precisar ajuste visual/revalidação)
- nova migração SQL apenas se a policy atual precisar correção

Resultado esperado após a implementação:
- o usuário recebe o convite
- ao clicar, não cai mais em `/welcome?...otp_expired`
- ele consegue criar a senha normalmente
- o administrador continua vendo o convite como “pendente” até o aceite real
- os erros passam a mostrar a causa correta, sem confundir senha inválida com convite expirado

Detalhe técnico importante:
- O log atual prova que o token está morrendo no `/verify` antes da aplicação assumir o fluxo.
- Portanto, a correção principal não é “mais timeout” nem “mais retries” no frontend.
- A correção precisa mudar o modelo do link enviado no e-mail e a forma como `/welcome` estabelece a sessão de convite.
