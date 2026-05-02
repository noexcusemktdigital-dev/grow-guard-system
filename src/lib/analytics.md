# Analytics — guia de uso

## Eventos críticos a trackear

(usar ANALYTICS_EVENTS — não strings literais)

| Quando | Evento | Properties |
|--------|--------|-----------|
| Após signup | SIGNUP_COMPLETED | plan, source |
| Compra credits OK | CREDITS_PURCHASED | amount, pack_id |
| Geração IA OK | AI_CONTENT_GENERATED | feature, prompt_version |
| Geração IA falha | AI_CONTENT_FAILED | feature, error |
| OAuth conecta | INTEGRATION_CONNECTED | provider |
| Lead criado | LEAD_CREATED | source |
| DSR pedido | DSR_EXPORT_REQUESTED ou DSR_DELETE_REQUESTED | (sem PII) |

## Provider

Atual: noop (loga em dev). Quando Rafael decidir (PostHog/Mixpanel/Segment):
1. Implementar AnalyticsProvider
2. Chamar setAnalyticsProvider(provider) no main.tsx
3. Trocar é trivial — events não mudam

## Sanitização

Layer NUNCA envia campos com nomes que contenham: email, cpf, cnpj, phone, telefone, password, senha, token, access_token, secret, api_key. Validado em cada call.

## Adicionar novo evento

1. Adicionar em ANALYTICS_EVENTS (taxonomy)
2. Documentar nesta tabela
3. Usar via analytics.track(ANALYTICS_EVENTS.MEU_EVENTO, { ... })
