

## Plano — Corrigir erro de "link inválido/expirado" no reset de senha

### Diagnóstico

O problema é idêntico ao que já foi corrigido no fluxo de convite (`invite-user`):

- A edge function `request-password-reset` usa `generateLink({ type: "recovery" })` e envia o `action_link` direto no e-mail
- Esse `action_link` é uma URL do Supabase (`/auth/v1/verify?token=...`) que consome o OTP via GET
- Scanners de e-mail (Gmail, Outlook, anti-phishing) fazem prefetch desse link, consumindo o token antes do usuário clicar
- Quando o usuário clica, o token já foi usado → erro `otp_expired` / "link inválido"

A solução já foi implementada com sucesso no `invite-user`: extrair o `hashed_token` do `generateLink` e montar uma URL segura com `token_hash` como query param. O frontend então faz `verifyOtp` explicitamente.

### Correções

#### 1. Edge Function `request-password-reset`

Mesmo padrão do `invite-user`:
- Extrair `linkData.properties.hashed_token` em vez de `action_link`
- Montar URL: `/reset-password?token_hash={hash}&type=recovery&email={email}&portal={portal}`
- Fallback para `action_link` se `hashed_token` não disponível

#### 2. Página `/reset-password` (ResetPassword.tsx)

Adicionar lógica de verificação explícita como a `/welcome`:
- Ler `token_hash`, `type`, `email` dos searchParams
- Se `token_hash` presente: chamar `supabase.auth.verifyOtp({ token_hash, type })` explicitamente
- Se hash URL contém `error=`: verificar se tem `token_hash` nos params e tentar verificação explícita (ignorar erro do hash)
- Manter fallback para o fluxo atual (onAuthStateChange) para links antigos que já estejam em circulação

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/request-password-reset/index.ts` | Extrair `hashed_token`, montar URL com `token_hash` |
| `src/pages/ResetPassword.tsx` | Adicionar verificação explícita via `verifyOtp` com `token_hash` |

### Resultado

- Links de reset de senha não são mais consumidos por scanners de e-mail
- O token só é verificado quando o usuário interage com a página
- Links antigos (action_link) continuam funcionando via fallback
- Mesmo padrão robusto já validado no fluxo de convites

