// @ts-nocheck

const STAGE_META = {
  conteudo: { label: "Conteúdo", tool: "conteudos" },
  trafego: { label: "Tráfego", tool: "trafego" },
  web: { label: "Web", tool: "sites" },
  sales: { label: "Vendas", tool: "scripts" },
  validacao: { label: "Validação", tool: "crm" },
};

const CONTENT_TYPES = ["educacao", "autoridade", "prova_social", "oferta"];
const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function toList(value: any) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toNumber(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function compactText(value: any, max = 72) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function currencyBRL(value: any) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return `R$ ${parsed.toLocaleString("pt-BR")}`;
}

function stageTitle(key: string, etapa: any, index: number) {
  return etapa?.titulo || STAGE_META[key]?.label || `Etapa ${index + 1}`;
}

function normalizeRadarData(radarData: any) {
  if (!Array.isArray(radarData)) return [];
  return radarData.map((item) => ({
    eixo: item?.eixo || item?.subject || "Eixo",
    score: toNumber(item?.score),
    max: toNumber(item?.max, 100),
  }));
}

function buildMarketingRadar(radarData: any[]) {
  if (!radarData.length) return null;

  return radarData.reduce((acc, item) => {
    const key = String(item.eixo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    if (!key) return acc;
    acc[key] = Number(((toNumber(item.score) / Math.max(toNumber(item.max, 100), 1)) * 10).toFixed(1));
    return acc;
  }, {} as Record<string, number>);
}

function buildCompetitorAnalysis(raw: any) {
  const ac = raw?.analise_concorrencia || raw?.analise_competitiva;
  if (!ac) return null;

  return {
    ...ac,
    visao_geral: ac.visao_geral || ac.diferencial_empresa || ac.posicionamento_recomendado || null,
    concorrentes: toList(ac.concorrentes).map((competitor) => ({
      ...competitor,
      pontos_fortes: Array.isArray(competitor?.pontos_fortes) ? competitor.pontos_fortes.join("; ") : competitor?.pontos_fortes,
      pontos_fracos: Array.isArray(competitor?.pontos_fracos) ? competitor.pontos_fracos.join("; ") : competitor?.pontos_fracos,
      oportunidade_diferenciacao: Array.isArray(competitor?.oportunidades)
        ? competitor.oportunidades.join("; ")
        : competitor?.oportunidades,
    })),
  };
}

function buildICP(raw: any) {
  if (raw?.icp) return raw.icp;
  if (!raw?.persona) return null;

  const persona = raw.persona;
  const demografia = [persona.faixa_etaria, persona.genero, persona.poder_aquisitivo].filter(Boolean).join(" • ");
  const canais = toList(persona.canais);

  return {
    nome_persona: persona.nome_persona || "Cliente Ideal",
    descricao: persona.descricao || raw?.resumo_cliente?.proposta_valor || null,
    demografia: demografia || null,
    perfil_profissional: raw?.resumo_cliente?.segmento || null,
    comportamento_digital: canais.length ? canais.join(" • ") : null,
    dores: persona.dor_principal ? [persona.dor_principal] : [],
    desejos: persona.decisao_compra ? [persona.decisao_compra] : [],
    objecoes: [],
    gatilhos_compra: persona.decisao_compra ? [persona.decisao_compra] : [],
    avatar_emoji: "🎯",
  };
}

function buildValueProposition(raw: any) {
  if (raw?.proposta_valor) return raw.proposta_valor;
  const headline = raw?.resumo_cliente?.proposta_valor;
  if (!headline) return null;

  return {
    headline,
    problema: raw?.persona?.dor_principal || null,
    metodo: raw?.etapas?.web?.titulo || raw?.etapas?.sales?.titulo || null,
    resultado: raw?.kpis_hero?.meta_faturamento || raw?.kpis_hero?.recorrencia || null,
    prova: raw?.analise_concorrencia?.diferencial_empresa || null,
  };
}

function buildAcquisition(raw: any) {
  if (raw?.estrategia_aquisicao) return raw.estrategia_aquisicao;

  const traffic = raw?.etapas?.trafego;
  const actions = toList(traffic?.acoes);
  const funnel = toList(raw?.projecoes?.funil_conversao);
  if (!traffic && !funnel.length) return null;

  const channels = actions.slice(0, 4).map((action, index) => ({
    nome: `Alavanca ${index + 1}`,
    percentual: Math.max(10, Math.round(100 / Math.max(actions.length, 1))),
    acao_principal: action,
    tipo: index === 0 ? "organico" : "pago",
  }));

  return {
    canais_prioritarios: channels,
    funil: funnel.length
      ? {
          topo: { estimativa_visitantes: toNumber(funnel[0]?.volume) },
          meio: { estimativa_leads: toNumber(funnel[Math.min(1, funnel.length - 1)]?.volume) },
          fundo: { estimativa_clientes: toNumber(funnel[funnel.length - 1]?.volume) },
        }
      : null,
  };
}

function buildContent(raw: any) {
  if (raw?.estrategia_conteudo) return raw.estrategia_conteudo;

  const content = raw?.etapas?.conteudo;
  const actions = toList(content?.acoes);
  if (!content && !actions.length) return null;

  return {
    pilares: actions.slice(0, 4).map((action, index) => ({
      nome: `Pilar ${index + 1}`,
      tipo: CONTENT_TYPES[index % CONTENT_TYPES.length],
      percentual: Math.max(15, Math.round(100 / Math.max(Math.min(actions.length, 4), 1))),
      descricao: action,
      exemplos: [],
    })),
    calendario_semanal: actions.slice(0, 7).map((action, index) => ({
      dia: WEEK_DAYS[index],
      formato: "Conteúdo",
      sugestao: compactText(action, 84),
    })),
    ideias_conteudo: actions.map((action, index) => ({
      titulo: compactText(action, 84),
      formato: "Post",
      etapa_funil: index < 2 ? "Topo" : index < 4 ? "Meio" : "Fundo",
    })),
  };
}

function buildGrowthPlan(raw: any) {
  if (raw?.plano_crescimento) return raw.plano_crescimento;

  const monthly = toList(raw?.projecoes?.projecao_mensal);
  const economics = raw?.projecoes?.unit_economics;
  if (!monthly.length && !economics) return null;

  return {
    indicadores: {
      cpc_medio: "—",
      cpl_estimado: "—",
      cac_estimado: economics?.cac || "—",
      roi_esperado: economics?.ltv_cac_ratio || raw?.kpis_hero?.ltv_cac || "—",
      ltv_estimado: economics?.ltv || "—",
    },
    projecoes_mensais: monthly.map((item, index) => ({
      mes: item?.mes ?? index + 1,
      leads: toNumber(item?.leads),
      clientes: toNumber(item?.clientes),
      receita: toNumber(item?.receita),
      investimento: toNumber(item?.investimento),
    })),
  };
}

function buildStructure(raw: any) {
  if (raw?.estrutura_recomendada) return raw.estrutura_recomendada;

  return toList(raw?.entregaveis_calculadora).map((deliverable) => ({
    titulo: deliverable?.service_name || "Entregável recomendado",
    recomendacao: deliverable?.justificativa || null,
    prioridade: deliverable?.quantity > 1 ? "alta" : "media",
    status: "fazer",
  }));
}

function buildExecutionPlan(raw: any) {
  if (raw?.plano_execucao) return raw.plano_execucao;
  if (!raw?.etapas) return [];

  return Object.entries(raw.etapas).map(([key, etapa], index) => ({
    mes: index + 1,
    titulo: stageTitle(key, etapa, index),
    passos: toList(etapa?.acoes).map((action) => ({
      titulo: compactText(action, 80),
      descricao: action,
      ferramenta: STAGE_META[key]?.tool || "",
    })),
  }));
}

function buildProjectedSeries(raw: any, field: "leads" | "receita") {
  return toList(raw?.projecoes?.projecao_mensal).map((item, index) => ({
    mes: `M${item?.mes ?? index + 1}`,
    periodo: `M${item?.mes ?? index + 1}`,
    atual: 0,
    projetado: toNumber(item?.[field]),
    com_estrategia: toNumber(item?.[field]),
  }));
}

function buildCommercialFunnel(raw: any) {
  if (raw?.diagnostico_comercial?.funil_reverso) return raw.diagnostico_comercial.funil_reverso;

  const funil = toList(raw?.projecoes?.funil_conversao);
  if (funil.length) {
    return funil.reduce((acc, item, index) => {
      const key = String(item?.etapa || `etapa_${index + 1}`)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      acc[key || `etapa_${index + 1}`] = toNumber(item?.volume);
      return acc;
    }, {} as Record<string, number>);
  }

  const firstMonth = raw?.projecoes?.projecao_mensal?.[0];
  if (!firstMonth) return null;

  return {
    leads: toNumber(firstMonth?.leads),
    clientes: toNumber(firstMonth?.clientes),
    receita: toNumber(firstMonth?.receita),
  };
}

function buildCommercialLevel(score: number) {
  if (score >= 76) return "Avançado";
  if (score >= 51) return "Intermediário";
  if (score >= 26) return "Básico";
  return "Crítico";
}

export function normalizeMarketingStrategyResult(rawResult: any) {
  if (!rawResult) return null;

  const diagGps = rawResult?.diagnostico_gps || {};
  const radarData = normalizeRadarData(diagGps?.radar_data);
  const monthlyProjection = toList(rawResult?.projecoes?.projecao_mensal);
  const averageInvestment = monthlyProjection.length
    ? currencyBRL(monthlyProjection.reduce((sum, item) => sum + toNumber(item?.investimento), 0) / monthlyProjection.length)
    : null;
  const firstRevenue = toNumber(monthlyProjection[0]?.receita, 0);
  const lastRevenue = toNumber(monthlyProjection[monthlyProjection.length - 1]?.receita, 0);
  const revenueGrowth = firstRevenue > 0 && lastRevenue > 0
    ? `${Math.round(((lastRevenue - firstRevenue) / firstRevenue) * 100)}% em projeção`
    : null;

  const salesProblems = toList(rawResult?.etapas?.sales?.problemas);
  const validationProblems = toList(rawResult?.etapas?.validacao?.problemas);
  const eceGaps = Object.values(diagGps?.gargalos_ece || {}).filter(Boolean);
  const diagnosticRisks = [
    ...salesProblems,
    ...validationProblems,
    ...eceGaps,
  ].slice(0, 6);

  const insightTexts = toList(diagGps?.insights).map((item) =>
    typeof item === "string" ? item : item?.texto || item?.descricao || item?.titulo || JSON.stringify(item)
  );

  const commercialScore = toNumber(rawResult?.score_comercial, toNumber(rawResult?.etapas?.sales?.score, toNumber(diagGps?.score_geral)));

  const normalized = {
    ...rawResult,
    objetivo_principal: rawResult?.objetivo_principal || rawResult?.kpis_hero?.meta_faturamento || null,
    canal_prioritario: rawResult?.canal_prioritario || rawResult?.etapas?.trafego?.titulo || null,
    investimento_recomendado: rawResult?.investimento_recomendado || averageInvestment,
    potencial_crescimento: rawResult?.potencial_crescimento || revenueGrowth || rawResult?.kpis_hero?.ltv_cac || null,
    icp: buildICP(rawResult),
    tom_comunicacao: rawResult?.tom_comunicacao || buildTomComunicacao(rawResult),
    proposta_valor: buildValueProposition(rawResult),
    analise_concorrencia: buildCompetitorAnalysis(rawResult),
    estrategia_aquisicao: buildAcquisition(rawResult),
    estrategia_conteudo: buildContent(rawResult),
    plano_crescimento: buildGrowthPlan(rawResult),
    estrutura_recomendada: buildStructure(rawResult),
    plano_execucao: buildExecutionPlan(rawResult),
    score_marketing: toNumber(rawResult?.score_marketing, toNumber(diagGps?.score_geral)),
    score_comercial: commercialScore,
    diagnostico: rawResult?.diagnostico || (diagGps?.score_geral ? {
      score_geral: toNumber(diagGps?.score_geral),
      analise: diagGps?.descricao || rawResult?.resumo_executivo || null,
      radar: buildMarketingRadar(radarData),
      radar_data: radarData,
      pontos_fortes: [rawResult?.resumo_cliente?.diferencial, rawResult?.kpis_hero?.recorrencia].filter(Boolean),
      oportunidades: insightTexts.slice(0, 4),
      riscos: diagnosticRisks,
    } : null),
    diagnostico_comercial: rawResult?.diagnostico_comercial || ((commercialScore || radarData.length || rawResult?.etapas?.sales) ? {
      score_comercial: commercialScore,
      nivel: rawResult?.diagnostico_comercial?.nivel || buildCommercialLevel(commercialScore),
      analise: rawResult?.etapas?.sales?.diagnostico || diagGps?.descricao || null,
      radar_comercial: rawResult?.diagnostico_comercial?.radar_comercial || radarData,
      insights: rawResult?.diagnostico_comercial?.insights || insightTexts,
      gaps: rawResult?.diagnostico_comercial?.gaps || diagnosticRisks,
      funil_reverso: buildCommercialFunnel(rawResult),
      projecao_leads: rawResult?.diagnostico_comercial?.projecao_leads || buildProjectedSeries(rawResult, "leads"),
      projecao_receita: rawResult?.diagnostico_comercial?.projecao_receita || buildProjectedSeries(rawResult, "receita"),
      plano_acao: rawResult?.diagnostico_comercial?.plano_acao || Object.entries(rawResult?.etapas || {}).map(([key, etapa], index) => ({
        fase: stageTitle(key, etapa, index),
        periodo: `${index + 1}º ciclo`,
        items: toList(etapa?.acoes),
      })),
      estrategias_vendas: rawResult?.diagnostico_comercial?.estrategias_vendas || (rawResult?.etapas?.sales ? [{
        titulo: rawResult.etapas.sales.titulo || "Estratégia Comercial",
        descricao: rawResult.etapas.sales.diagnostico || null,
        passos: toList(rawResult.etapas.sales.acoes),
        resultado_esperado: rawResult?.kpis_hero?.meta_faturamento || null,
      }] : []),
    } : null),
  };

  return normalized;
}