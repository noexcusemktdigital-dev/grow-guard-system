
# Split de Pagamentos Asaas — Lógica Corrigida

## Regra de Negócio (Implementada)

```text
VALOR BASE (monthly_value do contrato):
  → 80% franqueadora, 20% franqueado

EXCEDENTE (surplus_value — gerado via proposta/calculadora):
  → 20% franqueadora, 80% franqueado
```

O percentual do split no Asaas é calculado dinamicamente por cobrança usando média ponderada.

## Colunas adicionadas

- `contracts.surplus_value` (NUMERIC DEFAULT 0)
- `contracts.surplus_issuer` (TEXT)
- `client_payments.surplus_amount` (NUMERIC DEFAULT 0)
- `client_payments.franqueadora_share` (NUMERIC DEFAULT 0)

## Arquivos modificados

| Arquivo | Descrição |
|---------|-----------|
| `_shared/asaas-customer.ts` | `buildSplitConfig` recebe `baseValue` + `surplusValue`, calcula % ponderado |
| `asaas-charge-client/index.ts` | Busca `surplus_value`, calcula shares corretas, registra no DB |
| `get_network_contracts` (DB function) | Retorna `surplus_value` e `surplus_issuer` |
