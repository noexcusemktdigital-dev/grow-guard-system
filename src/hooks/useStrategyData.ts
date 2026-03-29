// @ts-nocheck
/* eslint-disable */
import { useActiveStrategy } from "./useMarketingStrategy";
import { useSalesPlan } from "./useSalesPlan";

/**
 * Shared hook for other tools to consume strategy data.
 * Used by: Conteúdos, Artes, Scripts, Tráfego Pago, CRM.
 * Now also exposes Sales Plan data for unified knowledge base.
 */
export function useStrategyData() {
  const { data: strategy, isLoading } = useActiveStrategy();
  const { data: salesPlan, isLoading: salesLoading } = useSalesPlan();
  const result = strategy?.strategy_result;
  const spAnswers = (salesPlan?.answers || {}) as Record<string, any>;

  return {
    isLoading: isLoading || salesLoading,
    hasStrategy: !!result,
    strategyId: strategy?.id,
    status: strategy?.status,

    // ICP
    icp: result?.icp || null,
    personaName: result?.icp?.nome_persona || null,
    publicoAlvo: result?.icp?.descricao || null,
    dores: result?.icp?.dores || [],
    desejos: result?.icp?.desejos || [],
    objecoes: result?.icp?.objecoes || [],
    gatilhosCompra: result?.icp?.gatilhos_compra || [],

    // Proposta de valor
    propostaValor: result?.proposta_valor || null,

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

    // Sales Plan (unified knowledge base)
    hasSalesPlan: Object.keys(spAnswers).length > 5,
    salesPlanAnswers: spAnswers,
    salesPlanProducts: spAnswers.produtos_servicos || null,
    salesPlanDiferenciais: spAnswers.diferenciais || null,
    salesPlanDorPrincipal: spAnswers.dor_principal || null,
    salesPlanSegmento: spAnswers.segmento || null,
    salesPlanModeloNegocio: spAnswers.modelo_negocio || null,
    salesPlanTicketMedio: spAnswers.ticket_medio || null,
    salesPlanEtapasFunil: spAnswers.etapas_funil || null,

    // Full result for advanced usage
    fullResult: result,
    answers: strategy?.answers || {},
  };
}
