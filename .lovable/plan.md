
## Problema

A política RLS da tabela `units` para SELECT exige que o usuário seja membro da `organization_id` (que é a Matriz). O franqueado é membro da `unit_org_id`, não da organização pai — por isso a query retorna vazio e ele vê "Nenhuma unidade vinculada".

**Dados atuais:**
- Unit "Unidade Teste": `organization_id = 4206c8f4` (Matriz), `unit_org_id = 5ee93547` (Franqueado)
- Franqueado Teste: membro de `5ee93547`
- Policy SELECT: `is_member_of_org(auth.uid(), organization_id)` → franqueado não passa

## Solução

Adicionar uma política RLS que permita franqueados visualizarem a unit vinculada via `unit_org_id`:

```sql
CREATE POLICY "Franchisee can view own unit"
ON public.units
FOR SELECT
TO authenticated
USING (is_member_of_org(auth.uid(), unit_org_id));
```

Isso permite que membros da organização franqueada vejam o registro da sua unidade, sem alterar nenhum código front-end.

### Arquivo alterado

| Arquivo | Ação |
|---------|------|
| Migration SQL | Nova policy RLS na tabela `units` |

Nenhuma alteração de código é necessária — o `FranqueadoMinhaUnidade.tsx` já faz `.eq("unit_org_id", orgId)`, só precisa que a RLS permita o acesso.

### Erro do session replay (bonus)

O erro `Could not find the 'saas_commission_percent' column of 'units'` visível no replay indica que a coluna `saas_commission_percent` não existe na tabela `units`. Isso será corrigido na mesma migration adicionando a coluna.
