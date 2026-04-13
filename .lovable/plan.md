

# Corrigir erro ao salvar Acompanhamento do Cliente

## Problema identificado

A política RLS (Row Level Security) da tabela `client_followups` só permite INSERT/UPDATE para membros da `organization_id` (franqueadora). Os franqueados (que acessam via `unit_org_id`) têm apenas permissão SELECT — por isso o save falha com erro de RLS.

**Fluxo atual:**
- Franqueado (org `5ee93547`) tenta salvar um followup
- Followup existente tem `organization_id = 4206c8f4` (franqueadora)
- RLS verifica `is_member_of_org(uid, 4206c8f4)` → **falha** (franqueado não é membro da franqueadora)

## Solução

### 1. Migração SQL — Adicionar políticas RLS para unit members

Adicionar duas novas políticas para permitir que franqueados (unit members) possam inserir e atualizar followups vinculados à sua unidade:

```sql
-- Franqueados podem inserir followups para sua unidade
CREATE POLICY "Unit members can insert followups"
ON public.client_followups FOR INSERT TO authenticated
WITH CHECK (is_member_of_org(auth.uid(), unit_org_id));

-- Franqueados podem atualizar followups da sua unidade
CREATE POLICY "Unit members can update followups"
ON public.client_followups FOR UPDATE TO authenticated
USING (is_member_of_org(auth.uid(), unit_org_id))
WITH CHECK (is_member_of_org(auth.uid(), unit_org_id));
```

### 2. Corrigir `useSaveFollowup` no hook

Ao atualizar um followup existente, o `organization_id` do payload não deve ser sobrescrito com o orgId do franqueado — deve manter o valor original do registro. Caso contrário, o franqueado estaria tentando mudar o `organization_id` de `4206c8f4` para `5ee93547`.

No `src/hooks/useClientFollowups.ts`, na mutação de update, preservar o `organization_id` original quando for uma atualização (quando `input.id` existe).

### 3. Garantir `unit_org_id` no insert

Quando um franqueado cria um novo followup, o `unit_org_id` precisa ser preenchido com o orgId do franqueado para que a nova política de INSERT funcione.

## Detalhes técnicos

- Tabela afetada: `client_followups`
- Políticas existentes: ALL (organization_id), SELECT (unit_org_id)
- Políticas a criar: INSERT e UPDATE (unit_org_id)
- Arquivo a editar: `src/hooks/useClientFollowups.ts` (mutationFn do useSaveFollowup)

