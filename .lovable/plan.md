

# Engenharia de Atendimento WhatsApp — Espelho Completo + Agente IA

## Diagnóstico

1. **Agente IA não funciona**: O único agente ("Davi Tesch") tem `status: paused`. O `ai-agent-reply` só processa agentes com `status: active`. Quando pausado, nenhuma mensagem recebe resposta automática, mas os contatos ficam em `attending_mode: ai` — criando um limbo onde ninguém atende.

2. **Falta de lógica quando agente está pausado**: Quando o agente está pausado/desabilitado, todos os contatos que estavam atribuídos a ele deveriam automaticamente ter `attending_mode` alterado para `human` (desbloqueados para o humano). Atualmente isso não acontece.

3. **Número incorreto no header**: O `phone_number` no banco está correto (`554491129613`), mas o header da página de Conversas só mostra o número no estado de loading. No estado normal (conectado), o número não aparece no header principal.

4. **Divisão visual IA vs Humano inexistente na lista**: A lista de contatos tem filtros mas não tem uma separação visual clara entre conversas atendidas pela IA e conversas humanas.

## Solução

### 1. Webhook + ai-agent-reply — Lógica quando agente está pausado

**`whatsapp-webhook/index.ts`**: Após o trigger do `ai-agent-reply`, nada muda.

**`ai-agent-reply/index.ts`**: Quando não encontra agente ativo (linha 221), em vez de simplesmente retornar `skipped`, deve:
- Verificar se o contato está em `attending_mode: ai`
- Se sim, mudar para `attending_mode: human` (desbloquear para humano)
- Criar notificação informando que não há agente ativo

### 2. Sincronizar status do agente com contatos

Quando um agente muda de `active` → `paused`, todos os contatos atribuídos a ele devem ter `attending_mode` alterado para `human`. Implementar via:
- Uma verificação no `ai-agent-reply` (já coberto acima)
- Um hook na UI que, ao pausar um agente, faz UPDATE em batch nos contatos

**`src/hooks/useClienteAgents.ts`**: Na mutation de update do agente, quando status muda para `paused`, executar UPDATE em `whatsapp_contacts` onde `agent_id = agentId` para setar `attending_mode = 'human'`.

### 3. UI — Divisão clara IA vs Humano na lista de contatos

**`src/components/cliente/ChatContactList.tsx`**: Reorganizar a lista em duas seções visuais:
- **"Atendimento Humano"** — contatos com `attending_mode = 'human'` (com badge de unread count destacado)
- **"Agente IA"** — contatos com `attending_mode = 'ai'` (com ícone de bot e nome do agente)

Manter os filtros existentes mas adicionar separadores visuais entre as seções.

### 4. Header — Mostrar número conectado

**`src/pages/cliente/ClienteChat.tsx`**: Adicionar o badge com o número conectado no header principal (não apenas no loading state). Usar `instance?.phone_number` formatado.

### 5. Fix whatsapp-send — Usar instância correta do contato

**`supabase/functions/whatsapp-send/index.ts`**: Verificar que está buscando a instância com `instance_id` do contato, não apenas a primeira da org.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/ai-agent-reply/index.ts` | Quando sem agente ativo, mudar contato para `human` |
| `src/hooks/useClienteAgents.ts` | Ao pausar agente, desbloquear contatos para humano |
| `src/components/cliente/ChatContactList.tsx` | Separar visualmente seções IA vs Humano |
| `src/pages/cliente/ClienteChat.tsx` | Mostrar número conectado no header |

