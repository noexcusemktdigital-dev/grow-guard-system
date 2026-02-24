
# Melhorias: Prospeccao, Agenda Google, Suporte e Integracao CRM

## 1. Prospeccao - Renomear + Mais Campos para IA

### Renomear
- Sidebar: "Prospeccao IA" -> "Prospeccao"
- PageHeader: titulo "Prospeccao" com subtitulo atualizado
- Aba "Nova" -> "Prospeccao IA"

### Novos campos no formulario de Prospeccao IA
Adicionar ao formulario (e ao tipo `ProspectionInputs`):

| Campo | Tipo | Descricao |
|-------|------|-----------|
| nome_empresa | text | Nome da empresa alvo |
| site | text | URL do site (se conhecer) |
| redes_sociais | text | Instagram, LinkedIn, etc |
| conhecimento_previo | textarea | O que ja sabe sobre a empresa |
| nivel_contato | select | Frio / Morno / Quente |
| contato_decisor | text | Nome do decisor (se souber) |
| cargo_decisor | text | Cargo do decisor |

### Arquivos editados
- `src/hooks/useFranqueadoProspections.ts` - atualizar interface ProspectionInputs
- `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` - renomear abas, adicionar campos ao formulario
- `src/components/FranqueadoSidebar.tsx` - renomear label "Prospeccao IA" -> "Prospeccao"
- `supabase/functions/generate-prospection/index.ts` - incluir novos campos no prompt para IA

---

## 2. Agenda - Integracao Google Calendar

Implementar sync bidirecional real com Google Calendar usando Edge Functions.

### Fluxo
1. Franqueado clica "Conectar Google Agenda"
2. Abre popup OAuth do Google (redirect para Edge Function)
3. Edge Function troca code por access_token + refresh_token
4. Tokens salvos na tabela `google_calendar_tokens`
5. Sync inicial: puxa eventos do Google -> insere no sistema
6. Ao criar/editar/excluir evento local -> replica no Google
7. Webhook ou polling periodico para puxar mudancas do Google

### Banco de dados (nova tabela)
```
google_calendar_tokens:
  - id uuid PK
  - organization_id uuid FK
  - user_id uuid FK
  - access_token text (encrypted)
  - refresh_token text (encrypted)
  - expires_at timestamptz
  - google_calendar_id text
  - created_at timestamptz
  - updated_at timestamptz
```

Adicionar coluna `google_event_id text` na tabela `calendar_events` para rastrear eventos sincronizados.

### Edge Functions
- `google-calendar-oauth` - Inicia fluxo OAuth e troca code por tokens
- `google-calendar-sync` - Sync bidirecional (push/pull eventos)

### Secrets necessarios
- `GOOGLE_CLIENT_ID` - Client ID do Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Client Secret do Google Cloud Console

### Arquivos
- Nova tabela + coluna via migracao SQL
- `supabase/functions/google-calendar-oauth/index.ts` (novo)
- `supabase/functions/google-calendar-sync/index.ts` (novo)
- `src/hooks/useGoogleCalendar.ts` (novo) - hook para conectar/desconectar/sync
- `src/pages/franqueado/FranqueadoAgenda.tsx` - ativar botao "Conectar Google Agenda", mostrar status de conexao, badge de sync

---

## 3. Suporte - Mensagens mais documentadas

Atualmente as mensagens parecem chat de WhatsApp. Mudar para formato de "historico documentado":

### Mudancas no layout de mensagens
- Cada mensagem vira um "card" com:
  - Avatar + nome do autor
  - Data/hora completa (nao so HH:mm)
  - Conteudo com formatacao rica
  - Anexos em grid de preview
  - Borda lateral colorida (azul = franqueado, cinza = matriz)
- Layout vertical (timeline), nao bolhas de chat
- Separadores de data entre mensagens de dias diferentes

### Arquivos editados
- `src/pages/franqueado/FranqueadoSuporte.tsx` - redesign do componente `TicketMessages` e do painel de detalhe do chamado

---

## 4. Calculadora - Fix R$15.000

O valor de R$15k provavelmente vem de selecoes salvas no localStorage de sessoes anteriores. O hook `useCalculator` persiste o estado com a chave `noexcuse-calculator-state`.

### Correcao
- Ao abrir a aba "Calculadora", se nao houver `lead_id` na URL, iniciar com estado limpo (nao carregar do localStorage)
- Adicionar botao visivel "Limpar Selecao" no topo
- Mostrar alerta se houver selecoes salvas de uma sessao anterior

### Arquivo editado
- `src/pages/franqueado/FranqueadoPropostas.tsx` - logica de inicializacao

---

## 5. Integracao CRM - Indicadores no Lead

O CRM ja tem indicadores visuais (checkmarks coloridos no `CrmKanbanCard`). Ja usa lookups de prospections, strategies e proposals vinculados por `lead_id`. Essa integracao ja existe e funciona.

### Melhorias adicionais
- No detalhe do lead (`CrmLeadDetailSheet`), adicionar secao "Ferramentas" com links rapidos:
  - "Gerar Prospeccao" -> `/franqueado/prospeccao?lead_id=X`
  - "Criar Estrategia" -> `/franqueado/estrategia?lead_id=X`
  - "Gerar Proposta" -> `/franqueado/propostas?lead_id=X`
  - Mostrar status de cada ferramenta (feito/pendente)
- No Kanban, manter os checkmarks ja existentes

### Arquivos editados
- `src/components/franqueado/CrmLeadDetailSheet.tsx` - adicionar secao de ferramentas integradas

---

## Ordem de implementacao

1. Prospeccao: renomear + novos campos + atualizar edge function
2. Suporte: redesign das mensagens para formato documentado
3. Calculadora: fix do localStorage / R$15k
4. CRM: links rapidos no detalhe do lead
5. Agenda Google: tabela + edge functions + UI (requer secrets do Google)
