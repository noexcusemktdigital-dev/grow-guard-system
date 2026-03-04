

# Correcao da Logica de Split: Base vs Excedente

## Regra de Negocio Correta

O split atual esta errado — trata tudo como 80% franqueadora / 20% franqueado. A regra real e:

```text
VALOR BASE (monthly_value do contrato):
  → 80% franqueadora, 20% franqueado

EXCEDENTE (valor adicional gerado pelo franqueado via proposta/calculadora):
  → 20% franqueadora, 80% franqueado
```

Exemplo: Base R$1.000 + Excedente R$500 = Total R$1.500
- Da base: franqueadora R$800, franqueado R$200
- Do excedente: franqueadora R$100, franqueado R$400
- Total franqueadora: R$900 (60% do total)
- Total franqueado: R$600 (40% do total)

O percentual do split varia por cobranca, calculado dinamicamente.

## O que falta no banco de dados

A tabela `contracts` nao tem campos para excedente. Precisamos adicionar:
- `surplus_value NUMERIC DEFAULT 0` — valor do excedente
- `surplus_issuer TEXT` — quem emitiu o excedente (`franqueado` ou `matriz`)

A tabela `client_payments` tambem precisa registrar a separacao:
- `surplus_amount NUMERIC DEFAULT 0` — quanto do pagamento e excedente
- `franqueadora_share NUMERIC DEFAULT 0` — valor que vai para a franqueadora

## Plano de Execucao

### 1. Migracao SQL
Adicionar colunas em `contracts` e `client_payments` para registrar excedente.

### 2. Corrigir `buildSplitConfig` em `_shared/asaas-customer.ts`
Receber `baseValue` e `surplusValue` como parametros. Calcular o percentual ponderado para o split do Asaas:

```text
franqueadoraFromBase = baseValue * 0.80
franqueadoraFromSurplus = surplusValue * 0.20
totalFranqueadora = franqueadoraFromBase + franqueadoraFromSurplus
totalCharge = baseValue + surplusValue
splitPercent = (totalFranqueadora / totalCharge) * 100
```

### 3. Corrigir `asaas-charge-client/index.ts`
- Buscar `surplus_value` do contrato
- Calcular `amount = monthly_value + surplus_value`
- Passar ambos valores para `buildSplitConfig`
- Registrar `surplus_amount` e `franqueadora_share` no `client_payments`

### 4. Atualizar `get_network_contracts` DB function
Incluir as novas colunas `surplus_value` e `surplus_issuer` no retorno.

### 5. Atualizar plan.md

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar `surplus_value`, `surplus_issuer` em `contracts`; `surplus_amount`, `franqueadora_share` em `client_payments` |
| `supabase/functions/_shared/asaas-customer.ts` | `buildSplitConfig` recebe base+surplus e calcula % ponderado |
| `supabase/functions/asaas-charge-client/index.ts` | Usar surplus do contrato, calcular shares corretas |
| `.lovable/plan.md` | Registrar correcao |

