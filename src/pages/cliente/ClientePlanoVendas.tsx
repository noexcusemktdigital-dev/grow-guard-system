import { useState, useMemo } from "react";
import {
  Target, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Lightbulb, TrendingUp, Users, Rocket, RotateCcw, Clock,
  ChevronRight, Activity, Building2, Wallet, DollarSign,
  BarChart3, Handshake, Bot, BookOpen, Send, MessageSquare,
  Layers, ShieldCheck, Save, Plus, Lock, Calendar, Pencil, X,
  Check, HelpCircle, FolderOpen, ChevronDown, Filter, Trash2,
  UserPlus, FileText, Receipt, BarChartHorizontal, Megaphone, Sparkles,
  Phone, Mail, Zap, User, Archive,
} from "lucide-react";
import { useActiveGoals, useHistoricGoals, useGoalMutations } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { GoalCard } from "@/components/metas/GoalCard";
import { GoalProgressRing } from "@/components/metas/GoalProgressRing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiagnosticoTermometro } from "@/components/diagnostico/DiagnosticoTermometro";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════ */

type Answers = Record<string, string | string[] | number>;

interface StrategyQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: "choice" | "multi-choice" | "text";
  options?: { label: string; value: string; icon?: React.ElementType }[];
  placeholder?: string;
  optional?: boolean;
}

interface StrategySection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  questions: StrategyQuestion[];
}

/* ══════════════════════════════════════════════
   METRIC OPTIONS
   ══════════════════════════════════════════════ */
const METRIC_OPTIONS = [
  { value: "revenue", label: "Faturamento" },
  { value: "leads", label: "Leads Gerados" },
  { value: "conversions", label: "Taxa de Conversão" },
  { value: "contracts", label: "Contratos Fechados" },
  { value: "meetings", label: "Reuniões" },
  { value: "avg_ticket", label: "Ticket Médio" },
];

/* ══════════════════════════════════════════════
   DIAGNOSTIC SECTIONS & QUESTIONS (~25 questions in 8 sections)
   ══════════════════════════════════════════════ */

const salesSections: StrategySection[] = [
  {
    id: "negocio", title: "Sobre o Negócio", subtitle: "Contexto básico para entender sua operação",
    icon: Building2,
    questions: [
      {
        id: "segmento", question: "Qual é o segmento da sua empresa?", type: "choice",
        options: [
          { label: "Serviços", value: "servicos" }, { label: "Varejo / Loja", value: "varejo" },
          { label: "Alimentação", value: "alimentacao" }, { label: "Saúde / Estética", value: "saude" },
          { label: "Educação", value: "educacao" }, { label: "Tecnologia", value: "tecnologia" },
          { label: "Indústria", value: "industria" }, { label: "Outro", value: "outro" },
        ],
      },
      {
        id: "modelo_negocio", question: "Qual o modelo de negócio?", type: "choice",
        options: [
          { label: "B2B (empresas)", value: "b2b" }, { label: "B2C (consumidor final)", value: "b2c" },
          { label: "Ambos", value: "ambos" },
        ],
      },
      {
        id: "tempo_mercado", question: "Há quanto tempo está no mercado?", type: "choice",
        options: [
          { label: "Menos de 1 ano", value: "0-1" }, { label: "1 a 3 anos", value: "1-3" },
          { label: "3 a 5 anos", value: "3-5" }, { label: "Mais de 5 anos", value: "5+" },
        ],
      },
      {
        id: "num_funcionarios", question: "Quantos funcionários na empresa?", type: "choice",
        options: [
          { label: "Só eu", value: "1" }, { label: "2 a 5", value: "2-5" },
          { label: "6 a 20", value: "6-20" }, { label: "21 a 50", value: "21-50" },
          { label: "51+", value: "51+" },
        ],
      },
    ],
  },
  {
    id: "financeiro", title: "Financeiro Comercial", subtitle: "Dimensione sua operação comercial",
    icon: Wallet,
    questions: [
      {
        id: "faturamento", question: "Qual o faturamento mensal aproximado?", type: "choice",
        options: [
          { label: "Até R$ 10 mil", value: "0-10k" }, { label: "R$ 10-30 mil", value: "10-30k" },
          { label: "R$ 30-100 mil", value: "30-100k" }, { label: "R$ 100-300 mil", value: "100-300k" },
          { label: "R$ 300 mil+", value: "300k+" },
        ],
      },
      {
        id: "ticket_medio", question: "Qual o ticket médio?", type: "choice",
        options: [
          { label: "Até R$ 200", value: "0-200" }, { label: "R$ 200-1 mil", value: "200-1k" },
          { label: "R$ 1-5 mil", value: "1-5k" }, { label: "R$ 5-15 mil", value: "5-15k" },
          { label: "R$ 15 mil+", value: "15k+" },
        ],
      },
      {
        id: "meta_faturamento", question: "Qual a meta de faturamento mensal?", type: "choice",
        options: [
          { label: "Até R$ 20 mil", value: "0-20k" }, { label: "R$ 20-50 mil", value: "20-50k" },
          { label: "R$ 50-150 mil", value: "50-150k" }, { label: "R$ 150-500 mil", value: "150-500k" },
          { label: "R$ 500 mil+", value: "500k+" },
        ],
      },
      {
        id: "receita_novos", question: "Percentual da receita de novos clientes vs recorrência?", type: "choice",
        options: [
          { label: "90%+ novos", value: "90_novos" }, { label: "70% novos / 30% recorrente", value: "70_30" },
          { label: "50/50", value: "50_50" }, { label: "30% novos / 70% recorrente", value: "30_70" },
        ],
      },
    ],
  },
  {
    id: "equipe", title: "Equipe e Estrutura", subtitle: "Como está sua equipe comercial",
    icon: Users,
    questions: [
      {
        id: "tamanho_equipe", question: "Tamanho da equipe comercial", type: "choice",
        options: [
          { label: "Só eu", value: "1" }, { label: "2-3 pessoas", value: "2-3" },
          { label: "4-7 pessoas", value: "4-7" }, { label: "8-15 pessoas", value: "8-15" },
          { label: "16+", value: "16+" },
        ],
      },
      {
        id: "funcoes_equipe", question: "Quais funções existem na equipe?", type: "multi-choice",
        options: [
          { label: "SDR / Pré-vendas", value: "sdr" }, { label: "Closer / Vendedor", value: "closer" },
          { label: "CS / Pós-venda", value: "cs" }, { label: "Gestor Comercial", value: "gestor" },
          { label: "Nenhuma definida", value: "nenhuma" },
        ],
      },
      {
        id: "processo_documentado", question: "Processo comercial está documentado?", type: "choice",
        options: [
          { label: "Não existe", value: "nao" }, { label: "Parcial / informal", value: "parcial" },
          { label: "Sim, documentado", value: "sim" }, { label: "Sim, com playbook completo", value: "completo" },
        ],
      },
      {
        id: "tempo_fechamento", question: "Tempo médio de fechamento de uma venda?", type: "choice",
        options: [
          { label: "No mesmo dia", value: "mesmo_dia" }, { label: "1 a 7 dias", value: "1-7" },
          { label: "1 a 4 semanas", value: "1-4sem" }, { label: "1 a 3 meses", value: "1-3m" },
          { label: "Mais de 3 meses", value: "3m+" },
        ],
      },
    ],
  },
  {
    id: "leads", title: "Gestão de Leads", subtitle: "Como você gerencia seus leads",
    icon: Target,
    questions: [
      {
        id: "usa_crm", question: "Usa algum CRM atualmente?", type: "choice",
        options: [
          { label: "Não uso nada", value: "nao" }, { label: "Planilha / anotações", value: "planilha" },
          { label: "CRM básico", value: "crm_basico" }, { label: "CRM profissional", value: "crm_pro" },
        ],
      },
      {
        id: "followup", question: "Tem follow-up estruturado?", type: "choice",
        options: [
          { label: "Não faço follow-up", value: "nao" }, { label: "Faço quando lembro", value: "eventual" },
          { label: "Sim, com cadência definida", value: "cadencia" }, { label: "Sim, automatizado", value: "auto" },
        ],
      },
      {
        id: "cadencia_followup", question: "Qual a cadência de follow-up?", type: "choice",
        options: [
          { label: "Não tenho cadência", value: "nenhuma" }, { label: "A cada 7+ dias", value: "7d" },
          { label: "A cada 2-3 dias", value: "2-3d" }, { label: "Diário", value: "diario" },
        ],
      },
      {
        id: "qtd_leads_mes", question: "Quantos leads recebe por mês?", type: "choice",
        options: [
          { label: "0-10", value: "0-10" }, { label: "11-30", value: "11-30" },
          { label: "31-100", value: "31-100" }, { label: "100-500", value: "100-500" },
          { label: "500+", value: "500+" },
        ],
      },
    ],
  },
  {
    id: "canais", title: "Canais e Prospecção", subtitle: "De onde vêm os seus leads",
    icon: Megaphone,
    questions: [
      {
        id: "canais_aquisicao", question: "Quais canais de aquisição usa?", type: "multi-choice",
        options: [
          { label: "Google Ads", value: "google" }, { label: "Instagram", value: "instagram" },
          { label: "Facebook", value: "facebook" }, { label: "LinkedIn", value: "linkedin" },
          { label: "Indicação", value: "indicacao" }, { label: "WhatsApp", value: "whatsapp" },
          { label: "Cold Call", value: "cold_call" }, { label: "Cold Email", value: "cold_email" },
          { label: "Eventos", value: "eventos" }, { label: "Parcerias", value: "parcerias" },
        ],
      },
      {
        id: "canal_principal", question: "Qual o canal que mais gera resultados?", type: "choice",
        options: [
          { label: "Indicação", value: "indicacao" }, { label: "Tráfego pago", value: "trafego" },
          { label: "Prospecção ativa", value: "prospeccao" }, { label: "Redes sociais orgânico", value: "organico" },
          { label: "Não sei", value: "nao_sei" },
        ],
      },
      {
        id: "mede_roi", question: "Mede o ROI por canal?", type: "choice",
        options: [
          { label: "Não meço", value: "nao" }, { label: "Parcialmente", value: "parcial" },
          { label: "Sim, de todos", value: "sim" },
        ],
      },
    ],
  },
  {
    id: "processo", title: "Processo de Vendas", subtitle: "Como você vende",
    icon: Layers,
    questions: [
      {
        id: "usa_scripts", question: "Usa scripts ou roteiros padronizados?", type: "choice",
        options: [
          { label: "Não uso", value: "nao" }, { label: "Tenho mas não sigo", value: "tem_nao_segue" },
          { label: "Sim, parcialmente", value: "parcial" }, { label: "Sim, toda equipe usa", value: "sim" },
        ],
      },
      {
        id: "etapas_funil", question: "Quais etapas do funil utiliza?", type: "multi-choice",
        options: [
          { label: "Prospecção", value: "prospeccao" }, { label: "Qualificação", value: "qualificacao" },
          { label: "Apresentação", value: "apresentacao" }, { label: "Proposta", value: "proposta" },
          { label: "Negociação", value: "negociacao" }, { label: "Fechamento", value: "fechamento" },
          { label: "Não tenho funil definido", value: "nenhum" },
        ],
      },
      {
        id: "reuniao_recorrente", question: "Tem reunião comercial recorrente?", type: "choice",
        options: [
          { label: "Não", value: "nao" }, { label: "Mensal", value: "mensal" },
          { label: "Semanal", value: "semanal" }, { label: "Diária", value: "diaria" },
        ],
      },
    ],
  },
  {
    id: "ferramentas", title: "Ferramentas e Automação", subtitle: "Tecnologia no seu comercial",
    icon: Zap,
    questions: [
      {
        id: "ferramentas_usadas", question: "Quais ferramentas utiliza?", type: "multi-choice",
        options: [
          { label: "CRM", value: "crm" }, { label: "WhatsApp Business", value: "whatsapp" },
          { label: "Email Marketing", value: "email" }, { label: "Telefone", value: "telefone" },
          { label: "Automação (RD, HubSpot)", value: "automacao" }, { label: "Planilhas", value: "planilhas" },
          { label: "Nenhuma", value: "nenhuma" },
        ],
      },
      {
        id: "tem_automacoes", question: "Tem automações ativas no processo comercial?", type: "choice",
        options: [
          { label: "Nenhuma", value: "nao" }, { label: "Poucas (email, lembretes)", value: "poucas" },
          { label: "Sim, várias integradas", value: "sim" },
        ],
      },
      {
        id: "usa_agente_ia", question: "Usa agente de IA para atendimento?", type: "choice",
        options: [
          { label: "Não", value: "nao" }, { label: "Já pensei nisso", value: "pensou" },
          { label: "Sim, básico", value: "basico" }, { label: "Sim, integrado ao CRM", value: "integrado" },
        ],
      },
    ],
  },
  {
    id: "performance", title: "Metas e Performance", subtitle: "Como você controla resultados",
    icon: BarChart3,
    questions: [
      {
        id: "metas_historicas", question: "Suas metas são baseadas em dados históricos?", type: "choice",
        options: [
          { label: "Não tenho metas", value: "nao" }, { label: "Metas por achismo", value: "achismo" },
          { label: "Baseadas em histórico", value: "historico" }, { label: "Com projeções e cenários", value: "projecoes" },
        ],
      },
      {
        id: "conversao_etapa", question: "Acompanha taxa de conversão por etapa do funil?", type: "choice",
        options: [
          { label: "Não acompanho", value: "nao" }, { label: "Apenas conversão geral", value: "geral" },
          { label: "Sim, por etapa", value: "por_etapa" },
        ],
      },
      {
        id: "relatorios", question: "Gera relatórios comerciais periodicamente?", type: "choice",
        options: [
          { label: "Nunca", value: "nunca" }, { label: "Mensal", value: "mensal" },
          { label: "Semanal", value: "semanal" }, { label: "Diário", value: "diario" },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════
   SCORING LOGIC — 5 AXES
   ══════════════════════════════════════════════ */

function computeScores(answers: Answers) {
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
  if (Array.isArray(etapas) && !etapas.includes("nenhum")) scoreMap["Processo"] += Math.min(etapas.length, 3);

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

const niveis = [
  { id: 1, label: "Inicial", cor: "#dc2626", desc: "Seu comercial precisa ser construído do zero. Priorize documentar o processo." },
  { id: 2, label: "Estruturando", cor: "#ea580c", desc: "Algumas bases existem, mas falta consistência e padronização." },
  { id: 3, label: "Escalável", cor: "#eab308", desc: "Estrutura sólida, pronta para escalar com ajustes pontuais." },
  { id: 4, label: "Alta Performance", cor: "#16a34a", desc: "Máquina comercial rodando com previsibilidade e dados." },
];

function getNivel(pct: number) {
  if (pct <= 25) return niveis[0];
  if (pct <= 50) return niveis[1];
  if (pct <= 75) return niveis[2];
  return niveis[3];
}

/* ══════════════════════════════════════════════
   INSIGHTS GENERATOR
   ══════════════════════════════════════════════ */

function generateInsights(answers: Answers, scoreMap: Record<string, number>, maxMap: Record<string, number>) {
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

function getLeadsProjection(pct: number) {
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

function getRevenueProjection(answers: Answers, pct: number) {
  const ticketMap: Record<string, number> = {
    "0-200": 150, "200-1k": 600, "1-5k": 3000, "5-15k": 10000, "15k+": 20000,
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

function generateActionPlan(scoreMap: Record<string, number>, maxMap: Record<string, number>, answers: Answers) {
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

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */

export default function ClientePlanoVendas() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("diagnostico");

  // ── Diagnostic state ──
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => {
    const saved = localStorage.getItem("plano_vendas_data");
    return saved ? JSON.parse(saved) : {};
  });
  const [completed, setCompleted] = useState(() => {
    return !!localStorage.getItem("plano_vendas_data") && Object.keys(JSON.parse(localStorage.getItem("plano_vendas_data") || "{}")).length > 5;
  });

  // ── Metas state (real data) ──
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
  const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anoAtual = new Date().getFullYear();
  const { data: activeGoals, isLoading: goalsLoading } = useActiveGoals(scopeFilter);
  const { data: historicGoals } = useHistoricGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { createGoal, archiveGoal } = useGoalMutations();
  const { data: teams } = useCrmTeams();

  // ── History state ──
  const [history] = useState([
    { date: "2026-01-15", score: 32, nivel: "Inicial" },
    { date: "2026-02-10", score: 48, nivel: "Estruturando" },
  ]);

  const section = salesSections[currentSection];
  const totalSections = salesSections.length;
  const progressPct = ((currentSection + 1) / totalSections) * 100;

  const visibleQuestions = useMemo(() => {
    if (!section) return [];
    return section.questions;
  }, [section]);

  const { scoreMap, maxMap, radarData, percentage } = useMemo(() => computeScores(answers), [answers]);
  const nivel = getNivel(percentage);
  const insights = useMemo(() => generateInsights(answers, scoreMap, maxMap), [answers, scoreMap, maxMap]);
  const leadsProjection = useMemo(() => getLeadsProjection(percentage), [percentage]);
  const revenueProjection = useMemo(() => getRevenueProjection(answers, percentage), [answers, percentage]);
  const actionPlan = useMemo(() => generateActionPlan(scoreMap, maxMap, answers), [scoreMap, maxMap, answers]);

  const canGoNext = () => {
    return visibleQuestions.every(q => {
      if (q.optional) return true;
      const val = answers[q.id];
      if (q.type === "text") return !!val && String(val).length > 0;
      if (q.type === "multi-choice") return Array.isArray(val) && val.length > 0;
      return !!val;
    });
  };

  const handleNext = () => {
    if (currentSection < totalSections - 1) setCurrentSection(currentSection + 1);
    else {
      setCompleted(true);
      localStorage.setItem("plano_vendas_data", JSON.stringify(answers));
    }
  };
  const handlePrev = () => { if (currentSection > 0) setCurrentSection(currentSection - 1); };

  const handleChoiceSelect = (qId: string, value: string) => setAnswers(prev => ({ ...prev, [qId]: value }));
  const handleMultiChoiceToggle = (qId: string, value: string) => {
    setAnswers(prev => {
      const current = (prev[qId] as string[]) || [];
      if (current.includes(value)) return { ...prev, [qId]: current.filter(v => v !== value) };
      return { ...prev, [qId]: [...current, value] };
    });
  };
  const handleTextChange = (qId: string, val: string) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const handleRestart = () => {
    setAnswers({}); setCurrentSection(0); setCompleted(false);
    localStorage.removeItem("plano_vendas_data");
  };

  /* ── Render Question ── */
  const renderQuestion = (q: StrategyQuestion) => (
    <div key={q.id} className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{q.question}</p>
        {q.subtitle && <p className="text-xs text-muted-foreground">{q.subtitle}</p>}
        {q.optional && <span className="text-[10px] text-muted-foreground italic ml-1">(opcional)</span>}
      </div>

      {q.type === "choice" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {q.options?.map(opt => {
            const selected = answers[q.id] === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => handleChoiceSelect(q.id, opt.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200
                  ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}
              >
                {Icon && <Icon className={`w-4 h-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />}
                <span className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "multi-choice" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {q.options?.map(opt => {
            const arr = (answers[q.id] as string[]) || [];
            const selected = arr.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleMultiChoiceToggle(q.id, opt.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200
                  ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}
              >
                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                  ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                  {selected && <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <span className={`text-xs ${selected ? "font-medium text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {q.type === "text" && (
        <Input
          value={(answers[q.id] as string) || ""}
          onChange={e => handleTextChange(q.id, e.target.value)}
          placeholder={q.placeholder}
          className="text-sm"
        />
      )}
    </div>
  );

  /* ── METAS: Add Meta (real) ── */
  const handleAddMeta = () => {
    if (!novaMeta.title || novaMeta.target_value <= 0 || !novaMeta.mesRef) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const [y, m] = novaMeta.mesRef.split("-").map(Number);
    const periodStart = new Date(y, m - 1, 1).toISOString();
    const periodEnd = new Date(y, m, 0, 23, 59, 59).toISOString();
    createGoal.mutate({
      title: novaMeta.title,
      target_value: novaMeta.target_value,
      metric: novaMeta.metric,
      scope: novaMeta.scope,
      priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : undefined,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : undefined,
      period_start: periodStart,
      period_end: periodEnd,
      status: "active",
    }, {
      onSuccess: () => {
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setNovaMetaOpen(false);
        toast({ title: "Meta criada com sucesso!" });
      },
    });
  };

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Plano de Vendas"
        subtitle="Consultoria comercial interativa para diagnosticar e evoluir seu comercial"
        icon={<Target className="w-5 h-5 text-primary" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="diagnostico" className="text-xs gap-1.5"><Activity className="w-3.5 h-3.5" /> Diagnóstico</TabsTrigger>
          <TabsTrigger value="metas" className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> Minhas Metas</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><Clock className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ═══════ DIAGNÓSTICO ═══════ */}
        <TabsContent value="diagnostico" className="mt-4">
          {!completed ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {section && <section.icon className="w-4 h-4 text-primary" />}
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {section?.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {currentSection + 1} de {totalSections}
                  </span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={section?.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Card className="glass-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                    <CardContent className="py-6 px-6 md:px-10 space-y-6">
                      <div>
                        <h2 className="text-lg font-black tracking-tight">{section?.title}</h2>
                        <p className="text-sm text-muted-foreground">{section?.subtitle}</p>
                      </div>
                      {visibleQuestions.map(renderQuestion)}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={handlePrev} disabled={currentSection === 0} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
                <Button onClick={handleNext} disabled={!canGoNext()} className="gap-2">
                  {currentSection === totalSections - 1 ? "Ver Resultado" : "Próximo"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* ── RESULT ── */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">SEU DIAGNÓSTICO COMERCIAL</p>
                  <p className="text-sm text-muted-foreground">Resultado baseado nas suas respostas</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRestart} className="gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Refazer
                </Button>
              </div>

              {/* Termômetro + Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DiagnosticoTermometro pontuacao={percentage} nivel={nivel} />
                <Card className="glass-card">
                  <CardContent className="py-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">RADAR POR ÁREA — 5 EIXOS</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="65%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">INSIGHTS E RECOMENDAÇÕES</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((ins, i) => (
                    <Card key={i} className={`border-l-4 ${
                      ins.type === "success" ? "border-l-emerald-500" :
                      ins.type === "warning" ? "border-l-destructive" : "border-l-primary"
                    }`}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                            ins.type === "success" ? "text-emerald-500" :
                            ins.type === "warning" ? "text-destructive" : "text-primary"
                          }`} />
                          <p className="text-sm flex-1">{ins.text}</p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={() => navigate(ins.path)}>
                            {ins.cta} <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Plano de Ação */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">PLANO DE AÇÃO EM 3 FASES</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {actionPlan.map(fase => (
                    <Card key={fase.fase} className="glass-card overflow-hidden">
                      <div className="h-1" style={{ background: fase.cor }} />
                      <CardContent className="py-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold">{fase.fase}</p>
                          <Badge variant="outline" className="text-[9px]">{fase.periodo}</Badge>
                        </div>
                        <ul className="space-y-2">
                          {fase.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Projeção Leads */}
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">PROJEÇÃO DE LEADS</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Sem Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={leadsProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...leadsProjection.map(d => d.comEstrategia))]} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted) / 0.3)" strokeWidth={2} name="Cenário Atual" strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary mb-2">Com Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={leadsProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...leadsProjection.map(d => d.comEstrategia))]} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} name="Com Estratégia" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projeção Receita */}
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">PROJEÇÃO DE RECEITA</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Sem Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...revenueProjection.map(d => d.comEstrategia))]} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]} />
                            <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted) / 0.3)" strokeWidth={2} name="Cenário Atual" strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-500 mb-2">Com Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...revenueProjection.map(d => d.comEstrategia))]} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]} />
                            <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3) / 0.1)" strokeWidth={2} name="Com Estratégia" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══════ METAS ═══════ */}
        <TabsContent value="metas" className="mt-4 space-y-6">
          {/* Header with scope filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">MINHAS METAS · {MESES_COMPLETOS[new Date().getMonth()]} {anoAtual}</p>
              <p className="text-sm text-muted-foreground">Acompanhe suas metas com dados reais do CRM</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex bg-secondary rounded-lg p-0.5">
                {[
                  { value: "all", label: "Todas", icon: Target },
                  { value: "company", label: "Empresa", icon: Building2 },
                  { value: "team", label: "Equipe", icon: Users },
                  { value: "individual", label: "Individual", icon: User },
                ].map(f => (
                  <button key={f.value} onClick={() => setScopeFilter(f.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${scopeFilter === f.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    <f.icon className="w-3 h-3" /> {f.label}
                  </button>
                ))}
              </div>
              <Button size="sm" className="gap-1" onClick={() => setNovaMetaOpen(true)}>
                <Plus className="w-3 h-3" /> Nova Meta
              </Button>
            </div>
          </div>

          {/* KPI Summary */}
          {activeGoals && activeGoals.length > 0 && goalProgress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const progValues = Object.values(goalProgress);
                const total = activeGoals.length;
                const achieved = progValues.filter(p => p.percent >= 100).length;
                const avgPct = progValues.length > 0 ? Math.round(progValues.reduce((s, p) => s + Math.min(p.percent, 100), 0) / progValues.length) : 0;
                const highPriority = activeGoals.filter(g => g.priority === "alta").length;
                return [
                  { label: "Metas Ativas", value: total, icon: Target, color: "text-primary" },
                  { label: "Batidas", value: achieved, icon: CheckCircle2, color: "text-emerald-500" },
                  { label: "Progresso Médio", value: `${avgPct}%`, icon: TrendingUp, color: "text-amber-500" },
                  { label: "Alta Prioridade", value: highPriority, icon: AlertCircle, color: "text-destructive" },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                      <div>
                        <p className="text-lg font-bold tabular-nums">{kpi.value}</p>
                        <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          )}

          {/* Goals List */}
          {goalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Card key={i}><CardContent className="h-40 animate-pulse bg-muted rounded" /></Card>)}
            </div>
          ) : !activeGoals?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Nenhuma meta ativa</p>
                <p className="text-xs text-muted-foreground mt-1">Crie metas integradas ao CRM para acompanhar seu desempenho.</p>
                <Button size="sm" variant="outline" className="mt-4 gap-1" onClick={() => setNovaMetaOpen(true)}>
                  <Plus className="w-3 h-3" /> Criar primeira meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  progress={goalProgress?.[goal.id]}
                  onEdit={() => { /* TODO: edit dialog */ }}
                  onArchive={() => archiveGoal.mutate(goal.id)}
                />
              ))}
            </div>
          )}

          {/* Historic Goals */}
          {historicGoals && historicGoals.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
                <ChevronDown className="w-4 h-4" />
                Histórico de Metas ({historicGoals.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {historicGoals.map(goal => {
                  const pct = goal.target_value > 0 ? Math.round(((goal.current_value || 0) / goal.target_value) * 100) : 0;
                  const achieved = pct >= 100;
                  return (
                    <Card key={goal.id} className="opacity-70">
                      <CardContent className="py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GoalProgressRing percent={Math.min(pct, 100)} size={36} strokeWidth={3} />
                          <div>
                            <p className="text-xs font-medium">{goal.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {goal.period_start && new Date(goal.period_start).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${achieved ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"}`}>
                          {achieved ? "Batida" : `${pct}%`}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Dialog: Nova Meta */}
          <Dialog open={novaMetaOpen} onOpenChange={setNovaMetaOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="text-base">Nova Meta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da meta</Label>
                  <Input value={novaMeta.title} onChange={e => setNovaMeta(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Faturar R$ 50 mil em março" className="text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Métrica</Label>
                    <Select value={novaMeta.metric} onValueChange={v => setNovaMeta(p => ({ ...p, metric: v }))}>
                      <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {METRIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mês de referência</Label>
                    <Select value={novaMeta.mesRef} onValueChange={v => setNovaMeta(p => ({ ...p, mesRef: v }))}>
                      <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {MESES_COMPLETOS.map((m, i) => (
                          <SelectItem key={i} value={`${anoAtual}-${String(i + 1).padStart(2, "0")}`}>{m} {anoAtual}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor alvo</Label>
                    <Input type="number" value={novaMeta.target_value || ""} onChange={e => setNovaMeta(p => ({ ...p, target_value: Number(e.target.value) }))} className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prioridade</Label>
                    <Select value={novaMeta.priority} onValueChange={v => setNovaMeta(p => ({ ...p, priority: v }))}>
                      <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Escopo</Label>
                  <Select value={novaMeta.scope} onValueChange={v => setNovaMeta(p => ({ ...p, scope: v }))}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Empresa (toda a organização)</SelectItem>
                      <SelectItem value="team">Equipe (time específico)</SelectItem>
                      <SelectItem value="individual">Individual (pessoa específica)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {novaMeta.scope === "team" && teams && teams.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Time</Label>
                    <Select value={novaMeta.team_id} onValueChange={v => setNovaMeta(p => ({ ...p, team_id: v }))}>
                      <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione o time" /></SelectTrigger>
                      <SelectContent>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button className="w-full gap-1" onClick={handleAddMeta} disabled={createGoal.isPending}>
                  <Plus className="w-3 h-3" /> {createGoal.isPending ? "Criando..." : "Criar Meta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════ HISTÓRICO ═══════ */}
        <TabsContent value="historico" className="mt-4 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">HISTÓRICO DE DIAGNÓSTICOS</p>
            <p className="text-sm text-muted-foreground">Acompanhe sua evolução comercial ao longo do tempo</p>
          </div>

          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Nenhum diagnóstico realizado</p>
                <p className="text-xs text-muted-foreground mt-1">Complete o diagnóstico para ver seu histórico aqui.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setActiveTab("diagnostico")}>
                  Iniciar Diagnóstico
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => {
                const nv = getNivel(h.score);
                return (
                  <Card key={i} className="glass-card">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: nv.cor }}>
                          {h.score}%
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{h.nivel}</p>
                          <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: nv.cor, color: nv.cor }}>
                        {h.nivel}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
