

# Migracao Asaas Producao + Cobrancas Vinculadas a Contratos

## Resumo

Duas frentes de trabalho: (1) migrar todas as Edge Functions do Asaas de Sandbox para Producao, e (2) adicionar emissao de cobrancas diretamente na aba "Contratos Ativos" do Controle Financeiro.

---

## Fase 1 — Migrar Asaas para Producao

### O que muda

Todas as 7 Edge Functions que usam o Asaas tem um fallback hardcoded para sandbox:
```
const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api-sandbox.asaas.com/v3";
```

Isso sera alterado para usar a URL de producao como fallback:
```
const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";
```

### Arquivos a alterar (fallback → producao)
- `supabase/functions/asaas-charge-client/index.ts`
- `supabase/functions/asaas-create-charge/index.ts`
- `supabase/functions/asaas-charge-system-fee/index.ts`
- `supabase/functions/asaas-charge-franchisee/index.ts`
- `supabase/functions/asaas-test-connection/index.ts`
- `supabase/functions/asaas-list-payments/index.ts`
- `supabase/functions/asaas-create-subscription/index.ts`

### Secrets a atualizar
- `ASAAS_BASE_URL` → `https://api.asaas.com/v3`
- `ASAAS_API_KEY` → Chave de producao do Asaas (sera solicitada ao usuario)

---

## Fase 2 — Cobrancas na aba Contratos Ativos (Controle Financeiro)

### Objetivo
Na pagina `FinanceiroControle.tsx`, aba "Contratos Ativos", cada contrato ativo tera um botao "Emitir Cobranca" que chama a Edge Function `asaas-charge-client`, permitindo gerar cobrancas via PIX, Boleto ou Cartao vinculadas ao contrato.

### Fluxo
1. Franqueadora clica em "Emitir Cobranca" ao lado de um contrato ativo
2. Um dialog abre perguntando o metodo de pagamento (PIX, Boleto, Cartao)
3. O sistema chama `asaas-charge-client` passando `organization_id` (da unidade dona do contrato ou da matriz) e `contract_id`
4. Se PIX, exibe QR Code + codigo copia-e-cola
5. Se Boleto/Cartao, exibe link do boleto/fatura
6. O pagamento fica rastreado na tabela `client_payments`

### Mudancas em `FinanceiroControle.tsx`
- Adicionar coluna "Acoes" na tabela de contratos ativos
- Botao "Emitir Cobranca" por linha
- Dialog de selecao de metodo de pagamento
- Dialog de resultado (QR Code PIX / link boleto)
- Usar o hook `useChargeClient` ja existente em `useClientPayments.ts`

### Ajuste no hook `useChargeClient`
O hook atual espera `contract_id` e `billing_type` e usa `orgId` do usuario logado. Para a franqueadora emitir cobrancas de contratos de unidades, sera necessario passar o `organization_id` do contrato (que pode ser de uma unidade) em vez de usar o `orgId` do usuario logado.

Alterar `useClientPayments.ts` para aceitar `organization_id` como parametro opcional na mutacao.

---

## Detalhes Tecnicos

### Arquivos a modificar
- **7 Edge Functions**: trocar fallback de `api-sandbox.asaas.com` para `api.asaas.com`
- **`src/pages/FinanceiroControle.tsx`**: adicionar botao de cobranca na aba de contratos ativos, dialog de metodo de pagamento, dialog de resultado (PIX QR / boleto link)
- **`src/hooks/useClientPayments.ts`**: ajustar `useChargeClient` para aceitar `organization_id` explicito

### Secrets
- Sera solicitada a API Key de producao do Asaas via ferramenta de secrets
- O `ASAAS_BASE_URL` sera atualizado para `https://api.asaas.com/v3`

### Nenhuma migracao de banco necessaria
- A tabela `client_payments` ja existe e suporta o fluxo
- A Edge Function `asaas-charge-client` ja faz todo o trabalho de criar customer + cobranca + QR code

