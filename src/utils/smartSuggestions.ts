/**
 * Extracts contextual suggestions from GPS do Negócio (strategy data).
 * Falls back to generic suggestions when GPS is not available.
 */

const GENERIC_TOPICS = ["Consórcio", "Imóvel", "Clínica", "Curso", "Evento", "Seguro", "Produto novo"];
const GENERIC_AUDIENCES = [
  "Empresários", "Mulheres 25-45", "Médicos", "Jovens 18-30",
  "Casais", "Donos de clínicas", "Investidores", "Público geral",
  "Profissionais de saúde", "Advogados", "Empreendedores digitais",
];
const GENERIC_ELEMENTS = [
  "Pessoas", "Produto", "Ambiente / Cenário", "Fundo abstrato",
  "Ícones", "Documentos", "Objetos específicos", "Notebook com gráfico",
  "Smartphone", "Prédio corporativo", "Casa moderna", "Pessoa sorrindo",
];

interface StrategyData {
  hasStrategy?: boolean;
  pilares?: Array<{ nome?: string; titulo?: string; [k: string]: unknown }>;
  ideiasConteudo?: Array<{ titulo?: string; tema?: string; [k: string]: unknown }>;
  personaName?: string | null;
  publicoAlvo?: string | null;
  dores?: string[];
  desejos?: string[];
  salesPlanProducts?: string | null;
  salesPlanSegmento?: string | null;
  salesPlanDorPrincipal?: string | null;
  tomPrincipal?: string | null;
  palavrasUsar?: string[];
  icp?: { descricao?: string; [k: string]: unknown } | null;
  [k: string]: unknown;
}

export interface SmartSuggestions {
  topics: string[];
  audiences: string[];
  elements: string[];
  topicPlaceholder: string;
  audiencePlaceholder: string;
}

function unique(arr: string[]): string[] {
  return [...new Set(arr.filter(s => s && s.trim().length > 1))];
}

function truncate(arr: string[], max = 10): string[] {
  return arr.slice(0, max);
}

export function getSmartSuggestions(data?: StrategyData | null): SmartSuggestions {
  if (!data?.hasStrategy) {
    return {
      topics: GENERIC_TOPICS,
      audiences: GENERIC_AUDIENCES,
      elements: GENERIC_ELEMENTS,
      topicPlaceholder: "Ex: consórcio de imóveis, clínica odontológica, lançamento de curso, evento corporativo...",
      audiencePlaceholder: "Ex: empresários, mulheres 25-45, médicos, público geral...",
    };
  }

  // ── Topics from GPS ──
  const topicSources: string[] = [];

  // Pilares de conteúdo
  if (data.pilares?.length) {
    data.pilares.forEach(p => {
      if (p.nome) topicSources.push(p.nome);
      if (p.titulo) topicSources.push(p.titulo);
    });
  }

  // Ideias de conteúdo
  if (data.ideiasConteudo?.length) {
    data.ideiasConteudo.forEach(i => {
      if (i.titulo) topicSources.push(i.titulo);
      if (i.tema) topicSources.push(i.tema);
    });
  }

  // Produtos/serviços
  if (data.salesPlanProducts) {
    const prods = String(data.salesPlanProducts);
    if (prods.includes(",")) {
      prods.split(",").forEach(p => topicSources.push(p.trim()));
    } else {
      topicSources.push(prods);
    }
  }

  // Segmento
  if (data.salesPlanSegmento) topicSources.push(String(data.salesPlanSegmento));

  const topics = truncate(unique(topicSources));

  // ── Audiences from GPS ──
  const audienceSources: string[] = [];

  if (data.personaName) audienceSources.push(String(data.personaName));
  if (data.publicoAlvo) audienceSources.push(String(data.publicoAlvo));
  if (data.icp?.descricao) audienceSources.push(String(data.icp.descricao));
  if (data.dores?.length) {
    data.dores.slice(0, 3).forEach(d => audienceSources.push(`Quem sofre com: ${d}`));
  }

  const audiences = truncate(unique(audienceSources));

  // ── Elements from GPS ──
  const elementSources: string[] = [];

  if (data.salesPlanSegmento) elementSources.push(String(data.salesPlanSegmento));
  if (data.salesPlanProducts) {
    const prods = String(data.salesPlanProducts);
    if (prods.includes(",")) {
      prods.split(",").slice(0, 3).forEach(p => elementSources.push(p.trim()));
    } else {
      elementSources.push(prods);
    }
  }
  // Add some generic useful ones
  elementSources.push("Pessoas", "Produto", "Ambiente / Cenário", "Fundo abstrato", "Ícones");

  const elements = truncate(unique(elementSources));

  // ── Placeholders ──
  const firstProduct = topics[0] || "seu produto";
  const firstAudience = audiences[0] || "seu público";

  return {
    topics: topics.length > 0 ? topics : GENERIC_TOPICS,
    audiences: audiences.length > 0 ? audiences : GENERIC_AUDIENCES,
    elements: elements.length > 0 ? elements : GENERIC_ELEMENTS,
    topicPlaceholder: `Ex: ${firstProduct}, promoção, lançamento, novidade...`,
    audiencePlaceholder: `Ex: ${firstAudience}, clientes atuais, novos leads...`,
  };
}
