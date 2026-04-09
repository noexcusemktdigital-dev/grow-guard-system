// @ts-nocheck
import { AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import type { Answers } from "./ClientePlanoVendasData";

/* ══════════════════════════════════════════════
   SCORING LOGIC — 5 AXES
   ══════════════════════════════════════════════ */

export function computeScores(answers: Answers) {
  const scoreMap: Record<string, number> = {
    "Processo": 0, "Gestão de Leads": 0, "Ferramentas": 0, "Canais": 0, "Performance": 0,
  };
  const maxMap: Record<string, number> = {
    "Processo": 12, "Gestão de Leads": 12, "Ferramentas": 9, "Canais": 9, "Performance": 9,
  };

  // Processo
  const proc = answers.processo_documentado as string;
  if (proc === "completo") scoreMap["Processo"] += 3;
  else if (proc === "sim") scoreMap["Processo"] += 2;
  else if (proc === "parcial") scoreMap["Processo"] += 1;

  const scripts = answers.usa_scripts as string;
  if (scripts === "sim") scoreMap["Processo"] += 3;
  else if (scripts === "parcial") scoreMap["Processo"] += 2;
  else if (scripts === "tem_nao_segue") scoreMap["Processo"] += 1;

  const etapas = answers.etapas_funil;
  if (typeof etapas === "string" && etapas.trim().length > 0) {
    const parsed = etapas.split(/→|->|,|\n/).map(s => s.trim()).filter(Boolean);
    scoreMap["Processo"] += Math.min(parsed.length, 3);
  } else if (Array.isArray(etapas) && !etapas.includes("nenhum")) {
    scoreMap["Processo"] += Math.min(etapas.length, 3);
  }

  const reuniao = answers.reuniao_recorrente as string;
  if (reuniao === "diaria") scoreMap["Processo"] += 3;
  else if (reuniao === "semanal") scoreMap["Processo"] += 2;
  else if (reuniao === "mensal") scoreMap["Processo"] += 1;

  // Gestão de Leads
  const crm = answers.usa_crm as string;
  if (crm === "crm_pro") scoreMap["Gestão de Leads"] += 3;
  else if (crm === "crm_basico") scoreMap["Gestão de Leads"] += 2;
  else if (crm === "planilha") scoreMap["Gestão de Leads"] += 1;

  const followup = answers.followup as string;
  if (followup === "auto") scoreMap["Gestão de Leads"] += 3;
  else if (followup === "cadencia") scoreMap["Gestão de Leads"] += 2;
  else if (followup === "eventual") scoreMap["Gestão de Leads"] += 1;

  const cadencia = answers.cadencia_followup as string;
  if (cadencia === "diario") scoreMap["Gestão de Leads"] += 3;
  else if (cadencia === "2-3d") scoreMap["Gestão de Leads"] += 2;
  else if (cadencia === "7d") scoreMap["Gestão de Leads"] += 1;

  const qtdLeads = answers.qtd_leads_mes as string;
  if (qtdLeads === "500+") scoreMap["Gestão de Leads"] += 3;
  else if (qtdLeads === "100-500") scoreMap["Gestão de Leads"] += 2;
  else if (qtdLeads === "31-100") scoreMap["Gestão de Leads"] += 1;

  // Ferramentas
  const ferramentas = answers.ferramentas_usadas;
  if (Array.isArray(ferramentas) && !ferramentas.includes("nenhuma")) scoreMap["Ferramentas"] += Math.min(ferramentas.length, 3);

  const automacoes = answers.tem_automacoes as string;
  if (automacoes === "sim") scoreMap["Ferramentas"] += 3;
  else if (automacoes === "poucas") scoreMap["Ferramentas"] += 1;

  const ia = answers.usa_agente_ia as string;
  if (ia === "integrado") scoreMap["Ferramentas"] += 3;
  else if (ia === "basico") scoreMap["Ferramentas"] += 2;
  else if (ia === "pensou") scoreMap["Ferramentas"] += 1;

  // Canais
  const canais = answers.canais_aquisicao;
  if (Array.isArray(canais)) scoreMap["Canais"] += Math.min(canais.length, 3);

  const roi = answers.mede_roi as string;
  if (roi === "sim") scoreMap["Canais"] += 3;
  else if (roi === "parcial") scoreMap["Canais"] += 1;

  if (answers.canal_principal && answers.canal_principal !== "nao_sei") scoreMap["Canais"] += 3;

  // Performance
  const metas = answers.metas_historicas as string;
  if (metas === "projecoes") scoreMap["Performance"] += 3;
  else if (metas === "historico") scoreMap["Performance"] += 2;
  else if (metas === "achismo") scoreMap["Performance"] += 1;

  const convEtapa = answers.conversao_etapa as string;
  if (convEtapa === "por_etapa") scoreMap["Performance"] += 3;
  else if (convEtapa === "geral") scoreMap["Performance"] += 1;

  const relat = answers.relatorios as string;
  if (relat === "diario") scoreMap["Performance"] += 3;
  else if (relat === "semanal") scoreMap["Performance"] += 2;
  else if (relat === "mensal") scoreMap["Performance"] += 1;

  const totalMax = Object.values(maxMap).reduce((a, b) => a + b, 0);
  const totalScore = Object.values(scoreMap).reduce((a, b) => a + b, 0);
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const radarData = Object.keys(scoreMap).map(k => ({
    category: k,
    value: maxMap[k] > 0 ? Math.round((scoreMap[k] / maxMap[k]) * 100) : 0,
  }));

  return { scoreMap, maxMap, radarData, percentage };
}

/* ══════════════════════════════════════════════
   INSIGHTS GENERATOR
   ══════════════════════════════════════════════ */

export function generateInsights(answers: Answers, scoreMap: Record<string, number>, maxMap: Record<string, number>) {
  const insights: { text: string; type: "success" | "warning" | "opportunity"; icon: React.ElementType; path: string; cta: string }[] = [];
  const pct = (k: string) => maxMap[k] > 0 ? (scoreMap[k] / maxMap[k]) * 100 : 0;

  if (pct("Gestão de Leads") < 50)
    insights.push({ text: "Implante um CRM para controlar seus leads, pipeline e histórico de interações.", type: "warning", icon: AlertCircle, path: "/cliente/crm", cta: "Acessar CRM" });
  else
    insights.push({ text: "Boa gestão de leads! Continue otimizando seu CRM e cadências de follow-up.", type: "success", icon: CheckCircle2, path: "/cliente/crm", cta: "Ver CRM" });

  if (pct("Processo") < 50)
    insights.push({ text: "Crie scripts padronizados para sua equipe. Consistência aumenta a conversão.", type: "opportunity", icon: Lightbulb, path: "/cliente/scripts", cta: "Criar Scripts" });

  if (pct("Ferramentas") < 50)
    insights.push({ text: "Configure um agente de IA para qualificar leads e responder automaticamente.", type: "opportunity", icon: Lightbulb, path: "/cliente/agentes-ia", cta: "Configurar Agente IA" });

  if (pct("Canais") < 50)
    insights.push({ text: "Estruture follow-ups automáticos e diversifique seus canais de prospecção.", type: "warning", icon: AlertCircle, path: "/cliente/disparos", cta: "Configurar Disparos" });

  if (answers.usa_crm === "nao" || answers.usa_crm === "planilha")
    insights.push({ text: "Sem CRM, você perde visibilidade do pipeline. Centralize tudo em um só lugar.", type: "warning", icon: AlertCircle, path: "/cliente/crm", cta: "Implantar CRM" });

  if (answers.usa_scripts === "nao")
    insights.push({ text: "Sem scripts, cada vendedor aborda de forma diferente. Padronize a comunicação.", type: "opportunity", icon: Lightbulb, path: "/cliente/scripts", cta: "Criar Scripts" });

  if (answers.usa_agente_ia === "nao" || answers.usa_agente_ia === "pensou")
    insights.push({ text: "IA pode qualificar leads 24h e acelerar o tempo de resposta. Configure seu agente.", type: "opportunity", icon: Lightbulb, path: "/cliente/agentes-ia", cta: "Configurar IA" });

  if (pct("Performance") >= 70)
    insights.push({ text: "Seu controle de performance está avançado. Foque em escalar com previsibilidade.", type: "success", icon: CheckCircle2, path: "/cliente/dashboard", cta: "Ver Relatórios" });

  return insights.slice(0, 6);
}

/* ══════════════════════════════════════════════
   PROJECTIONS
   ══════════════════════════════════════════════ */

export function getLeadsProjection(pct: number) {
  const base = Math.round(pct * 0.5);
  return [
    { mes: "Mês 1", atual: base, comEstrategia: base + 8 },
    { mes: "Mês 2", atual: base + 2, comEstrategia: base + 20 },
    { mes: "Mês 3", atual: base + 4, comEstrategia: base + 38 },
    { mes: "Mês 4", atual: base + 5, comEstrategia: base + 60 },
    { mes: "Mês 5", atual: base + 6, comEstrategia: base + 85 },
    { mes: "Mês 6", atual: base + 7, comEstrategia: base + 115 },
  ];
}

export function getRevenueProjection(answers: Answers, pct: number) {
  const ticketMap: Record<string, number> = {
    "0-200": 150, "200-1k": 600, "1-5k": 3000, "5-15k": 10000,
    "15-50k": 30000, "50-150k": 90000, "150k+": 200000, "15k+": 20000,
  };
  const ticket = ticketMap[answers.ticket_medio as string] || 600;
  const conv = 0.1;
  const baseLeads = Math.round(pct * 0.5);

  return [
    { mes: "Mês 1", atual: Math.round(baseLeads * conv * ticket), comEstrategia: Math.round((baseLeads + 8) * conv * ticket * 1.1) },
    { mes: "Mês 2", atual: Math.round((baseLeads + 2) * conv * ticket), comEstrategia: Math.round((baseLeads + 20) * conv * ticket * 1.15) },
    { mes: "Mês 3", atual: Math.round((baseLeads + 4) * conv * ticket), comEstrategia: Math.round((baseLeads + 38) * conv * ticket * 1.2) },
    { mes: "Mês 4", atual: Math.round((baseLeads + 5) * conv * ticket), comEstrategia: Math.round((baseLeads + 60) * conv * ticket * 1.25) },
    { mes: "Mês 5", atual: Math.round((baseLeads + 6) * conv * ticket), comEstrategia: Math.round((baseLeads + 85) * conv * ticket * 1.3) },
    { mes: "Mês 6", atual: Math.round((baseLeads + 7) * conv * ticket), comEstrategia: Math.round((baseLeads + 115) * conv * ticket * 1.35) },
  ];
}

/* ══════════════════════════════════════════════
   ACTION PLAN
   ══════════════════════════════════════════════ */

export function generateActionPlan(scoreMap: Record<string, number>, maxMap: Record<string, number>, answers: Answers) {
  const pct = (k: string) => maxMap[k] > 0 ? (scoreMap[k] / maxMap[k]) * 100 : 0;
  const fase1: string[] = [];
  const fase2: string[] = [];
  const fase3: string[] = [];

  fase1.push("Documentar processo comercial e etapas do funil");
  if (pct("Gestão de Leads") < 50) fase1.push("Implantar CRM e migrar base de leads");
  if (pct("Processo") < 50) fase1.push("Criar scripts de abordagem e qualificação");
  if (answers.followup === "nao" || answers.followup === "eventual") fase1.push("Definir cadência de follow-up");
  if (fase1.length < 3) fase1.push("Mapear jornada do cliente e pontos de contato");

  fase2.push("Configurar agente de IA para qualificação automática");
  if (pct("Canais") < 50) fase2.push("Diversificar canais de aquisição de leads");
  fase2.push("Implementar automações de follow-up e nutrição");
  if (answers.reuniao_recorrente === "nao") fase2.push("Estabelecer reunião comercial semanal");
  if (fase2.length < 3) fase2.push("Treinar equipe com scripts e playbook");

  fase3.push("Otimizar funil com base em dados de conversão por etapa");
  if (pct("Performance") < 50) fase3.push("Implantar relatórios semanais de performance");
  fase3.push("Escalar investimento nos canais com melhor ROI");
  fase3.push("Integrar CRM com agente de IA e automações");

  return [
    { fase: "Fase 1 — Estruturação", periodo: "Mês 1-2", cor: "hsl(var(--primary))", items: fase1.slice(0, 5) },
    { fase: "Fase 2 — Otimização", periodo: "Mês 3-4", cor: "hsl(var(--chart-2))", items: fase2.slice(0, 5) },
    { fase: "Fase 3 — Escala", periodo: "Mês 5-6", cor: "hsl(var(--chart-3))", items: fase3.slice(0, 5) },
  ];
}
