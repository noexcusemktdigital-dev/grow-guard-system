
interface StrategyData {
  hasStrategy: boolean;
  personaName?: string | null;
  publicoAlvo?: string | null;
  dores?: string[];
  desejos?: string[];
  objecoes?: string[];
  gatilhosCompra?: string[];
  propostaValor?: any;
  tomPrincipal?: string | null;
  personalidadeMarca?: string[];
  palavrasUsar?: string[];
  palavrasEvitar?: string[];
  pilares?: any[];
  canaisPrioritarios?: any[];
  funil?: any;
  salesPlanProducts?: string | null;
  salesPlanDiferenciais?: string | null;
  salesPlanDorPrincipal?: string | null;
  salesPlanSegmento?: string | null;
  salesPlanTicketMedio?: string | null;
  salesPlanModeloNegocio?: string | null;
  estrategiasVendas?: any[];
  planoAcaoComercial?: any[];
  [key: string]: any;
}

function safe(v: any, max = 60): string {
  if (!v) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function listFirst(arr: any[], n = 3): string {
  if (!arr?.length) return "";
  return arr.slice(0, n).map(i => typeof i === "string" ? i : i?.nome || i?.name || i?.titulo || JSON.stringify(i)).join(", ");
}

export function getPersonalizedTips(slug: string, data: StrategyData): string[] {
  if (!data?.hasStrategy) return [];
  const tips: string[] = [];

  switch (slug) {
    case "crm": {
      if (data.salesPlanTicketMedio) {
        tips.push(`Com ticket médio de ${safe(data.salesPlanTicketMedio)}, qualifique bem cada lead antes de avançar no funil.`);
      }
      if (data.salesPlanSegmento) {
        tips.push(`No segmento "${safe(data.salesPlanSegmento)}", personalize as etapas do funil para o ciclo de compra do seu cliente.`);
      }
      if (data.dores?.length) {
        tips.push(`Use as dores do seu público como critério de qualificação: ${listFirst(data.dores, 2)}.`);
      }
      if (data.objecoes?.length) {
        tips.push(`Prepare respostas para as objeções mais comuns: ${listFirst(data.objecoes, 2)}.`);
      }
      if (data.gatilhosCompra?.length) {
        tips.push(`Fique atento aos gatilhos de compra: ${listFirst(data.gatilhosCompra, 2)}.`);
      }
      break;
    }

    case "scripts": {
      if (data.dores?.length) {
        tips.push(`Crie scripts de prospecção abordando a dor: "${safe(data.dores[0])}".`);
      }
      if (data.tomPrincipal) {
        tips.push(`Mantenha o tom "${safe(data.tomPrincipal)}" em todos os scripts para consistência da marca.`);
      }
      if (data.propostaValor) {
        const pv = typeof data.propostaValor === "string" ? data.propostaValor : data.propostaValor?.resumo || data.propostaValor?.principal;
        if (pv) tips.push(`Inclua sua proposta de valor nos scripts: "${safe(pv)}".`);
      }
      if (data.objecoes?.length) {
        tips.push(`Prepare scripts de contorno para: ${listFirst(data.objecoes, 3)}.`);
      }
      if (data.salesPlanDiferenciais) {
        tips.push(`Destaque seus diferenciais: "${safe(data.salesPlanDiferenciais)}".`);
      }
      break;
    }

    case "conteudos": {
      if (data.pilares?.length) {
        const nomes = data.pilares.map(p => p?.nome || p?.name || p).filter(Boolean);
        if (nomes.length) tips.push(`Produza conteúdo dentro dos seus pilares: ${listFirst(nomes, 3)}.`);
      }
      if (data.canaisPrioritarios?.length) {
        const canais = data.canaisPrioritarios.map(c => c?.canal || c?.name || c).filter(Boolean);
        if (canais.length) tips.push(`Priorize conteúdo para: ${listFirst(canais, 2)}.`);
      }
      if (data.palavrasUsar?.length) {
        tips.push(`Use as palavras-chave: ${listFirst(data.palavrasUsar, 4)}.`);
      }
      if (data.palavrasEvitar?.length) {
        tips.push(`Evite na comunicação: ${listFirst(data.palavrasEvitar, 3)}.`);
      }
      if (data.personaName) {
        tips.push(`Direcione o conteúdo para "${safe(data.personaName)}" — sua persona principal.`);
      }
      break;
    }

    case "artes": {
      if (data.personalidadeMarca?.length) {
        tips.push(`Reflita a personalidade da marca nas artes: ${listFirst(data.personalidadeMarca, 3)}.`);
      }
      if (data.tomPrincipal) {
        tips.push(`O visual deve transmitir o tom "${safe(data.tomPrincipal)}" da sua marca.`);
      }
      if (data.palavrasUsar?.length) {
        tips.push(`Use chamadas com as palavras: ${listFirst(data.palavrasUsar, 3)}.`);
      }
      if (data.desejos?.length) {
        tips.push(`Conecte as artes aos desejos do público: ${listFirst(data.desejos, 2)}.`);
      }
      break;
    }

    case "sites": {
      if (data.propostaValor) {
        const pv = typeof data.propostaValor === "string" ? data.propostaValor : data.propostaValor?.resumo || data.propostaValor?.principal;
        if (pv) tips.push(`Destaque sua proposta de valor no hero: "${safe(pv)}".`);
      }
      if (data.publicoAlvo) {
        tips.push(`Direcione a landing page para: "${safe(data.publicoAlvo)}".`);
      }
      if (data.dores?.length) {
        tips.push(`Aborde as dores do público na seção de benefícios: ${listFirst(data.dores, 2)}.`);
      }
      if (data.objecoes?.length) {
        tips.push(`Inclua uma seção de FAQ quebrando objeções: ${listFirst(data.objecoes, 2)}.`);
      }
      if (data.salesPlanDiferenciais) {
        tips.push(`Mostre seus diferenciais competitivos: "${safe(data.salesPlanDiferenciais)}".`);
      }
      break;
    }

    case "trafego": {
      if (data.objecoes?.length) {
        tips.push(`Quebre a objeção "${safe(data.objecoes[0])}" nos seus anúncios.`);
      }
      if (data.salesPlanTicketMedio) {
        tips.push(`Com ticket de ${safe(data.salesPlanTicketMedio)}, invista em campanhas de consideração antes da conversão.`);
      }
      if (data.gatilhosCompra?.length) {
        tips.push(`Use gatilhos de compra nos copies: ${listFirst(data.gatilhosCompra, 2)}.`);
      }
      if (data.personaName) {
        tips.push(`Segmente seus anúncios para o perfil de "${safe(data.personaName)}".`);
      }
      if (data.canaisPrioritarios?.length) {
        const canais = data.canaisPrioritarios.map(c => c?.canal || c?.name || c).filter(Boolean);
        if (canais.length) tips.push(`Concentre investimento nos canais: ${listFirst(canais, 2)}.`);
      }
      break;
    }

    case "agentes-ia": {
      if (data.salesPlanProducts) {
        tips.push(`Configure a base de conhecimento do agente com: "${safe(data.salesPlanProducts)}".`);
      }
      if (data.tomPrincipal) {
        tips.push(`Defina a personalidade do agente com tom "${safe(data.tomPrincipal)}".`);
      }
      if (data.dores?.length) {
        tips.push(`Treine o agente para identificar e abordar: ${listFirst(data.dores, 2)}.`);
      }
      if (data.objecoes?.length) {
        tips.push(`Programe respostas automáticas para objeções: ${listFirst(data.objecoes, 2)}.`);
      }
      break;
    }

    case "disparos": {
      if (data.personaName) {
        tips.push(`Segmente seus disparos para o perfil de "${safe(data.personaName)}".`);
      }
      if (data.gatilhosCompra?.length) {
        tips.push(`Use gatilhos de compra nas mensagens: ${listFirst(data.gatilhosCompra, 2)}.`);
      }
      if (data.tomPrincipal) {
        tips.push(`Mantenha o tom "${safe(data.tomPrincipal)}" nos disparos.`);
      }
      if (data.desejos?.length) {
        tips.push(`Conecte a mensagem aos desejos: ${listFirst(data.desejos, 2)}.`);
      }
      break;
    }

    case "chat": {
      if (data.tomPrincipal) {
        tips.push(`Mantenha o tom "${safe(data.tomPrincipal)}" nas respostas do WhatsApp.`);
      }
      if (data.personalidadeMarca?.length) {
        tips.push(`Transmita a personalidade: ${listFirst(data.personalidadeMarca, 3)}.`);
      }
      if (data.salesPlanProducts) {
        tips.push(`Tenha à mão informações sobre: "${safe(data.salesPlanProducts)}".`);
      }
      break;
    }

    case "checklist":
    case "gamificacao": {
      if (data.estrategiasVendas?.length) {
        const acoes = data.estrategiasVendas.map(e => e?.titulo || e?.name || e).filter(Boolean);
        if (acoes.length) tips.push(`Foque nas ações estratégicas: ${listFirst(acoes, 3)}.`);
      }
      if (data.planoAcaoComercial?.length) {
        const acoes = data.planoAcaoComercial.map(a => a?.acao || a?.titulo || a).filter(Boolean);
        if (acoes.length) tips.push(`Inclua no checklist: ${listFirst(acoes, 3)}.`);
      }
      if (data.salesPlanDorPrincipal) {
        tips.push(`Priorize ações que resolvem: "${safe(data.salesPlanDorPrincipal)}".`);
      }
      break;
    }

    default: {
      if (data.tomPrincipal) {
        tips.push(`Mantenha o tom "${safe(data.tomPrincipal)}" em tudo que produzir aqui.`);
      }
      if (data.personaName) {
        tips.push(`Direcione para sua persona: "${safe(data.personaName)}".`);
      }
      if (data.dores?.length) {
        tips.push(`Lembre das dores do seu público: ${listFirst(data.dores, 2)}.`);
      }
    }
  }

  return tips.slice(0, 5);
}
