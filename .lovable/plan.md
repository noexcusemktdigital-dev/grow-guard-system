
## Plano: Propostas, Cobrancas Asaas de Clientes e Correcoes Financeiras

### Resumo

4 grandes areas de trabalho:

1. **Gerador de Proposta** — abrir proposta completa ao clicar, com download PDF e acoes (vincular lead, gerar contrato)
2. **Cobrancas de clientes via Asaas** — criar edge function para cobrar clientes do franqueado, integrar no financeiro
3. **Corrigir pagamento do sistema** — bug na edge function `asaas-charge-system-fee` (campo `document` nao existe, deveria ser `cnpj`)
4. **Financeiro da franqueadora** — receitas devem mostrar pagamentos de sistema dos franqueados e clientes

---

### 1. Proposta Completa — Visualizacao, Download e Acoes

Ao clicar em uma proposta na lista (`PropostasListTab`), abrir um **Sheet/Dialog** com a proposta renderizada completa (reutilizando o layout do `ProposalGenerator`), com botoes:
- **Baixar PDF** (html2pdf.js)
- **Vincular a Lead** (select de leads do CRM, chama `updateProposal`)
- **Marcar como Aceita** (muda status para "accepted")
- **Gerar Contrato** (navega para `/franqueado/contratos?tab=novo&proposal_id=X&lead_id=Y`)

Alteracoes:
- `FranqueadoPropostas.tsx`: adicionar state `viewingProposal`, Sheet com proposta renderizada inline (preview A4), botoes de acao. Reutilizar estilos do ProposalGenerator para preview.

---

### 2. Cobrancas de Clientes via Asaas — Edge Function + Financeiro

**Sim, e possivel gerar cobrancas para clientes do franqueado pelo Asaas.** O sistema ja tem `asaas-create-charge` para creditos e usuarios extras. Vamos criar uma nova edge function `asaas-charge-client` especifica para cobrar clientes de contratos ativos.

#### 2a. Nova Edge Function: `asaas-charge-client`

Recebe: `organization_id`, `contract_id`, `billing_type` (PIX/BOLETO/CREDIT_CARD)

Logica:
1. Busca o contrato e dados do cliente (nome, CPF/CNPJ, email)
2. Cria/reutiliza customer no Asaas com os dados do cliente do contrato
3. Gera cobranca com valor mensal do contrato
4. Salva registro na tabela `client_payments` (nova tabela)
5. Retorna invoice_url, pix_qr_code, etc.

#### 2b. Nova tabela: `client_payments`

```text
client_payments
- id (uuid PK)
- organization_id (FK organizations)
- contract_id (FK contracts)
- month (text, ex: "2026-03")
- amount (numeric)
- franchisee_share (numeric, 20% do amount)
- billing_type (text)
- asaas_payment_id (text)
- asaas_customer_id (text)
- invoice_url (text)
- status (text: pending/paid/overdue)
- paid_at (timestamptz)
- created_at (timestamptz)
```

#### 2c. Webhook — processar pagamentos de clientes

Atualizar `asaas-webhook` para reconhecer pagamentos de clientes via `externalReference` formato `client_payment|{org_id}|{contract_id}|{month}`. Quando confirmado, marcar como pago e registrar como receita no `finance_revenues`.

#### 2d. Financeiro do Franqueado — Integrar cobrancas reais

Renomear sidebar de "Financeiro Unidade" para "Financeiro". No `FranqueadoFinanceiro.tsx`:
- Aba "Controle de Pagamentos": substituir o toggle local `receivedMap` por dados reais da tabela `client_payments`
- Adicionar botao "Gerar Cobranca" por contrato/mes que chama a edge function
- Mostrar status real (pago via webhook, pendente, atrasado)
- PIX inline com QR code e copia-cola

---

### 3. Corrigir Pagamento do Sistema

**Bug encontrado:** A edge function `asaas-charge-system-fee` faz `select("id, name, asaas_customer_id, document, email")` mas a tabela `organizations` nao tem coluna `document` — tem `cnpj`. Isso causa erro silencioso.

Correcao:
- `asaas-charge-system-fee/index.ts`: trocar `.select("id, name, asaas_customer_id, document, email")` por `.select("id, name, asaas_customer_id, cnpj, email")` e `org.document` por `org.cnpj`
- Adicionar alerta visual no dashboard do franqueado quando sistema nao esta pago (banner no topo)

---

### 4. Franqueadora — Receitas com Pagamentos de Sistema e Clientes

Na pagina `FinanceiroReceitas.tsx` da franqueadora:
- Adicionar abas: "Todas", "Sistema Franqueados", "Clientes Franqueados"
- Aba "Sistema Franqueados": listar `franchisee_system_payments` de todas as unidades (join com org name), mostrando status e valores
- Aba "Clientes Franqueados": listar `client_payments` de todas as unidades com org name, contrato e status
- Contratos ativos vao automaticamente para faturamento no financeiro

---

### 5. Contratos Ativos no Financeiro

Na sidebar do franqueado, os contratos ativos devem ser gerenciados pelo financeiro (cobrancas, faturamento). O modulo "Meus Contratos" continua para criacao/gestao, mas a aba de faturamento fica no financeiro.

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/asaas-charge-system-fee/index.ts` | Fix: `document` -> `cnpj` |
| `supabase/functions/asaas-charge-client/index.ts` | Criar: cobranca de clientes via Asaas |
| `supabase/functions/asaas-webhook/index.ts` | Editar: processar `client_payment` events |
| Migration SQL | Criar tabela `client_payments` |
| `src/pages/franqueado/FranqueadoPropostas.tsx` | Editar: Sheet de visualizacao completa + acoes |
| `src/pages/franqueado/FranqueadoFinanceiro.tsx` | Reescrever: cobrancas reais via `client_payments` + botao gerar cobranca |
| `src/components/FranqueadoSidebar.tsx` | Editar: renomear "Financeiro Unidade" para "Financeiro" |
| `src/pages/FinanceiroReceitas.tsx` | Editar: abas com sistema + clientes franqueados |
| `src/hooks/useClientPayments.ts` | Criar: hook para client_payments |

### Sequencia

1. Migration (tabela `client_payments`)
2. Fix `asaas-charge-system-fee` (bug `document` -> `cnpj`)
3. Edge function `asaas-charge-client`
4. Atualizar webhook
5. Hook `useClientPayments`
6. Sidebar (renomear)
7. Propostas (visualizacao completa)
8. Financeiro franqueado (cobrancas reais)
9. Receitas franqueadora (abas sistema/clientes)
