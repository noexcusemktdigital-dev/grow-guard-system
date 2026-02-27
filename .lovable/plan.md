
## Plano: Corrigir Convites, Onboarding e Refazer Contratos + Financeiro

### Bug 1: Convite de usuarios da erro "Forbidden"

**Causa raiz**: A edge function `invite-user` verifica se o chamador e membro da org **destino** (`is_member_of_org(caller, target_org)`). Quando a franqueadora convida alguem para a org de um franqueado, o admin da franqueadora nao e membro daquela org — e membro da org pai. O check falha com "Forbidden".

**Correcao**: Criar uma database function `is_member_or_parent_of_org` que verifica se o usuario e membro da org OU membro da org pai (via `parent_org_id`). Atualizar `invite-user` para usar essa funcao.

---

### Bug 2: Onboarding nao aparece apos criar

**Causa raiz**: O mutation `createUnit` no hook passa o campo `responsible` no insert, mas a tabela `onboarding_units` nao tem coluna `responsible`. O insert falha silenciosamente.

**Correcao**: Adicionar coluna `responsible` (text, nullable) na tabela `onboarding_units` via migration. Isso resolve o insert e os dados aparecerao.

---

### Mudanca 3: Refazer modulo Contratos

O objetivo da franqueadora no modulo de contratos:
1. **Templates**: criar/editar modelos de contrato que servem de base para franqueados
2. **Contratos de franquia**: contratos proprios da franqueadora (nao sao templates)
3. **Visao de rede**: ver todos os contratos ativos da rede, filtrando por tipo e dono

**Alteracoes no banco**:
- Adicionar colunas na tabela `contracts`:
  - `contract_type` (text): "assessoria", "saas", "sistema", "franquia"
  - `owner_type` (text): "unidade", "matriz", "cliente_saas"
  - `unit_org_id` (uuid, nullable): referencia a qual unidade pertence o contrato
- Adicionar coluna na tabela `contract_templates`:
  - `template_type` (text): "assessoria", "saas", "sistema", "franquia"
  - `description` (text, nullable)
- Criar database function `get_network_contracts` que retorna contratos de toda a rede (org propria + orgs filhas)

**Nova estrutura do sidebar Contratos**:
- Templates (criar/editar modelos)
- Contratos da Matriz (contratos de franquia, proprios)
- Rede (todos os contratos de todas as unidades + matriz, com filtros por tipo e dono)

**Alteracoes nos arquivos**:
- `ContratosTemplates.tsx`: adicionar campos `template_type` e `description`, botao editar
- `ContratosGerenciamento.tsx`: reescrever como visao de rede com filtros (tipo, dono, status, unidade), usando `get_network_contracts`
- `ContratosGerador.tsx`: reescrever para criar contratos da matriz, com campos completos (tipo, valor, duracao, signatario, owner_type)
- Remover `ContratosConfiguracoes.tsx` da sidebar (configuracoes sao estaticas sem persistencia real)
- Atualizar `useContracts.ts` com novos hooks e mutations

---

### Mudanca 4: Refazer modulo Financeiro

O financeiro tem 2 funcoes:
1. **Repasses e Fechamentos**: consolidar o que cada franqueado deve pagar (royalties, sistema) e gerar fechamentos mensais
2. **Financeiro da Matriz**: receitas e despesas proprias da franqueadora

**Nova estrutura do sidebar Financeiro**:
- Dashboard (visao geral: MRR da rede, receitas vs despesas da matriz, repasses pendentes)
- Repasse (cobracas de royalties/sistema aos franqueados — ja funciona)
- Fechamentos (consolidacao mensal por unidade — receita gerada, royalty devido, taxa sistema)
- Receitas da Matriz (receitas manuais + venda de franquia + contratos proprios)
- Despesas da Matriz (despesas operacionais da franqueadora)

**Alteracoes**:
- `FinanceiroDashboard.tsx`: reescrever com KPIs de rede (MRR rede, repasses pendentes, receita matriz) + grafico mensal
- `FinanceiroReceitas.tsx`: simplificar para receitas da MATRIZ apenas (remover abas de sistema/clientes que pertencem ao repasse)
- `FinanceiroFechamentos.tsx`: implementar consolidacao mensal por unidade (cruzar contratos ativos x royalties x taxas)
- Manter `FinanceiroRepasse.tsx` e `FinanceiroDespesas.tsx` como estao
- Remover `FinanceiroConfiguracoes.tsx` do sidebar (configuracoes sem persistencia)

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Adicionar `responsible` em `onboarding_units`, `contract_type`/`owner_type`/`unit_org_id` em `contracts`, `template_type`/`description` em `contract_templates`, function `is_member_or_parent_of_org`, function `get_network_contracts` |
| `supabase/functions/invite-user/index.ts` | Corrigir: usar `is_member_or_parent_of_org` |
| `src/pages/ContratosTemplates.tsx` | Editar: adicionar tipo e descricao |
| `src/pages/ContratosGerenciamento.tsx` | Reescrever: visao de rede com filtros |
| `src/pages/ContratosGerador.tsx` | Reescrever: criar contratos da matriz com campos completos |
| `src/hooks/useContracts.ts` | Editar: adicionar hooks de rede e novos campos |
| `src/pages/FinanceiroDashboard.tsx` | Reescrever: KPIs de rede + matriz |
| `src/pages/FinanceiroReceitas.tsx` | Simplificar: apenas receitas da matriz |
| `src/pages/FinanceiroFechamentos.tsx` | Implementar: consolidacao mensal por unidade |
| `src/components/FranqueadoraSidebar.tsx` | Editar: ajustar subitens de Contratos e Financeiro |

### Sequencia

1. Migration (colunas + functions)
2. Corrigir `invite-user` (bug critico)
3. Onboarding (coluna `responsible` resolve o bug)
4. Contratos (templates, gerador, gerenciamento de rede)
5. Financeiro (dashboard, receitas, fechamentos)
6. Sidebar (ajustar menus)
