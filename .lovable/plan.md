

## Plano: CRM Unificado, Gestão de Unidades e "Minha Unidade"

### 1. CRM — Padronizar Franqueadora e Franqueado com o ClienteCRM

**Problema:** O CRM do cliente final (`ClienteCRM.tsx`, 892 linhas) é o mais completo, com Pipeline Summary (valor por etapa, ticket médio, taxa de conversão), Tutorial, PointerSensor, bulk actions com atribuição de responsável. Já o `CrmExpansao.tsx` (396 linhas) e `FranqueadoCRM.tsx` (523 linhas) são versões simplificadas com funcionalidades faltantes.

**Ação:**
- Reescrever `CrmExpansao.tsx` usando `ClienteCRM.tsx` como base — mesmo layout, mesmas funcionalidades (Pipeline Summary com valores por etapa, filtro por responsável, tutorial, PointerSensor, bulk actions completas)
- Reescrever `FranqueadoCRM.tsx` da mesma forma
- Ambos usam os mesmos hooks (`useCrmLeads`, `useCrmFunnels`, `useCrmSettings`, `useCrmTeam`) — a separação de dados é feita pelo `organization_id` automaticamente

**Sidebar Franqueadora:** Renomear "CRM Expansão" → "CRM" e mover para **primeira posição** na seção Rede (antes de Atendimento)

### 2. Limpeza de Unidades

**Dados a deletar via insert tool (não migration):**
- Deletar unit "Allure - NOE curitiba" (`7d8c7468`) e a organização correspondente (`80ef0089`) + memberships e dados vinculados
- Deletar unit "Nova Unidade" (`7f4a71de`)
- **Manter:** "Unidade Teste" (`5ee93547`) como unidade de demonstração

### 3. "Minha Unidade" — Nova Página do Franqueado

**Nova rota:** `/franqueado/unidade`
**Sidebar:** Adicionar "Minha Unidade" (ícone `Building2`) na seção Gestão do franqueado

**Lógica:** O franqueado faz login → `useUserOrgId()` retorna seu `org_id` → buscar na tabela `units` a unidade onde `unit_org_id = org_id` → exibir os dados com permissões restritas:

| Aba | Franqueado pode | Não pode |
|-----|----------------|----------|
| **Dados** | Editar telefone, email, endereço próprios | Editar nome da unidade, dados financeiros |
| **Usuários** | Criar novos (admin ou user, máx 2) | Deletar usuários criados pela Matriz |
| **Documentos** | Adicionar documentos, baixar todos | Deletar documentos criados pela Matriz |
| **Financeiro** | Visualizar fechamentos | Editar qualquer valor |

**Componentes reutilizados:**
- `UnidadeDadosEdit` — adicionar prop `readOnly` para campos que o franqueado não pode editar
- `UnidadeUsuariosReal` — adicionar prop `canDeleteMatrizUsers: false` e `maxUsers: 2`
- `UnidadeDocumentosReal` — adicionar prop `canDeleteMatrizDocs: false`
- `UnidadeFinanceiroReal` — renderizar em modo readonly (sem edição de comissão/royalties)

### 4. Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `src/pages/CrmExpansao.tsx` | Reescrever com paridade ao ClienteCRM |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Reescrever com paridade ao ClienteCRM |
| `src/components/FranqueadoraSidebar.tsx` | "CRM Expansão" → "CRM", mover para 1ª posição da seção Rede |
| `src/components/FranqueadoSidebar.tsx` | Adicionar "Minha Unidade" na seção Gestão |
| `src/pages/franqueado/FranqueadoMinhaUnidade.tsx` | **Novo** — página "Minha Unidade" |
| `src/App.tsx` | Adicionar rota `/franqueado/unidade` |
| `src/components/unidades/UnidadeDadosEdit.tsx` | Adicionar prop `readOnly` |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Adicionar props `canDeleteMatrizUsers`, `maxUsers` |
| `src/components/unidades/UnidadeDocumentosReal.tsx` | Adicionar prop `canDeleteMatrizDocs` |
| `src/components/unidades/UnidadeFinanceiroReal.tsx` | Adicionar prop `readOnly` |
| **Data cleanup** | Deletar units e orgs não-teste via insert tool |

### Ordem de execução

1. Sidebar (renomear CRM, adicionar Minha Unidade)
2. Reescrever CRM Franqueadora
3. Reescrever CRM Franqueado
4. Criar página "Minha Unidade" + rota
5. Adaptar componentes de Unidade (props de permissão)
6. Limpeza de dados (deletar unidades falsas)

