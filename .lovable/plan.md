

## GPS do Negócio — Plano Atualizado

### Resumo das mudanças solicitadas

1. **Dois agentes em vez de um**: Rafael (Consultor Comercial) e Sofia (Consultora de Marketing) continuam existindo, mas agora trabalham em sequência dentro do GPS do Negócio. Rafael faz as perguntas comerciais primeiro, depois "passa a bola" para Sofia que faz as perguntas de marketing.
2. **Onboarding interativo antes do chat**: tela de boas-vindas visual explicando os benefícios do GPS do Negócio antes de iniciar o chat.
3. **Visual destacado na sidebar**: ícone de GPS (Navigation/MapPin), cor amber/dourada, posicionado entre Gamificação e Vendas com espaçamento próprio como um módulo isolado.
4. **Todas as ferramentas bloqueadas** até o GPS ser concluído (gate unificado).

---

### Fluxo do usuário

```text
Sidebar: clica em "GPS do Negócio"
        ↓
┌─────────────────────────────────────────┐
│  ONBOARDING INTERATIVO (tela visual)    │
│  - O que é o GPS do Negócio             │
│  - Por que essa base de conhecimento    │
│    é tão importante                     │
│  - O que você vai receber (benefícios)  │
│  - Quanto tempo leva (~12 min)          │
│  - Botão: "Iniciar Diagnóstico"         │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  CHAT — FASE 1: RAFAEL                  │
│  Foto + apresentação do consultor       │
│  comercial. Faz ~15 perguntas sobre     │
│  negócio, financeiro, equipe, leads,    │
│  canais, processo de vendas, metas.     │
│                                         │
│  Ao finalizar: "Agora vou passar você   │
│  para a Sofia, nossa consultora de      │
│  marketing..."                          │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  CHAT — FASE 2: SOFIA                   │
│  Foto + apresentação da consultora de   │
│  marketing. Faz ~13 perguntas sobre     │
│  público, posicionamento, concorrência, │
│  canais atuais, comunicação, objetivo.  │
│  (perguntas duplicadas são eliminadas)  │
│                                         │
│  Ao finalizar: "Gerando seu GPS..."     │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  RESULTADO — Dashboard com Tabs         │
│  Resumo | Marketing | Comercial | Exec  │
└─────────────────────────────────────────┘
```

### Detalhes técnicos

#### Fase 1 — Agentes, perguntas unificadas, sidebar, rota, onboarding

| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/briefingAgents.ts` | Criar `GPS_RAFAEL_STEPS` (~15 perguntas comerciais) e `GPS_SOFIA_STEPS` (~13 perguntas marketing, sem duplicatas). Manter `SOFIA_STEPS` e `RAFAEL_STEPS` originais para backward compat. Adicionar avatarUrl aos agentes Rafael e Sofia. |
| `src/components/ClienteSidebar.tsx` | Remover "Plano de Vendas" e "Plano de Marketing" das seções. Adicionar "GPS do Negócio" entre Gamificação e Vendas com ícone Navigation, cor amber, espaçamento isolado (separadores acima e abaixo), badge "NOVO". |
| `src/App.tsx` | Nova rota `/cliente/gps-negocio`. Redirects de `/cliente/plano-vendas` e `/cliente/plano-marketing` para `/cliente/gps-negocio`. |
| `src/pages/cliente/ClienteGPSNegocio.tsx` (novo) | Página principal: estado `welcome` → `chat-rafael` → `chat-sofia` → `generating` → `result`. Tela de welcome com cards visuais explicando benefícios. Chat com transição animada entre agentes. |

#### Fase 2 — Edge Function expandida

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-strategy/index.ts` | Expandir TOOL_SCHEMA com seção `diagnostico_comercial` (radar 5 eixos, score, insights, estratégias de vendas, funil reverso, projeções leads/receita 6 meses, plano de ação 30/60/90 dias). Expandir SYSTEM_PROMPT para gerar análise comercial detalhada com cálculos e gráficos. |

#### Fase 3 — Dashboard unificado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Tab Resumo (score duplo marketing+comercial), Tab Marketing (reutiliza componentes existentes de StrategyDashboard), Tab Comercial (radar 5 eixos, projeções com AreaChart, funil reverso visual, estratégias detalhadas, plano de ação em cards), Tab Execução (roadmap 3 meses). |

#### Fase 4 — Gates, hooks e redirects

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/FeatureGateContext.tsx` | Unificar gates: `no_sales_plan` e `no_marketing_strategy` viram `no_gps` apontando para `/cliente/gps-negocio`. |
| `src/components/FeatureGateOverlay.tsx` | Adicionar entrada para "GPS do Negócio" com descrição e ícone Navigation. |
| `src/hooks/useStrategyData.ts` | Expandir para expor dados comerciais do resultado unificado. |
| Referências em GlobalSearch, Gamificação, Onboarding | Atualizar paths e labels. |

### Chat com dois agentes — mecânica

O `ChatBriefing` component já suporta um agente por sessão. Para o GPS, a página `ClienteGPSNegocio` vai:
1. Renderizar `ChatBriefing` com Rafael + `GPS_RAFAEL_STEPS`
2. Ao completar (onComplete), exibir mensagem de transição animada ("Passando para a Sofia...")
3. Renderizar segundo `ChatBriefing` com Sofia + `GPS_SOFIA_STEPS`, passando as respostas do Rafael como contexto
4. Ao completar, juntar todas as respostas e chamar `generate-strategy`

### Perguntas unificadas (~28 no total)

**Rafael (~15 perguntas):**
Negócio (empresa, produto, segmento, modelo_negocio, ticket_medio), Financeiro (faturamento, meta_faturamento, tem_recorrencia, ciclo_recompra), Equipe (tamanho_equipe, funcoes_equipe, tempo_fechamento), Leads (usa_crm, followup, dor_principal), Canais (canais_aquisicao, canal_principal), Processo (etapas_funil), Metas (metas_historicas, conversao_etapa)

**Sofia (~13 perguntas — sem duplicatas):**
Público (publico, faixa_etaria, problema), Posicionamento (razao_escolha, diferencial, resultados_clientes), Concorrência (concorrentes_urls, concorrente_faz_melhor), Estrutura atual (canais_atuais, investe_anuncios, frequencia_conteudo), Objetivo (objetivo, meta), Comunicação (tom_comunicacao, nao_quero_comunicacao, marcas_referencia), Presença digital (links_digitais), Sazonalidade (sazonalidade), Região (regiao, orcamento)

### Entregas comerciais detalhadas (novo)

- Radar 5 eixos com scores 0-10
- Score de maturidade comercial (0-100) com nível
- 2-3 estratégias de vendas detalhadas (nome, descrição, passos, resultado esperado)
- Funil reverso: meta → vendas necessárias → leads → tráfego
- Projeção de leads 6 meses (cenário atual vs com estratégia) — AreaChart
- Projeção de receita 6 meses (cenário atual vs com estratégia) — AreaChart
- Gaps comerciais identificados
- Plano de ação 30/60/90 dias
- Insights personalizados com tipos (success/warning/opportunity)

### Implementação em 4 fases sequenciais

Cada fase será implementada na ordem acima. A primeira fase já entrega a experiência completa de briefing. A segunda expande a IA. A terceira cria o dashboard visual. A quarta conecta todos os gates.

