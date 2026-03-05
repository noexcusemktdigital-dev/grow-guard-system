

# Configurar Wallet ID de Produção do Asaas

## Situação Atual

A tabela `organizations` tem `asaas_wallet_id = null` para todas as organizações. A franqueadora **NoExcuse Franqueadora** (ID: `4206c8f4-...`) precisa do wallet ID para que o split funcione.

## Plano

1. **Atualizar o `asaas_wallet_id`** da organização "NoExcuse Franqueadora" com o valor `766e812a-a192-4162-bcde-fadabd5c5db4` usando o insert tool (UPDATE query).

2. **Verificar** que o `buildSplitConfig` em `_shared/asaas-customer.ts` consegue ler o wallet ID corretamente — o código já busca `parentOrg.asaas_wallet_id` e monta o split automaticamente.

## Nota importante

Isso resolve o split, mas o bloqueio principal (`not_allowed_ip`) ainda precisa ser resolvido no painel do Asaas antes que qualquer cobrança funcione.

