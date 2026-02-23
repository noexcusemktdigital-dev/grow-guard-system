

# Atualizar Chave API do Asaas

## O que sera feito

1. **Atualizar o secret `ASAAS_API_KEY`** com a nova chave de producao fornecida
2. **Re-deploy das 3 edge functions** de pagamento para que usem a nova chave:
   - `asaas-create-subscription`
   - `asaas-create-charge`
   - `asaas-list-payments`

## Detalhes Tecnicos

- O secret `ASAAS_API_KEY` ja existe no sistema e sera atualizado com o novo valor
- As edge functions serao re-deployadas automaticamente apos a atualizacao
- Nenhuma alteracao de codigo e necessaria, apenas a troca da chave

## Resultado Esperado

Apos a atualizacao, o fluxo de upgrade de plano e compra de creditos deve funcionar sem o erro de IP nao autorizado, ja que a nova chave pode nao ter a restricao associada.

