

# Prioridade 8: Notificações em Tempo Real — Novos Leads e Mensagens

## Problema Atual

1. **Leads via webhook** (`crm-lead-webhook`) e **mensagens WhatsApp recebidas** (`whatsapp-webhook`) não geram notificações — apenas leads criados manualmente pelo frontend disparam notificação (e só para o próprio usuário)
2. As `action_url` são hardcoded para `/cliente/crm` — não funciona para franqueado (`/franqueado/crm`) nem franqueadora
3. Notificações só são enviadas ao usuário que criou o lead, não a todos os membros da organização

## Solução

### 1. Database Triggers para Notificações Automáticas

Criar dois triggers server-side (AFTER INSERT) que notificam **todos os membros da organização**:

**Trigger A — `notify_new_crm_lead`**: dispara ao inserir em `crm_leads`, cria uma notificação por membro da org com tipo "CRM" e `action_url = '/crm'` (sem prefixo de portal).

**Trigger B — `notify_new_whatsapp_message`**: dispara ao inserir em `whatsapp_messages` com `direction = 'inbound'`, cria notificação por membro da org com tipo "Chat" e `action_url = '/chat'`. Usa debounce: só notifica se não houver notificação de chat para o mesmo contato nos últimos 5 minutos (evita spam).

### 2. Resolução de URL por Portal (Client-Side)

Atualizar `NotificationBell.tsx` para prefixar a `action_url` com o portal correto baseado no `role` do AuthContext:
- `super_admin` / `admin` → `/franqueadora`
- `franqueado` → `/franqueado`
- `cliente_admin` / `cliente_user` → `/cliente`

Isso permite que o mesmo registro de notificação funcione para qualquer portal.

### 3. Atualizar Webhook do CRM para Também Notificar

O `crm-lead-webhook` já insere em `crm_leads`, então o trigger A cobre esse caso automaticamente. Nenhuma mudança necessária no webhook.

### 4. Habilitar Realtime em `crm_leads`

A tabela `crm_leads` ainda não está no `supabase_realtime`. Adicionar para que o frontend receba atualizações instantâneas no Kanban quando leads chegam via webhook.

## Arquivos Alterados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar funções + triggers para notificação automática em `crm_leads` e `whatsapp_messages`; adicionar `crm_leads` ao realtime |
| `src/components/NotificationBell.tsx` | Prefixar `action_url` com portal do usuário baseado no role |
| `src/hooks/useCrmLeads.ts` | Remover notificação manual do `createLead` (trigger cuida disso agora) |
| `src/pages/NotificacoesPage.tsx` | Adicionar tipo "CRM" nos filtros e ícones |
| `.lovable/plan.md` | Registrar P8 |

## Detalhes Técnicos

**Trigger Function (simplificado)**:
```sql
CREATE FUNCTION notify_on_new_lead() RETURNS trigger AS $$
BEGIN
  INSERT INTO client_notifications (user_id, organization_id, title, message, type, action_url)
  SELECT om.user_id, NEW.organization_id, 
    'Novo lead: ' || NEW.name, 
    'Lead adicionado via ' || coalesce(NEW.source, 'CRM'),
    'CRM', '/crm'
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

**URL Resolution (NotificationBell)**:
```typescript
const portalPrefix = role === 'franqueado' ? '/franqueado' 
  : (role === 'super_admin' || role === 'admin') ? '/franqueadora' 
  : '/cliente';

// When navigating:
navigate(portalPrefix + n.action_url); // e.g. "/cliente/crm"
```

**WhatsApp debounce**: o trigger verifica se já existe notificação não lida de Chat para o mesmo `contact_id` nos últimos 5 min antes de criar nova.

