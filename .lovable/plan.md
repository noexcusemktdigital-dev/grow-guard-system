

## Plano: Agenda para Portal Cliente (com Google Calendar)

### Contexto
- O portal **Franqueadora** já possui uma agenda completa em `src/pages/Agenda.tsx` com integração Google Calendar
- O portal **Cliente** não tem agenda — precisamos criar uma versão adaptada
- A agenda deve ficar abaixo de "Tarefas" no sidebar (posição 3 da `globalSection`)

### Estrutura Existente Reutilizável
| Recurso | Localização | Status |
|---------|-------------|--------|
| Hooks de calendário | `useCalendar.ts` | ✅ Reutilizar |
| Hooks Google OAuth | `useGoogleCalendar.ts` | ✅ Reutilizar |
| Wizard de setup Google | `GoogleSetupWizard.tsx` | ✅ Reutilizar |
| Tabela `calendar_events` | BD | ✅ Já existe |
| Tabela `google_calendar_tokens` | BD | ✅ Já existe |

### Arquivos a Criar/Modificar

**1. Nova página `src/pages/cliente/ClienteAgenda.tsx`**
- Componente simplificado baseado em `Agenda.tsx`
- Visões: Mês, Semana, Dia
- Criar, editar, excluir eventos
- Botão "Conectar Google Agenda" usando hooks existentes
- Sincronização bidirecional (pull/push)
- Visual alinhado ao design do portal cliente

**2. Sidebar `src/components/ClienteSidebar.tsx`**
```tsx
// Adicionar na globalSection (após Tarefas, antes de Gamificação):
{ label: "Agenda", icon: Calendar, path: "/cliente/agenda" }
```

**3. Rotas `src/App.tsx`**
```tsx
<Route path="agenda" element={<ClienteAgenda />} />
```

### Interface da Agenda Cliente

```text
┌──────────────────────────────────────────────────────────────┐
│  📅 Agenda                          [Google ✓] [+ Evento]    │
├──────────────────────────────────────────────────────────────┤
│  ◀ Março de 2026 ▶             [Mês] [Semana] [Dia]          │
├──────────────────────────────────────────────────────────────┤
│  Dom  Seg  Ter  Qua  Qui  Sex  Sáb                           │
│   1    2    3    4    5    6    7                            │
│  ┌──┐                                                        │
│  │📌│ Reunião cliente                                        │
│  └──┘                                                        │
│   8    9   10   11   12   13   14                            │
│       ┌──┐                                                   │
│       │📌│ Call follow-up                                    │
│       └──┘                                                   │
└──────────────────────────────────────────────────────────────┘
```

### Fluxo Google Calendar
1. Usuário clica "Conectar Google Agenda"
2. Abre `GoogleSetupWizard` (mesmo da Franqueadora)
3. OAuth redirect para `/cliente/agenda?code=...`
4. Exchange code → tokens salvos
5. Sincronização automática (pull)
6. Badge "Google conectado" visível

### Características
- **Cores por tipo**: Reunião (azul), Comercial (verde), Pessoal (roxo)
- **Mobile-friendly**: Responsivo com scroll horizontal em semana
- **All-day events**: Suporte a eventos de dia inteiro
- **Eventos recorrentes**: Display visual (não cria múltiplos)

### Banco de Dados
Nenhuma migração necessária — usar tabelas existentes:
- `calendar_events` (já com RLS por org)
- `calendars` (opcional, para categorização)
- `google_calendar_tokens` (por user)

