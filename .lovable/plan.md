

## Plano — Reformulação do Criador de Estratégia do Franqueado

### Visão geral

Transformar a ferramenta "Criação de Estratégia" do franqueado em um sistema completo que combina: (A) diagnóstico analítico tipo GPS do Negócio (score, radar, problemas), (B) planejamento estratégico em 5 etapas da metodologia NoExcuse (Conteúdo, Tráfego, Web, Sales, Validação/Escala), seguindo o framework ECE (Infraestrutura → Coleta → Escala), e (C) integrações com CRM, PDF e Calculadora.

---

### Parte 1 — Reformulação das perguntas do diagnóstico

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategia.tsx` (linhas 78-184)

Reestruturar as 8 seções atuais em seções alinhadas às 5 etapas + contexto do negócio:

1. **Contexto do Negócio** — Nome, segmento, tempo de mercado, faturamento, ticket médio, clientes ativos, modelo de negócio, meta de faturamento, meta de clientes/mês
2. **Conteúdo e Linha Editorial** — Produz conteúdo? Frequência? Canais? Tem linha editorial? Funil de conteúdo? Formatos usados?
3. **Tráfego e Distribuição** — Investe em tráfego? Quanto? Plataformas? CPL? Volume de leads? Canal que mais converte?
4. **Web e Conversão** — Tem site/LP? Quantidade? Taxa de conversão? Testes A/B? Elementos de prova? CTA principal?
5. **Sales e Fechamento** — Processo comercial? Time? CRM? Script? Funil definido? Taxa de conversão? Follow-up?
6. **Validação e Escala** — Mede métricas? Quais KPIs acompanha? Já escalou algum canal? Capacidade de atendimento? O que acontece se dobrar demanda?
7. **Termômetro de Maturidade** — Slider 1-5 para cada etapa (Conteúdo, Tráfego, Web, Sales, Escala) + Marketing geral + Posicionamento
8. **Financeiro e Projeções** — Margem de lucro, LTV, CAC máximo aceitável, investimento atual em marketing

---

### Parte 2 — Nova edge function `generate-strategy` (reformulação)

**Arquivo:** `supabase/functions/generate-strategy/index.ts`

Atualmente faz 3 chamadas separadas (marketing-core, marketing-growth, comercial) pensadas para o GPS do cliente SaaS. Reformular para gerar:

**Chamada 1 — Diagnóstico + GPS (como o GPS do Negócio):**
- Score geral 0-100 com nível (Crítico/Básico/Intermediário/Avançado)
- Radar com 5 eixos baseados nas 5 etapas (Conteúdo, Tráfego, Web, Sales, Escala)
- Problemas identificados por etapa
- Gargalos estratégicos (onde estão os problemas na metodologia ECE)
- Insights personalizados

**Chamada 2 — Planejamento Estratégico das 5 Etapas:**
Para cada etapa, gerar ações específicas como no site iGo Pass:
- **Conteúdo e Linha Editorial**: Funil de conteúdo (topo/meio/fundo/pós-venda), formatos por canal, calendário sugerido
- **Tráfego e Distribuição**: Plataformas recomendadas, investimento sugerido por canal, métricas-alvo (CTR, CPC, CPL, MQLs)
- **Web e Conversão**: LPs necessárias por segmento/público, testes estruturais, elementos obrigatórios
- **Sales e Fechamento**: Funil de vendas com taxas, processo comercial em etapas, otimizações
- **Validação e Escala**: Análise por etapa, gargalos, testes controlados, escala progressiva

**Chamada 3 — Projeções e Previsibilidade:**
- Unit Economics (CAC, LTV, LTV/CAC)
- Projeção de leads e receita 6 meses
- Cenário base com taxas de conversão por etapa do funil
- Crescimento acumulado com recorrência (se aplicável)
- Entregáveis recomendados com mapeamento para serviços da calculadora

---

### Parte 3 — Nova interface de resultados

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx`

Reescrever `NewStrategyResultView` para exibir:

1. **Resumo do Cliente** — Sobre a empresa, proposta de valor, aplicações, diferencial
2. **KPIs Hero** — Meta/mês, Ticket, Recorrência, LTV/CAC (como no header do iGo Pass)
3. **Visão Geral das 5 Etapas** — Cards numerados 01-05 com título e descrição curta
4. **Seção detalhada por etapa** — Cada etapa expandida com suas ações, métricas e entregáveis
5. **GPS/Diagnóstico** — Termômetro de maturidade, radar 5 eixos, problemas, gargalos
6. **Projeção e Previsibilidade** — Cenário base, receita, crescimento acumulado
7. **Entregáveis mapeados** — Lista de serviços NoExcuse vinculados ao planejamento

---

### Parte 4 — Três ações pós-geração

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategia.tsx`

Adicionar 3 botões de ação no resultado:

1. **Salvar e Vincular ao CRM** — Já existe parcialmente (vincular lead_id). Melhorar com seletor de lead e salvamento automático no histórico.

2. **Exportar PDF A4** — Reformular o `exportPdf` para gerar um PDF profissional paginado com timbrado NoExcuse, todas as seções organizadas visualmente (usar jsPDF + html2canvas existente, mas com layout dedicado para impressão com fundo branco forçado).

3. **Enviar para Calculadora** — Novo botão que extrai os entregáveis recomendados do planejamento estratégico, mapeia cada um para o `service.id` correspondente em `src/data/services.ts`, e navega para `/franqueado/propostas` com os itens pré-selecionados via query params ou estado compartilhado.

---

### Parte 5 — Integração Estratégia → Calculadora

**Arquivos:**
- `src/pages/franqueado/FranqueadoEstrategia.tsx` — Botão "Enviar para Calculadora"
- `src/pages/franqueado/FranqueadoPropostas.tsx` — Receber entregáveis pré-selecionados
- `src/hooks/useFranqueadoStrategies.ts` — Atualizar `StrategyResult` interface

O resultado da IA incluirá um array `entregaveis_calculadora` com objetos `{ service_id, quantity, justificativa }` mapeados para os IDs reais de `src/data/services.ts`. Ao clicar "Enviar para Calculadora", o sistema navega para a aba de calculadora com esses itens pré-preenchidos.

---

### Parte 6 — Histórico e gestão

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategia.tsx` (MeusDiagnosticosTab)

Melhorar a listagem existente com:
- Filtros por status (concluído, rascunho, erro)
- Badge do score de maturidade mais visível
- Indicador de lead vinculado clicável
- Ações rápidas: PDF, Calculadora, Vincular CRM

---

### Parte 7 — Fix do runtime error

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategia.tsx` (linha 67)

O erro `Identifier 'supabase' has already been declared` é causado por dupla importação de `supabase` nas linhas 50 e 67. Remover a linha 67.

---

### Resumo de arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Reformular perguntas, adicionar 3 ações, fix dupla importação |
| `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx` | Reescrever exibição com 5 etapas + GPS + projeções |
| `src/pages/franqueado/FranqueadoEstrategiaData.ts` | Atualizar tipos para novo schema |
| `src/hooks/useFranqueadoStrategies.ts` | Atualizar `StrategyResult` interface |
| `supabase/functions/generate-strategy/index.ts` | Reformular prompts e schemas para 5 etapas + ECE |
| `src/pages/franqueado/FranqueadoPropostas.tsx` | Receber entregáveis pré-selecionados da estratégia |

### Ordem de execução sugerida

1. Fix runtime error (dupla importação)
2. Atualizar perguntas do diagnóstico
3. Reformular edge function (schemas + prompts)
4. Atualizar interface de resultados
5. Implementar 3 ações (CRM, PDF, Calculadora)
6. Integração Calculadora
7. Melhorar histórico

