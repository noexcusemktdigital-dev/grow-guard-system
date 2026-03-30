

## Plano — E-mail de confirmação de signup via Resend

### Problema
O `supabase.auth.signUp()` dispara automaticamente o e-mail de confirmação padrão (inglês, sem branding). Não há como suprimir esse e-mail quando se usa o método client-side.

### Solução
Mover a criação do usuário para uma Edge Function que usa a Admin API (`admin.createUser` com `email_confirm: false`), impedindo o disparo do e-mail padrão. A função gera o link de confirmação via `admin.generateLink({ type: "signup" })` e envia o e-mail branded via Resend.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/signup-saas/index.ts` | Adicionar criação do usuário via Admin API + envio de e-mail branded via Resend. Hoje a função recebe `user_id` do frontend; passará a receber `email`, `password`, `full_name` e criar o usuário internamente |
| `supabase/config.toml` | `signup-saas` → `verify_jwt = false` (agora é chamada antes de existir sessão) |
| `src/pages/SaasAuth.tsx` | Remover `supabase.auth.signUp()` e chamar `signup-saas` diretamente com email/password/full_name. Substituir `supabase.auth.resend()` por chamada à mesma função com flag `resend_only: true` |

### Fluxo novo

```text
Frontend (SaasAuth)
  -> POST signup-saas { email, password, full_name, referral_code }
     -> admin.createUser({ email, password, email_confirm: false })
     -> admin.generateLink({ type: "signup" })
     -> Resend: e-mail branded PT-BR com logo NoExcuse
     -> Provisiona org/subscription/wallet (lógica existente)
     -> Retorna { success, user_id }
  -> Mostra tela "verifique seu e-mail"

Reenviar confirmação:
  -> POST signup-saas { email, resend_only: true }
     -> admin.generateLink({ type: "signup" })
     -> Resend: mesmo template
     -> Retorna { success }
```

### Template do e-mail
Mesmo padrão visual dos convites e reset: logo NoExcuse, título "Confirme seu e-mail", texto PT-BR, botão vermelho (#E2233B), remetente `noreply@noexcusedigital.com.br`.

### Detalhes técnicos
- `admin.createUser()` com `email_confirm: false` cria o usuário sem disparar e-mail nenhum
- `admin.generateLink({ type: "signup" })` gera o link de confirmação que, ao ser clicado, confirma o e-mail do usuário
- A lógica de provisioning (org, subscription, wallet, referral) permanece na mesma função
- Detecção de usuário existente continua funcionando (erro `email_exists` do `createUser`)
- O `resend_only: true` permite reenviar a confirmação sem recriar o usuário

