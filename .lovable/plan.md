

# Sync completo do WhatsApp — Correção do endpoint multi-device

## Problema

Os logs mostram que a sincronização encontrou **637 chats** e filtrou para **556 conversas individuais**, mas falha ao buscar mensagens históricas:
```
"Does not work in multi device version"
```
O endpoint `GET /chat-messages/{phone}` da Z-API **não é compatível** com a versão multi-device do WhatsApp. Isso significa que os contatos estão sendo criados, mas sem mensagens históricas — e o processo trava/demora demais tentando buscar mensagens de 556 contatos.

## Solução

### 1. Corrigir `whatsapp-sync-chats` (edge function)
- **Remover** a tentativa de buscar mensagens históricas via `/chat-messages/{phone}` (não funciona em multi-device)
- **Focar** na sincronização de contatos via `/chats` (que funciona perfeitamente)
- Usar os dados do `/chats` (nome, foto, última mensagem, unread count) para criar/atualizar contatos
- Extrair o `lastMessage` que já vem no payload do `/chats` como preview da última mensagem
- Resultado: sincronização rápida (segundos ao invés de minutos) e contatos aparecem imediatamente

### 2. O que muda no fluxo
- **Antes**: Tentava buscar 20 mensagens por contato × 556 contatos = 11.120 requests (falhando)
- **Depois**: 1 request paginado ao `/chats` → cria todos os contatos → webhook captura mensagens novas a partir daqui
- As conversas históricas de cada contato não estarão no sistema (limitação da Z-API multi-device), mas todas as novas mensagens serão capturadas em tempo real pelo webhook

### 3. Melhorar feedback na UI
- Mostrar progresso durante a sincronização (contatos encontrados/processados)
- Toast com resultado detalhado

### Arquivos modificados
- `supabase/functions/whatsapp-sync-chats/index.ts` — remover loop de `/chat-messages`, focar em upsert de contatos
- `src/pages/cliente/ClienteChat.tsx` — sem mudanças significativas (já tem o botão de sync)

