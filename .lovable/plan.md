
# Melhorias do CRM de Vendas

## Resumo

O CRM atual tem o basico: Kanban com drag-and-drop, busca e um detalhe de lead simplificado. Vamos transforma-lo em um CRM completo e funcional com as seguintes melhorias:

---

## 1. Botao "Adicionar Lead" + Dialog de criacao

Atualmente nao existe forma de criar leads manualmente. Vamos adicionar:
- Botao "+ Novo Lead" no header ao lado dos toggles de visualizacao
- Dialog com formulario: Nome, Telefone, E-mail, Empresa, Valor, Origem (select), Tags
- O lead e criado automaticamente na primeira etapa do funil

---

## 2. Detalhe do Lead completo (Sheet expandida com 4 abas)

O detalhe atual so mostra dados basicos e WhatsApp. Vamos expandir para 4 abas:

**Aba Dados** (editavel):
- Todos os campos do lead com edicao inline
- Select para mudar etapa do funil
- Campo de valor editavel
- Tags editaveis (adicionar/remover)
- Botoes "Marcar como Vendido" e "Marcar como Perdido" (com campo de motivo)

**Aba Atividades/Timeline**:
- Lista cronologica de atividades (ligacao, whatsapp, reuniao, email, nota)
- Formulario rapido para registrar nova atividade
- Cada atividade mostra tipo, data, descricao e resultado
- Usa a tabela `crm_activities` ja existente

**Aba Tarefas**:
- Lista de tarefas vinculadas ao lead
- Criar nova tarefa com titulo, descricao, data, prioridade
- Marcar como concluida/pendente
- Indicador visual de tarefas atrasadas
- Usa a tabela `crm_tasks` ja existente

**Aba WhatsApp** (ja existe, manter como esta)

---

## 3. Filtros no Kanban/Lista

Barra de filtros abaixo da busca:
- Filtro por Origem (source): WhatsApp, Formulario, Indicacao, etc.
- Filtro por Tags
- Botao "Limpar filtros"
- Os filtros funcionam tanto no Kanban quanto na Lista

---

## 4. Acoes rapidas nos cards do Kanban

Ao passar o mouse no card:
- Icone de telefone (copia numero)
- Icone de WhatsApp (abre chat)
- Menu "..." com: Editar, Marcar como Perdido, Excluir

---

## 5. Gerenciador de Funil (Configuracoes)

Botao de engrenagem no header que abre Dialog:
- Lista de etapas do funil atual com drag para reordenar
- Editar nome, cor e icone de cada etapa
- Adicionar/remover etapas
- Salva no banco (tabela `crm_funnels`)
- Se nao existe funil, cria um com as etapas padrao

---

## Arquivos a editar

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| Reescrever | `src/pages/cliente/ClienteCRM.tsx` | Adicionar botao novo lead, filtros, acoes nos cards, detalhe completo com 4 abas |
| Editar | `src/hooks/useCrmLeads.ts` | Adicionar suporte a won_at/lost_at/lost_reason nas mutations |
| Nenhuma alteracao | Hooks de tasks/activities/funnels | Ja existem e sao suficientes |

## Detalhes Tecnicos

- Nenhuma migration necessaria: todas as colunas (`won_at`, `lost_at`, `lost_reason`, `assigned_to`, `custom_fields`) ja existem na tabela `crm_leads`
- As tabelas `crm_activities`, `crm_tasks`, `crm_lead_notes` ja existem com RLS configurado
- O hook `useCrmActivityMutations` ja tem `createActivity`
- O hook `useCrmTaskMutations` ja tem `createTask`, `updateTask`, `deleteTask`
- O gerenciador de funil usa `useCrmFunnelMutations` para criar/atualizar funis
- O componente permanece em um unico arquivo (~600-700 linhas) para manter a coesao do modulo
