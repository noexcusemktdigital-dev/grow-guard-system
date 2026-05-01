# Architecture Decision Records — Sistema Noé

Decisões arquiteturais importantes. Cada ADR é imutável após "Aceito" — para reverter, criar novo ADR `Substitui ADR-NNN`.

| # | Título | Status |
|---|--------|--------|
| [001](001-lovable-cloud-platform.md) | Lovable Cloud como plataforma única | Aceito |
| [002](002-multi-tenant-rls.md) | Multi-tenant via organization_id + RLS | Aceito |
| [003](003-edge-fns-verify-jwt-false.md) | Edge functions com verify_jwt=false por padrão | Aceito |
| [004](004-ai-gateway-gemini.md) | AI Gateway Lovable (Gemini-only) | Aceito |
| [005](005-migrations-idempotent-via-lovable.md) | Migrations idempotentes commitadas | Aceito |

## Como criar um novo ADR

1. Copiar o template (qualquer ADR existente)
2. Numerar sequencialmente (próximo: 006)
3. Status inicial: Proposto → após discussão: Aceito/Rejeitado
4. Adicionar entrada nesta tabela
