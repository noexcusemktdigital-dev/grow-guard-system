

## Plano: Corrigir target_unit_ids para usar org IDs

### Causa raiz

O formulário de comunicados usa `units.id` (tabela `units`) como identificador ao selecionar unidades específicas. Porém, a RPC `get_announcements_with_parent` compara `_org_id::text = ANY(target_unit_ids)`, onde `_org_id` é o ID da **organização** (tabela `organizations`).

Dados reais no banco:
- `units.id` = `7d8c7468...` (salvo em `target_unit_ids`)
- `organizations.id` = `80ef0089...` (o que a RPC compara)

Como são IDs diferentes, o filtro nunca encontra correspondência e o comunicado não aparece para ninguém.

### Correção

**1. Alterar o formulário (`ComunicadoForm.tsx`)** para salvar `unit_org_id` (que é o ID da organização filha) em vez de `units.id`:
- Ao renderizar checkboxes de unidades, usar `u.unit_org_id` como valor
- Filtrar apenas unidades que possuem `unit_org_id` preenchido (unidades sem vínculo com org não fazem sentido no filtro)

**2. Atualizar dados existentes no banco** — Migration para corrigir os `target_unit_ids` já salvos, traduzindo `units.id` → `units.unit_org_id`:
```sql
UPDATE announcements SET target_unit_ids = (
  SELECT array_agg(u.unit_org_id::text)
  FROM unnest(target_unit_ids) AS tid
  JOIN units u ON u.id::text = tid
  WHERE u.unit_org_id IS NOT NULL
)
WHERE target_unit_ids IS NOT NULL AND array_length(target_unit_ids, 1) > 0;
```

**3. Caso alternativo**: Se uma unidade não tiver `unit_org_id` vinculado, o form deve mostrar um aviso de que aquela unidade não pode ser alvo de comunicados até ser vinculada a uma organização.

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `src/components/comunicados/ComunicadoForm.tsx` | Usar `unit_org_id` em vez de `id` |
| Migration SQL | Corrigir `target_unit_ids` existentes |

