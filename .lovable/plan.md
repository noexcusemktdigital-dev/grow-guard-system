
# Auditoria Financeira Asaas — Problemas Encontrados e Correcoes

## BUG CRITICO 1: Variavel duplicada no Webhook (quebra a funcao inteira)

No arquivo `supabase/functions/asaas-webhook/index.ts`, a variavel `externalRef` e declarada com `const` duas vezes no mesmo escopo (linhas 94 e 187):

```text
Linha 94:  const externalRef = payment.externalReference;  // 1a declaracao
Linha 187: const externalRef = payment.externalReference;  // 2a declaracao (ERRO!)
```

Isso causa um **SyntaxError** no Deno, impedindo que o webhook funcione para **qualquer** evento. Nenhum pagamento confirmado esta sendo processado — nem SaaS, nem franqueado, nem cliente.

**Correcao:** Remover a segunda declaracao na linha 187, pois a variavel `externalRef` ja existe no escopo desde a linha 94.

---

## BUG 2: Metodo `getClaims()` inexistente no supabase-js v2

Tres Edge Functions usam `userClient.auth.getClaims(token)`, que **nao existe** na versao 2 do supabase-js:

- `asaas-charge-franchisee/index.ts` (linha 41)
- `asaas-create-subscription/index.ts` (linha 40)
- `asaas-list-payments/index.ts` (linha 35)

Isso faz com que essas funcoes retornem **401 Unauthorized** para todas as requisicoes autenticadas.

**Correcao:** Substituir `getClaims()` por `getUser()` em todas as tres funcoes:
```typescript
// DE:
const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { ... }

// PARA:
const { data: userData, error: userError } = await userClient.auth.getUser();
if (userError || !userData?.user) { ... }
```

---

## BUG 3: `asaas-charge-client` sem autenticacao

A Edge Function `asaas-charge-client` nao valida o token JWT do usuario. Qualquer pessoa com a URL pode gerar cobrancas em nome de qualquer organizacao.

**Correcao:** Adicionar validacao de autenticacao identica a das outras funcoes (via `getUser()`).

---

## Resumo dos Fluxos e Status Atual

| Fluxo | Funciona? | Problema |
|-------|-----------|----------|
| SaaS — Assinatura (create-subscription) | NAO | getClaims() quebra auth |
| SaaS — Recarga creditos (create-charge) | SIM | Auth funciona com getClaims? Verificar — mas este usa getClaims tambem |
| SaaS — Webhook (confirmacao pagamento) | NAO | Variavel duplicada causa SyntaxError |
| Franqueado — Taxa sistema (charge-system-fee) | SIM | Auth usa getUser() corretamente |
| Franqueado — Cobranca cliente (charge-client) | PARCIAL | Funciona mas sem auth |
| Franqueadora — Cobranca franqueado (charge-franchisee) | NAO | getClaims() quebra auth |
| Franqueadora — Listar pagamentos (list-payments) | NAO | getClaims() quebra auth |
| UI — Controle Financeiro emitir cobranca | SIM | Codigo correto, depende do charge-client |

---

## Plano de Correcao (4 arquivos)

### 1. `supabase/functions/asaas-webhook/index.ts`
- Remover a segunda declaracao `const externalRef` na linha 187
- Substituir por reutilizacao da variavel ja existente (simplesmente remover o `const`)

### 2. `supabase/functions/asaas-charge-franchisee/index.ts`
- Substituir `getClaims()` por `getUser()` (linhas 38-45)

### 3. `supabase/functions/asaas-create-subscription/index.ts`
- Substituir `getClaims()` por `getUser()` (linhas 39-46)

### 4. `supabase/functions/asaas-list-payments/index.ts`
- Substituir `getClaims()` por `getUser()` (linhas 34-41)

### 5. `supabase/functions/asaas-create-charge/index.ts`
- Verificar se tambem usa `getClaims()` e corrigir se necessario

### 6. `supabase/functions/asaas-charge-client/index.ts`
- Adicionar bloco de autenticacao (auth header + getUser())
