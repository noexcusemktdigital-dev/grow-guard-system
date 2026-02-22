

# Fluxo Completo: Chat WhatsApp + Agente de IA + CRM

## O Problema

Hoje os 3 modulos (Chat, Agentes de IA, CRM) funcionam isolados. Precisamos conecta-los para que:
1. Contatos do WhatsApp possam ser vinculados a leads no CRM
2. O Agente de IA responda automaticamente mensagens recebidas
3. O atendente humano possa assumir (transbordo) quando necessario

---

## Como saber se um contato e um lead?

A ligacao entre Chat e CRM sera feita pelo **telefone**. O sistema comparara o `phone` do `whatsapp_contacts` com o `phone` do `crm_leads`. Se houver match, o contato ja e um lead. Se nao, o atendente pode clicar em "Criar Lead" direto do chat.

Adicionamos tambem um campo `whatsapp_contact_id` na tabela `crm_leads` para vincular diretamente.

---

## Arquitetura do Fluxo

```text
Mensagem recebida (Z-API Webhook)
        |
        v
  whatsapp-webhook (edge function)
        |
        +-- Salva mensagem no banco
        |
        +-- Verifica se tem Agente de IA ativo
        |       |
        |       SIM --> Chama edge function "ai-agent-reply"
        |       |           |
        |       |           +-- Busca config do agente (persona, prompt, base)
        |       |           +-- Chama Lovable AI Gateway
        |       |           +-- Envia resposta via Z-API
        |       |           +-- Salva resposta como mensagem outbound
        |       |
        |       NAO --> Mensagem fica aguardando atendente humano
        |
        v
  Chat (frontend) -- atendente ve conversa em tempo real
        |
        +-- Pode "Assumir" conversa (desativa IA para este contato)
        +-- Pode "Criar Lead" (envia contato para CRM)
        +-- Pode "Ver Lead" (se ja existe lead vinculado)
        +-- Pode "Devolver para IA" (reativa IA para este contato)
```

---

## Etapa 1 -- Banco de Dados (Migration)

### Alteracoes em tabelas existentes:

1. **`whatsapp_contacts`** -- adicionar colunas:
   - `agent_id` (uuid, nullable, FK -> client_ai_agents) -- agente de IA atribuido
   - `attending_mode` (text, default 'ai') -- 'ai' | 'human' | 'idle'
   - `crm_lead_id` (uuid, nullable) -- vinculo direto com lead do CRM

2. **`crm_leads`** -- adicionar coluna:
   - `whatsapp_contact_id` (uuid, nullable) -- vinculo com contato WhatsApp

### Nova tabela:

3. **`ai_conversation_logs`** -- log de interacoes do agente
   - `id` (uuid, PK)
   - `organization_id` (uuid)
   - `contact_id` (uuid, FK -> whatsapp_contacts)
   - `agent_id` (uuid, FK -> client_ai_agents)
   - `input_message` (text)
   - `output_message` (text)
   - `tokens_used` (int)
   - `model` (text)
   - `created_at` (timestamptz)
   - RLS: membros da org podem SELECT

---

## Etapa 2 -- Edge Function "ai-agent-reply"

Nova edge function que sera chamada pelo webhook quando uma mensagem chega:

1. Recebe `organization_id`, `contact_id`, `message_text`
2. Busca o contato e verifica `attending_mode`:
   - Se `human` --> ignora (atendente humano esta respondendo)
   - Se `ai` --> continua
3. Busca o agente ativo (status = 'active', channel = 'whatsapp') da organizacao
4. Se nao tem agente ativo --> ignora
5. Busca as ultimas N mensagens da conversa para contexto
6. Monta o prompt com: system_prompt do agente + persona + base de conhecimento + historico
7. Chama Lovable AI Gateway (google/gemini-3-flash-preview)
8. Envia a resposta via Z-API (reusa logica do whatsapp-send)
9. Salva a resposta como mensagem outbound em `whatsapp_messages`
10. Registra o log em `ai_conversation_logs`

---

## Etapa 3 -- Atualizar Webhook

Modificar `whatsapp-webhook/index.ts` para, apos salvar a mensagem recebida:
- Verificar se o contato tem `attending_mode = 'ai'`
- Se sim, chamar a edge function `ai-agent-reply` (via fetch interno)
- Se nao, apenas salvar normalmente

---

## Etapa 4 -- Chat: Vincular ao CRM + Transbordo IA/Humano

Modificar o header da conversa no Chat para incluir:

**Indicador de modo de atendimento:**
- Badge "IA" (roxo) ou "Humano" (verde) ou "Sem atendimento" (cinza)
- Botao "Assumir" (muda attending_mode para 'human')
- Botao "Devolver para IA" (muda attending_mode para 'ai')

**Integracao com CRM:**
- Se o telefone do contato corresponde a um lead existente: mostra badge "Lead" com link para abrir detalhe
- Se nao corresponde: botao "Criar Lead" que abre dialog pre-preenchido com nome e telefone do contato
- Ao criar o lead, vincula `whatsapp_contact_id` e `crm_lead_id` automaticamente

---

## Etapa 5 -- CRM: Ver historico WhatsApp do lead

No detalhe do lead (Sheet lateral no ClienteCRM), adicionar aba "WhatsApp":
- Se o lead tem `whatsapp_contact_id`, mostra as ultimas mensagens da conversa
- Botao "Abrir conversa" que navega para o Chat com o contato selecionado
- Se nao tem vinculo, mostra "Nenhuma conversa vinculada" com opcao de buscar por telefone

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Migration | Alterar `whatsapp_contacts`, `crm_leads`, criar `ai_conversation_logs` |
| Criar | `supabase/functions/ai-agent-reply/index.ts` |
| Editar | `supabase/functions/whatsapp-webhook/index.ts` (chamar ai-agent-reply) |
| Editar | `src/hooks/useWhatsApp.ts` (adicionar mutations de transbordo e vinculo CRM) |
| Editar | `src/components/cliente/ChatConversation.tsx` (header com transbordo + CRM) |
| Editar | `src/pages/cliente/ClienteCRM.tsx` (aba WhatsApp no detalhe do lead) |
| Editar | `supabase/config.toml` (registrar ai-agent-reply) |

---

## Detalhes Tecnicos

- A edge function `ai-agent-reply` usa `LOVABLE_API_KEY` (ja configurada) para chamar o Lovable AI Gateway
- O modelo padrao sera `google/gemini-3-flash-preview`, mas respeita o modelo configurado no agente
- O historico enviado ao modelo inclui as ultimas 20 mensagens para manter contexto
- O transbordo e por contato: quando o atendente clica "Assumir", apenas aquele contato para de receber respostas da IA
- O vinculo CRM e bidirecional: `whatsapp_contacts.crm_lead_id` e `crm_leads.whatsapp_contact_id`
- Tratamento de rate limit (429) e creditos (402) no ai-agent-reply: se falhar, a mensagem fica sem resposta e um log e registrado

## Ordem de implementacao sugerida

1. Migration (colunas novas + tabela de logs)
2. Edge function `ai-agent-reply`
3. Atualizar webhook para chamar o agente
4. Frontend: transbordo + CRM no chat
5. Frontend: aba WhatsApp no detalhe do lead
