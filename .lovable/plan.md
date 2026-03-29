

## Usar Resend para todos os e-mails de autenticação

### Situação atual

- O domínio `noexcusedigital.com.br` está **verificado no Resend** (conforme seu print)
- O domínio configurado no Lovable Cloud (`notify.sistema.noexcusedigital.com.br`) está **pendente** e nunca vai verificar por conta do sub-subdomínio
- Os e-mails de convite e transacionais **já usam Resend** diretamente e funcionam
- Os e-mails de autenticação (reset de senha, verificação, magic link) passam pelo sistema gerenciado do Lovable Cloud — como o domínio está pendente, saem sem personalização

### Solução

Atualizar o `auth-email-hook` para enviar diretamente pelo Resend (como já fazem `invite-user` e `send-transactional-email`), em vez de depender do sistema de fila do Lovable Cloud que requer DNS verificado.

### O que muda

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/auth-email-hook/index.ts` | Substituir o enqueue para pgmq por envio direto via Resend API. Manter os templates React Email personalizados (logo, cores, PT-BR) |

### Como vai funcionar

1. O hook continua interceptando eventos de autenticação (signup, recovery, magic link, etc.)
2. Continua renderizando os templates React Email personalizados (logo NoExcuse, botões vermelhos, PT-BR)
3. Em vez de enfileirar na pgmq, envia diretamente via Resend API usando `RESEND_API_KEY` (que já está configurada)
4. E-mails saem como `NoExcuse Digital <noreply@noexcusedigital.com.br>` — do domínio verificado

### O que NÃO muda

- Os templates visuais permanecem iguais (logo, cores, textos em português)
- Os outros e-mails (convite, transacionais) continuam funcionando como já estão
- Nenhuma mudança de banco de dados necessária

