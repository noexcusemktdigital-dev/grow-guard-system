

# Atualizar ASAAS_API_KEY para Sandbox

## Resumo

Substituir o valor atual do secret `ASAAS_API_KEY` pela chave do ambiente Sandbox do Asaas, permitindo que todas as 4 Edge Functions (create-subscription, create-charge, list-payments, charge-franchisee) e o webhook se comuniquem corretamente com o ambiente de testes.

## O que sera feito

1. Atualizar o secret `ASAAS_API_KEY` com o valor da chave sandbox fornecida
2. Nenhuma alteracao de codigo necessaria -- as funcoes ja leem esse secret via `Deno.env.get("ASAAS_API_KEY")`

## Estado final dos secrets Asaas

| Secret | Valor |
|--------|-------|
| `ASAAS_API_KEY` | Chave sandbox (`$aact_hmlg_...`) |
| `ASAAS_BASE_URL` | `https://api-sandbox.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | `whsec_Ntk8jfwX4OhA8-6BcpRu-Euugv49ar1kdCi1dARU6Q8` |

## Proximo passo apos atualizacao

Testar o fluxo completo: criar uma cobranca pelo app, verificar no painel Asaas Sandbox, simular pagamento e confirmar que o webhook injeta creditos.

