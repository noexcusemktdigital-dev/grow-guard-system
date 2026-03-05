

# Plano: Motor de Automações CRM + Integração com Agentes IA

## Diagnóstico

### Problema Principal
As automações do CRM são **apenas registros no banco** — não existe nenhum motor de execução backend. Quando o usuário cria uma automação "Lead criado → IA: Primeiro contato", absolutamente nada acontece. Os triggers nunca disparam.

### Problema Secundário
Não existe vínculo automático entre leads do CRM e contatos do WhatsApp. Quando um lead é criado com um telefone, ele não cria/vincula um `whatsapp_contact` com `crm_lead_id`. Isso impede que o agente IA tenha contexto do lead ao atender.

---

## Arquitetura da Solução

```text
CRM Lead criado/atualizado
         │
    [DB Trigger]
         │
    ▼ Insere na fila ▼
  crm_automation_queue
         │
    [Edge Function: crm-run-automations]  ← chamada pelo trigger ou CRON
         │
    ┌────┴────────────────────┐
    │  Para cada automação    │
    │  ativa que casa com o   │
    │  trigger:               │
    │                         │
    │  • create_task          │
    │  • change_stage         │
    │  • add_tag / remove_tag │
    │  • notify               │
    │  • send_whatsapp        │
    │  • ai_first_contact ◄───┼── Cria WhatsApp contact + vincula crm_lead_id + envia msg via IA
    │  • ai_followup      ◄───┼── Configura agent follow-up para o contato
    │  • ai_qualify        ◄───┼── IA qualifica e atualiza lead automaticamente
    │  • assign_to_person     │
    │  • assign_to_team       │
    │  • move_to_funnel       │
    └─────────────────────────┘
```

---

## Implementação

### 1. Migration: Tabela de fila + função trigger

Criar tabela `crm_automation_queue` para registrar eventos que precisam ser processados, e um trigger na tabela `crm_leads` que insere nessa fila quando leads são criados/atualizados.

```sql
-- Fila de eventos para processamento
CREATE TABLE public.crm_automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,  -- 'lead_created', 'stage_change', 'lead_won', 'lead_lost', 'tag_added'
  trigger_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Trigger function que detecta eventos no CRM
CREATE OR REPLACE FUNCTION public.enqueue_crm_automation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  -- Lead criado
  IF TG_OP = 'INSERT' THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_created', jsonb_build_object('source', NEW.source, 'stage', NEW.stage, 'funnel_id', NEW.funnel_id));
  END IF;
  
  -- Mudança de etapa
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'stage_change', jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage, 'funnel_id', NEW.funnel_id));
  END IF;
  
  -- Lead vendido
  IF TG_OP = 'UPDATE' AND NEW.won_at IS NOT NULL AND OLD.won_at IS NULL THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_won', '{}');
  END IF;
  
  -- Lead perdido
  IF TG_OP = 'UPDATE' AND NEW.lost_at IS NOT NULL AND OLD.lost_at IS NULL THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_lost', jsonb_build_object('reason', NEW.lost_reason));
  END IF;
  
  -- Tag adicionada
  IF TG_OP = 'UPDATE' AND NEW.tags IS DISTINCT FROM OLD.tags THEN
    DECLARE new_tags text[];
    BEGIN
      SELECT array_agg(t) INTO new_tags FROM unnest(NEW.tags) t WHERE NOT (t = ANY(COALESCE(OLD.tags, '{}')));
      IF new_tags IS NOT NULL THEN
        FOREACH tag IN ARRAY new_tags LOOP
          INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
          VALUES (NEW.organization_id, NEW.id, 'tag_added', jsonb_build_object('tag', tag));
        END LOOP;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_lead_automation
  AFTER INSERT OR UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION enqueue_crm_automation();

-- Adicionar campos de controle na tabela de automações
ALTER TABLE crm_automations ADD COLUMN IF NOT EXISTS execution_count integer DEFAULT 0;
ALTER TABLE crm_automations ADD COLUMN IF NOT EXISTS last_executed_at timestamptz;
```

### 2. Edge Function: `crm-run-automations`

Nova edge function que:
1. Busca eventos não processados na `crm_automation_queue`
2. Para cada evento, encontra automações ativas que casam com o `trigger_type`
3. Executa a ação correspondente
4. Para ações de IA (`ai_first_contact`, `ai_qualify`, `ai_followup`):
   - Verifica se o lead tem telefone
   - Cria ou encontra o `whatsapp_contact` correspondente
   - Vincula `crm_lead_id` no contato
   - Define `attending_mode: "ai"` e atribui o agente
   - Para `ai_first_contact`: envia mensagem inicial proativa via o agente IA
   - Para `ai_followup`: marca o contato para follow-up (o cron existente cuida)
   - Para `ai_qualify`: envia mensagem de qualificação BANT via agente SDR
5. Incrementa `execution_count` na automação
6. Marca evento como processado

A função será chamada:
- Via `pg_net` HTTP POST automaticamente pelo trigger (chamada assíncrona ao inserir na fila)
- OU via CRON a cada 1 minuto como fallback

### 3. Vinculação automática CRM ↔ WhatsApp

Quando um lead é criado com telefone:
- O motor de automações procura um `whatsapp_contact` com mesmo telefone na organização
- Se encontra, vincula via `crm_lead_id`
- Se não encontra e a ação é de IA, cria o contato no WhatsApp automaticamente

Isso permite que o agente IA já tenha contexto do lead (nome, etapa, valor, tags) quando atende.

### 4. Automações Estratégicas Pré-configuradas

Atualizar as recomendações no `CrmAutomations.tsx` com automações que fazem sentido real:

| Automação | Trigger | Ação | Lógica |
|---|---|---|---|
| **Primeiro contato IA** | Lead criado (fonte: Ads/Formulário) | `ai_first_contact` | Agente SDR envia mensagem de boas-vindas e inicia qualificação BANT |
| **Follow-up automático 24h** | Lead criado | `ai_followup` | Se lead não responder em 24h, agente faz follow-up (até 3x) |
| **Qualificação IA** | Mudança para etapa "Qualificação" | `ai_qualify` | Agente SDR inicia processo de qualificação via WhatsApp |
| **Notificar equipe em venda** | Lead vendido | `notify` | Notifica toda equipe sobre fechamento |
| **Alerta lead quente parado** | Lead parado 3 dias | `notify` | Alerta sobre leads quentes sem atividade |
| **Mover para Closer** | Tag "qualificado" adicionada | `change_stage` + `ai_first_contact` (closer) | Move lead e transfere para agente Closer |

### 5. Configuração de IA nas Automações (UI)

Adicionar no diálogo de criação de automação:
- **Seletor de agente IA** (quando ação é `ai_*`): escolher qual agente executa
- **Mensagem inicial personalizada** (opcional para `ai_first_contact`)
- **Configuração de follow-up** (delay, max tentativas) para `ai_followup`

### 6. Auto-link no Webhook

Atualizar `whatsapp-webhook` para que quando uma mensagem inbound chega de um telefone que tem lead no CRM, vincule automaticamente o `crm_lead_id` no contato (se ainda não vinculado).

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---|---|
| **Migration SQL** | Criar `crm_automation_queue`, trigger `enqueue_crm_automation`, campos extras em `crm_automations` |
| `supabase/functions/crm-run-automations/index.ts` | **NOVO** — Motor de execução de automações |
| `supabase/functions/whatsapp-webhook/index.ts` | Auto-vincular `crm_lead_id` quando telefone casa com lead existente |
| `src/components/crm/CrmAutomations.tsx` | Seletor de agente IA, config de follow-up, automações recomendadas estratégicas |
| `src/hooks/useCrmAutomations.ts` | Ajustar payload para incluir `agent_id` e config de IA |
| `supabase/config.toml` | Registrar nova edge function `crm-run-automations` |
| **CRON SQL** | Agendar processamento a cada 1 minuto como fallback |

---

## Fluxo Completo Exemplo

1. Usuário adiciona lead "João" com telefone no CRM, etapa "Novo Lead"
2. Trigger insere evento `lead_created` na fila
3. Motor encontra automação "Primeiro contato IA" ativa
4. Motor cria `whatsapp_contact` para "João", vincula `crm_lead_id`
5. Motor chama `ai-agent-reply` com mensagem inicial proativa
6. Agente SDR envia boas-vindas e inicia qualificação BANT
7. João responde → webhook recebe → agente continua conversa com contexto do lead
8. Agente qualifica → executa `[AI_ACTION:MOVE_STAGE:qualificacao]` → lead move no CRM automaticamente

