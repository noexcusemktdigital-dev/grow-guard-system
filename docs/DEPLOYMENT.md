# Processo de Deploy — Sistema Noé

> Gerado em 2026-05-02. Baseado em [ADR-001](adr/001-lovable-cloud-platform.md), [ADR-005](adr/005-migrations-idempotent-via-lovable.md), [ARCHITECTURE.md](ARCHITECTURE.md) e [ROLLBACK.md](ROLLBACK.md).

---

## 1. Visão Geral

O Sistema Noé opera inteiramente via **Lovable Cloud** como plataforma de deploy (ADR-001). Toda mudança flui pelo mesmo canal: **commit em `main` → Lovable detecta → deploy automático**.

```
merge em main
  ├─→ Frontend (Vite build) ──→ CDN Lovable (~2–5 min)
  ├─→ Edge Functions (Deno) ──→ Supabase (~até 10 min)
  └─→ Migrations SQL ─────────→ PostgreSQL (ordem numérica)
```

Não usar: `supabase db push`, `supabase functions deploy`, deploy manual de migrations, CLI do Supabase para escrita em produção.

Refs: Supabase `gxrhdpbbxfipeopdyygn` · Lovable project `1d5802a2-4462-4bb6-a30e-a9b2d444f68e` · GitHub `grupomassaru/grow-guard-system`

---

## 2. Frontend

Push em `main` → Lovable dispara build Vite → assets publicados no CDN em **~2–5 min**. Se o build falhar, a versão anterior permanece no ar.

Variáveis `VITE_` são injetadas em build-time pela Lovable — nunca colocar secrets nelas (ficam expostas no bundle). Em uso: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key pública por design).

---

## 3. Edge Functions

Push em `main` com alteração em `supabase/functions/` → Lovable sincroniza com o Supabase em **~até 10 min**.

Todas as funções usam `verify_jwt = false` (ADR-003) — autenticação feita internamente via `requireAuth(req)` de `_shared/auth.ts`. Nunca criar função sem auth interna. Alterações em `_shared/` afetam todas as ~104 funções simultaneamente — revisar com atenção.

Logs: Lovable Dashboard → Functions → [nome] → Logs.

---

## 4. Migrations SQL

Migrations ficam em `supabase/migrations/<timestamp>_descricao.sql`. A Lovable aplica em ordem numérica.

### Caminho Recomendado — Arquivo no Repo + SQL Editor (manual)

1. Criar `supabase/migrations/<timestamp>_descricao.sql` com SQL idempotente
2. Commitar, abrir PR, revisar (idempotência + RLS obrigatórios)
3. Merge em `main` → Lovable aplica automaticamente

Para validação prévia, executar o SQL via **Lovable SQL Editor** antes ou durante o merge. Mantém rastreabilidade no Git.

### Alternativo — Lovable API `/database/query` (programático)

Permite executar SQL sem commitar migration. Útil para hotfixes de dados (INSERT/UPDATE pontuais). **Não recomendado para alterações de schema**: SQL não aparece no SQL Editor da Lovable, sem rastreabilidade no Git.

### Regras Invioláveis (ADR-005)

1. **Commitada antes de aplicada** — nunca `supabase db push`
2. **Idempotente** — `IF NOT EXISTS`, `CREATE OR REPLACE`, `IF EXISTS`
3. **RLS na mesma migration** — `ENABLE ROW LEVEL SECURITY` + 4 policies (SELECT/INSERT/UPDATE/DELETE) no mesmo arquivo da `CREATE TABLE`
4. **`CREATE INDEX CONCURRENTLY`** para índices em tabelas com >10k linhas — em arquivo separado (não pode rodar em transação)

---

## 5. Secrets

Gerenciados **exclusivamente via Lovable UI** — não há endpoint público de API exposto para isso.

Para adicionar ou rotacionar: Lovable Dashboard → Settings → Secrets → adicionar/atualizar → fazer redeploy da função afetada.

> Rotação de secrets exige **confirmação dupla do Rafael** antes de qualquer ação. Listar como "Plano Futuro" separado — nunca incluir em lote automático.

---

## 6. PWA Assets

Assets em `public/`: `manifest.json`, `offline.html`, `icons/`.

Os ícones em `public/icons/` são **placeholders**. Rafael deve fornecer os PNGs finais nas dimensões especificadas em `public/PWA-ICONS-README.md`. Para atualizar: substituir os arquivos → commitar → merge em `main` → CDN atualiza automaticamente.

---

## 7. Rollback de Frontend

```bash
# Reverter commit específico (cria novo commit, não destrói histórico)
git revert <commit-hash> --no-edit
git push origin main
# Lovable rebuilda automaticamente — ~2–5 min
```

Alternativa via UI: Lovable Dashboard → Deployments → deploy anterior → "Redeploy".

---

## 8. Rollback de Edge Functions

Mesmo processo do frontend — git revert + push. Lovable ressincroniza as funções em **~até 10 min**.

```bash
git revert <commit-hash> --no-edit
git push origin main
```

---

## 9. Rollback de Migration

**Migrations não têm rollback automático.** Toda reversão é manual via Lovable SQL Editor ou Supabase Dashboard → SQL Editor.

Exemplos de reversão:

```sql
-- Coluna adicionada (destrói dados da coluna)
ALTER TABLE public.tabela DROP COLUMN IF EXISTS nova_coluna;

-- Policy RLS alterada
DROP POLICY IF EXISTS "nova_politica" ON public.tabela;
CREATE POLICY "politica_original" ON public.tabela FOR SELECT USING (<condição anterior>);

-- Constraint adicionada
ALTER TABLE public.tabela DROP CONSTRAINT IF EXISTS nome_constraint;
```

Após executar o SQL de reversão, commitar um arquivo `<timestamp>_revert_<descricao>.sql` para manter histórico.

---

## 10. CI Checks

Definido em `.github/workflows/ci.yml`. Roda em todo push para `main` e em todo PR contra `main`.

| Job | Comando | Bloqueia merge |
|-----|---------|----------------|
| TypeScript | `npx tsc --noEmit` | Sim |
| Lint | `npm run lint` (ESLint) | Não (`continue-on-error: true`) |
| Unit Tests | `npm test` (Vitest) | Não (`continue-on-error: true`) |
| Dependency Audit | `npm audit --audit-level=high` | Não (`continue-on-error: true`) |
| Bundle Size | `npm run build` + checar <50MB | Sim |

> **Tech debt (auditoria 2026-05-01):** Lint, Unit Tests e Audit têm `continue-on-error: true` — falhas não bloqueiam merge. Rastrear em [fix/ops-ci-strict](../CHANGELOG.md).

Rodar localmente antes de abrir PR: `npx tsc --noEmit && npm run lint && npm test && npm run build`

---

## 11. Monitoramento Pós-Deploy

**Logs de edge functions:** Lovable Dashboard → Functions → [nome] → Logs. Logs estruturados com `correlationId`, `fnName`, `durationMs`.

**DLQ (`job_failures`):** Verificar após deploys que alterem processamento assíncrono:

```sql
SELECT job_type, error_code, count(*), max(failed_at)
FROM job_failures
WHERE resolved_at IS NULL AND failed_at > now() - interval '1 hour'
GROUP BY job_type, error_code;
```

Ver [runbooks/dlq-investigation.md](runbooks/dlq-investigation.md).

**`dsr_requests` (LGPD):** Após deploys que alterem fluxos de dados pessoais, verificar `SELECT status, count(*) FROM dsr_requests WHERE created_at > now() - interval '24 hours' GROUP BY status`. Ver [runbooks/dsr-processing.md](runbooks/dsr-processing.md).

**Sentry/GlitchTip:** Ainda não configurado. `correlationId` nos logs está preparado para integração futura.

**Supabase Dashboard:** https://supabase.com/dashboard/project/gxrhdpbbxfipeopdyygn — Auth, Query Performance, Functions Usage.

---

## 12. Rotinas Pós-Deploy

Após deploys que afetam funcionalidades críticas:

- [ ] Login nos 3 portais: Franqueadora, Franqueado, Cliente final
- [ ] Verificar DLQ limpa (query em `job_failures` acima)
- [ ] Fluxo de pagamento Asaas (se edge fns de cobrança foram alteradas)
- [ ] Envio/recebimento WhatsApp (se integração Evolution foi alterada)
- [ ] Após migrations: verificar RLS ativo (`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`)

---

## 13. Janela de Deploy

Não há janela formal — deploy é contínuo e automático via push em `main`. Recomendações:

- Evitar deploys em **sextas-feiras à tarde** e **vésperas de feriados**
- Migrations destrutivas (`DROP COLUMN`, `DROP TABLE`) com revisão redobrada
- Em incidente em horário de pico: preferir rollback imediato a tentar hotfix

---

## 14. Como Saber se o Deploy Deu Certo

| Verificar | Onde | Resultado esperado |
|-----------|------|--------------------|
| Build frontend | Lovable Dashboard → Deployments | Status "Success" |
| CDN atualizado | Browser → URL do projeto | Página carrega, versão nova visível |
| Edge functions | Lovable Dashboard → Functions | Sem erro de deploy |
| Migrations aplicadas | Supabase Dashboard → Table Editor | Tabelas/colunas presentes |
| DLQ limpa | Query `job_failures` | Sem failures novos na última hora |
| CI passou | GitHub → Actions | Jobs obrigatórios verdes |

**Sinais de problema:** build "Failed" no Lovable (versão anterior continua no ar) · entries novos em `job_failures` após deploy · erros 500 nas edge functions (verificar logs) · login falhando (verificar auth no Supabase) · tela em branco no frontend (verificar console JS).

---

*Referências: [ARCHITECTURE.md](ARCHITECTURE.md) · [ROLLBACK.md](ROLLBACK.md) · [adr/001](adr/001-lovable-cloud-platform.md) · [adr/005](adr/005-migrations-idempotent-via-lovable.md) · [runbooks/](runbooks/README.md)*
