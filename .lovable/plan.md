

## Melhorias no Espelho do WhatsApp — Funcionalidades Faltantes

Após análise completa do código atual e comparação com as funcionalidades do WhatsApp Web, identifiquei o que já está implementado e o que falta para tornar a ferramenta um espelho mais fiel.

### Já implementado (bem feito)
- Mensagens em tempo real, optimistic UI, retry automático
- Áudio (gravação + player estilizado), imagens, vídeos, documentos
- Emojis, respostas rápidas, citações (reply/quote)
- Indicador de digitação, confirmações de leitura (✓✓ azul)
- Lightbox de imagens, stickers, mensagens expansíveis
- Busca na conversa, filtros por modo (IA/Humano/Grupos)
- Lista virtualizada, cache IndexedDB, polling fallback

### Funcionalidades faltantes a implementar

**1. Menu de contexto nas mensagens (hover/long-press)**
Ao passar o mouse sobre uma mensagem, aparece um menu dropdown com ações:
- Responder (já existe via ícone, mover para o menu)
- Copiar texto
- Encaminhar
- Reagir com emoji
- Marcar com estrela
- Apagar mensagem
- Info da mensagem

**2. Reações com emoji**
- Barra rápida de 6 emojis (👍❤️😂😮😢🙏) + botão "+" para picker completo
- Reações ficam abaixo da bolha da mensagem
- Envia reação via edge function `whatsapp-send` com `type: "reaction"`

**3. Encaminhar mensagens**
- Dialog para selecionar contato(s) destino
- Reenvia a mensagem (texto/mídia) para outro contato

**4. Copiar texto da mensagem**
- Copia o conteúdo para clipboard com feedback via toast

**5. Marcar mensagens com estrela (favoritas)**
- Coluna `is_starred` na tabela `whatsapp_messages`
- Ícone de estrela no hover da mensagem
- Filtro "Favoritas" no topo da conversa para ver apenas mensagens marcadas

**6. Apagar mensagem**
- "Apagar para mim" (soft delete local) e "Apagar para todos" (envia revoke via API)
- Mensagem apagada mostra "🚫 Mensagem apagada" no lugar do conteúdo

**7. Painel de mídia/arquivos compartilhados**
- Nova aba no `ChatLeadPanel` mostrando galeria de mídias, documentos e links compartilhados na conversa
- Grid de thumbnails para imagens, lista para documentos

**8. Fixar conversas no topo**
- Coluna `is_pinned` na tabela `whatsapp_contacts`
- Contatos fixados ficam sempre no topo da lista

**9. Arquivar conversas**
- Coluna `is_archived` na tabela `whatsapp_contacts`
- Conversas arquivadas ficam ocultas por padrão, com link "Arquivadas (N)" no topo da lista

### Detalhes técnicos

**Migração SQL:**
```sql
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
```

**Menu de contexto** — Componente `ChatMessageMenu` usando `DropdownMenu` do Shadcn, posicionado via hover no canto da bolha (ícone ▾). Ações disparam mutations individuais.

**Reações** — Armazenadas no campo `metadata` da mensagem (ex: `metadata.reactions: [{emoji: "👍", from: "user"}]`). Enviadas via `whatsapp-send` com action `reaction`.

**Painel de mídia** — Filtra `whatsapp_messages` por `media_url IS NOT NULL` agrupando por tipo (imagem, documento, link). Reutiliza o `ChatLeadPanel` adicionando tabs.

### Arquivos afetados
- `src/components/cliente/ChatMessageBubble.tsx` — adicionar menu de contexto, reações, estrela
- `src/components/cliente/ChatConversation.tsx` — handlers para encaminhar, apagar, estrelar, filtro de favoritas
- `src/components/cliente/ChatContactList.tsx` — pinned no topo, seção "Arquivadas"
- `src/components/cliente/ChatContactItem.tsx` — ícone de pin
- `src/components/cliente/ChatLeadPanel.tsx` — abas mídia/docs/links
- `src/components/cliente/ChatForwardDialog.tsx` — novo componente
- `src/hooks/useWhatsApp.ts` — mutations para star, delete, pin, archive, reaction
- `supabase/migrations/` — nova migração (colunas is_starred, is_deleted, is_pinned, is_archived)

