

# Unificar Entradas com Pagamentos Asaas

## Conceito

Remover a aba "Pagamentos Asaas" separada e integrar os pagamentos reais do Asaas diretamente na aba **Entradas**, criando uma visao unificada de todas as receitas — manuais e automaticas.

## Mudancas

### 1. Aba "Entradas" unificada (`FinanceiroControle.tsx`)

- **Remover** a aba "Pagamentos Asaas" (TabsTrigger + TabsContent)
- **Combinar** na aba Entradas os dados de `revenues` (manuais) + `asaasPayments` (do Asaas) em uma unica lista
- Cada linha tera uma coluna **Origem** com badge "Manual" ou "Asaas"
- Pagamentos Asaas mostram: descricao do Asaas, valor, data de pagamento/vencimento, status real (CONFIRMED, PENDING, OVERDUE), e link de fatura
- Entradas manuais continuam editaveis/excluiveis; entradas Asaas sao read-only
- Botao "Atualizar Asaas" ao lado do "Nova Receita" para refetch dos dados
- KPI de Receitas passa a somar manuais + Asaas (pagos)

### 2. Formulario de Nova Receita com opcao Asaas

- Adicionar um toggle/switch no dialog de Nova Receita: "Cobrar via Asaas?"
- Se ativado, mostra campos para selecionar contrato ativo e metodo de pagamento (PIX/Boleto/Cartao)
- Ao confirmar, chama `asaas-charge-client` e a cobranca aparece automaticamente na listagem via API do Asaas
- Se desativado, funciona como hoje (entrada manual no banco)

### 3. Limpeza de codigo

- Remover imports e estado relacionados a aba Asaas separada (`TabsTrigger value="asaas"`, etc.)
- Manter o hook `useAsaasNetworkPayments` — apenas muda onde os dados sao exibidos

## Detalhes tecnicos

### Mesclagem de dados na tabela Entradas

```text
Lista unificada = [
  ...revenues.map(r => ({ ...r, source: "manual" })),
  ...asaasPayments.map(p => ({
    id: p.id,
    description: p.description || p.orgName,
    amount: p.value,
    date: p.paymentDate || p.dueDate,
    status: mapAsaasStatus(p.status),  // CONFIRMED/RECEIVED -> "paid", PENDING -> "pending"
    category: "Asaas",
    source: "asaas",
    invoiceUrl: p.invoiceUrl,
    billingType: p.billingType,
    asaasStatus: p.status,
  }))
]
// Ordenado por data desc
```

### Colunas da tabela

| Descricao | Categoria | Valor | Origem | Status | Data | Acoes |
|-----------|-----------|-------|--------|--------|------|-------|
| texto     | badge     | R$    | Manual/Asaas | Recebido/Pendente | data | editar/excluir ou link fatura |

- Linhas Asaas: acoes = botao "Ver Fatura" (se disponivel)
- Linhas manuais: acoes = editar + excluir (como hoje)

