

# Espelho Total do WhatsApp + Definição de Agente IA

## Problema Identificado

Existem **~20+ contatos** no banco com `instance_id = NULL` (criados antes da migração). A UI filtra por `instance_id = eq.{id}`, excluindo todos esses contatos. Além disso, grupos e broadcasts estão vazando para a tabela de contatos (ex: `120363402954928750-group`, `status@broadcast`).

O campo `attending_mode` não tem valor padrão — contatos novos precisam receber `ai` por padrão.

## Solução

### 1. Database Migration
- Adicionar `DEFAULT 'ai'` na coluna `attending_mode` de `whatsapp_contacts`
- Atualizar contatos com `instance_id = NULL` para a instância atual da org

### 2. Data Fix (via insert tool)
- Atualizar todos os contatos existentes com `instance_id = NULL` para a instância `9c722007-5c54-4a1c-8dde-56f39c6c8edf`

### 3. UI — Remover filtro estrito de instance_id
Em `ClienteChat.tsx`, passar `null` em vez de `instance?.id` para `useWhatsAppContacts`, mostrando TODOS os contatos da org (espelho total).

### 4. Melhorar filtro de grupos/broadcasts
Em `useWhatsApp.ts`, reforçar o filtro para excluir padrões de grupo (`-group`, `@g.us`, `@broadcast`, números no formato `XXXXXXX-XXXXXXXXXX`).

### 5. Webhook — Definir attending_mode padrão
Em `whatsapp-webhook/index.ts`, adicionar `attending_mode: 'ai'` ao criar novos contatos, garantindo que a IA responda por padrão.

### 6. ai-agent-reply — Tratar NULL como "ai"
Em `ai-agent-reply/index.ts`, alterar o check de `contact.attending_mode !== "ai"` para `contact.attending_mode === "human"`, tratando `null` como modo IA ativo.

## Arquivos

| Arquivo | Ação |
|---------|------|
| Database migration | DEFAULT 'ai' em attending_mode |
| Data update | Migrar instance_id NULL → instância atual |
| `src/pages/cliente/ClienteChat.tsx` | Remover filtro de instance_id |
| `src/hooks/useWhatsApp.ts` | Melhorar filtro de grupos/broadcasts |
| `supabase/functions/whatsapp-webhook/index.ts` | Definir attending_mode: 'ai' no insert |
| `supabase/functions/ai-agent-reply/index.ts` | Tratar NULL como modo IA |

