

# Sincronização inicial de conversas do WhatsApp

## Problema identificado

O sistema só captura conversas que passam pelo webhook **após** a configuração. Conversas que já existiam no WhatsApp (como "EcoAlternativa | Noexcuse", "Implante ingá", "Marcela Requena | Klir Imobiliária", "+55 44 9937-0965", "Titânia | Noexcuse marketing") **nunca foram importadas** para o banco de dados.

Atualmente existem **45 contatos** no sistema, mas o WhatsApp tem muito mais. O webhook funciona corretamente para novas mensagens, mas não faz retroativo.

## Solução

Criar uma edge function `whatsapp-sync-chats` que puxa todas as conversas existentes da Z-API e importa para o banco de dados — contatos + últimas mensagens.

### Funcionamento

1. Chamar `GET /chats` da Z-API para obter todas as conversas ativas
2. Para cada conversa individual (excluindo grupos/broadcasts):
   - Criar ou atualizar o contato no banco (upsert por phone + org_id)
   - Buscar as últimas mensagens via `GET /chat-messages/{phone}`
   - Inserir mensagens que ainda não existem (verificar por `message_id_zapi`)
3. Adicionar um botão "Sincronizar conversas" na interface do chat

### Detalhes técnicos

**Nova edge function**: `supabase/functions/whatsapp-sync-chats/index.ts`
- Recebe `instanceId` no body
- Busca a instância no banco e usa credenciais para chamar Z-API
- Chama `GET /chats` → filtra grupos/broadcasts → upsert contatos
- Para cada contato, chama `GET /chat/{phone}` com limite de 20 mensagens
- Insere mensagens com `ON CONFLICT DO NOTHING` baseado em `message_id_zapi`
- Retorna contagem de contatos e mensagens sincronizados

**Arquivo modificado**: `src/pages/cliente/ClienteChat.tsx`
- Adicionar botão "Sincronizar" no header do chat
- Chamar a edge function e invalidar queries ao concluir

**Arquivo modificado**: `src/components/cliente/ChatContactList.tsx`
- Adicionar botão de sync no topo da lista de contatos

### Fluxo do usuário

1. Usuário clica em "Sincronizar conversas" no chat
2. Sistema puxa todos os chats da Z-API
3. Contatos e mensagens são importados
4. Lista de contatos é atualizada automaticamente
5. Resultado: chat do sistema = espelho do WhatsApp

