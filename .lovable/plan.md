
# Ativar Sandbox Asaas e Testar Pagamentos (Cliente Final + Franqueado)

## O que sera feito

### 1. Adicionar secret ASAAS_WEBHOOK_TOKEN
O token `whsec_Ntk8jfwX4OhA8-6BcpRu-Euugv49ar1kdCi1dARU6Q8` precisa ser salvo como secret do backend. Ele nao existe ainda nos secrets configurados.

### 2. Trocar URL base para Sandbox em 4 funcoes
Todas as funcoes Asaas estao apontando para producao (`https://api.asaas.com/v3`). Mudar para leitura dinamica de env var com fallback para sandbox:

```
const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api-sandbox.asaas.com/v3";
```

Funcoes afetadas:
- `asaas-create-subscription/index.ts` (linha 9)
- `asaas-create-charge/index.ts` (linha 9)
- `asaas-list-payments/index.ts` (linha 9)
- `asaas-charge-franchisee/index.ts` (linha 9)

### 3. Adicionar secret ASAAS_BASE_URL
Valor: `https://api-sandbox.asaas.com/v3`

Quando for para producao, basta trocar para `https://api.asaas.com/v3`.

## Fluxo de teste

### Cliente Final (SaaS)
1. Acessar Plano e Creditos no app
2. Assinar um plano (ex: Starter via PIX)
3. Verificar se a cobranca aparece no painel Asaas Sandbox
4. Simular pagamento no sandbox
5. Confirmar que o webhook creditou 5.000 creditos na wallet
6. Testar compra de pack avulso (5.000 creditos / R$49)

### Franqueado (Repasse)
1. No painel da franqueadora, acessar Financeiro > Repasse
2. Gerar cobranca de repasse para um franqueado (precisa ter `asaas_customer_id` vinculado)
3. Verificar se a cobranca aparece no Asaas Sandbox
4. Simular pagamento
5. Confirmar que o webhook marcou o repasse como "pago" e registrou receita

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/asaas-create-subscription/index.ts` | URL base dinamica |
| `supabase/functions/asaas-create-charge/index.ts` | URL base dinamica |
| `supabase/functions/asaas-list-payments/index.ts` | URL base dinamica |
| `supabase/functions/asaas-charge-franchisee/index.ts` | URL base dinamica |

## Secrets a adicionar

| Secret | Valor |
|--------|-------|
| `ASAAS_WEBHOOK_TOKEN` | `whsec_Ntk8jfwX4OhA8-6BcpRu-Euugv49ar1kdCi1dARU6Q8` |
| `ASAAS_BASE_URL` | `https://api-sandbox.asaas.com/v3` |

## Resultado

- Todas as chamadas ao Asaas irao para o ambiente Sandbox
- O webhook validara o token de autenticacao
- Para ir para producao: trocar `ASAAS_API_KEY` (chave real), `ASAAS_BASE_URL` (URL producao) e `ASAAS_WEBHOOK_TOKEN` (token do webhook de producao)
