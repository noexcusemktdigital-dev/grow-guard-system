

## Plano: Corrigir Comunicados nas 3 Frentes

### Problemas encontrados

**1. Arquivamento corrompe dados** — `handleArchive` executa `updateAnnouncement({ id, type: "archived" })`, substituindo o tipo original (`Informativo`, `Urgente`, etc.) por `"archived"`. Isso faz o comunicado desaparecer de todos os filtros e quebra a exibição.

**2. Clientes finais não têm vínculo hierárquico** — Organizações do tipo `cliente` no banco possuem `parent_org_id = null`. A RPC `get_announcements_with_parent` depende de `parent_org_id` para buscar comunicados da org-pai, então clientes nunca recebem nada. É preciso suportar a cadeia completa: Franqueadora → Franqueado → Cliente.

**3. A RPC não filtra por `target_unit_ids`** — Quando a matriz envia um comunicado para unidades específicas (selecionadas no formulário), a RPC ignora esse filtro e retorna TODOS os comunicados publicados da org-pai. Isso pode mostrar comunicados direcionados a uma unidade para outra unidade que não deveria receber.

**4. Falta coluna `status` na tabela** — A tabela `announcements` não tem campo `status` para controlar arquivamento/expiração. A solução atual de mudar o `type` para `"archived"` é destrutiva.

### Correções

**Migration SQL**:
- Adicionar coluna `status TEXT NOT NULL DEFAULT 'active'` à tabela `announcements` (valores: `active`, `archived`)
- Marcar o comunicado existente com `type = 'archived'` como `status = 'archived'` e restaurar o type original
- Recriar a RPC `get_announcements_with_parent` para:
  - Filtrar `status = 'active'` (excluir arquivados)
  - Suportar cadeia hierárquica de 2 níveis (parent + grandparent) para que clientes vejam comunicados da franqueadora
  - Filtrar por `target_unit_ids`: se o array não está vazio, só retornar para orgs que estão na lista
  - Continuar filtrando `published_at IS NOT NULL` para esconder rascunhos de unidades filhas

**Código — Franqueadora (`Comunicados.tsx`)**:
- Corrigir `handleArchive` para usar `updateAnnouncement({ id, status: 'archived' })` em vez de `type: 'archived'`
- Ajustar mapeamento dos comunicados para usar o novo campo `status`

**Código — Franqueado (`FranqueadoComunicados.tsx`)** e **Cliente (`ClienteComunicados.tsx`)**:
- Nenhuma alteração necessária na lógica — o hook `useAnnouncements` já consome a RPC corretamente. A correção é toda no backend.

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Adicionar coluna `status`, atualizar RPC com filtros de hierarquia e `target_unit_ids` |
| `src/pages/Comunicados.tsx` | Corrigir `handleArchive` para usar campo `status` |

