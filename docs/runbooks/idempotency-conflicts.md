# Runbook: 409 idempotency_key_conflict no frontend

**Severidade:** P2
**Aplica a:** Todas as edge fns que aceitam `Idempotency-Key` header

## Sintoma

- Frontend recebe HTTP 409 com body `{ "error": "idempotency_key_conflict" }`
- Usuário tenta ação e vê erro sem contexto claro
- Logs mostram chave duplicada dentro da janela de expiração (24h padrão)

## Diagnóstico

```sql
-- Ver key em conflito (user e fn)
SELECT key, fn_name, response_status, created_at, expires_at
FROM idempotency_keys
WHERE key = '<KEY_DO_HEADER>'
  AND expires_at > now();
```

Se `response_status = 200` → requisição anterior completou com sucesso. O 409 é correto — frontend deve usar a resposta cacheada.

Se `response_status IS NULL` → requisição anterior falhou no meio. Chave "travada".

```sql
-- Chaves travadas (sem response_status, ainda válidas)
SELECT key, fn_name, created_at, expires_at
FROM idempotency_keys
WHERE response_status IS NULL
  AND expires_at > now()
  AND created_at < now() - interval '5 minutes';
```

## Mitigação

### Caso normal (409 esperado — duplicata detectada)
O sistema está funcionando corretamente. Frontend deve:
1. Ler a resposta 409 e usar o campo `cached_response` se presente
2. Não reenviar com a mesma key — gerar nova key UUID v4

### Chave travada (requisição anterior falhou sem limpar key)
```sql
-- Liberar chave travada (apenas se confirmado que a ação não completou)
UPDATE idempotency_keys
SET expires_at = now() - interval '1 second'
WHERE key = '<KEY>'
  AND response_status IS NULL;
```
Após liberar, o usuário pode retentar.

### Limpeza de massa (manutenção)
```sql
-- Expirar chaves antigas (pg_cron já faz isso — execução manual se necessário)
DELETE FROM idempotency_keys WHERE expires_at < now();
```

## Causa raiz comum

- Frontend gerou a mesma key UUID para requests distintos (bug no gerador)
- Usuário clicou 2× rápido e o segundo request usou a mesma key
- Retry automático do frontend reusou key da tentativa anterior que falhou

## Prevenção

- Frontend deve gerar UUID v4 fresco por interação do usuário (não reutilizar entre retries)
- Documentar: retries devem usar nova key, não a original
- Timeout de lock: chaves `response_status IS NULL` expiram em 2min (não 24h)
