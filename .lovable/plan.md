

# Corrigir erro "Invalid token" na integração Asaas

## Problema

A funcao `asaas-create-subscription` esta retornando `{ error: "Invalid token" }` ao tentar criar um cliente/assinatura no Asaas. Isso indica que a chamada API esta sendo rejeitada.

## Causa provavel

O secret `ASAAS_BASE_URL` foi previamente identificado como incorreto -- estava apontando para a URL do webhook (`https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/asaas-webhook`) em vez da API do Asaas Sandbox.

## O que sera feito

1. **Atualizar `ASAAS_BASE_URL`** para o valor correto: `https://api-sandbox.asaas.com/v3`
2. **Revalidar `ASAAS_API_KEY`** -- confirmar que a chave sandbox esta corretamente salva (re-salvar se necessario)
3. **Testar novamente** o fluxo de compra pelo usuario teste

## Estado correto dos secrets

| Secret | Valor esperado |
|--------|---------------|
| `ASAAS_BASE_URL` | `https://api-sandbox.asaas.com/v3` |
| `ASAAS_API_KEY` | Chave sandbox `$aact_hmlg_...` |
| `ASAAS_WEBHOOK_TOKEN` | Token do webhook configurado |

## Nenhuma alteracao de codigo

As funcoes ja usam `Deno.env.get("ASAAS_BASE_URL")` e `Deno.env.get("ASAAS_API_KEY")` -- o problema e apenas nos valores dos secrets.

