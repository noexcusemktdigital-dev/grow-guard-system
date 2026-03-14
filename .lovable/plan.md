

## Diagnóstico: Emails de convite não chegam no Gmail

### Causa raiz

O `invite-user` usa `inviteUserByEmail()` do Supabase Auth, que depende do sistema de email do Supabase para enviar o convite. O `auth-email-hook` (que interceptaria e enviaria via Resend) **não está sendo chamado** — os logs não mostram nenhum processamento de email. O domínio de email `notify.sistema.noexcusedigital.com` está com DNS "Pending", bloqueando todo o pipeline de email customizado.

Resultado: os convites ficam no limbo — o usuário é criado no banco, mas o email nunca chega.

### Solução

Mudar a estratégia do `invite-user`: em vez de depender do `inviteUserByEmail` (que precisa do pipeline de email funcionando), vamos:

1. **Criar o usuário** com `admin.createUser()` com senha temporária
2. **Gerar um link de redefinição de senha** com `admin.generateLink({ type: 'recovery' })`
3. **Enviar o email diretamente via Resend** dentro do próprio `invite-user`, usando o template de convite que já existe

Isso elimina completamente a dependência do DNS pendente e do auth-email-hook para convites.

### Arquivo afetado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/invite-user/index.ts` | Trocar `inviteUserByEmail` por `createUser` + `generateLink` + envio direto via Resend |

### Detalhes técnicos

- Usa `admin.createUser({ email, email_confirm: true })` para criar o usuário já confirmado
- Gera link de recovery via `admin.generateLink({ type: 'recovery', email })` para o usuário definir sua senha
- Envia o email usando a API do Resend diretamente (secret `RESEND_API_KEY` já configurada), remetente `NoExcuse Digital <noreply@noexcusedigital.com.br>`
- O template de email é HTML inline com o link de "Definir senha", sem precisar importar React Email (mantém a function simples)
- Se o email já existir, mantém o tratamento atual (erro 409)

