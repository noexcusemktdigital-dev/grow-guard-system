
# Otimizar Sistema de Notificacoes nas 3 Plataformas

## Problemas Identificados

1. **Notificacao nao "some" ao ser lida**: Ao clicar, ela e marcada como lida mas continua visivel no popover com a mesma aparencia -- nao ha feedback visual claro
2. **Sem botao "Marcar todas como lidas"**: O usuario precisa clicar uma por uma
3. **Franqueadora e Franqueado nao tem pagina de notificacoes**: So o cliente tem (`/cliente/notificacoes`), as outras plataformas nao tem rota nem link
4. **Popover nao fecha apos clicar**: Ao clicar numa notificacao com `action_url`, o popover permanece aberto
5. **Notificacoes lidas ficam misturadas com nao lidas** sem separacao visual clara

## Solucao

### 1. Melhorar o `NotificationBell.tsx`
- Adicionar botao **"Marcar todas como lidas"** no header do popover (icone CheckCheck que ja esta importado mas nao usado)
- Apos marcar como lida, aplicar **animacao de fade-out** para a notificacao sair suavemente da lista de nao lidas
- Separar a lista em **"Nao lidas"** (destaque) e **"Recentes"** (lidas, mais discretas)
- **Fechar o popover** automaticamente ao clicar numa notificacao com `action_url`
- Adaptar o link "Ver todas" para cada plataforma (`/franqueadora/notificacoes`, `/franqueado/notificacoes`, `/cliente/notificacoes`)

### 2. Adicionar mutacao `markAllNotificationsRead` no hook
- Nova mutacao em `useClienteContent.ts` que faz `UPDATE client_notifications SET is_read = true WHERE user_id = ? AND is_read = false`
- Invalida o cache de notificacoes apos sucesso

### 3. Criar pagina de notificacoes para Franqueadora e Franqueado
- Reusar o componente `ClienteNotificacoes.tsx` como base, criando um componente generico `NotificacoesPage.tsx` compartilhado
- Criar rotas `/franqueadora/notificacoes` e `/franqueado/notificacoes` no `App.tsx`

### 4. Realtime para UPDATE (nao so INSERT)
- Atualizar a subscription realtime para escutar tambem eventos `UPDATE` na tabela `client_notifications`, garantindo que se uma notificacao for marcada como lida em outra aba, a UI atualiza

## Arquivos Alterados

| Arquivo | Acao |
|---------|------|
| `src/components/NotificationBell.tsx` | Refatorar: marcar todas, fade-out, fechar popover, link adaptativo |
| `src/hooks/useClienteContent.ts` | Adicionar `markAllNotificationsRead` |
| `src/pages/NotificacoesPage.tsx` | Novo: pagina generica de notificacoes (extraida do ClienteNotificacoes) |
| `src/pages/cliente/ClienteNotificacoes.tsx` | Simplificar para importar o componente generico |
| `src/App.tsx` | Adicionar rotas `/franqueadora/notificacoes` e `/franqueado/notificacoes` |

## Detalhes Tecnicos

**Marcar todas como lidas:**
```text
markAllNotificationsRead = useMutation({
  mutationFn: async () => {
    await supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  },
  onSuccess: () => invalidate("client-notifications")
})
```

**Popover controlado:**
```text
const [open, setOpen] = useState(false);
// Ao clicar notificacao com action_url -> setOpen(false) + navigate
```

**Realtime ampliado:**
```text
event: '*'  // escuta INSERT, UPDATE e DELETE
```

**Separacao visual no popover:**
```text
- Nao lidas: fundo primary/5, bolinha azul, font-medium
- Lidas: fundo transparente, texto muted, sem bolinha
- Transicao suave com opacity ao marcar como lida
```
