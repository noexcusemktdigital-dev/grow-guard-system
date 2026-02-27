

## Plano: Vincular Marketing, Academy e Metas entre Franqueadora e Franqueados

### Problema Central

Os hooks `useMarketingFolders`, `useMarketingAssets` e `useAcademyModules` filtram por `organization_id` do usuario logado. Como franqueadora e franqueado sao organizacoes diferentes (vinculadas via `parent_org_id`), o franqueado nao ve os materiais nem modulos criados pela franqueadora.

---

### 1. Marketing da Franqueadora — Drive completo com upload

A pagina `Marketing.tsx` da franqueadora esta basica (grid flat de assets). Precisa ter a **mesma estrutura de categorias** do `FranqueadoMateriais.tsx`:

- **6 categorias**: Logos, Dia a Dia, Setup Inicial, Redes Sociais, Campanhas, Apresentacoes
- **Navegacao por pastas** com breadcrumb
- **Grid mensal** para Redes Sociais
- **Filtros por tipo** (imagem, video, PDF, documento, apresentacao)
- **Preview modal** de arquivos

**Diferenca para o franqueado**: a franqueadora tem botoes de **criacao**:
- "Nova Pasta" (com select de categoria)
- "Upload de Arquivo" (upload para storage `marketing-assets` + insert na tabela)
- "Excluir" / "Mover" assets e pastas

Alteracoes em `src/pages/Marketing.tsx`: reescrever usando a mesma estrutura de categorias e navegacao do `FranqueadoMateriais.tsx`, adicionando funcionalidades de CRUD (criar pasta, upload de arquivo, excluir).

Adicionar mutations no `src/hooks/useMarketing.ts`: `createFolder` (com `category`), `deleteFolder`, `deleteAsset`, `uploadAsset` (upload ao bucket `marketing-assets` + insert).

---

### 2. Franqueado ve materiais da Franqueadora — Hook com parent_org_id

Criar uma database function `get_parent_org_id` que retorna o `parent_org_id` da org do usuario:

```sql
CREATE FUNCTION get_parent_org_id(_org_id uuid) RETURNS uuid
```

Criar hooks com logica de parent:
- `useMarketingFoldersFromParent()` — busca pastas onde `organization_id` = parent_org_id da org do franqueado
- `useMarketingAssetsFromParent()` — mesma logica para assets

Alternativa mais simples: atualizar `useMarketingFolders` e `useMarketingAssets` para aceitar um parametro `sourceOrgId` opcional. No `FranqueadoMateriais.tsx`, buscar o `parent_org_id` e passar como source.

**Implementacao escolhida**: criar RPC `get_marketing_data_org_id(_user_org_id uuid)` que retorna o `parent_org_id` se existir, senao retorna o proprio org_id. Usar isso nos hooks de marketing do franqueado.

---

### 3. Academy — Franqueadora gerencia, Franqueado consome

O mesmo problema existe na Academy: modulos criados pela franqueadora ficam na org da franqueadora, franqueado nao ve.

**Solucao**: mesmo padrao do marketing. Criar RPC `get_academy_source_org_id(_user_org_id uuid)` ou reutilizar o mesmo `get_parent_org_id`. Os hooks `useAcademyModules` e `useAcademyLessons` do franqueado passam a buscar pela org pai.

A pagina `Academy.tsx` (franqueadora) ja tem abas de Gestao e Relatorios — manter. Adicionar na aba **Relatorios** visibilidade do progresso dos franqueados (buscar `academy_progress` de usuarios de orgs filhas).

---

### 4. Metas & Ranking — Plataforma funcional da Franqueadora

A pagina `MetasRanking.tsx` esta vazia (so mostra empty state). Implementar conteudo real nas 5 abas:

**Aba Dashboard**:
- KPIs: total de metas ativas, % atingimento medio, unidades no target, campanhas ativas
- Grafico de barras com atingimento por unidade (usando `rankings` table)

**Aba Metas**:
- Lista de metas existentes com status, periodo, valor alvo vs atual
- Dialog "Nova Meta" com campos: titulo, tipo (faturamento/leads/contratos), valor alvo, periodo, escopo (rede/unidade), unidade (select de unidades se escopo = unidade)
- Usar `useGoalMutations().createGoal` que ja existe

**Aba Ranking**:
- Tabela de ranking mensal por unidade (dados da tabela `rankings`)
- Posicao, nome da unidade, pontuacao, variacao

**Aba Campanhas**:
- CRUD basico de campanhas (premiacoes) — pode usar a tabela `goals` com `scope = "campaign"`
- Campos: nome, descricao, premio, periodo, meta

**Aba Configuracao**:
- Pesos das metricas para calculo do ranking (faturamento, leads, contratos)
- Regras de premiacao

---

### 5. Vincular Metas com Unidades

As metas ja tem `unit_org_id` na tabela `goals`. No dialog de nova meta, ao selecionar escopo "Por Unidade", mostrar select com unidades cadastradas (usando `useUnits`). Ao criar meta por unidade, preencher `unit_org_id`.

O franqueado deve ver suas proprias metas. Criar/atualizar hook para o franqueado buscar metas onde `unit_org_id` = sua org_id.

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar functions `get_parent_org_id` e `get_marketing_source_org` |
| `src/hooks/useMarketing.ts` | Editar: adicionar `sourceOrgId` nos hooks + mutations de upload/delete + `useParentOrgId` |
| `src/pages/Marketing.tsx` | Reescrever: drive completo com categorias, pastas, upload, preview (mesmo layout do FranqueadoMateriais + CRUD) |
| `src/pages/franqueado/FranqueadoMateriais.tsx` | Editar: buscar dados da org pai ao inves da propria org |
| `src/hooks/useAcademy.ts` | Editar: modules e lessons buscam da org pai para franqueados |
| `src/pages/MetasRanking.tsx` | Reescrever: implementar conteudo real nas 5 abas (dashboard, metas CRUD, ranking, campanhas, config) |
| `src/hooks/useGoals.ts` | Editar: adicionar hook para metas por unidade |

### Sequencia

1. Migration (function `get_parent_org_id`)
2. Hook `useParentOrgId` + atualizar `useMarketing` com source org
3. Reescrever `Marketing.tsx` (drive completo da franqueadora com CRUD)
4. Atualizar `FranqueadoMateriais.tsx` (ler da org pai)
5. Atualizar `useAcademy.ts` (modules/lessons da org pai para franqueados)
6. Reescrever `MetasRanking.tsx` (5 abas funcionais com CRUD de metas)
7. Vincular metas com unidades (select de unidade no dialog)
