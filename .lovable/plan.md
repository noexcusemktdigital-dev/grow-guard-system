

## Correção: Atualizar domínio do remetente para `noexcusedigital.com.br`

O domínio verificado no Resend é `noexcusedigital.com.br`, mas as edge functions estão configuradas com `noexcusedigital.com` (sem `.br`). Isso fará o Resend rejeitar os envios.

### Alterações

1. **`auth-email-hook/index.ts`** — Alterar:
   - `SENDER_DOMAIN` de `"noexcusedigital.com"` para `"noexcusedigital.com.br"`
   - `ROOT_DOMAIN` de `"sistema.noexcusedigital.com"` para `"sistema.noexcusedigital.com.br"`
   - O `FROM_ADDRESS` será atualizado automaticamente: `NoExcuse Digital <noreply@noexcusedigital.com.br>`

2. **`send-transactional-email/index.ts`** — Alterar:
   - `FROM_ADDRESS` de `noreply@noexcusedigital.com` para `noreply@noexcusedigital.com.br`

3. **Deploy** das duas edge functions atualizadas.

