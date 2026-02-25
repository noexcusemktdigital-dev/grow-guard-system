

# Testar Conexao Asaas Sandbox

## Status Atual

O webhook `asaas-webhook` esta funcional -- os logs confirmam que recebeu e processou os eventos de teste com sucesso. Porem, ainda nao validamos se a **chave API do Sandbox** consegue autenticar chamadas na API do Asaas (listar clientes, criar cobranças, etc).

## O que sera feito

### 1. Criar funcao de teste de conexao

Criar uma Edge Function temporaria `asaas-test-connection` que faz uma chamada GET simples a API do Asaas Sandbox (`/customers?limit=1`) usando a `ASAAS_API_KEY` configurada. Retorna:
- Se a conexao foi bem sucedida
- URL base sendo usada
- Quantidade de clientes existentes no sandbox

### 2. Executar o teste

Chamar a funcao para validar que a chave sandbox esta autenticando corretamente.

### 3. Limpeza

Apos confirmar que funciona, remover a funcao de teste (opcional -- pode ser util para diagnosticos futuros).

## Resultado Esperado

Resposta com `"connected": true` confirmando que todas as Edge Functions de pagamento estao prontas para uso no ambiente Sandbox.

## Detalhes Tecnicos

- A funcao faz apenas um `GET /customers?limit=1` com o header `access_token`
- Nenhuma alteracao em tabelas ou dados
- Nenhuma dependencia de autenticacao de usuario (chamada direta)
