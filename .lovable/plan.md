

# Ajustes: Espelhamento WhatsApp + Engenharia de Atendimento

## Diagnóstico

Após análise completa do código e dados, o sistema **já está bem estruturado** na maior parte. Os problemas reais identificados são pontuais:

### Problemas encontrados

1. **Agente IA vinculado a instâncias antigas** -- O agente "Davi Tesch" tem `whatsapp_instance_ids: ["e9ab6e19-...", "9c722007-..."]`, que são IDs de instâncias anteriores. A instância atual é `2f5c0892-1076-45ea-b126-ec4b47518b97`. Resultado: o agente é **bloqueado** pela verificação de instância no `ai-agent-reply` (linha 253-265) e nunca responde.

2. **Contatos de grupo e broadcast não sendo filtrados no webhook** -- O webhook já filtra grupos (`@g.us`) e broadcasts, mas contatos como `120363420345886065-group` e `status@broadcast` ainda são criados no banco e aparecem na lista (embora a UI os filtre parcialmente).

3. **Status updates criando contatos fantasma** -- Status do WhatsApp (`status@broadcast`) gera contatos com 282 mensagens não lidas, poluindo a interface.

4. **whatsapp-send não salva `instance_id` no contato** -- Quando um novo contato é criado via `whatsapp-send` (linha 133-138), o `instance_id` não é incluído, podendo criar contatos órfãos.

5. **ai-agent-reply busca instância genérica** -- Na linha 715, o `ai-agent-reply` busca `whatsapp_instances` sem filtrar pela instância do contato, podendo enviar pela instância errada em cenários multi-instância.

## Plano de correções

### 1. Atualizar `whatsapp_instance_ids` do agente (dado)
Atualizar o agente "Davi Tesch" para incluir o ID da instância atual `2f5c0892-1076-45ea-b126-ec4b47518b97`. Isso destrava a IA para responder nas conversas do número 554491129613.

### 2. Melhorar filtragem no webhook (edge function)
No `whatsapp-webhook`, rejeitar `status@broadcast` e contatos com padrão de grupo **antes** de inserir no banco, evitando poluição.

### 3. Corrigir `whatsapp-send` para salvar `instance_id` (edge function)
Ao criar novos contatos via `whatsapp-send`, incluir o `instance_id` da instância usada para envio.

### 4. Corrigir `ai-agent-reply` para usar instância do contato (edge function)
Na hora de enviar a resposta via Z-API, buscar a instância pelo `instance_id` do contato ao invés de pegar qualquer instância da organização.

### 5. Limpar contatos poluentes (dado)
Remover contatos de grupo e broadcast que já existem no banco (`status@broadcast`, padrões `-group`).

### 6. Ativar agente (status paused → active)
O agente "Davi Tesch" está com `status: "paused"`. Caso o usuário queira que a IA responda, ele precisa estar ativo. Verificar com o usuário se deseja ativar.

## Detalhes técnicos

**Arquivos modificados:**
- `supabase/functions/whatsapp-webhook/index.ts` -- adicionar filtro para `status@broadcast` e reforçar rejeição de grupos
- `supabase/functions/whatsapp-send/index.ts` -- incluir `instance_id` ao criar novo contato
- `supabase/functions/ai-agent-reply/index.ts` -- buscar instância pelo `contact.instance_id` ao invés de genérica

**Dados a atualizar:**
- `client_ai_agents`: atualizar `whatsapp_instance_ids` do agente para incluir `2f5c0892-...`
- `whatsapp_contacts`: deletar contatos com phone `status@broadcast` ou terminando em `-group`

**O que já funciona corretamente:**
- Espelhamento inbound/outbound (webhook captura `fromMe`)
- Filtro por instância no UI (já implementado)
- Realtime subscriptions
- Fluxo de 4 agentes (SDR, Closer, Pós-venda, Suporte) -- prompts e lógica já existem
- Transbordo humano automático
- Áudio transcription
- Criação de leads a partir do chat

