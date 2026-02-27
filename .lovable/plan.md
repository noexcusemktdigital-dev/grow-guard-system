

# Descobrir o IP das Edge Functions

## Objetivo

Criar uma Edge Function temporaria que faz `fetch("https://ipinfo.io/ip")` e retorna o IP publico de saida das Edge Functions. Com esse IP, voce podera adiciona-lo na lista de IPs autorizados do Asaas de producao.

## Implementacao

### 1. Criar Edge Function `get-outbound-ip/index.ts`

Uma funcao simples que:
- Faz GET em `https://ipinfo.io/ip`
- Retorna o IP no corpo da resposta
- Inclui CORS headers

### 2. Chamar a funcao via curl/teste

Apos o deploy, chamar a funcao para obter o IP e informar ao usuario.

### 3. Proximo passo

Com o IP em maos, voce adiciona no painel do Asaas (Configuracoes > Integracoes > API > IPs autorizados) e testamos a conexao novamente com `asaas-test-connection`.

