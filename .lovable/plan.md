

## Diagnóstico: Chave Asaas sendo rejeitada como `invalid_access_token`

### Análise do código

O código está correto na forma de enviar:
- Header: `access_token: <valor>` (linha 53 de `asaas-test-connection/index.ts`)
- Base URL: `https://api.asaas.com/v3`
- User-Agent: `NOE-Platform`

### Problema provável

O valor do secret `ASAAS_API_KEY` armazenado pode conter caracteres invisíveis (espaços, quebras de linha, aspas) que foram adicionados durante a cópia/colagem. O Asaas retorna `invalid_access_token` quando a chave não bate exatamente.

### Plano

1. **Adicionar logging de diagnóstico** na função `asaas-test-connection` para exibir:
   - Comprimento exato da chave (`asaasApiKey.length`)
   - Primeiros 15 caracteres (`asaasApiKey.substring(0, 15)`)
   - Se contém espaços ou quebras de linha (`asaasApiKey.includes('\n')`, `.trim() !== asaasApiKey`)
   - O response body completo do Asaas

2. **Aplicar `.trim()` na chave** antes de enviar, para eliminar espaços/quebras acidentais

3. **Re-deploy e testar** a conexão para ver o diagnóstico completo nos logs

### Mudança técnica

Arquivo: `supabase/functions/asaas-test-connection/index.ts`
- Na linha 48, após ler `ASAAS_API_KEY`, aplicar `.trim()` e logar informações de debug
- Incluir no response JSON os campos de diagnóstico (`key_length`, `key_prefix`, `key_has_whitespace`)

Isso vai revelar definitivamente se a chave armazenada está corrompida ou se é outro problema.

