
# Ajustes no Controle do Agente + Follow-up Inteligente + Pagamentos Asaas

## Resumo das Mudancas

Quatro ajustes principais baseados no feedback:

### 1. Reduzir limite padrao de mensagens (30 -> 10)

O padrao de 30 mensagens e excessivo. Alterar para **10 mensagens** como padrao em todos os pontos:
- `AgentFormSheet.tsx` -- valor padrao no formulario
- `ai-agent-reply/index.ts` -- fallback na edge function

### 2. Estrategia de follow-up com encerramento automatico

Hoje o follow-up funciona, mas apos esgotar as tentativas o contato continua em modo "ai". O correto e:

**Fluxo completo:**
1. Agente responde normalmente ate o limite de mensagens
2. Se o contato nao responde, inicia follow-ups automaticos (configuravel: 1-5 tentativas)
3. Apos esgotar os follow-ups sem resposta, o agente **encerra automaticamente** -- muda `attending_mode` para "closed" e notifica a equipe
4. Se o contato voltar a falar depois, o sistema reativa em modo humano (nao gasta mais tokens)

Alterar `agent-followup-cron` para executar handoff automatico apos `max_attempts` atingido.

### 3. Limite por objetivo (nao por conversa infinita)

Reforcar no system prompt que o agente tem um objetivo claro e um numero limitado de mensagens para cumpri-lo. Adicionar instrucao no prompt:

> "Voce tem no maximo {max_messages} mensagens para cumprir seu objetivo. Seja direto e eficiente. Se nao conseguir, transfira para um atendente humano."

Isso faz a IA ser mais objetiva e nao ficar enrolando.

### 4. Configurar recebimento de pagamentos via Asaas

O webhook do Asaas ja esta implementado (`asaas-webhook`). Para funcionar de ponta a ponta, precisamos:

- **Chave da API Asaas** -- precisa ser configurada como secret
- A edge function ja processa `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`
- Ja incrementa creditos automaticamente na wallet da organizacao
- O admin da Franqueadora ja pode fazer recargas manuais via `recharge-credits`

Para ativar, basta configurar o webhook no painel do Asaas apontando para a URL da edge function.

---

## Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/cliente/AgentFormSheet.tsx` | Padrao de max_messages de 30 para 10 |
| `supabase/functions/ai-agent-reply/index.ts` | Padrao de 30 para 10; instrucao de objetivo no prompt |
| `supabase/functions/agent-followup-cron/index.ts` | Encerrar contato (handoff) apos esgotar follow-ups |

---

## Detalhes Tecnicos

### AgentFormSheet.tsx

Linha 151 -- alterar default de `max_messages: 30` para `max_messages: 10`

Linha 665 -- alterar fallback `|| 30` para `|| 10`

### ai-agent-reply/index.ts

Linha 181 -- alterar `engagementRules.max_messages ?? 30` para `?? 10`

Adicionar instrucao no system prompt (antes de enviar para a IA):
```
Voce tem no maximo {maxMessages} mensagens nesta conversa para cumprir seu objetivo.
Seja direto, eficiente e conduza a conversa de forma objetiva.
Se nao conseguir cumprir o objetivo dentro desse limite, use [AI_ACTION:HANDOFF:motivo].
```

### agent-followup-cron/index.ts

Apos a checagem `if (followupCount >= maxAttempts) continue;`, adicionar logica para:
1. Verificar se o contato ja recebeu `maxAttempts` follow-ups
2. Se sim, mudar `attending_mode` para "human" (handoff)
3. Notificar equipe via `client_notifications`
4. O agente nao fala mais com esse contato (nao gasta tokens)

### Configuracao do Asaas

A URL do webhook que o usuario precisa cadastrar no painel Asaas sera:
`https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/asaas-webhook`

Opcionalmente, podemos adicionar um secret `ASAAS_WEBHOOK_TOKEN` para validar a autenticidade dos webhooks.
