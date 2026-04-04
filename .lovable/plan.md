

## Plano — Ferramenta de Acompanhamento do Cliente (Reunião Mensal)

### Conceito

Uma nova ferramenta abaixo do "Gerador de Proposta" na sidebar, chamada **"Acompanhamento"**. Serve como base para reuniões mensais com o cliente, vinculada a uma estratégia aprovada. Cada mês gera um ciclo com duas partes:

1. **Análise do mês anterior** — O que foi feito, o que deu certo, o que não deu certo (com dados e métricas)
2. **Plano do próximo mês** — Ações organizadas nas 4 etapas (Conteúdo, Tráfego, Web/Site, Sales/CRM) com entregas específicas

### Fluxo de uso

```text
┌─────────────────────────────────────────────────┐
│  ACOMPANHAMENTO DO CLIENTE                      │
│                                                 │
│  1. Vincular Estratégia (select)                │
│  2. Ver histórico de ciclos mensais             │
│  3. Criar novo ciclo mensal:                    │
│     ┌──────────────────────────────────┐        │
│     │ ANÁLISE DO MÊS (retrospectiva)  │        │
│     │ • Entregas realizadas ✓/✗       │        │
│     │ • Métricas: leads, conversões,  │        │
│     │   tráfego, engajamento          │        │
│     │ • O que funcionou (highlights)  │        │
│     │ • O que não funcionou (gaps)    │        │
│     └──────────────────────────────────┘        │
│     ┌──────────────────────────────────┐        │
│     │ PLANO DO PRÓXIMO MÊS            │        │
│     │ • Conteúdo: posts, vídeos, etc  │        │
│     │ • Tráfego: campanhas, budget    │        │
│     │ • Web: alterações no site       │        │
│     │ • Sales: CRM, scripts, funil    │        │
│     └──────────────────────────────────┘        │
│  4. Exportar em PDF (apresentação reunião)      │
└─────────────────────────────────────────────────┘
```

### Mudanças

#### 1. Tabela `client_followups` (migração)

```sql
CREATE TABLE public.client_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES franqueado_strategies(id) ON DELETE CASCADE,
  month_ref text NOT NULL,           -- "2026-04"
  status text NOT NULL DEFAULT 'draft', -- draft, presented, approved

  -- Análise do mês
  analise jsonb DEFAULT '{}',
  -- { entregas_realizadas: [{service_id, nome, status: "feito"|"pendente"|"cancelado"}],
  --   metricas: {leads, conversoes, trafego, engajamento, faturamento},
  --   destaques: string[], gaps: string[], observacoes: string }

  -- Plano do próximo mês
  plano_proximo jsonb DEFAULT '{}',
  -- { conteudo: {acoes: string[], entregas: string[]},
  --   trafego: {acoes: string[], budget: number, plataformas: string[]},
  --   web: {acoes: string[], entregas: string[]},
  --   sales: {acoes: string[], entregas: string[]} }

  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage followups"
  ON public.client_followups FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));
```

#### 2. Nova página `FranqueadoAcompanhamento.tsx`

- **Tela inicial**: Select para vincular estratégia + lista de ciclos mensais (cards com mês, status, badge)
- **Formulário de ciclo**: Dividido em duas seções (Análise + Plano). A análise puxa automaticamente os entregáveis da estratégia vinculada como checklist. O plano é organizado nas 4 etapas com campos de ações e entregas
- **IA auxiliar**: Botão "Gerar com IA" que analisa a estratégia, os entregáveis e o histórico de ciclos anteriores para sugerir análise e plano do próximo mês
- **Visual**: Segue o padrão dual-theme (análise em fundo claro, plano em fundo escuro)
- **Exportar PDF**: Mesmo padrão A4 screenshot-based já usado na estratégia

#### 3. Hook `useClientFollowups.ts`

- CRUD para `client_followups`
- Query por `strategy_id` com ordenação por `month_ref`
- Mutation para criar/atualizar ciclos

#### 4. Edge Function `generate-followup`

- Recebe: `strategy_id`, `month_ref`, dados de análise parciais, ciclos anteriores
- Retorna: Sugestões de análise (destaques/gaps) + plano detalhado para o próximo mês nas 4 etapas, baseado na estratégia original e no que foi executado

#### 5. Sidebar + Rotas

- Adicionar "Acompanhamento" na sidebar do franqueado (seção Comercial, abaixo de "Gerador de Proposta") com ícone `ClipboardList`
- Adicionar rota `/franqueado/acompanhamento` no `App.tsx`
- Replicar na sidebar da franqueadora com rota `/franqueadora/acompanhamento`

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| Migração SQL | Criar tabela `client_followups` com RLS |
| `src/pages/franqueado/FranqueadoAcompanhamento.tsx` | Nova página completa |
| `src/hooks/useClientFollowups.ts` | Novo hook CRUD |
| `supabase/functions/generate-followup/index.ts` | Nova edge function IA |
| `src/components/FranqueadoSidebar.tsx` | Adicionar item "Acompanhamento" |
| `src/components/FranqueadoraSidebar.tsx` | Adicionar item "Acompanhamento" |
| `src/App.tsx` | Adicionar rotas para ambos portais |

