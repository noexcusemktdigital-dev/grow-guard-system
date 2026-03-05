

# Configurar Proxy HTTP com IP Estático para Asaas

## Situação Atual

O código já suporta proxy — o helper `asaasFetch` em `supabase/functions/_shared/asaas-fetch.ts` lê o segredo `ASAAS_PROXY_URL` e roteia todas as chamadas automaticamente. Nenhuma alteração de código é necessária.

## O que falta

Provisionar um serviço de proxy externo com IP estático e configurar o segredo.

## Passo a passo

### 1. Contratar um serviço de proxy com IP estático

Opções recomendadas (compatíveis com Deno/Edge Functions):

| Serviço | Preço aprox. | Como funciona |
|---------|-------------|---------------|
| **QuotaGuard Static** | ~$19/mês | Fornece URL de proxy HTTP com IP fixo |
| **Fixie** | ~$5/mês | Mesmo modelo, URL de proxy HTTP |
| **IPRoyal Static** | ~$3/mês | Proxy residencial com IP dedicado |

O serviço fornecerá uma URL no formato:
```
http://usuario:senha@proxy.exemplo.com:9293
```

### 2. Configurar o segredo `ASAAS_PROXY_URL`

Após obter a URL do proxy, eu configuro o segredo `ASAAS_PROXY_URL` com o valor fornecido.

### 3. Adicionar o IP fixo do proxy no Asaas

No painel Asaas: **Minha Conta → Acessos e segurança → Lista de IPs autorizados** — adicionar o IP estático fornecido pelo serviço de proxy.

### 4. Testar a conexão

Executar `asaas-test-connection` para confirmar que `connected: true` e `proxy_url: "valid"`.

## Resultado

Todas as chamadas de saída para o Asaas passarão pelo proxy com IP fixo, eliminando definitivamente o problema de rotação de IP.

## Ação necessária do usuário

Escolher e contratar um dos serviços de proxy acima e fornecer a URL gerada para que eu configure o segredo.

