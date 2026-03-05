

# Solução: Desabilitar restrição de IP no Asaas

## O Problema

O Asaas está bloqueando as chamadas porque a conta tem **restrição de IP ativada**. Como as Edge Functions usam IPs rotativos, nunca vai funcionar com whitelist de IP.

## Solução (gratuita, 1 minuto)

Desabilitar a restrição de IP diretamente no painel do Asaas:

1. Acesse o painel Asaas → **Minha Conta → Integrações → Acessos e segurança**
2. Na seção **"Lista de IPs autorizados"**, **remova todos os IPs** ou desative a restrição
3. Salve as alterações

Sem IPs na lista, o Asaas aceita chamadas de qualquer origem — e a integração funciona imediatamente.

## Após desabilitar

Eu executo `asaas-test-connection` para confirmar `connected: true`. Nenhuma alteração de código necessária.

## Segurança

A chave de API (`ASAAS_API_KEY`) já está armazenada como segredo no servidor e nunca é exposta ao cliente. A autenticação continua protegida pelo token — a restrição de IP é uma camada opcional que conflita com infraestrutura serverless.

