
# Prioridade 8: Notificações em Tempo Real — Novos Leads e Mensagens ✅

## Implementado

1. **Trigger `trg_notify_new_crm_lead`** — AFTER INSERT em `crm_leads`, notifica todos os membros da org com tipo "CRM" e `action_url = '/crm'`
2. **Trigger `trg_notify_inbound_whatsapp`** — AFTER INSERT em `whatsapp_messages` (direction='inbound'), notifica membros com debounce de 5 min por contato
3. **Realtime habilitado** em `crm_leads` para atualizações instantâneas no Kanban
4. **NotificationBell** — resolve `action_url` com prefixo do portal atual (/franqueadora, /franqueado, /cliente)
5. **useCrmLeads** — removida notificação manual (trigger cuida)
6. **NotificacoesPage** — adicionado tipo "CRM" nos filtros e ícones
