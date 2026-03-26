

## Corrigir Clique no Contato + Remover "Fixar no Topo"

### Problema
O `ChatContactItem` envolve o botão inteiro em um `DropdownMenuTrigger`, então **qualquer clique abre o dropdown em vez de entrar na conversa**. Além disso, o "Fixar no topo" não é desejado — apenas "Arquivar" deve existir.

### Solução

Remover o `DropdownMenu` como wrapper do botão. O clique normal (`onClick`) abre a conversa. A opção "Arquivar" fica acessível via **clique com botão direito** (context menu) usando `ContextMenu` do Shadcn em vez de `DropdownMenu`.

Remover toda referência a `Pin`/`onPin`/`is_pinned` do componente.

### Mudanças

**`src/components/cliente/ChatContactItem.tsx`:**
- Trocar `DropdownMenu`/`DropdownMenuTrigger` por `ContextMenu`/`ContextMenuTrigger` do Shadcn
- O `<button onClick={onSelect}>` fica livre para funcionar normalmente
- Context menu (botão direito) mostra apenas "Arquivar" / "Desarquivar"
- Remover import de `Pin`, prop `onPin`, e ícone de pin na UI

**`src/components/cliente/ChatContactList.tsx`:**
- Remover prop `onPinContact` e referências a `onPin`
- Manter `onArchiveContact` funcionando via context menu

**`src/pages/cliente/ClienteChat.tsx`:**
- Remover handler `onPinContact` se existir

