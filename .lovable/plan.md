

# Limpar ASAAS_PROXY_URL e Testar Conexão

## O que será feito

1. **Atualizar o secret `ASAAS_PROXY_URL`** para valor vazio (`""`)
   - O código em `_shared/asaas-fetch.ts` já trata isso: quando vazio, usa `fetch` direto sem proxy

2. **Executar `asaas-test-connection`** para verificar se a API responde sem o proxy interferindo

## Por que isso pode resolver

O `ASAAS_PROXY_URL` contém atualmente um valor marcado como "invalid". Mesmo com o fallback no código, a tentativa de criar o `HttpClient` com proxy inválido pode estar causando comportamento inesperado. Remover elimina essa variável da equação.

