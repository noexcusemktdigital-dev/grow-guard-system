

## Plano: Ajustes nos Modulos da Franqueadora

Sao 6 mudancas solicitadas. Vou implementar todas nesta iteracao.

---

### 1. Comunicados — Anexo como upload de arquivo

**Remover:** campos `imagemUrl`, `linkExterno` e `anexo` (texto) do formulario
**Adicionar:** upload de arquivo real usando storage bucket `announcement-attachments`
**Adicionar coluna:** `attachment_url` na tabela `announcements`

Alteracoes:
- Migration: criar bucket `announcement-attachments`, adicionar coluna `attachment_url text` em `announcements`
- `ComunicadoForm.tsx`: remover os 3 campos (imagemUrl, linkExterno, anexo texto), adicionar input type="file" com upload para storage
- `ComunicadoDetail.tsx`: exibir link de download do anexo se existir
- `useAnnouncements.ts`: incluir `attachment_url` no payload de create/update
- `tipos/comunicados.ts`: remover `imagemUrl`, `linkExterno` dos campos do Comunicado (ou manter opcionais para retrocompatibilidade)

---

### 2. Unidades — Visualizacao por Card/Lista + Remover aba Creditos SaaS

**Remover:** aba "Creditos SaaS" (`CreditosSaasTab`) da pagina Unidades — esse conteudo vai para o novo modulo SaaS
**Adicionar:** toggle Card/Lista na listagem de unidades (ja temos cards, adicionar view de tabela)

Alteracoes:
- `Unidades.tsx`: remover `CreditosSaasTab` e a aba `TabsTrigger/TabsContent` de creditos. Adicionar toggle view (Card/Lista) com tabela alternativa mostrando colunas: Nome, Cidade/Estado, Responsavel, Status

---

### 3. CRM Expansao — Copiar o CRM do Cliente Final

Substituir o `CrmExpansao.tsx` atual pelo mesmo nivel de funcionalidade do `ClienteCRM.tsx`:
- Selecao em massa (bulk actions: mover etapa, atribuir, tags, excluir, marcar perdido)
- Modo selecao com checkboxes
- Filtros avancados completos (responsavel, tag, status, valor min/max, data)
- Cards com temperature cycling, dropdown de acoes (copiar telefone, WhatsApp, marcar perdido)
- Drag handle separado do click do card
- Aba Contatos integrada
- Gestao de funis (botao config)
- Import CSV
- DragOverlay com visual melhorado

Alteracoes:
- `CrmExpansao.tsx`: reescrever baseado no `ClienteCRM.tsx`, adaptando imports para usar hooks da franqueadora (`useCrmLeads` de `@/hooks/useCrmLeads`, `useCrmFunnels` de `@/hooks/useCrmFunnels`)

---

### 4. Onboarding — Status e passo a passo robusto

Melhorar a pagina atual com:
- Cards de unidade mostrando: barra de progresso, status com cores (Em implantacao, Concluido, Pausado, Atrasado), data inicio/meta, responsavel
- Botao "Nova Implantacao" abrindo Dialog completo (selecionar unidade, definir responsavel, data alvo)
- Na view de detalhe: toggle de checklist items (marcar como concluido), adicionar nova etapa, CRUD de reunioes (com ata), adicionar tarefas ao plano de acao
- Indicadores visuais de progresso por fase

Alteracoes:
- `Onboarding.tsx`: reescrever com cards mais ricos, dialog de criacao, CRUD funcional nos checklist/meetings/tasks
- `useOnboarding.ts`: adicionar mutations para toggle checklist, criar/editar meetings, criar/editar tasks

---

### 5. Atendimento — Primeira aba da Rede + Configuracoes

**Reordenar sidebar:** Atendimento vira o primeiro item da secao "Rede"
**Adicionar aba Configuracoes:** com categorias/subcategorias, SLA por prioridade, responsaveis, regras de automacao (reutilizar `AtendimentoConfig.tsx` ja existente)
**Melhorar o modulo:** detail com timeline de mensagens, atribuicao de responsavel, mudanca de status, filtro por categoria/prioridade

Alteracoes:
- `FranqueadoraSidebar.tsx`: reordenar `redeSection` para Atendimento ser o primeiro
- `Atendimento.tsx`: adicionar aba "Configuracoes" com `AtendimentoConfig`, melhorar detail view com timeline, adicionar selects de categoria/subcategoria ao criar chamado

---

### 6. Matriz — Mover para Administrativo

**Mover** o item "Matriz" de `redeSection` para `adminSection` na sidebar.

Alteracoes:
- `FranqueadoraSidebar.tsx`: remover Matriz de `redeSection`, adicionar em `adminSection` (antes de Drive Corporativo)

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar bucket `announcement-attachments`, coluna `attachment_url` em `announcements` |
| `src/components/comunicados/ComunicadoForm.tsx` | Editar — remover 3 campos, adicionar file upload |
| `src/components/comunicados/ComunicadoDetail.tsx` | Editar — exibir anexo como link de download |
| `src/hooks/useAnnouncements.ts` | Editar — suportar `attachment_url` |
| `src/pages/Unidades.tsx` | Editar — remover aba Creditos SaaS, adicionar toggle Card/Lista |
| `src/pages/CrmExpansao.tsx` | Reescrever — copiar estrutura do ClienteCRM |
| `src/pages/Onboarding.tsx` | Reescrever — cards com progresso, CRUD funcional |
| `src/hooks/useOnboarding.ts` | Editar — adicionar mutations |
| `src/pages/Atendimento.tsx` | Reescrever — aba config, detail com timeline, categorias |
| `src/components/FranqueadoraSidebar.tsx` | Editar — reordenar Atendimento para 1o da Rede, mover Matriz para Admin |

### Sequencia de Implementacao

1. Migration (bucket + coluna)
2. Sidebar (reordenar Atendimento + mover Matriz)
3. Comunicados (file upload)
4. Unidades (remover creditos, toggle view)
5. CRM Expansao (reescrever)
6. Onboarding (reescrever)
7. Atendimento (reescrever)

