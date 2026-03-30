

## Diagnóstico — E-mail de signup chegando sem branding

### O que está acontecendo

O e-mail de confirmação de signup está sendo enviado pelo **sistema padrão** (template em inglês, sem logo, remetente `no-reply@auth.lovable.cloud`), ignorando completamente o `auth-email-hook` customizado que já existe no projeto com templates em PT-BR, logo e envio via Resend.

### Causa raiz

O domínio de e-mail do projeto (`notify.sistema.noexcusedigital.com.br`) está com **DNS pendente**. Até que o DNS seja verificado, o sistema de e-mail gerenciado não ativa o hook customizado — todos os e-mails de autenticação (signup, recovery, etc.) passam pelo template padrão em inglês.

Além disso, o `auth-email-hook` atual usa o padrão antigo (envio direto via Resend) em vez do padrão de fila gerenciada. Mesmo após DNS verificado, pode não ser ativado corretamente pelo sistema gerenciado.

### Solução

1. **Verificar/completar DNS** — O primeiro passo é completar a configuração DNS do domínio de e-mail em **Cloud → Emails**. Sem isso, nenhum e-mail customizado será enviado.

2. **Re-scaffoldar o auth-email-hook** — Usar o sistema gerenciado para recriar o hook no padrão correto (com fila), aplicando o branding existente (logo, cores #E2233B, textos PT-BR).

3. **Redeployar** — Deploy do `auth-email-hook` atualizado.

4. **Manter fallback Resend para invite/recovery** — Os fluxos de convite e reset de senha já funcionam via Resend direto (Edge Functions separadas). Esses continuam funcionando independentemente.

### Ação imediata necessária do usuário

Antes de qualquer mudança de código, é necessário completar a verificação DNS do domínio de e-mail. Vou abrir as configurações de e-mail para você verificar o status e completar o setup DNS.

### Após DNS verificado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/auth-email-hook/index.ts` | Re-scaffold via sistema gerenciado + aplicar branding NoExcuse |
| `supabase/functions/_shared/email-templates/*.tsx` | Manter templates existentes com logo e cores da marca |
| Deploy `auth-email-hook` | Ativar o hook no pipeline de auth |

### Resultado esperado

- E-mail de signup chega com logo NoExcuse, texto em PT-BR, botão vermelho (#E2233B), remetente `noreply@noexcusedigital.com.br`
- Todos os e-mails de auth (signup, magic link, email change) passam pelo hook customizado

