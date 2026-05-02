// Prompts para geração de estratégia de tráfego pago.
// Extraído de supabase/functions/generate-traffic-strategy/index.ts em 2026-05-02.

export const PROMPT_VERSION = '1.0.0';

export const SYSTEM_PROMPT =
  'Você é um estrategista de tráfego pago. Retorne APENAS JSON válido, sem markdown.';

export interface TrafficStrategyInput {
  orgName: string;
  orgSegment: string;
  objetivo: string;
  produto: string;
  publicoText: string;
  pagina_destino: string;
  orcamento: number;
  selectedPlatforms: string;
  regiao: string;
  ativos: string[];
  strategyContext: string;
  contentsContext: string;
  sitesContext: string;
  postsContext: string;
  salesPlanContext: string;
  metricsContext: string;
}

/**
 * Monta o user prompt para geração de estratégia de tráfego.
 * Strings são truncadas para evitar context overflow:
 *   - strategyContext / metricsContext: truncados a 3000 chars pelo caller (recomendado)
 *   - contentsContext / postsContext / sitesContext: use até 10 registros (como na fn)
 */
export function buildUserPrompt(input: TrafficStrategyInput): string {
  const orgName = (input.orgName ?? '').slice(0, 200);
  const orgSegment = (input.orgSegment ?? '').slice(0, 200);
  const objetivo = (input.objetivo ?? '').replace(/[`*_~]/g, '').slice(0, 500);
  const produto = (input.produto ?? '').replace(/[`*_~]/g, '').slice(0, 500);
  const publicoText = (input.publicoText ?? '').slice(0, 500);
  const pagina_destino = (input.pagina_destino ?? '').slice(0, 300);
  const regiao = (input.regiao ?? '').slice(0, 300);
  const ativos = (input.ativos ?? []).slice(0, 20).join(', ') || 'Nenhum';

  return `Você é um estrategista de tráfego pago experiente. Com base nos dados abaixo, gere uma estratégia COMPLETA de tráfego pago.

DADOS DA EMPRESA:
- Nome: ${orgName}
- Segmento: ${orgSegment}

DADOS DO WIZARD:
- Objetivo da campanha: ${objetivo}
- Produto/Oferta: ${produto}
- Público-alvo: ${publicoText}
- Página de destino: ${pagina_destino}
- Orçamento mensal: R$${input.orcamento}
- Plataformas selecionadas: ${input.selectedPlatforms}
- Região de atuação: ${regiao}
- Ativos disponíveis: ${ativos}

ESTRATÉGIA DE MARKETING ATIVA:
${input.strategyContext}

CONTEÚDOS PUBLICADOS:
${input.contentsContext}

SITES:
${input.sitesContext}

CRIATIVOS DISPONÍVEIS:
${input.postsContext}
${input.salesPlanContext}

DADOS REAIS DAS CAMPANHAS ATIVAS (Meta Ads - últimos 30 dias):
${input.metricsContext}

IMPORTANTE: Use os dados reais acima para:
1. Calibrar as estimativas de CPL, CPC e CTR com base na performance histórica real
2. Identificar o que já está funcionando e amplificar
3. Identificar o que não está funcionando e sugerir mudanças
4. Propor orçamento baseado no CPL real, não em médias de mercado
5. Se o CPL real for alto, diagnosticar causas e propor soluções específicas

- platform: nome da plataforma
- objective: objetivo específico da campanha nessa plataforma
- audience: público-alvo detalhado (idade, interesses, comportamentos, localização)
- budget_suggestion: valor em reais da fatia do orçamento para esta plataforma
- budget_percentage: percentual do orçamento total
- ad_copies: array com 2-3 copies de anúncio
- creative_formats: formatos de criativos recomendados
- campaign_structure: { campaigns: [{ name, objective, ad_sets: [{ name, targeting, ads: [{ name, format }] }] }] }
- kpis: { estimated_reach, estimated_clicks, estimated_cpc, estimated_cpl, estimated_ctr, estimated_leads, estimated_clients, estimated_revenue }
- keywords: array de palavras-chave (apenas Google)
- interests: array de interesses/comportamentos (Meta, TikTok)
- tips: array com 3 dicas específicas
- optimization_actions: array com 3 ações de otimização
- tutorial: array com passos de execução na plataforma

Também inclua no topo do JSON:
- diagnostico: análise geral do potencial de aquisição (3-4 frases)
- kpi_tracking: array de métricas sugeridas para acompanhamento (CPC, CTR, CPL, CPA, ROI)
- investment_plan: { total_budget, distribution: [{ platform, percentage, amount }] }
- projections: { total_leads, total_clients, estimated_revenue, estimated_roi }

Retorne APENAS um JSON válido com a estrutura: { diagnostico, kpi_tracking, investment_plan, projections, platforms: [...] }. Sem texto adicional.`;
}
