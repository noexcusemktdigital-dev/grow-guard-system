

## Diagnóstico — GPS mostra só Marketing, falta Comercial

### O que encontrei

Os logs da Edge Function confirmam que **as 3 seções foram geradas com sucesso** (marketing-core: 5346 tokens, marketing-growth: 4482 tokens, comercial: 3291 tokens). Os dados comerciais (`diagnostico_comercial`, `estrategias_vendas`, `funil_reverso`, `projecao_leads`, `projecao_receita`) **estão salvos no banco** dentro do `strategy_result`.

O problema é que **o dashboard de resultado não tem abas para exibir os dados comerciais**. O componente `StrategyDashboard` em `ClientePlanoMarketingStrategy.tsx` só tem 8 abas — todas de marketing:

| Aba atual | Dados |
|-----------|-------|
| Resumo | Score marketing, radar 6 eixos (marketing), objetivo, canal |
| Cliente Ideal | ICP/persona |
| Concorrência | Análise concorrencial |
| Tom de Voz | Personalidade da marca |
| Aquisição | Canais e funil |
| Conteúdo | Pilares e calendário |
| Projeção | Crescimento (marketing growth) |
| Execução | Roadmap 3 meses |

**Faltam completamente:**
- Aba "Comercial" com radar de 5 eixos, score comercial, gaps, insights, estratégias de vendas
- Aba "Projeção Comercial" com funil reverso, projeção de leads e receita (AreaChart)
- O "Resumo" não integra o score comercial nem mostra a visão unificada

### Sobre os erros

Os logs mostram várias linhas `shutdown` — indicam que tentativas anteriores sofreram timeout. A geração mais recente (01:28-01:29) funcionou. O erro que o usuário viu foi provavelmente de uma tentativa anterior, mas o resultado parcial (só marketing visível) deu a impressão de falha.

### Plano de correção

1. **Adicionar aba "Comercial"** ao `StrategyDashboard`
   - Radar de 5 eixos (processo, gestão_leads, ferramentas, canais, performance)
   - Score comercial + nível
   - Análise textual
   - Gaps identificados
   - Insights com badges coloridos (success/warning/opportunity)
   - Estratégias de vendas com passos e resultado esperado
   - Plano de ação (3 fases: 30/60/90 dias)

2. **Adicionar aba "Projeções" (comercial)** ou unificar na aba Projeção existente
   - Funil reverso (meta → vendas → leads → tráfego)
   - Gráfico AreaChart de projeção de leads (atual vs com estratégia)
   - Gráfico AreaChart de projeção de receita (atual vs com estratégia)

3. **Atualizar aba "Resumo"** para incluir visão unificada
   - Mostrar ambos os scores (marketing + comercial)
   - Integrar radar comercial ao lado do radar marketing
   - Exibir diagnóstico completo

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClientePlanoMarketingStrategy.tsx` | Adicionar `TabComercial` e `TabProjecaoComercial`, atualizar `TabResumo` com dados comerciais, adicionar abas no TabsList |
| `src/pages/cliente/ClientePlanoMarketingTypes.ts` | Adicionar types para `DiagnosticoComercial`, `FunilReverso`, `ProjecaoRow` comercial |

### Detalhes técnicos

- Os dados comerciais já estão no `strategy_result` como `diagnostico_comercial` (com sub-campos: `score_comercial`, `radar_comercial`, `gaps`, `insights`, `estrategias_vendas`, `funil_reverso`, `projecao_leads`, `projecao_receita`, `plano_acao`)
- O `StrategyResult` type precisa incluir `diagnostico_comercial`
- O radar comercial usa `RadarChart` com 5 eixos (mesmo componente Recharts já importado)
- As projeções de leads/receita usam `AreaChart` (também já importado)

### Resultado

O GPS do Negócio passará a exibir a entrega completa: Marketing + Comercial, com abas dedicadas para cada área e um resumo unificado mostrando os dois scores lado a lado.

