

## Plano — Redesign visual do Plano Estratégico (fundo escuro, premium) + Refinamento do prompt da IA

### Duas frentes de trabalho

---

### Frente 1: Redesign visual dos resultados

**Conceito:** Dividir a visualização em duas zonas visuais claras:
- **Zona 1 (Diagnóstico)** — fundo claro (branco/glass): Resumo Executivo, Empresa, KPIs, GPS Score, Radar, ECE, Persona, Concorrência, Insights
- **Zona 2 (Plano + Execuções)** — fundo escuro (preto/dark): Visão Geral das 5 Etapas, Etapas detalhadas, Projeções, Entregáveis, botões de ação

**Mudanças visuais nas 5 Etapas (zona escura):**
- Cada etapa vira um card grande com número enorme (01-05), cor de destaque por etapa, score circular visual, e conteúdo expandido por padrão (não colapsável)
- Ações estratégicas com ícones de check animados, tipografia maior e mais destaque
- Métricas-alvo em cards visuais com fundo colorido
- Problemas com destaque visual forte (border vermelho)
- Separador visual entre Diagnóstico e Plano (divider estilizado com título "PLANO ESTRATÉGICO")

**Cards das etapas no tema escuro:**
- Background: `bg-[#0a0a0a]` ou `bg-zinc-950`
- Cards: `bg-zinc-900 border-zinc-800`
- Texto: `text-white` e `text-zinc-400`
- Acentos: vermelho primary para números e destaques
- Badges e métricas com contraste alto

**Aplica a todos os diagnósticos do histórico** (mesma `NewStrategyResultView`).

#### Arquivo: `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx`

- Na `NewStrategyResultView`, após os cards de Insights, inserir um wrapper `<div className="bg-zinc-950 rounded-2xl p-6 -mx-4 space-y-6">` que engloba: Visão Geral 5 Etapas, Etapas detalhadas, Projeções, Entregáveis
- Refazer `EtapaDetailCard`: remover Collapsible, expandir por padrão, layout premium com número gigante, score circular, seções com cores distintas
- Projeções e Entregáveis também dentro do wrapper escuro
- Botões "Salvar em PDF" e "Gerar Proposta" ficam dentro do wrapper escuro com estilo invertido

---

### Frente 2: Refinamento dos prompts da IA

Baseado na análise crítica do usuário, atualizar os prompts para gerar estratégias mais agressivas e consistentes.

#### Arquivo: `supabase/functions/generate-strategy/index.ts`

**GPS_PROMPT — Adicionar instruções:**
- Considerar **capacidade operacional** do cliente (quantos clientes consegue atender por semana/mês)
- Ao calcular projeções, considerar **recorrência real** (ex: psicólogo = paciente semanal, não avulso)
- CAC deve ser calculado com benchmark realista do segmento, não conservador demais
- Insights devem incluir alertas sobre gaps entre projeção e meta (se houver inconsistência, explicar)

**STRATEGIC_PLAN_PROMPT — Adicionar instruções:**
- Ações devem ser **agressivas e escaláveis** no padrão NoExcuse (não genéricas)
- Conteúdo: além de educativo, incluir **conteúdo emocional, de identificação e validação** (não só racional)
- Diferenciação criativa forte — não apenas "conteúdo educativo"
- Explorar **autoridade orgânica** como canal principal quando aplicável
- Considerar limitação de capacidade (ex: profissional liberal com agenda limitada)
- Cada ação deve ter **nível de detalhe executável** (ex: "Publicar 3 reels/semana com ângulo emocional de identificação + dor + validação" em vez de "Produzir conteúdo para redes sociais")

**PROJECTIONS_PROMPT — Adicionar instruções:**
- Modelo financeiro deve considerar **recorrência** (paciente semanal, mensalista, etc.)
- Projeção de receita deve bater com a meta informada — se não bater, explicar o gap e o que seria necessário
- CAC realista para o segmento (usar benchmarks brasileiros por vertical)
- Incluir **capacidade operacional** como limitador na projeção

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx` | Redesign visual: zona escura para plano, etapas expandidas, cards premium |
| `supabase/functions/generate-strategy/index.ts` | Refinamento dos 3 prompts com instruções de recorrência, capacidade, ações agressivas e consistência financeira |

