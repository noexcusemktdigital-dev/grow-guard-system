

# Fix: Conversas vinculadas à instância Z-API correta

## Problema

Existem 3 problemas interligados:

1. **Contatos e mensagens não estão vinculados a uma instância específica** -- as tabelas `whatsapp_contacts` e `whatsapp_messages` só têm `organization_id`, sem referência à instância. Quando o usuário troca de número no Z-API, os contatos antigos continuam aparecendo.

2. **Bug no check-status** -- em `ClienteIntegracoes.tsx` linha 164, a ação é passada como `"status"` mas a edge function espera `"check-status"`. O botão "Verificar" não atualiza o status real.

3. **Webhook pega apenas a primeira instância** -- `whatsapp-webhook` faz `.single()` na query de instâncias (linha 38), o que falha quando há múltiplas instâncias.

## Solução

### 1. Database Migration -- Vincular contatos a instâncias

Adicionar coluna `instance_id` (uuid, nullable para compatibilidade) em `whatsapp_contacts`, com FK para `whatsapp_instances`.

```sql
ALTER TABLE public.whatsapp_contacts 
  ADD COLUMN instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;
```

### 2. Fix check-status action name

Em `ClienteIntegracoes.tsx`, corrigir `action: "status"` para `action: "check-status"`.

### 3. Atualizar webhook para suportar múltiplas instâncias

Em `whatsapp-webhook/index.ts`:
- Remover `.single()` e buscar instância que corresponda ao webhook
- Salvar `instance_id` no contato ao criar/atualizar

### 4. Atualizar whatsapp-send para usar instância correta

Em `whatsapp-send/index.ts`:
- Buscar a instância correta do contato via `instance_id`, ou fallback para a primeira conectada.

### 5. Filtrar contatos por instância conectada na UI

Em `useWhatsApp.ts` (`useWhatsAppContacts`):
- Opcionalmente filtrar contatos pela instância ativa, ou mostrar todos com indicador de qual número.

### 6. ClienteChat -- Mostrar número conectado

Exibir o número do WhatsApp conectado no header da página de conversas.

## Arquivos

| Arquivo | Ação |
|---------|------|
| Database migration | ADD COLUMN `instance_id` em `whatsapp_contacts` |
| `src/pages/cliente/ClienteIntegracoes.tsx` | Fix `action: "status"` → `"check-status"` |
| `supabase/functions/whatsapp-webhook/index.ts` | Suportar múltiplas instâncias, salvar `instance_id` |
| `src/hooks/useWhatsApp.ts` | Filtrar contatos pela instância conectada |
| `src/pages/cliente/ClienteChat.tsx` | Exibir número conectado no header |

