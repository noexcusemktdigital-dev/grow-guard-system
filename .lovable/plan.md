

# Revisão Completa: Integração Asaas com Base na Documentação Oficial

## Diagnóstico Pós-Documentação

Após cruzar o código atual com a documentação oficial do Asaas, identifiquei **1 problema crítico** que provavelmente ainda causa 401, além de melhorias de robustez.

### Problema Crítico: Header `User-Agent` obrigatório ausente

A documentação de autenticação do Asaas diz explicitamente:

> "É obrigatório enviar o `User-Agent` no header de todas as requisições em novas contas raiz criadas a partir de 13/06/2024."

O helper `asaas-fetch.ts` e todas as edge functions **não enviam `User-Agent`**. Se sua conta Asaas foi criada após essa data, isso causa **401 silencioso** em todas as chamadas.

Os headers corretos segundo a documentação:
```
"Content-Type": "application/json"
"User-Agent": "NOE-Platform"
"access_token": "sua_api_key"
```

### Problema Secundário: URL de Sandbox incorreta no diagnóstico

A documentação mostra que a URL de sandbox é `https://api-sandbox.asaas.com/v3` (não `https://sandbox.asaas.com/api/v3`). O check no `asaas-test-connection` usa `.includes("sandbox")` que funciona, mas vale alinhar.

### Status das correções anteriores (já aplicadas)

| Item | Status |
|---|---|
| Auth `getUser()` em 9 funções | OK |
| Session refresh no frontend | OK |
| Error handling descritivo | OK |
| Logging pré-auth | OK |

---

## Plano de Correção

### 1. Adicionar `User-Agent` em TODAS as chamadas ao Asaas

Modificar o helper compartilhado `supabase/functions/_shared/asaas-fetch.ts` para injetar automaticamente o header `User-Agent: NOE-Platform` em todas as requisições. Isso corrige o problema em todos os 9+ edge functions de uma só vez.

```typescript
// Em asaas-fetch.ts, antes de fazer fetch:
const headers = new Headers(options?.headers);
if (!headers.has("User-Agent")) {
  headers.set("User-Agent", "NOE-Platform");
}
```

**Arquivo:** `supabase/functions/_shared/asaas-fetch.ts`

### 2. Melhorar diagnóstico do `asaas-test-connection`

Adicionar detecção do erro específico retornado pelo Asaas para guiar o usuário:
- `invalid_environment` → "Chave de API do ambiente errado"
- `access_token_not_found` → "Header access_token não enviado"
- `invalid_access_token_format` → "Formato da chave inválido"
- `invalid_access_token` → "Chave revogada ou inválida"

Retornar também se `User-Agent` está sendo enviado.

**Arquivo:** `supabase/functions/asaas-test-connection/index.ts`

### 3. Garantir `User-Agent` nos headers inline de todas as funções

Algumas funções passam headers diretamente (ex: `{ "Content-Type": "application/json", access_token: asaasApiKey }`). Adicionar `"User-Agent": "NOE-Platform"` nesses locais também, como fallback caso o helper não consiga injetar.

**Arquivos (6 funções que fazem POST):**
- `asaas-create-charge/index.ts`
- `asaas-create-subscription/index.ts`
- `asaas-charge-client/index.ts`
- `asaas-charge-system-fee/index.ts`
- `asaas-charge-franchisee/index.ts`
- `asaas-cancel-subscription/index.ts`

E o helper compartilhado:
- `_shared/asaas-customer.ts` (3 chamadas à API)

---

## Resumo

| Mudança | Arquivos | Impacto |
|---|---|---|
| Injetar `User-Agent` no helper centralizado | `_shared/asaas-fetch.ts` | Corrige 401 em todas as chamadas |
| Adicionar `User-Agent` nos headers inline | 6 edge functions + `_shared/asaas-customer.ts` | Redundância de segurança |
| Diagnóstico de erros Asaas expandido | `asaas-test-connection/index.ts` | Facilita debug futuro |

Total: ~8 arquivos modificados. A correção principal é no `asaas-fetch.ts` — uma linha que afeta todo o sistema.

## Checklist para o usuário (após deploy)

1. Executar `asaas-test-connection` para validar se retorna `connected: true`
2. Se ainda der erro, verificar o código de erro retornado (a função agora mostra o erro exato do Asaas)
3. Confirmar que `ASAAS_API_KEY` começa com `$aact_prod_` (produção) e `ASAAS_BASE_URL` é `https://api.asaas.com/v3`

