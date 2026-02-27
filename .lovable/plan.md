

# Migracao Asaas para Producao + Cobrancas no Controle Financeiro

## Fase 1 — Migrar 8 Edge Functions do Sandbox para Producao

Trocar o fallback hardcoded em cada arquivo de `https://api-sandbox.asaas.com/v3` para `https://api.asaas.com/v3`. Sao 8 arquivos (7 + webhook que nao tem fallback mas ja usa o secret):

| Arquivo | Linha |
|---------|-------|
| `supabase/functions/asaas-charge-client/index.ts` | 9 |
| `supabase/functions/asaas-create-charge/index.ts` | 11 |
| `supabase/functions/asaas-charge-system-fee/index.ts` | 9 |
| `supabase/functions/asaas-charge-franchisee/index.ts` | 9 |
| `supabase/functions/asaas-test-connection/index.ts` | 7 |
| `supabase/functions/asaas-list-payments/index.ts` | 9 |
| `supabase/functions/asaas-create-subscription/index.ts` | 9 |

Cada um tera a linha alterada de:
```
"https://api-sandbox.asaas.com/v3"
```
para:
```
"https://api.asaas.com/v3"
```

O webhook (`asaas-webhook`) nao usa `ASAAS_BASE` entao nao precisa de alteracao.

---

## Fase 2 — Solicitar API Key de Producao

Usar a ferramenta `add_secret` para solicitar a API Key de producao do Asaas (`ASAAS_API_KEY`) e atualizar o `ASAAS_BASE_URL` para `https://api.asaas.com/v3`.

---

## Fase 3 — Cobrancas na aba "Contratos Ativos" do Controle Financeiro

### Mudancas em `src/hooks/useClientPayments.ts`
- Alterar `useChargeClient` para aceitar `organization_id` como parametro opcional na mutacao
- Se fornecido, usa o `organization_id` do parametro em vez do `orgId` do usuario logado

### Mudancas em `src/pages/FinanceiroControle.tsx`
Na aba "Contratos Ativos":
- Adicionar coluna "Acoes" na tabela
- Botao "Emitir Cobranca" em cada linha de contrato ativo
- Dialog para selecionar metodo de pagamento (PIX, Boleto, Cartao de Credito)
- Dialog de resultado mostrando:
  - Se PIX: QR Code (imagem base64) + codigo copia-e-cola
  - Se Boleto/Cartao: link da fatura (abre em nova aba)
- Importar e usar o hook `useChargeClient` atualizado

### Fluxo do usuario
1. Abre Controle Financeiro → aba "Contratos Ativos"
2. Clica "Emitir Cobranca" ao lado de um contrato
3. Seleciona PIX, Boleto ou Cartao
4. Sistema chama `asaas-charge-client` com o `organization_id` do contrato e o `contract_id`
5. Resultado exibido na tela (QR Code ou link)

