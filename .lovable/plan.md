

## Plano — Termômetro Comercial detalhado + Metas no GPS do Negócio

### 1. Score Comercial com Termômetro detalhado

**Problema:** O score comercial é apenas uma barra de progresso simples. O usuário quer um visual tipo "termômetro" igual ao `DiagnosticoTermometro` existente, mostrando fases de 0 a 100.

**Solução:** Substituir a barra simples no `ComScoreRadar` por um termômetro comercial com 4 fases:

| Fase | Range | Cor |
|------|-------|-----|
| Crítico | 0-25 | Vermelho |
| Básico | 26-50 | Laranja |
| Intermediário | 51-75 | Amarelo |
| Avançado | 76-100 | Verde |

O termômetro terá gradiente horizontal (vermelho → verde), ponteiro animado na posição do score, marcadores de fase abaixo, e a fase atual destacada — similar ao componente `DiagnosticoTermometro` já existente no projeto.

### 2. Aba "Metas" no GPS do Negócio

**Problema:** As metas estavam no antigo Plano de Vendas (`ClientePlanoVendas`). Agora que o GPS unificou tudo, o módulo de metas precisa estar dentro do GPS.

**Solução:** Adicionar uma terceira aba principal no `StrategyDashboard`: **Marketing | Comercial | Metas**

A aba Metas reutilizará o componente `ClientePlanoVendasMetas` existente (que já tem todo o sistema de filtro por escopo, cards de progresso, gráficos) e o dialog `ClientePlanoVendasMetaDialog` para criar/editar metas.

As metas continuam usando os mesmos hooks (`useActiveGoals`, `useGoalMutations`, `useGoalProgress`) que já estão vinculados ao CRM, relatórios e dashboards. Nada muda na integração — apenas a localização na UI.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClientePlanoMarketingStrategy.tsx` | (1) Refazer `ComScoreRadar` com termômetro visual de 4 fases. (2) Adicionar aba principal "Metas" que renderiza o sistema completo de metas (create/edit/filter/progress). |
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Passar props de metas (goals, progress, mutations) para o `StrategyDashboard` |

### Detalhes técnicos

**Termômetro:** Reutilizar o padrão visual do `DiagnosticoTermometro` (gradiente linear + ponteiro absoluto + marcadores), adaptado com fases comerciais (Crítico/Básico/Intermediário/Avançado) em vez de Caótico/Reativo/Estruturado/Analítico.

**Metas:** O `StrategyDashboard` receberá props opcionais para o sistema de metas. O `ClienteGPSNegocio` importará os hooks de goals e passará tudo. A aba "Metas" aparecerá sempre (independente de ter `diagnostico_comercial`), pois metas são relevantes desde o início.

O sistema de metas já suporta:
- Escopos: empresa, time, individual
- Métricas: faturamento, contratos, leads, conversões, reuniões, ticket médio
- Integração com CRM (progresso automático via `useGoalProgress`)
- Filtro por período mensal
- Visualização em relatórios e dashboards

