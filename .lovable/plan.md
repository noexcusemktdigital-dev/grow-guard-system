
## Melhorias no CRM, Chat WhatsApp e Plano de Vendas

Este plano aborda os 7 problemas reportados em uma implementacao unificada.

---

### 1. Automacoes: remover campo "Prioridade da automacao"

**Arquivo**: `src/components/crm/CrmAutomations.tsx`

- Remover o bloco "Prioridade da automacao" (linhas 310-319) do dialog de Nova/Editar Automacao
- Remover o estado `priority` e seu uso no `handleSave` e `openEdit`
- Manter o campo `priority` no banco como default 0, apenas nao expor na UI

---

### 2. Roleta de Leads: verificar funcionamento

**Arquivo**: `src/components/crm/CrmRouletteConfig.tsx`

- A roleta apenas salva configuracao (membros + enabled) no `crm_settings`. Nao ha logica real de distribuicao round-robin ativa (nenhuma trigger ou funcao atribui leads automaticamente ao serem criados)
- Para a roleta funcionar de verdade, adicionar logica no hook `useCrmLeadMutations.createLead` que, apos inserir o lead, verifica se `lead_roulette_enabled` esta ativo e distribui para o proximo membro da lista `roulette_members` usando um indice rotativo salvo em `crm_settings.roulette_last_index`

**Arquivo**: `src/hooks/useCrmLeads.ts` — na mutation `createLead`:
- Apos o insert com sucesso, buscar `crm_settings` da org
- Se `lead_roulette_enabled` e true e `roulette_members` tem membros, calcular o proximo index (round-robin) e fazer update do lead com `assigned_to`
- Atualizar `roulette_last_index` no settings

**Migracao SQL**: adicionar coluna `roulette_last_index integer default 0` na tabela `crm_settings` (se nao existir)

---

### 3. Propostas dentro do Lead: mudar para "Anexar" em vez de "Criar"

**Arquivo**: `src/components/crm/CrmLeadDetailSheet.tsx` (ProposalsTab, linhas 376-650)

- Substituir o formulario completo de criacao de proposta por uma interface simples de anexo:
  - Input de arquivo (PDF, imagem) para upload
  - Campo de titulo e valor opcional
  - Upload para bucket `crm-files` e salvar referencia na tabela `crm_proposals` com `status: "draft"`
- Manter a listagem existente de propostas com status e acoes
- Remover a tabela de itens, calculadora de subtotal/desconto e campos de parceiro do dialog

---

### 4. WhatsApp dentro do Lead: design estilo WhatsApp

**Arquivo**: `src/components/crm/CrmLeadDetailSheet.tsx` (WhatsAppTab, linhas 653-734)

- Aplicar fundo com classe `whatsapp-bg` na area de mensagens
- Usar `ChatMessageBubble` com as "tails" (caudas) ja existentes (classes `chat-bubble-in`/`chat-bubble-out`)
- Adicionar header com avatar e nome do contato estilo WhatsApp (barra verde/escura)
- Input de mensagem com estilo rounded-full, icone de emoji e clip de anexo
- Aumentar `maxHeight` para usar mais espaco disponivel

---

### 5. Plano de Vendas: popup de primeiro acesso + bloqueio de funcoes

**Arquivo**: `src/pages/cliente/ClientePlanoVendas.tsx`

- Verificar no localStorage se `plano_vendas_data` existe e tem respostas suficientes
- Se nao existe (primeiro acesso): exibir Dialog modal de boas-vindas explicando:
  - "Estruture seu comercial com o Plano de Vendas"
  - Beneficios: diagnostico, insights, plano de acao, metas
  - Botao "Comecar agora" que fecha o dialog e inicia o questionario
- Apos completar o plano: salvar resultado e exibir como dashboard permanente (ja funciona assim)
- Adicionar botao "Refazer diagnostico" que limpa os dados e reinicia

**Arquivo**: `src/contexts/FeatureGateContext.tsx` ou novo contexto

- Adicionar verificacao: se `plano_vendas_data` nao existe no localStorage, bloquear as seguintes rotas:
  - `/cliente/crm`, `/cliente/chat`, `/cliente/agentes-ia`, `/cliente/scripts`, `/cliente/disparos`, `/cliente/dashboard`
- Na sidebar e nas paginas bloqueadas, exibir overlay com icone de cadeado + mensagem "Complete o Plano de Vendas primeiro"

**Arquivo**: `src/components/ClienteSidebar.tsx`

- Adicionar verificacao de `salesPlanCompleted` alem do gate de trial/creditos
- Items bloqueados ficam com `opacity-40` + icone de Lock (ja tem a estrutura)

**Arquivo**: `src/components/FeatureGateOverlay.tsx`

- Adicionar novo tipo de gate `"no_sales_plan"` com mensagem e CTA para `/cliente/plano-vendas`

---

### 6. CRM Kanban: lead nao move / sobreposicao ao selecionar

**Arquivo**: `src/pages/cliente/ClienteCRM.tsx`

O problema e que o Popover de acoes do card (linhas 104-123) e o checkbox de selecao (linhas 629-632) competem com o drag handle e o onClick do card, causando sobreposicao e impedindo o drag.

Correcoes:
- No `DraggableLeadCard`: garantir que o drag handle (`GripVertical`) tenha `touch-none` e esteja separado do click area
- Adicionar `pointer-events-none` ao card durante o drag (`isDragging`)
- Mover o Popover de acoes para fora da area draggable, usando `stopPropagation` corretamente
- Ajustar z-index do `DragOverlay` para ficar acima dos Popovers (z-50+)
- No Sheet do detalhe: fechar Popovers quando o sheet abre para evitar sobreposicao

---

### 7. Chat (Conversas): design WhatsApp + foto do usuario + mais infos

**Arquivo**: `src/components/cliente/ChatContactList.tsx`

- Adicionar preview da ultima mensagem no card do contato (buscar do campo `last_message` se disponivel)
- Mostrar foto do usuario via `photo_url` (ja usa Avatar com fallback)
- Adicionar mais info visivel: empresa, etapa CRM, agente atribuido como badges no card

**Arquivo**: `src/components/cliente/ChatConversation.tsx`

- Refinar header para parecer mais com WhatsApp: fundo verde-escuro, foto maior, status "online/offline", botoes de acao
- Area de mensagens: manter `whatsapp-bg` e adicionar wallpaper pattern sutil
- Input: campo arredondado com icones de emoji, clip e microfone (visual), botao de envio circular verde

**Arquivo**: `src/components/cliente/ChatMessageBubble.tsx`

- Refinar cores dos baloes: outbound verde-claro (#dcf8c6) em light mode, inbound branco
- Manter as "tails" (caudas) nos baloes
- Melhorar espaçamento e tipografia para ficar identico ao WhatsApp da imagem

---

### Detalhes tecnicos - Migracao SQL

Adicionar coluna para roleta:
```text
ALTER TABLE crm_settings 
ADD COLUMN IF NOT EXISTS roulette_last_index integer DEFAULT 0;
```

### Ordem de implementacao

1. Corrigir drag/sobreposicao do CRM Kanban (bug critico)
2. Remover prioridade das automacoes (rapido)
3. Implementar roleta real (logica + migracao)
4. Redesign do Chat WhatsApp (lista + conversa + bolhas)
5. Redesign do WA dentro do lead
6. Propostas como anexo
7. Plano de Vendas: popup + gate de funcoes
