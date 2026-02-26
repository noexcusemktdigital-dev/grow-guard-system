

## Otimizacoes CRM, Conversas e Agentes de IA

Avaliacao completa dos tres modulos com problemas identificados e correcoes propostas, organizados por prioridade.

---

### Prioridade Alta (impacto direto na experiencia)

#### 1. Preview de ultima mensagem vazio no Chat
O mapa `lastMessages` em `ClienteChat.tsx` e criado vazio e nunca preenchido. Resultado: a lista de contatos nao mostra preview da ultima mensagem.

**Correcao**: Fazer uma query leve buscando a ultima mensagem de cada contato, ou aproveitar o realtime para manter um cache local.

**Arquivo**: `src/pages/cliente/ClienteChat.tsx`

---

#### 2. Paginacao de mensagens no backend
`useWhatsAppMessages` busca TODAS as mensagens sem limite. Contatos com centenas de mensagens sobrecarregam o frontend.

**Correcao**: Adicionar `.limit(200)` na query inicial e implementar "carregar mais" com offset.

**Arquivo**: `src/hooks/useWhatsApp.ts`

---

#### 3. Indicador de "IA processando" no chat
O agente mostra "digitando" no WhatsApp, mas dentro da plataforma nao ha indicacao visual de que a IA esta processando uma resposta.

**Correcao**: Quando uma mensagem inbound chega e o contato esta em modo `ai`, exibir um indicador de "digitando..." temporario na conversa (3 pontinhos animados).

**Arquivo**: `src/components/cliente/ChatConversation.tsx`

---

#### 4. Validacao de conflito no SCHEDULE_MEETING
A acao `SCHEDULE_MEETING` insere o evento sem verificar se o horario ja esta ocupado. Se o LLM alucinar, cria eventos duplicados.

**Correcao**: Antes de inserir, fazer query em `calendar_events` para verificar overlap. Se houver conflito, nao criar e logar o erro.

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts`

---

### Prioridade Media (performance e robustez)

#### 5. Realtime muito amplo
O channel realtime invalida TODAS as queries de mensagens em qualquer mudanca, mesmo de contatos nao selecionados.

**Correcao**: Filtrar o listener do realtime pelo `contact_id` selecionado para mensagens, mantendo o listener amplo apenas para contatos (unread badges).

**Arquivo**: `src/pages/cliente/ClienteChat.tsx`

---

#### 6. Fallback de agente desativado
Se o agente atribuido ao contato foi desativado, a mensagem e ignorada silenciosamente.

**Correcao**: Se a query com `agent_id` retorna vazio, buscar qualquer agente ativo da organizacao como fallback. Logar o fallback.

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts`

---

#### 7. Retry com backoff em rate limit (429)
A funcao retorna erro imediatamente quando o gateway da 429.

**Correcao**: Implementar 1 retry com delay de 3 segundos antes de desistir.

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts`

---

#### 8. Bulk update de tags faz N chamadas
`handleBulkAddTag` no CRM faz um `updateLead.mutate()` por lead selecionado.

**Correcao**: Usar `bulkUpdateLeads` com logica de merge de tags no backend, ou pelo menos agrupar as chamadas.

**Arquivo**: `src/pages/cliente/ClienteCRM.tsx`

---

### Prioridade Baixa (limpeza e consistencia)

#### 9. Remover CrmKanban.tsx legado
O componente `CrmKanban.tsx` usa tipos mock e nao e usado no fluxo real do cliente. Pode ser removido.

**Arquivo**: `src/components/crm/CrmKanban.tsx`

---

#### 10. Limitar tamanho do system prompt
O prompt acumula muitas secoes e pode ultrapassar o context window com bases de conhecimento extensas.

**Correcao**: Truncar a base de conhecimento para no maximo 4000 caracteres e o historico de chat para 15 mensagens.

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts`

---

### Resumo de impacto

| Item | Arquivos | Complexidade |
|------|---------|-------------|
| Preview ultima msg | ClienteChat.tsx | Baixa |
| Paginacao mensagens | useWhatsApp.ts | Baixa |
| Indicador IA digitando | ChatConversation.tsx | Media |
| Validacao SCHEDULE_MEETING | ai-agent-reply | Baixa |
| Realtime otimizado | ClienteChat.tsx | Media |
| Fallback agente | ai-agent-reply | Baixa |
| Retry 429 | ai-agent-reply | Baixa |
| Bulk tags | ClienteCRM.tsx | Baixa |
| Remover legado | CrmKanban.tsx | Trivial |
| Truncar prompt | ai-agent-reply | Baixa |

Total: 6 arquivos afetados, maioria das correcoes sao pontuais.

