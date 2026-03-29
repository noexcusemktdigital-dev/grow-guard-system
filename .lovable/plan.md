

## Correção — Erro ao Definir Senha no Convite

### Diagnóstico

O problema está na página `/reset-password`. A sessão de recovery é detectada corretamente (o formulário aparece), mas o `supabase.auth.updateUser({ password })` falha com um erro genérico.

**Causa raiz provável:** Conflito de `storageKey`. O cliente Supabase em `lib/supabase.ts` usa `storageKey: "noe-saas-auth"` para `/reset-password`, independentemente do portal do usuário. Quando o link de convite é para um usuário de franquia (`?portal=franchise`), a sessão pode estar sendo processada sob a chave errada. Além disso, `getSession()` pode retornar uma sessão antiga antes que o token de recovery do hash seja processado, causando race condition.

Outro ponto: o código atual não loga o erro real do Supabase, dificultando o diagnóstico.

### Correções

**1. `src/pages/ResetPassword.tsx`**

- Logar o erro real do Supabase no console (`console.error("updateUser error:", error)`) para diagnóstico futuro
- Exibir a mensagem real do erro no toast (em vez do genérico "Tente novamente")
- Garantir que o `updateUser` só seja chamado após o evento `PASSWORD_RECOVERY` ou `SIGNED_IN` ser recebido via `onAuthStateChange` (não apenas por `getSession()` que pode retornar sessão antiga)
- Adicionar um estado `recoveryEvent` para distinguir entre "sessão existente" e "sessão de recovery válida"

**2. `src/lib/supabase.ts`**

- Fazer o `storageKey` respeitar o parâmetro `?portal=` da URL quando estiver em `/reset-password`, garantindo que a sessão de recovery use a mesma chave que o portal de destino do usuário

### Detalhes técnicos

```
ResetPassword.tsx — mudanças:
- Novo estado: recoveryConfirmed (boolean)
- onAuthStateChange: setar recoveryConfirmed=true apenas nos eventos PASSWORD_RECOVERY/SIGNED_IN
- getSession(): setar sessionReady mas NÃO recoveryConfirmed
- handleReset: se !recoveryConfirmed, tentar exchangeCodeForSession ou logar aviso
- console.error no catch do updateUser com error.message e error.status
- toast.error mostrando error.message real (traduzido se necessário)

lib/supabase.ts — mudanças:
- getPortalStorageKey(): quando path === "/reset-password", checar searchParams.get("portal")
  - Se portal=franchise → "noe-franchise-auth"
  - Senão → "noe-saas-auth" (default atual)
```

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ResetPassword.tsx` | Log de erro real, controle de recovery event, mensagem detalhada |
| `src/lib/supabase.ts` | StorageKey dinâmico para `/reset-password` respeitando `?portal=` |

