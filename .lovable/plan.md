

## Plano: Reformular Criador de Estratégia (SPIN + Termômetro NOEXCUSE)

### Resumo

Substituir o formulário atual de 7 blocos por 8 blocos SPIN Selling + Termômetro NOEXCUSE, renomear "Histórico" para "Meus Diagnósticos", e atualizar a IA para gerar documento com 7 seções (Diagnóstico, Problemas, Gargalos, Projeção, Estratégia, Serviços, Roadmap). Compatibilidade retroativa com diagnósticos já existentes.

### Novo Formulário (8 blocos)

1. **Situação** — produto/serviço, ticket, faturamento, meta, canais (checkbox-group), investimento marketing (condicional)
2. **Estrutura Comercial** — processo definido, atendimento leads, time, script, funil, CRM (condicional: qual?), conversão
3. **Geração de Demanda** — leads/mês, CPL, canal principal, tráfego pago (condicional: plataformas), conteúdo, posicionamento
4. **Problemas (SPIN)** — problema geração, problema vendas, perde oportunidades (condicional: por quê?), qualificação, previsibilidade
5. **Impacto (SPIN)** — consequências, impacto faturamento, vendas perdidas, impacto se resolver, capacidade dobrar demanda
6. **Resultado Esperado (SPIN Need Payoff)** — clientes desejados, faturamento ideal, ticket futuro, cenário 12 meses, mudanças necessárias
7. **Termômetro Maturidade** — 6 sliders (1-5): marketing, comercial, leads, previsibilidade, marca, escala
8. **Financeiro Estratégico** — margem lucro, custo máx/cliente, LTV médio

### Documento gerado pela IA (7 seções)

1. Diagnóstico do Negócio (modelo, momento, maturidade score + radar)
2. Problemas Identificados (5-8 do SPIN)
3. Gargalos Estratégicos (aquisição, conversão, estrutura, posicionamento)
4. Projeção de Crescimento (meta ÷ ticket = vendas ÷ conversão = leads)
5. Estratégia Recomendada (4 pilares: estrutura, aquisição, conversão, escala)
6. Serviços Indicados NOEXCUSE (5-8 com justificativa e prioridade)
7. Roadmap 4 fases (Estrutura → Demanda → Conversão → Escala)

### Mudanças na UI

- Tab "Histórico" → "Meus Diagnósticos"
- Formulário com 8 steps + progress bar
- Campos condicionais (investimento, CRM, tráfego, motivo perda)
- Bloco 7 usa Slider para autoavaliação 1-5
- Bloco canais usa CheckboxGroup
- StrategyResultView suporta novo e antigo formato

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useFranqueadoStrategies.ts` | Atualizar StrategyResult com novo schema + legacy fields |
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Novo formulário 8 blocos, renomear aba, novo StrategyResultView |
| `supabase/functions/generate-strategy/index.ts` | Novo TOOL_SCHEMA e SYSTEM_PROMPT para 7 seções SPIN+NOEXCUSE |

