# Security Policy

## Versões suportadas

| Branch | Suportado |
|--------|-----------|
| `main` | ✅ ativo — patches aplicados imediatamente |
| branches de feature | ⚠️ apenas enquanto o PR está aberto |
| branches arquivados | ❌ não recebem correções |

## Reportar uma vulnerabilidade

**NÃO abra uma issue pública.** Reporte privadamente:

- **Email:** rafael@grupolamadre.com.br
- **Assunto:** `[SECURITY] grow-guard-system: <título curto>`
- **Inclua:**
  - Passos para reproduzir
  - Impacto estimado (dados expostos, escopo de tenant, etc.)
  - Severidade sugerida (CVSS opcional)
  - Versão/commit afetado, se identificado

**Resposta em até 48 horas.** O fix será publicado antes de qualquer divulgação pública.

## Coordinated Disclosure

Seguimos o modelo de **coordinated disclosure com prazo de 90 dias**. Após esse prazo, a vulnerabilidade pode ser divulgada publicamente independentemente do status do patch. Ver detalhes em [`docs/SECURITY-POLICY.md`](docs/SECURITY-POLICY.md#13-disclosure-timeline).

## Bug Bounty

Não há programa formal de recompensas. Pesquisadores responsáveis serão reconhecidos no `CHANGELOG.md` (nome ou handle, a seu critério).

## Padrões de segurança já implementados

Consulte [`docs/SECURITY-POLICY.md`](docs/SECURITY-POLICY.md) para a política completa, incluindo:

- Multi-tenant isolation (RLS + `assertOrgMember`)
- HMAC SHA-256 em webhooks externos (Meta, WhatsApp Cloud, Asaas)
- Rate limiting nas edge functions `generate-*` (16 req/16 min)
- CORS com allowlist por origin
- Autenticação de cron com `CRON_SECRET` (constant-time compare)
- Idempotência em mutações financeiras
- Redaction de PII em logs
- Soft-delete e DSR endpoints (LGPD)
