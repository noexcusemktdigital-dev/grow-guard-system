

## Plano: Diagnóstico definitivo da conexão Asaas

### Causa mais provável
O secret **`ASAAS_BASE_URL`** pode estar apontando para `https://sandbox.asaas.com/v3` enquanto a chave é de produção. Isso causa exatamente o erro `invalid_access_token` — a chave existe mas pertence ao ambiente errado.

### Ações

1. **Verificar e corrigir `ASAAS_BASE_URL`** — garantir que o valor seja `https://api.asaas.com/v3` (produção)

2. **Reescrever `asaas-test-connection/index.ts`** com diagnóstico completo:
   - Logar a URL exata sendo chamada
   - Logar todos os headers enviados (nomes e primeiros chars dos valores)
   - Logar o response body completo como string raw
   - Remover as linhas duplicadas de `error`/`error_code`/`error_hint` no JSON de resposta (bug atual — linhas 82-84 são sobrescritas pelas 89-91)
   - Testar com `fetch` direto (sem `asaasFetch`) para eliminar o helper como variável

3. **Executar o teste** e analisar o resultado definitivo

### Detalhe técnico

```text
Possível fluxo atual:
  ASAAS_BASE_URL = "https://sandbox.asaas.com/v3"  ← secret configurado
  ASAAS_API_KEY  = "$aact_prod_000M..."              ← chave de produção
  → Asaas sandbox recebe chave de produção → rejeita como invalid_access_token
```

O teste reescrito vai fazer UMA chamada direta com `fetch()` (sem proxy, sem helper) para `https://api.asaas.com/v3/customers?limit=1` com a chave raw, eliminando todas as variáveis intermediárias.

