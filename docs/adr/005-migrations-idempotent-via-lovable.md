# ADR-005: Migrations idempotentes commitadas no repo

- Status: Aceito
- Data: 2026-05-01
- Decisores: Rafael Marutaka (founder/CTO), Davi Tesch (cliente NOEXCUSE)

## Contexto

O Sistema Noé usa Lovable Cloud (ver ADR-001) para aplicar migrations SQL. O modelo da Lovable é diferente do `supabase db push` clássico: a Lovable lê arquivos de migration do repositório Git e aplica cada arquivo na ordem, registrando o que já foi aplicado. Isso significa que **cada migration precisa estar commitada no repo ANTES de ser aplicada** — a Lovable não roda SQL ad-hoc do editor.

Há dois riscos principais:
1. **Drift entre estado local e produção:** se um dev rodar `supabase db push` localmente, o histórico do Supabase fica fora de sincronia com os arquivos no repo, e migrations futuras podem falhar ou se aplicar fora de ordem.
2. **Re-execução acidental:** retry, replay, ou aplicação manual em ambientes diferentes pode rodar a mesma migration duas vezes; sem idempotência, o segundo run quebra (`relation already exists`, `column already exists`, etc.).

Adicionalmente, RLS é parte intrínseca do modelo de dados (ver ADR-002): criar tabela e esquecer policy gera tabela exposta ou inacessível. Migrations que criam tabelas de negócio devem incluir RLS na mesma transação.

Em produção, índices criados sem `CONCURRENTLY` lockam a tabela; em uma rede de franquias com uso 24/7, isso é inaceitável para tabelas grandes (clientes, pedidos, agendamentos).

## Decisão

**Toda migration do Sistema Noé segue 4 regras invioláveis:**

1. **Commitada antes de aplicada.** Nunca rodar `supabase db push`. A Lovable é a única via de aplicação.
2. **Idempotente.** Usar `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `DROP ... IF EXISTS`. Migrations devem ser seguras para re-execução.
3. **RLS na mesma migration que cria a tabela.** `ENABLE ROW LEVEL SECURITY` e as 4 policies (SELECT/INSERT/UPDATE/DELETE) ficam no mesmo arquivo da `CREATE TABLE`.
4. **`CREATE INDEX CONCURRENTLY` em produção** para índices em tabelas com >10k linhas. `CONCURRENTLY` não pode rodar dentro de transação — esses índices vão em arquivo de migration separado.

## Consequências

### Positivas
- Estado do banco é reproduzível a partir do repo (DR + onboarding + ambientes de teste)
- Re-execução acidental não quebra deploy
- Tabela nunca fica sem RLS — bug de policy é detectado no review da migration
- Sem locks longos em produção (índices `CONCURRENTLY`)
- Histórico de migrations é o histórico Git — uma fonte da verdade

### Negativas / Trade-offs
- Devs precisam aprender o padrão (a maioria está acostumada com `db push` direto)
- Forks de migrations idempotentes são um pouco mais verbosas que `CREATE TABLE` puro
- `CREATE INDEX CONCURRENTLY` exige migration separada (não dá pra agrupar com o resto)
- Fácil esquecer RLS e descobrir depois — code review tem que cobrir isso
- Migrations destrutivas (`DROP COLUMN`) ainda exigem cuidado manual extra

## Alternativas consideradas

- **`supabase db push` clássico:** rápido localmente, mas dessincroniza estado com Lovable. Rejeitado (vide ADR-001).
- **Migrations não-idempotentes (CREATE TABLE puro):** mais conciso, mas qualquer retry quebra. Rejeitado.
- **RLS em migration separada:** flexibiliza ordering, mas abre janela onde a tabela existe sem policy. Rejeitado por risco de vazamento.
- **Índices comuns (sem CONCURRENTLY) em produção:** mais simples, mas trava tabelas grandes. Rejeitado pelo SLA do produto.
