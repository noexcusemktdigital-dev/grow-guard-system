

# Corrigir integração Asaas em produção

## Problema
O segredo `ASAAS_PROXY_URL` contém um valor invalido. Quando `asaasFetch` tenta criar um cliente HTTP com proxy, o Deno rejeita a URL e todas as Edge Functions financeiras quebram com erro 500.

No sandbox funcionava porque o segredo provavelmente nao estava definido, fazendo o codigo usar `fetch` direto (fallback).

## Solucao (2 partes)

### 1. Tornar o `asaasFetch` resiliente (codigo)
Atualizar `supabase/functions/_shared/asaas-fetch.ts` para:
- Validar se a URL do proxy e valida antes de usá-la (verificar se começa com `http://` ou `https://`)
- Se o proxy falhar, fazer fallback automatico para fetch direto em vez de crashar
- Adicionar log de warning quando o proxy falha

```text
asaasFetch(url, options)
  |
  +-- ASAAS_PROXY_URL definida e valida?
  |     SIM -> tenta fetch com proxy
  |             falhou? -> log warning + fallback fetch direto
  |     NAO -> fetch direto
```

### 2. Corrigir o valor do segredo `ASAAS_PROXY_URL`
- Se voce tem um proxy com IP estatico configurado, o valor deve ser uma URL completa como `http://usuario:senha@ip:porta` ou `http://ip:porta`
- Se voce **nao** tem um proxy configurado ainda, o segredo deve ser removido (definido como vazio) para que o sistema use fetch direto

## Impacto
- Todas as 8+ Edge Functions que usam `asaasFetch` serao beneficiadas automaticamente
- Nenhuma alteracao de schema ou migracao necessaria
- Apenas 1 arquivo de codigo alterado: `supabase/functions/_shared/asaas-fetch.ts`

