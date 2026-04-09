# Sistema Noe — Guia de Rollback

## Rollback de Deploy (Edge Functions)

### Via Lovable Cloud (recomendado)
1. Acesse https://lovable.dev → projeto Sistema Noe
2. Em "Deployments", clique no deploy anterior
3. Clique "Redeploy" para reverter

### Via CLI (emergência)
```bash
# Reverter para commit específico
git log --oneline -10
git revert HEAD --no-edit
git push origin main
# Lovable detecta push e faz redeploy automático
```

## Rollback de Migration SQL

⚠️ Migrations SQL são irreversíveis por padrão. Estratégias:

### 1. Rollback de Política RLS
```sql
-- Exemplo: reverter política alterada
DROP POLICY IF EXISTS "nova_politica" ON public.tabela;
CREATE POLICY "politica_original" ON public.tabela FOR SELECT USING (true);
```

### 2. Rollback de Coluna Adicionada
```sql
-- CUIDADO: perde dados na coluna
ALTER TABLE public.tabela DROP COLUMN IF EXISTS nova_coluna;
```

### 3. Rollback de Constraint
```sql
ALTER TABLE public.tabela DROP CONSTRAINT IF EXISTS nome_constraint;
```

## Rollback de Feature (Frontend)

```bash
# Identificar commit problemático
git log --oneline --since="2 days ago"

# Reverter commit específico
git revert <commit-hash> --no-edit
git push origin main
```

## Checklist Pós-Rollback

- [ ] Verificar que a feature voltou ao estado anterior
- [ ] Rodar `npm test -- --run` (420 testes devem passar)
- [ ] Verificar `npx tsc --noEmit` sem erros
- [ ] Testar login nos 3 portais (franqueadora, franqueado, cliente)
- [ ] Verificar que RLS ainda está ativo nas tabelas críticas

## Contatos de Emergência

- **Supabase Dashboard:** https://supabase.com/dashboard/project/gxrhdpbbxfipeopdyygn
- **GitHub Repo:** https://github.com/grupomassaru/grow-guard-system
- **Lovable Project:** https://lovable.dev/projects/1d5802a2-4462-4bb6-a30e-a9b2d444f68e
