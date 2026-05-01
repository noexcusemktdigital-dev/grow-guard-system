# ADR-002: Multi-tenant via organization_id + RLS

- Status: Aceito
- Data: 2026-05-01
- Decisores: Rafael Marutaka (founder/CTO), Davi Tesch (cliente NOEXCUSE)

## Contexto

O Sistema Noé é um SaaS para uma rede de franquias com 3 perfis distintos: administrador da rede (vê todas as unidades), franqueado (vê apenas a sua unidade) e cliente final (vê apenas seus próprios dados). O modelo de negócio prevê crescimento para múltiplas franquias e potencialmente múltiplas redes (multi-marca). Cada franquia precisa de isolamento estrito de dados — nenhum franqueado pode ver clientes/pedidos/financeiro de outra franquia.

Há três abordagens clássicas de multi-tenancy: (1) database-per-tenant, (2) schema-per-tenant, (3) row-level (shared schema com discriminator + RLS). Database/schema-per-tenant escalam mal no Supabase (auth e storage compartilhados, custo de migrations N×) e são overkill para o nível de isolamento exigido (LGPD comum, sem requisitos PCI/HIPAA específicos).

O Postgres do Supabase oferece Row Level Security nativo, integrado com `auth.uid()` e claims JWT. Isso permite implementar isolamento de tenant declarativamente, sem depender da camada de aplicação acertar o `WHERE` em todo lugar.

## Decisão

**Multi-tenancy é implementado via coluna `organization_id` em toda tabela de negócio, com policies RLS que filtram por essa coluna.** Cada usuário tem `organization_id` no seu perfil (`profiles.organization_id`); policies RLS leem esse valor (via função `current_user_organization_id()` ou JWT claim) e restringem `SELECT/INSERT/UPDATE/DELETE` ao tenant correto. Roles de admin de rede recebem policies separadas que permitem cross-tenant.

## Consequências

### Positivas
- Isolamento garantido pelo banco — bug na aplicação não vaza dados entre tenants
- Custo operacional baixo: 1 schema, 1 migration por mudança, backups unificados
- Onboarding de nova franquia = INSERT em `organizations` (sem provisionar schema/db)
- Cross-tenant analytics (rede vê tudo) é trivial com policy de admin
- Compatível com Supabase Realtime, Storage e Auth sem workaround

### Negativas / Trade-offs
- Toda tabela de negócio precisa de `organization_id` (não esquecer em migration nova)
- Toda policy RLS precisa cobrir os 4 comandos (SELECT/INSERT/UPDATE/DELETE) — fácil esquecer um
- Performance: queries precisam de índice em `organization_id`; sem ele, scan completo
- Migração futura para schema-per-tenant exigiria rebuild caso surja exigência regulatória
- Risco de "noisy neighbor": franquia muito grande pode degradar queries de outras

## Alternativas consideradas

- **Schema-per-tenant:** isolamento mais forte, mas custo N× em migrations e operação. Rejeitado.
- **Database-per-tenant:** máximo isolamento, mas Supabase não suporta nativamente; exigiria múltiplos projetos Supabase. Rejeitado.
- **Filtro só na aplicação (sem RLS):** rápido de implementar, mas qualquer bug vaza dados. Rejeitado por risco LGPD.
