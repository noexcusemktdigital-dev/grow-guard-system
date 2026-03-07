

## Plano: Reestruturar Módulo Comercial (Franqueadora + Franqueado)

### Resumo

Espelhar a estrutura comercial do Franqueado na Franqueadora (CRM, Prospecção, Estratégia, Propostas), mover CRM da seção "Rede" para "Comercial", adicionar "Metas & Ranking" ao Comercial do Franqueado, e reorganizar Marketing/Academy em seção própria. Os dados de cada portal são **completamente isolados** via `organization_id` — nenhum compartilhamento entre Matriz e Unidades.

### Mudanças na Sidebar

**Franqueadora (`FranqueadoraSidebar.tsx`)**

```text
REDE (antes)              REDE (depois)
├─ CRM                    ├─ Atendimento
├─ Atendimento            ├─ Unidades
├─ Unidades               └─ Onboarding
└─ Onboarding

COMERCIAL (antes)         COMERCIAL (depois)
├─ Propostas              ├─ CRM de Vendas     ← movido da Rede
├─ Marketing              ├─ Prospecção         ← NOVO
├─ Treinamentos           ├─ Criador de Estratégia ← NOVO
├─ Metas & Ranking        ├─ Gerador de Proposta
                          └─ Metas & Ranking

(novo)                    MARKETING & ACADEMY
                          ├─ Marketing
                          └─ Treinamentos
```

**Franqueado (`FranqueadoSidebar.tsx`)**

Adicionar ao Comercial:
```text
COMERCIAL (depois)
├─ CRM de Vendas
├─ Prospecção
├─ Criador de Estratégia
├─ Gerador de Proposta
└─ Metas & Ranking ← NOVO
```

### Novas rotas (`App.tsx`)

| Rota | Componente | Observação |
|------|-----------|------------|
| `/franqueadora/prospeccao` | `FranqueadoProspeccaoIA` | Mesmo componente, dados isolados por org_id |
| `/franqueadora/estrategia` | `FranqueadoEstrategia` | Idem |
| `/franqueado/metas` | `FranqueadoMetasRanking` (NOVO) | Visão read-only de metas e troféus |

### Nova página: `FranqueadoMetasRanking.tsx`

- Exibe metas mensais da unidade (herdadas da Matriz via `get_goals_with_parent`)
- Mostra ranking apenas se a unidade está no ranking (filtrado por `unit_org_id`)
- Classificação da unidade (Prata/Ouro/Elite) como badge
- Seção de troféus desbloqueáveis ao atingir metas

### Isolamento de dados

Os hooks `useCrmLeads`, `useFranqueadoProspections`, `useFranqueadoStrategies`, `useCrmProposals` já filtram por `organization_id`. Como Matriz e Franqueado têm `organization_id` diferentes, os dados são automaticamente isolados — nenhuma alteração de RLS necessária.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Reorganizar seções |
| `src/components/FranqueadoSidebar.tsx` | Adicionar Metas & Ranking |
| `src/App.tsx` | Adicionar 3 rotas |
| `src/pages/franqueado/FranqueadoMetasRanking.tsx` | CRIAR |

### Ordem
1. Atualizar sidebars
2. Adicionar rotas no App.tsx
3. Criar FranqueadoMetasRanking

