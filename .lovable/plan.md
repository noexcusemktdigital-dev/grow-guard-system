

# Melhorias Visuais: Projecoes Duplas e Insights Acionaveis

Tres alteracoes no arquivo `src/pages/cliente/ClientePlanoMarketing.tsx`:

---

## 1. Projecao de Resultados (Leads) — 2 graficos lado a lado

Substituir o grafico unico (com 2 linhas) por **2 graficos em grid 2 colunas**:

- **Grafico esquerdo**: "Sem Estrategia" — mostra apenas a linha `atual` (cinza, dashed), com area cinza
- **Grafico direito**: "Com Estrategia" — mostra apenas a linha `comEstrategia` (azul primario), com area azul

Ambos compartilham a mesma escala Y (domain calculado pelo maximo de `comEstrategia`) para que a comparacao visual seja justa.

Layout: `grid grid-cols-1 md:grid-cols-2 gap-4` dentro do mesmo Card.

---

## 2. Projecao de Faturamento Estimado — 2 graficos lado a lado

Mesma logica:

- **Grafico esquerdo**: "Sem Estrategia" — linha `atual` (cinza, dashed), area cinza
- **Grafico direito**: "Com Estrategia" — linha `comEstrategia` (verde), area verde

Ambos com mesma escala Y e formatacao `R$Xk`. Cada grafico tem um subtitulo claro.

---

## 3. Insights — Botao de acao "Iniciar Agora"

Cada card de insight recebera um botao pequeno "Iniciar agora" (variante `link` ou `ghost`) que ao clicar faz `setActiveTab("produtos")`, levando o usuario para a aba de Produtos Recomendados.

O botao ficara alinhado a direita dentro do card do insight, com icone `ArrowRight`.

---

## Arquivo alterado

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Editar secoes de projecao (linhas ~913-965) e insights (linhas ~892-911) |

Sem arquivos novos. Sem mudancas de banco.

---

## Detalhes tecnicos

- As funcoes `getLeadsProjection` e `getRevenueProjection` nao mudam — os dados ja tem `atual` e `comEstrategia`
- A mudanca e apenas na renderizacao: em vez de 1 AreaChart com 2 Areas, serao 2 AreaCharts cada um com 1 Area
- Para manter a escala justa, o `domain` do YAxis sera `[0, maxValue]` calculado a partir do array `comEstrategia`
- Nos insights, o botao chama `setActiveTab("produtos")` que ja existe no componente

