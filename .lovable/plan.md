

# Plano de Evolução - Módulos do Franqueado

## ✅ Concluído

### Calculadora NOE Original + Playbooks Comerciais
- Calculadora completa com ~35 serviços, tipos de precificação variados, simulação de pagamento e gerador de PDF
- 8 Playbooks estáticos na aba de Prospecção IA

### Suporte Robusto
- Visão Kanban por status (Aberto, Em análise, Aguardando, Resolvido)
- Visão lista alternativa
- Formulário robusto com categoria, subcategoria, prioridade, anexos múltiplos
- Chat com suporte a imagens e arquivos (upload para storage)
- Mensagens em tempo real (Supabase Realtime)
- KPIs de resumo (abertos, em análise, aguardando, resolvidos)

### Comunicados com Alertas
- Banner de alerta para comunicados críticos não confirmados (com animação)
- Filtros por prioridade, tipo e busca textual
- Badge de contagem de novos
- Exibição de data de expiração
- Confirmação obrigatória para comunicados críticos

---

## 🔜 Próximos

### 3. Base de Prospecção (Prospecção IA)
Transformar a Prospecção em uma base de dados de empresas-alvo que o franqueado está prospectando.

**Tabela nova**: `franqueado_prospect_companies`
- id, organization_id, name, segment, region, size, contact_name, contact_phone, contact_email
- status (pesquisando, contato_feito, reuniao_marcada, proposta_enviada, convertido, descartado)
- notes, tags, last_contact_at, next_followup_at
- prospection_id (FK para franqueado_prospections - vincular ao plano IA)
- lead_id (FK para crm_leads - quando converter)
- created_by, created_at, updated_at

**UI**:
- Lista/tabela de prospects com filtros por status, segmento, região
- Card de detalhe com histórico de interações
- Botão "Converter para Lead" (cria no CRM principal)
- Integração com playbooks e prospecções IA existentes
- KPIs: total de prospects, por status, taxa de conversão

### 4. Agenda com Google Calendar
Sincronização bidirecional com Google Calendar.

**Infraestrutura necessária**:
- Edge Function `google-calendar-sync` para OAuth callback e sync
- Tabela `google_calendar_connections` para armazenar tokens
- Colunas em `calendar_events`: google_event_id, google_calendar_id, sync_status

**Fluxo**:
1. Franqueado clica "Conectar Google Agenda"
2. OAuth flow via Google Cloud Console
3. Sync inicial puxa eventos do Google
4. Eventos criados no sistema são enviados ao Google
5. Webhook ou polling para manter sincronizado

**Requisitos do usuário**:
- Configurar Google Cloud Console com OAuth credentials
- Ou usar um conector Google Calendar (se disponível)

---

## Ordem de implementação restante

1. Base de Prospecção (criar tabela + UI)
2. Agenda Google Calendar (configurar OAuth + edge functions + UI)
