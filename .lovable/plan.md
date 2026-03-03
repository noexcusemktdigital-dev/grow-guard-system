

# Prioridade 9: Varredura de Polish — Visual, UX e Consistencia ✅

## Correções Aplicadas

### Bloco 1 — Bugs de Layout
- **FranqueadoraLayout / FranqueadoLayout**: Trocado `animate-slide-up` por `page-enter`; mobile header de `fixed` para `sticky` (sem overlap)
- **SaasDashboard**: TabsList responsivo `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`
- **CrmLeadDetailSheet**: TabsList responsivo `grid-cols-3 sm:grid-cols-5`

### Bloco 2 — Navegação em Notificações
- **NotificacoesPage**: Click agora navega para `action_url` com prefixo de portal correto

### Bloco 3 — Polish Dashboard Franqueado
- Hero card com saudação estilizada, gradiente e frase do dia integrada
- Seção comercial enriquecida com pipeline summary (grid de stages)
- Agenda em grid responsivo

### Bloco 4 — Sidebar Franqueadora
- Footer trocado de link direto para Popover com "Meu Perfil" e "Sair"
