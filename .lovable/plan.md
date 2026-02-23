

# Separar Diagnostico e Metas + Adicionar Graficos de Acompanhamento

## Resumo

O Diagnostico Comercial e as Metas estao atualmente misturados na mesma pagina (`ClientePlanoVendas`). Precisam ser separados em paginas independentes. A pagina de Metas precisa ter graficos de acompanhamento que puxam dados reais do CRM.

---

## Mudancas na Sidebar

```text
VENDAS (antes)                    VENDAS (depois)
  Plano de Vendas                   Plano de Vendas (diagnostico)
  CRM                              Metas            <-- NOVA entrada
  Chat                             CRM
  ...                              Chat
                                   ...
```

Adicionar um item "Metas" com icone `BarChart3` na sidebar, apontando para `/cliente/metas`.

---

## Pagina `ClientePlanoVendas.tsx` -- Somente Diagnostico

Remover toda a secao de Metas (linhas ~992-1234) desta pagina. Ela ficara apenas com:
- Header "Plano de Vendas"
- Diagnostico interativo (perguntas em secoes)
- Resultado do diagnostico (termometro, radar, insights, plano de acao, projecoes)
- Historico de diagnosticos

---

## Nova Pagina `ClienteMetas.tsx` -- Metas com Graficos

Pagina dedicada com:

### 1. Header + Filtros (sem abas)
- Titulo "Metas Comerciais" com subtitulo e mes atual
- Filtros inline: [Todas] [Empresa] [Equipe] [Individual]
- Botao "Nova Meta"

### 2. KPI Summary (4 cards)
- Metas Ativas / Batidas / Progresso Medio / Alta Prioridade
- Igual ao que ja existe, mantido

### 3. Graficos de Acompanhamento (NOVO)

Secao com 2-3 graficos que puxam dados reais do CRM via `useGoalProgress`:

**Grafico 1 -- Progresso das Metas (BarChart horizontal)**
- Cada barra representa uma meta ativa
- Barra mostra valor atual vs valor alvo
- Cores: verde (>=80%), amarelo (>=50%), vermelho (<50%)

**Grafico 2 -- Evolucao Diaria do Mes (AreaChart)**
- Eixo X: dias do mes (1-28/30/31)
- Linhas: progresso acumulado de cada meta (dados vindos de `crm_leads.created_at` e `crm_leads.won_at`)
- Linha pontilhada mostrando o ritmo ideal (linear do 0 ao target)

**Grafico 3 -- Comparativo por Escopo (BarChart agrupado)**
- Agrupa metas por escopo (Empresa, Equipe, Individual)
- Mostra media de progresso por grupo

### 4. Lista de Goal Cards
- Cards visuais com progress ring, barra, status, ritmo (GoalCard existente)
- Sem abas, tudo junto, filtrado pelos botoes de escopo

### 5. Historico de Metas (Collapsible)
- Metas de meses anteriores, igual ao existente

### 6. Dialog Nova Meta
- Migrado da pagina atual sem alteracoes

---

## Detalhes Tecnicos

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteMetas.tsx` | **NOVO** -- Pagina dedicada de metas com graficos |
| `src/pages/cliente/ClientePlanoVendas.tsx` | **MODIFICAR** -- Remover secao de metas (linhas 992-1234), manter somente diagnostico |
| `src/components/ClienteSidebar.tsx` | **MODIFICAR** -- Adicionar item "Metas" na secao de vendas |
| `src/App.tsx` | **MODIFICAR** -- Adicionar rota `/cliente/metas` |

### Graficos

Usarao `recharts` (ja instalado):
- `BarChart` horizontal para progresso de cada meta
- `AreaChart` para evolucao diaria
- `BarChart` agrupado para comparativo por escopo

Os dados vem do hook `useGoalProgress` que ja calcula `currentValue`, `percent`, `pacePerDay`, `remaining` e `daysLeft` a partir dos dados reais de `crm_leads` e `crm_activities`.

### Hook useGoalProgress

Ja existe e retorna dados suficientes para os graficos. Nenhuma alteracao necessaria no hook.

### Nenhuma migracao SQL necessaria

Todas as colunas necessarias ja existem na tabela `goals`.

