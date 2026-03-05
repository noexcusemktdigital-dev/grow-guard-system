

# Recriação da Ferramenta de Estratégia de Marketing

## Situação Atual

A ferramenta de estratégia atual (`ClientePlanoMarketing.tsx`, 1022 linhas) usa um sistema de briefing por chat (`ChatBriefing`) com ~30 perguntas em 9 seções, gera scores localmente no frontend e exibe resultados estáticos (radar, projeções calculadas localmente). Existe uma edge function `generate-strategy` que usa Gemini, mas o fluxo principal **não a utiliza** — o scoring e os insights são todos hardcoded no frontend.

## O que muda

O documento pede uma mudança fundamental: ao invés de calcular tudo localmente, o chat coleta **10 perguntas simples** e envia para a IA gerar a estratégia completa com blocos estruturados (diagnóstico, posicionamento, persona, pilares de conteúdo, funil, site, tráfego, projeções).

## Plano de Implementação

### 1. Atualizar a tabela `marketing_strategies`

Adicionar coluna `strategy_result` (JSONB) para armazenar o resultado estruturado da IA, e `status` para controle de aprovação.

```sql
ALTER TABLE marketing_strategies 
  ADD COLUMN IF NOT EXISTS strategy_result jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
```

A coluna `answers` continua armazenando as 10 respostas coletadas. O `strategy_result` armazena o resultado completo da IA.

### 2. Reescrever a Edge Function `generate-strategy`

- Atualizar o system prompt para as 10 perguntas do documento
- Reestruturar o tool calling para retornar os blocos especificados:
  - `diagnostico` (análise do negócio)
  - `posicionamento` (proposta de valor, mensagem central, diferenciação)
  - `persona` (perfil detalhado do cliente ideal)
  - `pilares_conteudo` (3-5 pilares)
  - `estrategia_aquisicao` (canais prioritários)
  - `funil` (topo, meio, fundo)
  - `ideias_conteudo` (lista de conteúdos iniciais)
  - `estrutura_site` (páginas recomendadas)
  - `trafego_pago` (campanhas e canais)
  - `indicadores` (CPL, CAC, ROI, conversão)
  - `projecoes` (leads, clientes, faturamento — com dados para gráfico)
  - `resumo_executivo`
- Salvar o resultado na coluna `strategy_result` da tabela
- Manter lógica de créditos existente

### 3. Reescrever `ClientePlanoMarketing.tsx`

**Interface de coleta (chat):**
- Simplificar para as 10 perguntas do documento usando `ChatBriefing` com um novo set de steps
- Atualizar o agente Sofia com as novas perguntas

**Interface de resultado:**
- Após gerar, exibir os blocos estruturados retornados pela IA:
  - Card de Diagnóstico do Negócio
  - Card de Posicionamento Estratégico
  - Card de Persona
  - Cards de Pilares de Conteúdo
  - Card de Funil (Topo/Meio/Fundo)
  - Lista de Ideias de Conteúdo
  - Estrutura de Site recomendada
  - Estratégia de Tráfego Pago
  - KPIs e Indicadores
  - Gráficos de Projeção (leads, faturamento)
- Botões: Aprovar, Regenerar
- Crédito consumido somente após aprovação

### 4. Atualizar `briefingAgents.ts`

Substituir os `SOFIA_STEPS` (atuais ~30 perguntas em 9 seções) por 10 steps simples conforme documento:
1. Referência (link site/Instagram)
2. Descrição do negócio
3. Produto/serviço principal
4. Público-alvo
5. Problema que resolve
6. Diferencial competitivo
7. Objetivo de marketing
8. Meta desejada
9. Canais disponíveis
10. Orçamento de marketing

### 5. Atualizar `useMarketingStrategy.ts`

- Adicionar campo `strategy_result` ao tipo `MarketingStrategy`
- Separar fluxo: salvar respostas primeiro, depois chamar IA, depois salvar resultado
- Adicionar mutation para aprovar estratégia (`status: 'approved'`)

## Arquivos Modificados

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova migration: add `strategy_result`, `status` |
| `supabase/functions/generate-strategy/index.ts` | Reescrever prompt e tool schema |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Reescrever completamente |
| `src/components/cliente/briefingAgents.ts` | Substituir `SOFIA_STEPS` |
| `src/hooks/useMarketingStrategy.ts` | Atualizar tipos e mutations |

## Dados reutilizáveis

Os dados armazenados em `answers` + `strategy_result` ficam disponíveis via `useActiveStrategy()` para as outras ferramentas (Conteúdo, Postagens, Site, Tráfego) consumirem automaticamente — pilares de conteúdo, persona, funil, estrutura de site, estratégia de tráfego.

## Escopo desta tarefa

Apenas a **Ferramenta de Estratégia**. As outras ferramentas (Conteúdo, Postagens, Site, Tráfego) serão recriadas nos próximos documentos.

