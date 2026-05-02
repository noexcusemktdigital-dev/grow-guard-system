# Runbook: 429 burst em generate-* fns

**Severidade:** P2
**Aplica a:** `generate-caption`, `generate-hashtags`, `generate-ad-copy`, e qualquer fn prefixada `generate-*`

## Sintoma

- Frontend recebe HTTP 429 com body `{ "error": "rate_limit_exceeded", "retry_after": <segundos> }`
- Usuários reclamam de "erro ao gerar conteúdo" em horários de pico
- Logs mostram rajadas de requisições dentro de janela curta (burst)

## Diagnóstico

```sql
-- Ver rate limit hits recentes por user e fn
SELECT
  user_id,
  fn_name,
  count(*) AS hits,
  min(created_at) AS first_hit,
  max(created_at) AS last_hit
FROM rate_limit_log
WHERE created_at > now() - interval '1 hour'
  AND status = 'rejected'
GROUP BY user_id, fn_name
ORDER BY hits DESC
LIMIT 20;
```

```sql
-- Ver configuração atual dos limites
SELECT fn_name, max_requests, window_seconds, burst_allowance
FROM rate_limit_config
ORDER BY fn_name;
```

Se tabela `rate_limit_config` não existir: limites estão hardcoded nas fns. Verificar código da fn.

```sql
-- Usuário específico com muitos hits
SELECT created_at, fn_name, status, ip_address
FROM rate_limit_log
WHERE user_id = '<USER_UUID>'
  AND created_at > now() - interval '30 minutes'
ORDER BY created_at DESC;
```

## Mitigação

### Usuário legítimo sendo bloqueado (burst pontual)
Nenhuma ação imediata necessária — o 429 inclui `retry_after` para o frontend respeitar. Se for caso isolado de usuário VIP, pode-se aumentar limite temporariamente:

```sql
-- Ajuste temporário (desfazer após pico)
UPDATE rate_limit_config
SET burst_allowance = burst_allowance + 10
WHERE fn_name = 'generate-caption';
```

### Usuário abusivo (bot ou scraper)
```sql
-- Bloquear user_id temporariamente
INSERT INTO rate_limit_blocks (user_id, blocked_until, reason)
VALUES ('<USER_UUID>', now() + interval '1 hour', 'rate_limit_abuse_manual');
```

### Pico legítimo de todos os usuários (evento/lançamento)
1. Notificar Rafael antes de aumentar limites globais
2. Aumentar `max_requests` na `rate_limit_config` para as fns afetadas
3. Monitorar custo de OpenAI/Anthropic — aumento de limite aumenta custo

## Causa raiz comum

- Frontend disparando múltiplos requests simultâneos (falta de debounce)
- Usuário apertando botão múltiplas vezes sem feedback visual de loading
- Script/automação externa descobriu endpoint público
- Configuração de limite muito restritiva para horário de pico

## Prevenção

- Frontend: adicionar debounce 500ms em botões de geração
- Frontend: desabilitar botão enquanto request está em andamento
- Monitorar P95 de taxa de 429s por fn — alerta se >5% dos requests forem rejeitados
- Revisar limites mensalmente com base nos padrões de uso reais
