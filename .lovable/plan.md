

# Proxy com IP Fixo para Asaas

## Problema

As Edge Functions usam IPs dinamicos que mudam a cada execucao, causando o erro `not_allowed_ip` na API de producao do Asaas.

## Solucao

Usar um servico de proxy com IP estatico (como **QuotaGuard Static** ou **Fixie**) para rotear todas as chamadas ao Asaas atraves de um IP fixo que sera cadastrado no painel do Asaas.

## Passos

### 1. Voce contrata um servico de proxy estatico

Servicos recomendados (tem planos gratuitos/baratos):
- **QuotaGuard Static** (quotaguard.com) — plano gratis com 250 req/dia
- **Fixie** (fixie.ai) — plano gratis com 500 req/mes

Apos criar a conta, voce recebera uma URL de proxy no formato:
```text
http://usuario:senha@proxy.quotaguard.com:9293
```

### 2. Salvar a URL do proxy como secret

Armazenar `ASAAS_PROXY_URL` nos secrets do projeto para uso nas Edge Functions.

### 3. Criar helper `asaas-fetch` compartilhado

Criar uma funcao utilitaria que todas as Edge Functions Asaas importam. Ela usa `Deno.createHttpClient` com o proxy configurado:

```typescript
// Exemplo do helper
export function asaasFetch(url: string, options?: RequestInit) {
  const proxyUrl = Deno.env.get("ASAAS_PROXY_URL");
  if (proxyUrl) {
    const client = Deno.createHttpClient({ proxy: { url: proxyUrl } });
    return fetch(url, { ...options, client });
  }
  return fetch(url, options);
}
```

Se o proxy nao estiver configurado, faz a chamada direta (fallback para sandbox/testes).

### 4. Atualizar as 8 Edge Functions do Asaas

Substituir todos os `fetch()` que chamam a API do Asaas pela funcao `asaasFetch()` nas seguintes functions:

1. `asaas-test-connection`
2. `asaas-charge-client`
3. `asaas-charge-franchisee`
4. `asaas-charge-system-fee`
5. `asaas-create-charge`
6. `asaas-create-subscription`
7. `asaas-list-payments`
8. `asaas-webhook` (se faz chamadas de volta ao Asaas)

### 5. Cadastrar o IP fixo no Asaas

Com o IP estatico do servico de proxy, voce adiciona em:
**Asaas > Configuracoes > Integracoes > API > IPs autorizados**

### 6. Testar a conexao

Chamar `asaas-test-connection` para confirmar que o proxy funciona e o Asaas aceita a requisicao.

## Notas Tecnicas

- `Deno.createHttpClient` e nativo do Deno e suporta proxy HTTP/HTTPS sem dependencias externas
- O helper fica em um arquivo separado que as Edge Functions importam via caminho relativo
- O fallback sem proxy garante que o sandbox continua funcionando sem configuracao adicional
- Custo estimado: R$0 a R$50/mes dependendo do volume de chamadas

