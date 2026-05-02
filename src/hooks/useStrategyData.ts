import { useActiveStrategy } from "./useMarketingStrategy";
import { useSalesPlan } from "./useSalesPlan";
import { normalizeMarketingStrategyResult } from "@/lib/normalizeMarketingStrategyResult";

/**
 * Shared hook for other tools to consume strategy data.
 * Used by: Conteúdos, Artes, Scripts, Tráfego Pago, CRM.
 * Now also exposes Sales Plan data for unified knowledge base.
 */
export function useStrategyData() {
  const { data: strategy, isLoading } = useActiveStrategy();
  const { data: salesPlan, isLoading: salesLoading } = useSalesPlan();
  const rawResult = strategy?.strategy_result;
  const result = normalizeMarketingStrategyResult(rawResult);
  const spAnswers = (salesPlan?.answers || {}) as Record<string, unknown>;

  return {
    isLoading: isLoading || salesLoading,
    hasStrategy: !!result,
    strategyId: strategy?.id,
    status: strategy?.status,

    // ICP
    icp: (result?.icp as Record<string, unknown>) || null,
    personaName: result?.icp?.nome_persona || null,
    publicoAlvo: result?.icp?.descricao || null,
    dores: result?.icp?.dores || [],
    desejos: result?.icp?.desejos || [],
    objecoes: result?.icp?.objecoes || [],
    gatilhosCompra: result?.icp?.gatilhos_compra || [],

    // Proposta de valor
    propostaValor: (result?.proposta_valor as Record<string, unknown>) || null,

    // Tom de comunicação
    tomComunicacao: result?.tom_comunicacao || null,
    tomPrincipal: result?.tom_comunicacao?.tom_principal || null,
    personalidadeMarca: result?.tom_comunicacao?.personalidade_marca || [],
    palavrasUsar: result?.tom_comunicacao?.palavras_usar || [],
    palavrasEvitar: result?.tom_comunicacao?.palavras_evitar || [],

    // Conteúdo
    pilares: result?.estrategia_conteudo?.pilares || [],
    calendarioSemanal: result?.estrategia_conteudo?.calendario_semanal || [],
    ideiasConteudo: result?.estrategia_conteudo?.ideias_conteudo || [],

    // Aquisição
    canaisPrioritarios: result?.estrategia_aquisicao?.canais_prioritarios || [],
    funil: result?.estrategia_aquisicao?.funil || null,

    // Concorrência
    analiseConcorrencia: result?.analise_concorrencia || null,

    // Benchmarks
    benchmarks: result?.benchmarks_setor || null,

    // Objetivos
    objetivoPrincipal: result?.objetivo_principal || null,
    canalPrioritario: result?.canal_prioritario || null,

    // Diagnóstico Comercial (GPS do Negócio)
    diagnosticoComercial: result?.diagnostico_comercial || null,
    scoreComercial: result?.diagnostico_comercial?.score_comercial || null,
    nivelComercial: result?.diagnostico_comercial?.nivel || null,
    radarComercial: result?.diagnostico_comercial?.radar_comercial || null,
    insightsComerciais: result?.diagnostico_comercial?.insights || [],
    estrategiasVendas: result?.diagnostico_comercial?.estrategias_vendas || [],
    funilReverso: result?.diagnostico_comercial?.funil_reverso || null,
    projecaoLeads: result?.diagnostico_comercial?.projecao_leads || [],
    projecaoReceita: result?.diagnostico_comercial?.projecao_receita || [],
    planoAcaoComercial: result?.diagnostico_comercial?.plano_acao || [],
    gapsComerciais: result?.diagnostico_comercial?.gaps || [],

    // Sales Plan (backward compat — unified knowledge base)
    hasSalesPlan: Object.keys(spAnswers).length > 5,
    salesPlanAnswers: spAnswers,
    salesPlanProducts: (spAnswers.produtos_servicos as string) || null,
    salesPlanDiferenciais: (spAnswers.diferenciais as string) || null,
    salesPlanDorPrincipal: (spAnswers.dor_principal as string) || null,
    salesPlanSegmento: (spAnswers.segmento as string) || null,
    salesPlanModeloNegocio: (spAnswers.modelo_negocio as string) || null,
    salesPlanTicketMedio: (spAnswers.ticket_medio as string) || null,
    salesPlanEtapasFunil: (spAnswers.etapas_funil as string) || null,

    // Full result for advanced usage
    fullResult: result,
    answers: strategy?.answers || {},
  };
}
