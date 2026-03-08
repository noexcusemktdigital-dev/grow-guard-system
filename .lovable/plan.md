

## Plano: Lista de Conversas Unificada (Estilo WhatsApp)

### Problema
A lista de contatos separa "Atendimento Humano" e "Agente IA" em seções distintas com headers coloridos. O usuário quer uma lista única, cronológica, idêntica ao WhatsApp real.

### Mudança em `ChatContactList.tsx`

**Remover**: A lógica de separação `humanContacts` / `aiContacts` e os dois blocos de seção com headers ("Atendimento Humano" e "Agente IA").

**Substituir por**: Uma única lista flat ordenada por `last_message_at` (mais recente primeiro). O indicador de modo (IA/Humano) já existe no `ChatContactItem` como badge no avatar — continua visível sem precisar de seções separadas.

**Manter**: Os filtros por pill (Todos, IA, Humano, Espera) no header para quem quiser filtrar. Busca por nome/telefone. Filtro por agente. Stats de "hoje" e unread count.

### Resumo técnico
- Substituir o `useMemo` que separa em `humanContacts`/`aiContacts` por um único array `sortedContacts`
- Remover os dois blocos `<div>` com headers de seção
- Renderizar um único `.map(contact => <ChatContactItem>)` direto no `ScrollArea`
- Remover variável `humanUnread` (não mais usada)

Apenas 1 arquivo alterado: `src/components/cliente/ChatContactList.tsx`

