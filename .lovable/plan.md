

# CRM Contatos + Financeiro Comercial + Contratos Vinculados a Propostas

## 1. CRM - Importacao de Lista de Contatos para o Franqueado

O componente `CrmCsvImportDialog` ja existe e funciona perfeitamente (upload CSV, preview, importacao para `crm_contacts`). O problema e que ele so e usado no CRM do cliente SaaS, nao aparece no CRM do franqueado (`FranqueadoCRM.tsx`).

### Mudancas
- Adicionar botao "Importar Contatos" no header do `FranqueadoCRM.tsx` ao lado do "Novo Lead"
- Importar e renderizar o `CrmCsvImportDialog` existente
- O dialog ja inclui download do modelo padrao CSV e preview dos dados antes de importar

### Arquivo editado
- `src/pages/franqueado/FranqueadoCRM.tsx`

---

## 2. Financeiro - Foco em Vendas e Receita dos Contratos

O financeiro atual esta generico (receitas/despesas manuais). O franqueado precisa de uma visao focada em **vendas**: contratos ativos geram receita mensal, e ele recebe sua parte mensalmente.

### Novo layout com 3 abas

**Aba "Visao Geral"**
- KPIs: Receita Recorrente (MRR dos contratos ativos), Contratos Ativos, Ticket Medio, Previsao Proximos 3 Meses
- Tabela de contratos ativos com: cliente, valor mensal, dia de pagamento, proxima cobranca, status do pagamento
- Grafico de receita acumulada por mes (ultimos 6 meses, baseado nos contratos)

**Aba "Controle de Pagamentos"**
- Lista mensal de pagamentos esperados baseados nos contratos ativos
- Cada contrato gera uma linha por mes com: cliente, valor, dia de pagamento, status (Pago/Pendente/Atrasado)
- Botao para marcar como recebido
- Filtro por mes/status

**Aba "Fechamentos"**
- Manter o drive de arquivos de fechamento como esta (ja funciona)

### Arquivo editado
- `src/pages/franqueado/FranqueadoFinanceiro.tsx` - reescrever com foco em vendas/contratos

---

## 3. Contratos - Vinculacao com Propostas + Duracao Fixa + Data de Pagamento

### Mudanca no banco
Adicionar coluna `payment_day` (integer, 1-31) na tabela `contracts` para indicar o dia de pagamento mensal.

### Mudancas no formulario de contrato
- **Duracao**: substituir input livre por Select com 3 opcoes fixas: 1 mes, 6 meses, 12 meses
- **Data de pagamento**: novo campo Select (dia 1 a 31) para indicar o dia do mes que o cliente paga
- **Vinculacao com proposta**: adicionar campo para selecionar uma proposta aceita do gerador de propostas. Ao selecionar, preenche automaticamente:
  - Titulo do contrato
  - Descricao dos servicos (lista dos itens da proposta)
  - Valor mensal (calculado da proposta)
  - Valor total
  - Dados do lead vinculado (se a proposta tiver lead_id)
- **Data fim**: calculada automaticamente a partir da data inicio + duracao

### Fluxo integrado
```text
1. Franqueado cria proposta no Gerador de Propostas
2. Proposta e aceita pelo cliente
3. No modulo Contratos > Novo Contrato, seleciona a proposta
4. Dados sao preenchidos automaticamente
5. Franqueado ajusta/confirma e gera o contrato
6. Contrato ativo aparece no Financeiro com dia de pagamento
```

### Arquivos editados
- Migracao SQL: adicionar `payment_day` em `contracts`
- `src/pages/franqueado/FranqueadoContratos.tsx` - reformular formulario com duracao fixa, dia de pagamento, vinculacao com proposta
- `src/hooks/useContracts.ts` - adicionar `payment_day` nas mutations

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar `payment_day` integer em `contracts` |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Adicionar botao + dialog de importacao CSV |
| `src/pages/franqueado/FranqueadoFinanceiro.tsx` | Reescrever com foco em vendas/contratos |
| `src/pages/franqueado/FranqueadoContratos.tsx` | Reformular com duracao fixa, dia pagamento, vinculacao proposta |
| `src/hooks/useContracts.ts` | Adicionar payment_day |

