
# Chat Avancado + IA com Leads + Permissao por Funil

## Resumo

Tres grandes frentes: (1) reestruturar o Chat WhatsApp com separacao IA/Humano, filtros por etapa/agente, painel de acoes destacado e chat integrado no CRM; (2) IA inteligente que atualiza leads automaticamente (mudanca de etapa, transbordo com alerta); (3) sistema de permissoes por funil no CRM, permitindo intercalar entre funis com acesso controlado por usuario/time.

---

## Parte 1: Chat Reestruturado

### 1.1 Filtros na lista de contatos (ChatContactList)

Adicionar pilulas de filtro acima da busca:
- **Todos** | **IA** | **Humano** | **Espera** (contatos com mensagens nao lidas)
- **Por agente**: dropdown com agentes ativos (busca em `client_ai_agents`)
- **Por etapa do lead**: dropdown com etapas do funil (busca a etapa via `crm_lead_id` -> `crm_leads.stage`)

Cada contato na lista exibira badges visuais:
- Badge roxa "IA" ou verde "Humano" no avatar
- Badge com nome da etapa do lead vinculado (se houver)
- Badge com nome do agente IA atribuido

### 1.2 Painel de acoes na conversa (ChatConversation)

Destacar as acoes do header em um painel mais robusto:
- **Transbordo**: botao "Assumir" / "Devolver p/ IA" com destaque visual
- **Lead vinculado**: card compacto mostrando nome do lead, etapa atual e valor. Clicar abre o lead detail sheet direto
- **Criar Lead**: se nao houver lead vinculado, botao "Criar Lead" com pre-preenchimento
- **Transferir agente**: dropdown para mudar o agente IA atribuido ao contato
- **Alterar etapa**: select rapido para mover a etapa do lead vinculado sem sair do chat
- **Alerta de transbordo**: quando a IA solicitar transbordo, exibir banner amarelo/laranja no topo da conversa

### 1.3 Indicadores visuais nas mensagens (ChatMessageBubble)

- Badge "IA" em mensagens enviadas pelo agente (detectar via `metadata.ai_generated`)
- Badge "Humano" em mensagens enviadas manualmente

---

## Parte 2: Chat Integrado no Lead (CRM)

### 2.1 Aba WhatsApp expandida no Lead Detail Sheet

Expandir a aba "WA" do `CrmLeadDetailSheet` para exibir:
- Historico completo de mensagens do contato vinculado
- Input de envio de mensagem no rodape
- Botao "Abrir no Chat" para ir a pagina completa
- Se nao houver contato vinculado mas o lead tem telefone, exibir botao "Iniciar conversa"

---

## Parte 3: IA Inteligente -- Atualizacao Automatica de Leads

### 3.1 Contexto CRM no system prompt (ai-agent-reply)

Modificar a edge function para incluir no system prompt:
- Informacoes do lead vinculado (nome, etapa atual, valor, tags)
- Etapas disponiveis do funil
- Instrucoes para acoes estruturadas: `[AI_ACTION:MOVE_STAGE:nome]`, `[AI_ACTION:HANDOFF:motivo]`, `[AI_ACTION:UPDATE_LEAD:campo=valor]`

### 3.2 Processamento de acoes na edge function

Apos receber a resposta da IA:
1. Parsear acoes `[AI_ACTION:...]` do texto
2. Remover as acoes do texto antes de enviar ao usuario
3. Executar no banco:
   - `MOVE_STAGE`: atualizar `crm_leads.stage` e registrar atividade
   - `HANDOFF`: mudar `attending_mode` para `human`, criar notificacao em `client_notifications`
   - `UPDATE_LEAD`: atualizar campos do lead (value, tags)
4. Inserir alerta em `client_notifications` no transbordo

### 3.3 Alerta de transbordo

Quando a IA executa `HANDOFF`:
1. Mudar `attending_mode` do contato para `human`
2. Criar notificacao em `client_notifications` com titulo "IA solicitou transbordo" e link para o chat
3. No frontend, exibir banner amarelo quando `attending_mode` acabou de mudar para `human`

---

## Parte 4: Permissoes por Funil no CRM

### 4.1 Intercalar entre funis

Atualmente o CRM usa apenas o funil padrao (ou o primeiro). Adicionar:
- Um **seletor de funil** no header do CRM (Select/Tabs) que permite intercalar entre funis
- Os leads sao filtrados por `funnel_id` do funil selecionado
- O estado `selectedFunnelId` controla qual funil esta ativo

### 4.2 Controle de acesso por funil

A tabela `crm_teams` ja possui `funnel_ids` (lista de funis a que o time tem acesso) e `members` (lista de user_ids). Usar essa estrutura para controlar visibilidade:

- Ao carregar os funis, filtrar apenas os que o usuario logado tem acesso:
  - Se o usuario e `cliente_admin` -> ve todos os funis
  - Senao -> buscar em `crm_teams` onde o `user_id` esta em `members` e retornar os `funnel_ids` desses times
- Criar um hook `useUserFunnelAccess()` que retorna os IDs de funis acessiveis
- Os funis que o usuario nao tem acesso nao aparecem no seletor

### 4.3 Configuracao no CRM Config

Na aba "Times" do CRM Config (ja existe `CrmTeamManager`), garantir que a vinculacao de funis aos times esteja clara:
- Cada time ja tem campo `funnel_ids` para definir quais funis aquele time pode acessar
- A interface ja permite selecionar funis por time

### 4.4 Impacto nos leads

- Quando o usuario cria um lead, ele e criado no funil selecionado (campo `funnel_id`)
- Quando o usuario muda de funil, os leads mostrados mudam
- A barra de acoes em massa respeita o funil ativo

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Criar | `src/hooks/useUserFunnelAccess.ts` -- hook que retorna funis acessiveis pelo usuario logado |
| Reescrever | `src/pages/cliente/ClienteChat.tsx` -- filtros por modo/agente/etapa |
| Reescrever | `src/components/cliente/ChatContactList.tsx` -- pilulas de filtro, badges visuais |
| Reescrever | `src/components/cliente/ChatConversation.tsx` -- painel de acoes expandido, alerta transbordo, select de etapa/agente |
| Editar | `src/components/cliente/ChatMessageBubble.tsx` -- badge IA/Humano |
| Editar | `src/components/crm/CrmLeadDetailSheet.tsx` -- aba WA com historico completo e input de envio |
| Editar | `src/pages/cliente/ClienteCRM.tsx` -- seletor de funil, filtro por funnel_id, acesso por permissao |
| Editar | `src/hooks/useWhatsApp.ts` -- adicionar `useUpdateContactAgent` mutation |
| Reescrever | `supabase/functions/ai-agent-reply/index.ts` -- contexto CRM, acoes automaticas, transbordo |

## Sem migration necessaria

Todos os campos ja existem:
- `whatsapp_contacts.attending_mode`, `agent_id`, `crm_lead_id`
- `crm_leads.stage`, `value`, `tags`, `funnel_id`
- `crm_teams.funnel_ids`, `members`
- `client_notifications` para alertas
- `whatsapp_messages.metadata` para flag `ai_generated`

## Detalhes Tecnicos

- O hook `useUserFunnelAccess` busca o usuario logado com `auth.uid()`, consulta `crm_teams` onde `members` contem o user_id (via filtro local no array JSONB), e retorna a uniao de `funnel_ids`. Se o usuario tiver role `cliente_admin`, retorna todos os funis sem filtro.
- Os filtros do chat usam os dados ja carregados em memoria (contacts array), sem queries extras, exceto para cruzar `crm_lead_id` com leads (uma query batch)
- As acoes da IA usam regex para parsear `[AI_ACTION:...]` do texto retornado pelo modelo
- O transbordo cria uma notificacao via `adminClient.from("client_notifications").insert(...)` na edge function
- A aba WhatsApp no CRM reutiliza `useWhatsAppMessages` e `useSendWhatsAppMessage` existentes
- O seletor de funil no CRM fica no header ao lado da busca, como um Select compacto que lista apenas funis acessiveis
- Ao mudar de funil, `useCrmLeads(funnelId)` busca leads filtrados por aquele funil
- Leads criados via "Novo Lead" sao automaticamente associados ao funil selecionado
