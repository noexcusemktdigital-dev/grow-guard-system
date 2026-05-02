# Runbook: Webhooks Meta/WhatsApp rejeitando 100%

**Severidade:** P0
**Aplica a:** `meta-leadgen-webhook`, `whatsapp-cloud-webhook`

## Sintoma

- Logs do Lovable mostram: `HMAC validation failed: missing_app_secret_env` ou `invalid_signature`
- Leads do Meta param de chegar no CRM
- Mensagens de WhatsApp Cloud não disparam chatbot
- HTTP 401 ou 403 em todas as requisições de webhook

## Diagnóstico

1. Verificar logs no Lovable Dashboard:
   ```
   Sistema NOE → Functions → meta-leadgen-webhook → Logs
   Buscar: "HMAC validation failed"
   ```

2. Confirmar se secrets estão configuradas:
   - Lovable Dashboard → Settings → Secrets
   - Esperado: `META_APP_SECRET` e `WHATSAPP_APP_SECRET`

3. Confirmar valor correto (Meta App Dashboard):
   ```
   developers.facebook.com → seu app → Settings → Basic → App Secret
   ```

4. Checar via query se eventos estão sendo registrados:
   ```sql
   SELECT provider, count(*), max(received_at)
   FROM webhook_events
   WHERE received_at > now() - interval '1 hour'
   GROUP BY provider;
   ```
   Se `meta` ou `whatsapp` não aparecer → eventos não chegam ou falham antes de persistir.

## Mitigação imediata

### Se secret ausente
1. Lovable Dashboard → Settings → Secrets → Add Secret
2. Nome: `META_APP_SECRET` ou `WHATSAPP_APP_SECRET`
3. Valor: copiado do Meta App Dashboard
4. Save → fns são reiniciadas automaticamente em ~30s

### Se secret errado (rotacionado pelo Meta)
1. **Aguardar 2× confirmação explícita do Rafael** (regra absoluta — ver [secret-rotation.md](secret-rotation.md))
2. Atualizar valor em Lovable Secrets
3. Rebroadcast eventos perdidos: não há retry automático — se houver leads/mensagens não capturadas durante a janela, importar manualmente via Meta Graph API

### Verificar após correção
```sql
SELECT provider, external_event_id, received_at, processed_at
FROM webhook_events
WHERE provider IN ('meta', 'whatsapp')
ORDER BY received_at DESC
LIMIT 5;
```
`processed_at IS NOT NULL` confirma que o pipeline voltou.

## Causa raiz comum

- Secret nunca foi configurada após deploy inicial (HMAC fail-closed by design)
- Meta App Secret rotacionado no painel sem aviso
- App incorreto vinculado (test app vs prod app)
- Deploy novo que sobrescreveu env vars

## Prevenção

- Adicionar synthetic check que faz POST de teste assinado na fn 1x/h
- Alerta quando 3+ HMAC failures em 5min → notificação Slack/email
- Documentar em onboarding: `META_APP_SECRET` e `WHATSAPP_APP_SECRET` são obrigatórias pré-deploy
- Checklist pré-deploy inclui verificação de secrets presentes
