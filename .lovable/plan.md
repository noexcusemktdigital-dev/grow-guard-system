

# Correção Completa: Integração Asaas — Sandbox → Produção

## Diagnóstico

Baseado nas suas observações sobre os 4 motivos clássicos de falha na virada Sandbox → Produção, identifiquei os seguintes problemas concretos no código:

### 1. Autenticação quebrada (`getClaims` inexistente)
Todas as 8 edge functions de pagamento usam `userClient.auth.getClaims(token)` — este método **não existe** no `supabase-js@2`. Ele falha silenciosamente e retorna 401 Unauthorized. As funções afetadas:
- `asaas-create-charge`
- `asaas-create-subscription`
- `asaas-charge-client`
- `asaas-charge-system-fee`
- `asaas-charge-franchisee`
- `asaas-list-payments`
- `asaas-cancel-subscription`
- `asaas-get-pix`
- `asaas-test-connection`

### 2. `ASAAS_BASE_URL` — possível URL de sandbox
O secret `ASAAS_BASE_URL` pode ainda apontar para `https://sandbox.asaas.com/api/v3` ao invés de `https://api.asaas.com/v3`. O fallback no código usa produção, mas se o secret estiver setado com sandbox, ele prevalece.

### 3. `ASAAS_PROXY_URL` com valor inválido
Os logs anteriores mostraram `" https://asaas.com/api/v3"` (com espaço e URL errada). Isso não é um proxy — é a própria API. O regex valida e ignora, mas polui os logs.

### 4. `asaas_wallet_id` de ambiente errado no split
Se o `asaas_wallet_id` salvo na tabela `organizations` é do ambiente sandbox, o split vai falhar em produção. Isso precisa de validação manual do usuário.

### 5. `ASAAS_API_KEY` — possível chave do sandbox
Se a chave é do sandbox (`$aact_...` sandbox vs produção), todas as chamadas falham.

---

## Plano de Correção

### Etapa 1: Corrigir autenticação em todas as edge functions (9 arquivos)

Substituir o padrão `getClaims()` por `auth.getUser()` que funciona corretamente:

```typescript
// ANTES (quebrado)
const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { return 401; }

// DEPOIS (funcional)
const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) {
  console.error("[function-name] Auth failed:", authError?.message);
  return 401;
}
```

**Arquivos:**
- `supabase/functions/asaas-create-charge/index.ts`
- `supabase/functions/asaas-create-subscription/index.ts`
- `supabase/functions/asaas-charge-client/index.ts`
- `supabase/functions/asaas-charge-system-fee/index.ts`
- `supabase/functions/asaas-charge-franchisee/index.ts`
- `supabase/functions/asaas-list-payments/index.ts`
- `supabase/functions/asaas-cancel-subscription/index.ts`
- `supabase/functions/asaas-get-pix/index.ts`
- `supabase/functions/asaas-test-connection/index.ts`

Com esta mudança, não precisamos mais do `token` extraído manualmente — o `userClient` já tem o header Authorization e `getUser()` o valida server-side.

### Etapa 2: Adicionar diagnóstico de ambiente no `asaas-test-connection`

Expandir a resposta do `asaas-test-connection` para retornar:
- A URL base sendo usada (produção vs sandbox)
- Se o proxy está ativo e válido
- Se a API key está funcionando
- Verificação do ambiente (sandbox vs produção)

### Etapa 3: Adicionar refresh de sessão no frontend antes de chamadas de pagamento

Nos 3 pontos do frontend que chamam edge functions de pagamento, adicionar `await supabase.auth.getSession()` antes do `invoke`:

**Arquivos:**
- `src/pages/cliente/ClientePlanoCreditos.tsx` — mutations `purchase` (créditos) e `subscribe` (plano)
- `src/hooks/useFranqueadoSystemPayments.ts` — mutation `useChargeSystemFee`
- `src/hooks/useClientPayments.ts` — mutation `useChargeClient`

### Etapa 4: Melhorar tratamento de erros de pagamento no frontend

Adicionar mensagens descritivas para erros comuns:
- 401 → "Sessão expirada. Recarregue a página."
- `not_allowed_ip` → "IP não autorizado no Asaas. Configure o proxy."
- `CPF/CNPJ` → Mensagem específica pedindo cadastro do documento

### Etapa 5: Logging estruturado

Adicionar `console.log` no início de cada função (antes do auth) para garantir visibilidade de que a função foi chamada, mesmo que o auth falhe.

---

## Checklist de Secrets que o usuário deve validar manualmente

Após as correções de código, será necessário confirmar:

| Secret | Valor esperado (produção) |
|---|---|
| `ASAAS_API_KEY` | Chave de produção (`$aact_...`) |
| `ASAAS_BASE_URL` | `https://api.asaas.com/v3` |
| `ASAAS_PROXY_URL` | URL de proxy HTTP válida (ou remover) |
| `ASAAS_WEBHOOK_TOKEN` | Token configurado no painel Asaas produção |

E na tabela `organizations`, verificar que `asaas_wallet_id` e `asaas_customer_id` são IDs de produção.

---

## Resumo

| Mudança | Arquivos |
|---|---|
| Trocar `getClaims()` por `getUser()` | 9 edge functions |
| Refresh de sessão antes de pagamentos | 3 arquivos frontend |
| Diagnóstico expandido | `asaas-test-connection` |
| Erros descritivos | `ClientePlanoCreditos.tsx`, hooks de pagamento |
| Logging antes do auth | 9 edge functions |

