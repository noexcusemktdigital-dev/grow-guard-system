

## Histórico Completo de Atividades do Lead

### Problema
A aba "Dados" do lead não mostra um histórico automático. As atividades na aba "Atividades" são apenas manuais. O usuário quer ver tudo que aconteceu com o lead: movimentações de etapa, tags adicionadas/removidas, marcação como vendido/perdido, etc.

### Solução

**1. Nova tabela `crm_lead_history`** (migração)

Tabela de log automático que registra cada evento do lead:

```sql
CREATE TABLE crm_lead_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  user_id uuid,
  event_type text NOT NULL, -- 'stage_change', 'tag_added', 'tag_removed', 'won', 'lost', 'created', 'field_updated'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

RLS: membros da org podem ler.

**2. Trigger automático `log_crm_lead_history()`**

Trigger `AFTER INSERT OR UPDATE` em `crm_leads` que registra automaticamente:
- **INSERT**: "Lead criado"
- **Mudança de etapa**: "Movido de X para Y"
- **Tags adicionadas**: "Tag 'abc' adicionada"
- **Tags removidas**: "Tag 'abc' removida"
- **Vendido** (`won_at` preenchido): "Lead marcado como vendido"
- **Perdido** (`lost_at` preenchido): "Lead marcado como perdido — motivo: ..."
- **Campos editados** (name, value, company, email, phone): "Campo X atualizado"

**3. Hook `useCrmLeadHistory(leadId)`**

Query simples que busca os registros de `crm_lead_history` ordenados por `created_at DESC`.

**4. Seção "Histórico" na aba "Dados" do `CrmLeadDetailSheet.tsx`**

Após o bloco "Criado em", adicionar uma timeline visual com:
- Ícone por tipo de evento (seta para etapa, tag para tag, troféu para venda, etc.)
- Descrição do evento
- Data/hora formatada
- Scroll limitado com "Ver mais" se necessário

### Arquivos afetados
- `supabase/migrations/` — nova migração (tabela + trigger)
- `src/hooks/useCrmLeadHistory.ts` — novo hook
- `src/components/crm/CrmLeadDetailSheet.tsx` — seção de histórico na aba "Dados"

### Detalhes técnicos
- O trigger usa `SECURITY DEFINER` para acessar os dados sem conflito de RLS
- O histórico é separado das atividades manuais (são conceitos diferentes)
- Eventos passados não serão retropreenchidos — o log começa a partir da ativação do trigger

