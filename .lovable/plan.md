

## Plano: Integração com Resend para E-mails (Auth + Transacionais)

### O que será feito

Substituir o sistema nativo de e-mail do Lovable Cloud pelo **Resend** como provedor de envio para todos os e-mails (autenticação e transacionais).

### Pré-requisitos (você precisa fazer)

1. **Criar conta no Resend** em [resend.com](https://resend.com)
2. **Adicionar e verificar seu domínio** no painel do Resend (ele vai gerar registros CNAME/TXT que você adiciona no cPanel da HostGator — mesmo processo de qualquer provedor)
3. **Gerar uma API Key** no Resend (Settings → API Keys)

### Etapas de implementação

1. **Configurar secret `RESEND_API_KEY`** — armazenar a chave de API do Resend como secret no projeto

2. **Reescrever `auth-email-hook`** — substituir o envio via `@lovable.dev/email-js` por chamadas diretas à API do Resend (`https://api.resend.com/emails`), mantendo os 6 templates PT-BR já existentes (signup, recovery, invite, magic-link, email-change, reauthentication)

3. **Criar edge function `send-transactional-email`** — nova função para enviar e-mails transacionais (notificações, alertas) via Resend API

4. **Remover dependência da fila `process-email-queue`** — como o Resend gerencia a entrega, o envio será direto (sem fila pgmq), simplificando a arquitetura

### Detalhes técnicos

- Os templates React-Email existentes em `supabase/functions/_shared/email-templates/` serão mantidos e reutilizados
- O `auth-email-hook` continuará recebendo webhooks do sistema de auth, mas enviará via `fetch('https://api.resend.com/emails')` em vez do SDK Lovable
- O `from` será configurado com o domínio verificado no Resend (ex: `noreply@noexcusedigital.com` ou `noreply@sistema.noexcusedigital.com.br`)
- A função `process-email-queue` pode ser removida ou desativada

### Fluxo resumido

```text
Auth event → auth-email-hook → Resend API → e-mail entregue
App action → send-transactional-email → Resend API → e-mail entregue
```

### Primeiro passo agora

Você precisa:
1. Criar sua conta no Resend
2. Adicionar seu domínio lá e verificar o DNS
3. Gerar a API Key

Quando tiver a API Key, me avise que eu configuro o secret e reescrevo as edge functions.

