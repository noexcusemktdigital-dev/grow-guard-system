

## Melhorias no CRM — Cards coloridos, motivos de perda e leads permanentes no funil

### 1. Cards com cor de status (Ganho/Perdido) no Kanban

**Arquivo:** `src/pages/cliente/ClienteCRMKanban.tsx`

O `DraggableLeadCard` atualmente usa apenas `stageColor` para a borda esquerda. Adicionar lógica condicional:
- Se `lead.won_at` → borda esquerda verde + fundo sutil verde (`border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20`)
- Se `lead.lost_at` → borda esquerda vermelha + fundo sutil vermelho (`border-l-red-500 bg-red-50/50 dark:bg-red-950/20`)
- Badge discreto "Vendido" ou "Perdido" no card para reforçar visualmente
- Manter o card funcional e arrastável normalmente

Mesma lógica será replicada nos cards do `CrmExpansao.tsx` e `FranqueadoCRM.tsx`.

### 2. Motivos de perda configuráveis

**Migration SQL:** Adicionar coluna `loss_reasons` (tipo `text[]`) na tabela `crm_settings` para armazenar os motivos padrão por organização. Valores default: `["Preço", "Concorrência", "Timing inadequado", "Sem orçamento", "Sem resposta", "Escolheu outro fornecedor", "Desistiu do projeto"]`.

**Novo componente:** `src/components/crm/CrmLossReasonsConfig.tsx`
- Aba "Motivos de Perda" nas configurações do CRM (`CrmConfigPage.tsx`)
- Lista de motivos com opção de adicionar, editar e remover
- Usa `useCrmSettings` / `useCrmSettingsMutations` para persistir

**Arquivo:** `src/components/crm/CrmConfigPage.tsx`
- Adicionar nova aba "Motivos" com icone `XCircle`

### 3. Dialog de perda com motivo obrigatório

**Arquivo:** `src/components/crm/CrmLeadDetailSheet.tsx`
- Carregar motivos de `crm_settings.loss_reasons` via `useCrmSettings()`
- Substituir o campo de texto livre por: Select com motivos padrão + campo de descrição opcional (Textarea)
- O botão "Confirmar" fica desabilitado até selecionar um motivo
- `lost_reason` passa a ser obrigatório no `markAsLost`

Mesma lógica no `CrmLeadDetailSheet` do franqueado e nos menus rápidos do Kanban (que hoje chamam `onMarkLost` direto sem dialog — precisam abrir dialog primeiro).

### 4. Leads ganhos/perdidos permanecem no funil

**Problema atual:** O `markAsWon` muda o stage para "Venda" e o `markAsLost` muda para "Oportunidade Perdida". Se essas etapas não existem no funil customizado, o lead desaparece do pipeline visual.

**Correção em `src/hooks/useCrmLeads.ts`:**
- `markAsWon`: **Não alterar o stage**. Apenas setar `won_at`. O lead permanece na etapa onde estava, mas com status visual de vendido.
- `markAsLost`: **Não alterar o stage**. Apenas setar `lost_at` + `lost_reason`. O lead permanece na etapa onde estava, mas com status visual de perdido.

**Correção em `src/pages/cliente/ClienteCRM.tsx`:**
- Remover filtro implícito que exclui leads won/lost do pipeline. Atualmente o `leadsByStage` inclui todos os `filteredLeads`, mas o filtro de status padrão pode estar excluindo-os. Garantir que sem filtro ativo, todos os leads (inclusive won/lost) apareçam no kanban.

### 5. Integração com metas e relatórios

A integração já existe: `ClienteDashboard.tsx` já conta `wonLeads` e `lostLeads` com base em `won_at`/`lost_at`, calcula ticket médio, taxa de conversão e motivos de perda. O `goal-progress` já é invalidado quando leads mudam. **Nenhuma mudança necessária** nesta frente — tudo já funciona automaticamente quando `won_at` é setado.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `ALTER TABLE crm_settings ADD COLUMN loss_reasons text[]` |
| `src/pages/cliente/ClienteCRMKanban.tsx` | Card verde/vermelho para won/lost |
| `src/pages/CrmExpansao.tsx` | Mesma lógica de cor |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Mesma lógica de cor |
| `src/components/crm/CrmLossReasonsConfig.tsx` | Novo — gerenciar motivos de perda |
| `src/components/crm/CrmConfigPage.tsx` | Nova aba "Motivos" |
| `src/components/crm/CrmLeadDetailSheet.tsx` | Dialog de perda com select obrigatório |
| `src/components/franqueado/CrmLeadDetailSheet.tsx` | Mesmo ajuste |
| `src/hooks/useCrmLeads.ts` | markAsWon/markAsLost não alteram mais o stage |

