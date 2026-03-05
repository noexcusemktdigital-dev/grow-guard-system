

# Sincronizar estado real do WhatsApp — remover contatos antigos

## Problema

O sync atual (`whatsapp-sync-chats`) apenas **adiciona e atualiza** contatos. Nunca remove os que não existem mais no WhatsApp. Resultado: contatos antigos, conversas deletadas e números que não interagem mais ficam acumulados na lista.

## Solução

Após sincronizar os chats da Z-API, comparar os telefones retornados com os existentes no banco. Contatos que **não aparecem na Z-API** e **não têm mensagens recentes no banco** (últimos 7 dias) serão **deletados** do banco.

Adicionalmente, contatos sem `last_message_preview` e com `last_message_at` muito antigo (> 30 dias) que a Z-API não retornou serão removidos — são conversas mortas.

## Mudanças

### `supabase/functions/whatsapp-sync-chats/index.ts`
- Após o loop de upsert, coletar todos os phones retornados pela Z-API num Set
- Buscar contatos existentes no banco que **não estão** nesse Set
- Para cada um desses "órfãos": deletar se `last_message_at` for > 7 dias atrás **e** não houver mensagens no banco nos últimos 7 dias
- Retornar `contacts_removed` na resposta
- Remover logs DEBUG desnecessários

### `src/hooks/useWhatsApp.ts`
- No `useWhatsAppContacts`, filtrar contatos do tipo `lid` (são IDs internos do WhatsApp, não contatos reais) — já filtra groups mas não lid

### `src/pages/cliente/ClienteChat.tsx`
- Atualizar o toast de sync para mostrar contatos removidos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-sync-chats/index.ts` | Deletar contatos ausentes da Z-API + sem atividade recente |
| `src/hooks/useWhatsApp.ts` | Filtrar contatos `lid` |
| `src/pages/cliente/ClienteChat.tsx` | Mostrar removidos no toast |

