import { useState, useMemo, useEffect } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
// ChatBriefing integration
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, RAFAEL_STEPS } from "@/components/cliente/briefingAgents";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiagnosticoTermometro } from "@/components/diagnostico/DiagnosticoTermometro";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { useSalesPlan, useSaveSalesPlan, useSalesPlanHistory, useArchiveSalesPlan } from "@/hooks/useSalesPlan";
import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useCrmFunnels";
import { useClienteScriptMutations } from "@/hooks/useClienteScripts";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import { useActiveGoals, useHistoricGoals, useGoalMutations } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { GoalCard } from "@/components/metas/GoalCard";
import { GoalProgressRing } from "@/components/metas/GoalProgressRing";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, BarChart, Bar, Cell, Legend, ReferenceLine,
} from "recharts";

/* ══════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════ */

type Answers = Record<string, string | string[] | number>;

interface StrategyQuestion {
  id: string;
  question: string;
  subtitle?: string;
  helpText?: string;
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
   METRIC OPTIONS (shared)
   ══════════════════════════════════════════════ */
const METRIC_OPTIONS = [
  { value: "revenue", label: "Faturamento" },
  { value: "leads", label: "Leads Gerados" },
  { value: "conversions", label: "Taxa de Conversão" },
  { value: "contracts", label: "Contratos Fechados" },
  { value: "meetings", label: "Reuniões" },
  { value: "avg_ticket", label: "Ticket Médio" },
];

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
        helpText: "Identifique o setor principal de atuação para personalizar as recomendações do plano.",
        options: [
          { label: "Serviços", value: "servicos" }, { label: "Varejo / Loja", value: "varejo" },
          { label: "Alimentação", value: "alimentacao" }, { label: "Saúde / Estética", value: "saude" },
          { label: "Educação", value: "educacao" }, { label: "Tecnologia", value: "tecnologia" },
          { label: "Indústria", value: "industria" }, { label: "Outro", value: "outro" },
        ],
      },
      {
        id: "modelo_negocio", question: "Qual o modelo de negócio?", type: "choice",
        helpText: "Saber se vende para empresas ou consumidor final muda toda a estratégia de abordagem.",
        options: [
          { label: "B2B (empresas)", value: "b2b" }, { label: "B2C (consumidor final)", value: "b2c" },
          { label: "Ambos", value: "ambos" },
        ],
      },
      {
        id: "produtos_servicos", question: "Principais produtos ou serviços", type: "text",
        helpText: "Liste seus principais produtos ou serviços para personalizar o plano.",
        placeholder: "Ex: Consultoria em gestão, treinamentos corporativos...",
      },
      {
        id: "diferenciais", question: "Diferenciais competitivos", type: "text",
        helpText: "O que te diferencia da concorrência.",
        placeholder: "Ex: Atendimento 24h, entrega em 2h...",
      },
    ],
  },
  {
    id: "financeiro", title: "Financeiro Comercial", subtitle: "Dimensione sua operação comercial",
    icon: Wallet,
    questions: [
      {
        id: "faturamento", question: "Qual o faturamento mensal aproximado?", type: "choice",
        helpText: "Usado para calcular projeções de crescimento e dimensionar a estratégia comercial.",
        options: [
          { label: "Até R$ 10 mil", value: "0-10k" }, { label: "R$ 10-30 mil", value: "10-30k" },
          { label: "R$ 30-100 mil", value: "30-100k" }, { label: "R$ 100-300 mil", value: "100-300k" },
          { label: "R$ 300 mil+", value: "300k+" },
        ],
      },
      {
        id: "ticket_medio", question: "Qual o ticket médio?", type: "choice",
        helpText: "O ticket médio impacta diretamente na quantidade de vendas necessárias para atingir a meta.",
        options: [
          { label: "Até R$ 200", value: "0-200" }, { label: "R$ 200-1 mil", value: "200-1k" },
          { label: "R$ 1-5 mil", value: "1-5k" }, { label: "R$ 5-15 mil", value: "5-15k" },
          { label: "R$ 15-50 mil", value: "15-50k" }, { label: "R$ 50-150 mil", value: "50-150k" },
          { label: "R$ 150 mil+", value: "150k+" },
        ],
      },
      {
        id: "meta_faturamento", question: "Qual a meta de faturamento mensal?", type: "choice",
        helpText: "Sua meta ideal de receita mensal. Usamos para projetar o funil reverso.",
        options: [
          { label: "Até R$ 20 mil", value: "0-20k" }, { label: "R$ 20-50 mil", value: "20-50k" },
          { label: "R$ 50-150 mil", value: "50-150k" }, { label: "R$ 150-500 mil", value: "150-500k" },
          { label: "R$ 500 mil+", value: "500k+" },
        ],
      },
      {
        id: "tem_recorrencia", question: "Você tem clientes que compram mais de uma vez?", type: "choice",
        helpText: "Recorrência é a base de um negócio previsível e escalável.",
        options: [
          { label: "Sim, boa parte volta", value: "sim" }, { label: "Parcialmente", value: "parcialmente" },
          { label: "Não, sempre clientes novos", value: "nao" },
        ],
      },
      {
        id: "ciclo_recompra", question: "Ciclo médio de recompra e fidelização", type: "text",
        helpText: "Descreva como funciona a recompra e fidelização no seu negócio.",
        placeholder: "Ex: Clientes voltam a cada 3 meses para manutenção...",
      },
    ],
  },
  {
    id: "equipe", title: "Equipe e Estrutura", subtitle: "Como está sua equipe comercial",
    icon: Users,
    questions: [
      {
        id: "tamanho_equipe", question: "Tamanho da equipe comercial", type: "choice",
        helpText: "Quantas pessoas estão envolvidas diretamente em vendas e prospecção.",
        options: [
          { label: "Só eu", value: "1" }, { label: "2-3 pessoas", value: "2-3" },
          { label: "4-7 pessoas", value: "4-7" }, { label: "8-15 pessoas", value: "8-15" },
          { label: "16+", value: "16+" },
        ],
      },
      {
        id: "funcoes_equipe", question: "Quais funções existem na equipe?", type: "multi-choice",
        helpText: "Equipes com funções definidas (SDR, Closer, CS) têm maior previsibilidade de resultados.",
        options: [
          { label: "SDR / Pré-vendas", value: "sdr" }, { label: "Closer / Vendedor", value: "closer" },
          { label: "CS / Pós-venda", value: "cs" }, { label: "Gestor Comercial", value: "gestor" },
          { label: "Nenhuma definida", value: "nenhuma" },
        ],
      },
      {
        id: "processo_documentado", question: "Processo comercial está documentado?", type: "choice",
        helpText: "Processos documentados permitem treinar novos vendedores e escalar a operação.",
        options: [
          { label: "Não existe", value: "nao" }, { label: "Parcial / informal", value: "parcial" },
          { label: "Sim, documentado", value: "sim" }, { label: "Sim, com playbook completo", value: "completo" },
        ],
      },
      {
        id: "tempo_fechamento", question: "Tempo médio de fechamento de uma venda?", type: "choice",
        helpText: "Ciclos de venda mais longos exigem automação e cadências de follow-up mais robustas.",
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
        helpText: "CRM centraliza informações e evita perda de oportunidades por falta de acompanhamento.",
        options: [
          { label: "Não uso nada", value: "nao" }, { label: "Planilha / anotações", value: "planilha" },
          { label: "CRM básico", value: "crm_basico" }, { label: "CRM profissional", value: "crm_pro" },
        ],
      },
      {
        id: "followup", question: "Tem follow-up estruturado?", type: "choice",
        helpText: "Estudos mostram que 80% das vendas precisam de 5+ follow-ups para fechar.",
        options: [
          { label: "Não faço follow-up", value: "nao" }, { label: "Faço quando lembro", value: "eventual" },
          { label: "Sim, com cadência definida", value: "cadencia" }, { label: "Sim, automatizado", value: "auto" },
        ],
      },
      {
        id: "cadencia_followup", question: "Qual a cadência de follow-up?", type: "choice",
        helpText: "Quanto mais rápido o follow-up, maior a chance de conversão.",
        options: [
          { label: "Não tenho cadência", value: "nenhuma" }, { label: "A cada 7+ dias", value: "7d" },
          { label: "A cada 2-3 dias", value: "2-3d" }, { label: "Diário", value: "diario" },
        ],
      },
      {
        id: "qtd_leads_mes", question: "Quantos leads recebe por mês?", type: "choice",
        helpText: "Volume de leads determina a necessidade de automação e tamanho da equipe.",
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
        helpText: "Diversificar canais reduz o risco de depender de uma única fonte de leads.",
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
        helpText: "Saber o canal mais eficiente ajuda a alocar orçamento e esforço de forma inteligente.",
        options: [
          { label: "Indicação", value: "indicacao" }, { label: "Tráfego pago", value: "trafego" },
          { label: "Prospecção ativa", value: "prospeccao" }, { label: "Redes sociais orgânico", value: "organico" },
          { label: "Não sei", value: "nao_sei" },
        ],
      },
      {
        id: "mede_roi", question: "Mede o ROI por canal?", type: "choice",
        helpText: "Medir ROI evita desperdício de verba em canais que não geram retorno.",
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
        helpText: "Scripts garantem consistência na abordagem e aceleram o ramp-up de novos vendedores.",
        options: [
          { label: "Não uso", value: "nao" }, { label: "Tenho mas não sigo", value: "tem_nao_segue" },
          { label: "Sim, parcialmente", value: "parcial" }, { label: "Sim, toda equipe usa", value: "sim" },
        ],
      },
      {
        id: "etapas_funil", question: "Descreva as etapas do seu processo de vendas", type: "text",
        helpText: "Um funil bem definido permite identificar gargalos. Vamos criar seu funil automaticamente!",
        placeholder: "Ex: Prospecção → Qualificação → Reunião → Proposta → Negociação → Fechamento",
      },
      {
        id: "reuniao_recorrente", question: "Tem reunião comercial recorrente?", type: "choice",
        helpText: "Reuniões de alinhamento garantem que a equipe mantenha foco nas prioridades e metas.",
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
        helpText: "Mapear suas ferramentas atuais ajuda a identificar lacunas e oportunidades de integração.",
        options: [
          { label: "CRM", value: "crm" }, { label: "WhatsApp Business", value: "whatsapp" },
          { label: "Email Marketing", value: "email" }, { label: "Telefone", value: "telefone" },
          { label: "Automação (RD, HubSpot)", value: "automacao" }, { label: "Planilhas", value: "planilhas" },
          { label: "Nenhuma", value: "nenhuma" },
        ],
      },
      {
        id: "tem_automacoes", question: "Tem automações ativas no processo comercial?", type: "choice",
        helpText: "Automações liberam tempo da equipe para tarefas de maior valor, como negociação.",
        options: [
          { label: "Nenhuma", value: "nao" }, { label: "Poucas (email, lembretes)", value: "poucas" },
          { label: "Sim, várias integradas", value: "sim" },
        ],
      },
      {
        id: "usa_agente_ia", question: "Usa agente de IA para atendimento?", type: "choice",
        helpText: "IA responde leads 24h, reduz tempo de espera e qualifica automaticamente.",
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
        helpText: "Metas baseadas em dados evitam frustração e permitem projeções mais realistas.",
        options: [
          { label: "Não tenho metas", value: "nao" }, { label: "Metas por achismo", value: "achismo" },
          { label: "Baseadas em histórico", value: "historico" }, { label: "Com projeções e cenários", value: "projecoes" },
        ],
      },
      {
        id: "conversao_etapa", question: "Acompanha taxa de conversão por etapa do funil?", type: "choice",
        helpText: "Conversão por etapa revela exatamente onde os leads estão sendo perdidos.",
        options: [
          { label: "Não acompanho", value: "nao" }, { label: "Apenas conversão geral", value: "geral" },
          { label: "Sim, por etapa", value: "por_etapa" },
        ],
      },
      {
        id: "relatorios", question: "Gera relatórios comerciais periodicamente?", type: "choice",
        helpText: "Relatórios frequentes permitem ajustar a estratégia rapidamente e não perder tempo.",
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
  const anoAtual = new Date().getFullYear();

  // ── Sales Plan from DB ──
  const { data: salesPlanData, isLoading: spLoading } = useSalesPlan();
  const saveSalesPlan = useSaveSalesPlan();
  const { data: planHistory, isLoading: historyLoading } = useSalesPlanHistory();
  const archiveSalesPlan = useArchiveSalesPlan();

  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Sync from DB once loaded
  useEffect(() => {
    if (spLoading) return;
    if (salesPlanData) {
      const dbAnswers = (salesPlanData.answers || {}) as Answers;
      setAnswers(dbAnswers);
      const isComplete = Object.keys(dbAnswers).length > 5;
      setCompleted(isComplete);
      setShowWelcome(!isComplete);
    }
  }, [salesPlanData, spLoading]);

  // ── History dialog state ──
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  const selectedHistoryScores = useMemo(() => {
    if (!selectedHistoryItem) return null;
    return computeScores(selectedHistoryItem.answers as Answers);
  }, [selectedHistoryItem]);

  const selectedHistoryInsights = useMemo(() => {
    if (!selectedHistoryScores || !selectedHistoryItem) return [];
    return generateInsights(selectedHistoryItem.answers as Answers, selectedHistoryScores.scoreMap, selectedHistoryScores.maxMap);
  }, [selectedHistoryItem, selectedHistoryScores]);

  const selectedHistoryActionPlan = useMemo(() => {
    if (!selectedHistoryScores || !selectedHistoryItem) return [];
    return generateActionPlan(selectedHistoryScores.scoreMap, selectedHistoryScores.maxMap, selectedHistoryItem.answers as Answers);
  }, [selectedHistoryItem, selectedHistoryScores]);

  // ── Metas state ──
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
  const [targetDisplay, setTargetDisplay] = useState("");

  const { data: activeGoals, isLoading: goalsLoading } = useActiveGoals(scopeFilter);
  const { data: historicGoals } = useHistoricGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { createGoal, updateGoal, archiveGoal } = useGoalMutations();
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const { data: teams } = useCrmTeams();
  const { data: members } = useCrmTeam();

  const isMonetaryMetric = (m: string) => ["revenue", "avg_ticket"].includes(m);

  // ── Diagnostic computed ──
  const { scoreMap, maxMap, radarData, percentage } = useMemo(() => computeScores(answers), [answers]);
  const nivel = getNivel(percentage);
  const insights = useMemo(() => generateInsights(answers, scoreMap, maxMap), [answers, scoreMap, maxMap]);
  const leadsProjection = useMemo(() => getLeadsProjection(percentage), [percentage]);
  const revenueProjection = useMemo(() => getRevenueProjection(answers, percentage), [answers, percentage]);
  const actionPlan = useMemo(() => generateActionPlan(scoreMap, maxMap, answers), [scoreMap, maxMap, answers]);

  // ── Metas charts data ──
  const progressChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    return [...activeGoals]
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      .map(g => {
        const p = goalProgress[g.id];
        return {
          name: g.title?.length > 25 ? g.title.slice(0, 22) + "..." : g.title,
          atual: p?.currentValue ?? 0,
          alvo: g.target_value ?? 0,
          percent: p?.percent ?? 0,
        };
      });
  }, [activeGoals, goalProgress]);

  const evolutionChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const point: any = { dia: d };
      activeGoals.forEach(g => {
        const p = goalProgress[g.id];
        if (!p) return;
        const idealPerDay = (g.target_value ?? 0) / daysInMonth;
        point[`ideal_${g.id}`] = Math.round(idealPerDay * d);
        if (d <= currentDay) {
          point[`real_${g.id}`] = Math.round((p.currentValue / currentDay) * d);
        }
      });
      data.push(point);
    }
    return data;
  }, [activeGoals, goalProgress]);

  const scopeChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    const scopeGroups: Record<string, number[]> = { company: [], team: [], individual: [] };
    activeGoals.forEach(g => {
      const p = goalProgress[g.id];
      if (p) {
        const scope = g.scope || "company";
        if (!scopeGroups[scope]) scopeGroups[scope] = [];
        scopeGroups[scope].push(Math.min(p.percent, 100));
      }
    });
    const labels: Record<string, string> = { company: "Empresa", team: "Equipe", individual: "Individual" };
    return Object.entries(scopeGroups)
      .filter(([, vals]) => vals.length > 0)
      .map(([scope, vals]) => ({
        name: labels[scope] || scope,
        media: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        total: vals.length,
      }));
  }, [activeGoals, goalProgress]);

  const getBarColor = (pct: number) => {
    if (pct >= 80) return "hsl(var(--chart-3))";
    if (pct >= 50) return "hsl(var(--chart-2))";
    return "hsl(var(--destructive))";
  };

  const progValues = goalProgress ? Object.values(goalProgress) : [];
  const hasGoals = activeGoals && activeGoals.length > 0;

  // ── Auto funnel + scripts hooks ──
  const { data: existingFunnels } = useCrmFunnels();
  const { createFunnel } = useCrmFunnelMutations();
  const { createScript } = useClienteScriptMutations();
  const { data: orgId } = useUserOrgId();

  const STAGE_COLORS = ["#8b5cf6", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#f97316", "#6366f1", "#14b8a6"];

  const parseFunnelStages = (text: string): { id: string; name: string; color: string }[] => {
    const parts = text.split(/→|->|,|\n/).map(s => s.trim()).filter(Boolean);
    return parts.map((name, i) => ({
      id: String(i + 1),
      name,
      color: STAGE_COLORS[i % STAGE_COLORS.length],
    }));
  };

  const handleChatComplete = async (chatAnswers: Record<string, any>) => {
    const ans = chatAnswers as Answers;
    setAnswers(ans);
    setCompleted(true);
    const { percentage: pct } = computeScores(ans);
    saveSalesPlan.mutate({ answers: ans, score: Math.round(pct) });

    // ── Auto-create CRM funnel from etapas_funil ──
    const etapasText = ans.etapas_funil;
    if (typeof etapasText === "string" && etapasText.trim().length > 0 && (!existingFunnels || existingFunnels.length === 0)) {
      const stages = parseFunnelStages(etapasText);
      if (stages.length >= 2) {
        try {
          await createFunnel.mutateAsync({
            name: "Funil Principal",
            description: "Criado automaticamente a partir do Plano de Vendas",
            stages,
            is_default: true,
          });
          toast({ title: "Funil CRM criado automaticamente!", description: `${stages.length} etapas configuradas.` });
        } catch (e) {
          console.error("Auto-funnel error:", e);
        }
      }
    }

    // ── Auto-generate initial scripts (background) ──
    if (orgId) {
      const scriptStages = ["prospeccao", "diagnostico", "fechamento"];
      const context = {
        segment: ans.segmento,
        modeloNegocio: ans.modelo_negocio,
        produtosServicos: ans.produtos_servicos,
        diferenciais: ans.diferenciais,
        dorPrincipal: ans.dor_principal,
        ticketMedio: ans.ticket_medio,
        etapasFunil: typeof etapasText === "string" ? etapasText.split(/→|->|,|\n/).map((s: string) => s.trim()).filter(Boolean) : [],
        tempoFechamento: ans.tempo_fechamento,
      };

      // Fire and forget — don't block UI
      (async () => {
        let created = 0;
        for (const stage of scriptStages) {
          try {
            const { data, error } = await supabase.functions.invoke("generate-script", {
              body: { stage, briefing: {}, context, organization_id: orgId },
            });
            if (!error && data?.content) {
              await createScript.mutateAsync({
                title: data.title || `Script de ${stage}`,
                content: data.content,
                category: stage,
                tags: data.tags || [stage],
              });
              created++;
            }
          } catch (e) {
            console.error(`Auto-script ${stage} error:`, e);
          }
        }
        if (created > 0) {
          toast({ title: `${created} scripts gerados automaticamente!`, description: "Acesse a seção de Scripts para revisá-los." });
        }
      })();
    }
  };

  const handleRestart = async () => {
    // Archive the current plan before resetting
    if (salesPlanData && Object.keys(salesPlanData.answers || {}).length > 5) {
      try {
        await archiveSalesPlan.mutateAsync({
          answers: salesPlanData.answers,
          score: salesPlanData.score ?? 0,
        });
      } catch (e) {
        console.error("Archive error:", e);
      }
    }
    setAnswers({}); setCompleted(false);
    saveSalesPlan.mutate({ answers: {}, score: 0 });
  };

  // ── Metas handler ──
  const handleAddMeta = () => {
    if (!novaMeta.title || novaMeta.target_value <= 0 || !novaMeta.mesRef) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (novaMeta.scope === "team" && !novaMeta.team_id) {
      toast({ title: "Selecione o time para a meta de equipe", variant: "destructive" });
      return;
    }
    if (novaMeta.scope === "individual" && !novaMeta.assigned_to) {
      toast({ title: "Selecione a pessoa responsável pela meta individual", variant: "destructive" });
      return;
    }
    const [y, m] = novaMeta.mesRef.split("-").map(Number);
    const periodEnd = new Date(y, m, 0, 23, 59, 59);
    const now = new Date();
    if (periodEnd < now) {
      const confirmed = window.confirm(
        `O período selecionado (${MESES_COMPLETOS[m - 1]} ${y}) já passou. A meta será enviada diretamente para o histórico. Deseja continuar?`
      );
      if (!confirmed) return;
    }
    const periodStart = new Date(y, m - 1, 1).toISOString();
    const periodEndISO = periodEnd.toISOString();
    createGoal.mutate({
      title: novaMeta.title,
      target_value: novaMeta.target_value,
      metric: novaMeta.metric,
      scope: novaMeta.scope,
      priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : undefined,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : undefined,
      period_start: periodStart,
      period_end: periodEndISO,
      status: "active",
    }, {
      onSuccess: () => {
        playSound("success");
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay("");
        setNovaMetaOpen(false);
        toast({ title: "Meta criada com sucesso!" });
      },
    });
  };

  const handleEditMeta = () => {
    if (!editingGoal || !novaMeta.title || novaMeta.target_value <= 0 || !novaMeta.mesRef) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const [y, m] = novaMeta.mesRef.split("-").map(Number);
    const periodStart = new Date(y, m - 1, 1).toISOString();
    const periodEnd = new Date(y, m, 0, 23, 59, 59).toISOString();
    updateGoal.mutate({
      id: editingGoal.id,
      title: novaMeta.title,
      target_value: novaMeta.target_value,
      metric: novaMeta.metric,
      scope: novaMeta.scope,
      priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : null,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : null,
      period_start: periodStart,
      period_end: periodEnd,
    }, {
      onSuccess: () => {
        playSound("success");
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay("");
        setNovaMetaOpen(false);
        setEditingGoal(null);
        toast({ title: "Meta atualizada com sucesso!" });
      },
    });
  };

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */

  return (
    <div className="w-full space-y-6">
      {/* Welcome popup for first-time users */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Rocket className="w-5 h-5 text-primary" />
              Estruture seu Comercial
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              O <strong>Plano de Vendas</strong> é o primeiro passo para desbloquear todo o potencial da plataforma. Em poucos minutos você terá:
            </p>
            <ul className="space-y-2.5">
              {[
                { icon: Activity, text: "Diagnóstico completo do seu comercial" },
                { icon: Lightbulb, text: "Insights personalizados com plano de ação" },
                { icon: TrendingUp, text: "Projeções de crescimento de leads e receita" },
                { icon: Target, text: "Metas claras e acompanhamento em tempo real" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Sem o Plano de Vendas, CRM, Chat, Agentes IA e outras funções ficam bloqueados.
              </p>
            </div>
          </div>
          <Button className="w-full font-semibold" onClick={() => setShowWelcome(false)}>
            <Rocket className="w-4 h-4 mr-2" /> Começar agora
          </Button>
        </DialogContent>
      </Dialog>
      <PageHeader
        title="Plano de Vendas"
        subtitle="Consultoria comercial interativa para diagnosticar e evoluir seu comercial"
        icon={<Target className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="plano_vendas" />}
      />

      <Tabs defaultValue="diagnostico" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="diagnostico" className="gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Diagnóstico
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Metas
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: DIAGNÓSTICO ═══════ */}
        <TabsContent value="diagnostico" className="space-y-6 mt-4">
          <div className="space-y-4">
            <Collapsible defaultOpen={!completed}>
              <CollapsibleTrigger className="group flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors w-full py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted">
                <Activity className="w-4 h-4 text-primary" />
                Diagnóstico Comercial
                {completed && <Badge variant="outline" className="text-[9px] ml-1 border-primary/30 text-primary">Concluído</Badge>}
                <ChevronDown className="w-4 h-4 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
              {!completed ? (
                <ChatBriefing
                  agent={AGENTS.rafael}
                  steps={RAFAEL_STEPS}
                  onComplete={handleChatComplete}
                  onCancel={() => setShowWelcome(true)}
                />
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

                  {/* ═══ NEW: Bar Chart by Category + Gauge + Comparativo ═══ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar chart horizontal por categoria */}
                    <Card className="glass-card">
                      <CardContent className="py-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">SCORE POR CATEGORIA</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={radarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" />
                              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Score"]} />
                              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} name="Score">
                                {radarData.map((entry, i) => (
                                  <Cell key={i} fill={entry.value >= 70 ? "hsl(var(--chart-3))" : entry.value >= 40 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Comparativo Ideal vs Real */}
                    <Card className="glass-card">
                      <CardContent className="py-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">ATUAL vs IDEAL (100%)</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={radarData.map(d => ({ ...d, ideal: 100 }))} margin={{ left: 10, right: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="category" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" />
                              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                              <Bar dataKey="ideal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} barSize={24} name="Ideal" />
                              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} name="Atual" />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gauge de Maturidade */}
                  <Card className="glass-card">
                    <CardContent className="py-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4 text-center">INDICADOR DE MATURIDADE COMERCIAL</p>
                      <div className="flex items-center justify-center">
                        <div className="relative w-64 h-44">
                          <svg viewBox="0 0 200 130" className="w-full h-full">
                            {/* Background arc */}
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
                            {/* Colored arc based on percentage */}
                            <path
                              d="M 20 100 A 80 80 0 0 1 180 100"
                              fill="none"
                              stroke={nivel.cor}
                              strokeWidth="14"
                              strokeLinecap="round"
                              strokeDasharray={`${(percentage / 100) * 251.3} 251.3`}
                              className="transition-all duration-1000 ease-out"
                            />
                            {/* Needle */}
                            {(() => {
                              const angle = -180 + (percentage / 100) * 180;
                              const rad = (angle * Math.PI) / 180;
                              const cx = 100, cy = 100, len = 60;
                              const x2 = cx + len * Math.cos(rad);
                              const y2 = cy + len * Math.sin(rad);
                              return <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-1000 ease-out" />;
                            })()}
                            <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
                            {/* Labels */}
                            <text x="20" y="118" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">0%</text>
                            <text x="100" y="18" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">50%</text>
                            <text x="180" y="118" fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">100%</text>
                          </svg>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                            <p className="text-2xl font-bold leading-tight" style={{ color: nivel.cor }}>{percentage}%</p>
                            <p className="text-xs font-medium" style={{ color: nivel.cor }}>{nivel.label}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        {niveis.map(n => (
                          <div key={n.id} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: n.cor }} />
                            <span className="text-[10px] text-muted-foreground">{n.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>


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

                  {/* ═══ KPI Cards de Impacto ═══ */}
                  {(() => {
                    const lastLead = leadsProjection[leadsProjection.length - 1];
                    const lastRev = revenueProjection[revenueProjection.length - 1];
                    const leadGrowth = lastLead.atual > 0 ? Math.round(((lastLead.comEstrategia - lastLead.atual) / lastLead.atual) * 100) : 0;
                    const revGrowth = lastRev.atual > 0 ? Math.round(((lastRev.comEstrategia - lastRev.atual) / lastRev.atual) * 100) : 0;
                    const ticketMap2: Record<string, number> = { "0-200": 150, "200-1k": 600, "1-5k": 3000, "5-15k": 10000, "15k+": 20000 };
                    const ticket2 = ticketMap2[answers.ticket_medio as string] || 600;
                    const conv2 = 0.1;
                    const closingsM6 = Math.round(lastLead.comEstrategia * conv2);
                    const funnelData = [
                      { stage: "Leads", value: lastLead.comEstrategia, fill: "hsl(var(--primary))" },
                      { stage: "Qualificados", value: Math.round(lastLead.comEstrategia * 0.5), fill: "hsl(var(--chart-1))" },
                      { stage: "Propostas", value: Math.round(lastLead.comEstrategia * 0.2), fill: "hsl(var(--chart-2))" },
                      { stage: "Fechamentos", value: closingsM6, fill: "hsl(var(--chart-3))" },
                    ];

                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Receita Projetada M6", value: `R$ ${(lastRev.comEstrategia / 1000).toFixed(0)}k`, sublabel: `vs R$ ${(lastRev.atual / 1000).toFixed(0)}k atual` },
                            { label: "Crescimento Receita", value: `+${revGrowth}%`, sublabel: "em 6 meses" },
                            { label: "Leads Projetados M6", value: `${lastLead.comEstrategia}`, sublabel: `vs ${lastLead.atual} atual` },
                            { label: "Fechamentos M6", value: `${closingsM6}`, sublabel: `${Math.round(conv2 * 100)}% conversão` },
                          ].map((kpi, i) => (
                            <Card key={i} className="glass-card border-primary/10 overflow-hidden group relative">
                              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-500" />
                              <CardContent className="py-4 px-4 relative">
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{kpi.label}</p>
                                <div className="flex items-end gap-2 mt-1">
                                  <span className="text-xl font-black tracking-tight text-kpi-positive">{kpi.value}</span>
                                  <TrendingUp className="w-3.5 h-3.5 text-kpi-positive mb-1" />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sublabel}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* ═══ Gráfico Receita Sobreposto ═══ */}
                        <Card className="glass-card">
                          <CardContent className="py-6">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">PROJEÇÃO DE RECEITA — 6 MESES</p>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-[9px] gap-1 border-muted-foreground/30">
                                  <span className="w-2 h-0.5 bg-muted-foreground inline-block" style={{ borderTop: "2px dashed" }} /> Cenário Atual
                                </Badge>
                                <Badge className="text-[9px] gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                  <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Com Estratégia
                                </Badge>
                              </div>
                            </div>
                            <div className="h-64 relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueProjection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="gradRevStrategy" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                  <RechartsTooltip
                                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                                  />
                                  <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={2} strokeDasharray="6 4" name="Cenário Atual" />
                                  <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--primary))" fill="url(#gradRevStrategy)" strokeWidth={2.5} name="Com Estratégia" />
                                </AreaChart>
                              </ResponsiveContainer>
                              {/* Floating growth badge */}
                              <div className="absolute top-2 right-4 flex flex-col items-end gap-1">
                                <Badge className="bg-kpi-positive/10 text-kpi-positive border-kpi-positive/20 hover:bg-kpi-positive/10 text-xs font-bold">
                                  +{revGrowth}%
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">crescimento projetado</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* ═══ Funil de Conversão Horizontal ═══ */}
                        <Card className="glass-card">
                          <CardContent className="py-6">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">FUNIL DE CONVERSÃO PROJETADO — MÊS 6</p>
                              <Badge variant="outline" className="text-[9px]">Ticket: R$ {ticket2.toLocaleString("pt-BR")}</Badge>
                            </div>
                            <div className="h-52">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fontWeight: 600 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={90} />
                                  <RechartsTooltip
                                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                                  />
                                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Quantidade" barSize={28}>
                                    {funnelData.map((entry, idx) => (
                                      <Cell key={idx} fill={entry.fill} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>
              )}
              </CollapsibleContent>
            </Collapsible>
          </div>

        </TabsContent>

        {/* ═══════ TAB: HISTÓRICO ═══════ */}
        <TabsContent value="historico" className="space-y-6 mt-4">
          <div>
            <p className="text-sm font-semibold">Histórico de Diagnósticos</p>
            <p className="text-xs text-muted-foreground">Cada vez que você refaz o diagnóstico, o anterior é salvo aqui. Clique para ver o diagnóstico completo.</p>
          </div>

          {/* Evolution Chart */}
          {planHistory && planHistory.length >= 2 && (
            <Card className="glass-card">
              <CardContent className="py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">EVOLUÇÃO DA MATURIDADE COMERCIAL</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...planHistory].reverse().map(h => ({
                      data: new Date(h.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
                      score: h.score,
                    }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradHistoryEvo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="data" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" />
                      <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Score"]} />
                      <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#gradHistoryEvo)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                      <ReferenceLine y={75} stroke="hsl(var(--chart-3))" strokeDasharray="5 5" label={{ value: "Alta Perf.", position: "right", fontSize: 10, fill: "hsl(var(--chart-3))" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Card key={i}><CardContent className="h-16 animate-pulse bg-muted rounded" /></Card>)}
            </div>
          ) : !planHistory || planHistory.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">Nenhum diagnóstico salvo no histórico</p>
                <p className="text-xs text-muted-foreground mt-1">Ao refazer o diagnóstico, o anterior será salvo automaticamente aqui.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {planHistory.map((h) => {
                const nv = getNivel(h.score);
                return (
                  <Card key={h.id} className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setSelectedHistoryItem(h); setHistoryDialogOpen(true); }}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ backgroundColor: nv.cor }}>
                          {h.score}%
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{nv.label}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px]" style={{ borderColor: nv.cor, color: nv.cor }}>
                          {nv.label}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ DIALOG: Histórico completo ═══ */}
        <Dialog open={historyDialogOpen} onOpenChange={(o) => { setHistoryDialogOpen(o); if (!o) setSelectedHistoryItem(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Diagnóstico de {selectedHistoryItem && new Date(selectedHistoryItem.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </DialogTitle>
            </DialogHeader>
            {selectedHistoryScores && selectedHistoryItem && (() => {
              const hNivel = getNivel(selectedHistoryScores.percentage);
              return (
                <div className="space-y-6 mt-2">
                  {/* Score + Level */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground" style={{ backgroundColor: hNivel.cor }}>
                      {selectedHistoryScores.percentage}%
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: hNivel.cor }}>{hNivel.label}</p>
                      <p className="text-xs text-muted-foreground">{hNivel.desc}</p>
                    </div>
                  </div>

                  {/* Radar */}
                  <Card>
                    <CardContent className="py-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">RADAR POR ÁREA</p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={selectedHistoryScores.radarData} outerRadius="65%">
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                            <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bar chart by category */}
                  <Card>
                    <CardContent className="py-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">SCORE POR CATEGORIA</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedHistoryScores.radarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                            <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                            <RechartsTooltip formatter={(v: number) => [`${v}%`, "Score"]} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                              {selectedHistoryScores.radarData.map((entry, i) => (
                                <Cell key={i} fill={entry.value >= 70 ? "hsl(var(--chart-3))" : entry.value >= 40 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">INSIGHTS</p>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedHistoryInsights.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50">
                          <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${ins.type === "success" ? "text-emerald-500" : ins.type === "warning" ? "text-destructive" : "text-primary"}`} />
                          <span>{ins.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Plan */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">PLANO DE AÇÃO</p>
                    <div className="space-y-3">
                      {selectedHistoryActionPlan.map(fase => (
                        <div key={fase.fase} className="p-3 rounded-lg border" style={{ borderColor: fase.cor + "40" }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold">{fase.fase}</p>
                            <Badge variant="outline" className="text-[9px]">{fase.periodo}</Badge>
                          </div>
                          <ul className="space-y-1">
                            {fase.items.map((item, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ═══════ TAB: METAS ═══════ */}
        <TabsContent value="metas" className="space-y-6 mt-4">
          {/* Header + Filters + Export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Metas Comerciais</p>
              <p className="text-xs text-muted-foreground">Acompanhe suas metas com dados reais do CRM · {MESES_COMPLETOS[new Date().getMonth()]} {anoAtual}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => {
                if (!activeGoals.length) return;
                const rows = activeGoals.map(g => {
                  const p = goalProgress?.[g.id];
                  return [g.title, g.metric, g.target_value, p?.currentValue ?? 0, p?.percent ?? 0, g.scope, g.priority].join(",");
                });
                const csv = "Meta,Métrica,Alvo,Atual,%,Escopo,Prioridade\n" + rows.join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `metas-${anoAtual}.csv`; a.click(); URL.revokeObjectURL(url);
              }}>
                <FileText className="w-3 h-3" /> CSV
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={async () => {
                const el = document.getElementById("metas-report-area");
                if (!el) return;
                const html2pdf = (await import("html2pdf.js")).default;
                html2pdf().set({ margin: 0.5, filename: `relatorio-metas-${anoAtual}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: "a4" } }).from(el).save();
              }}>
                <Receipt className="w-3 h-3" /> PDF
              </Button>
              <Button size="sm" className="gap-1" onClick={() => setNovaMetaOpen(true)}>
                <Plus className="w-3 h-3" /> Nova Meta
              </Button>
            </div>
          </div>

          {/* Scope Filters */}
          <div className="flex bg-secondary rounded-lg p-0.5 w-fit">
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

          <div id="metas-report-area">
          {/* KPI Summary */}
          {hasGoals && goalProgress && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {(() => {
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

          {/* Charts */}
          {hasGoals && goalProgress && (
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">GRÁFICOS DE ACOMPANHAMENTO</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {progressChartData.length > 0 && (
                  <Card>
                    <CardContent className="py-5">
                      <p className="text-xs font-semibold mb-4">Progresso das Metas</p>
                      <div style={{ height: Math.max(progressChartData.length * 50, 150) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={progressChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                            <RechartsTooltip
                              formatter={(value: number, name: string) => [
                                typeof value === "number" ? value.toLocaleString("pt-BR") : value,
                                name === "atual" ? "Atual" : "Alvo",
                              ]}
                            />
                            <Bar dataKey="alvo" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={16} name="Alvo" />
                            <Bar dataKey="atual" radius={[0, 4, 4, 0]} barSize={16} name="Atual">
                              {progressChartData.map((entry, i) => (
                                <Cell key={i} fill={getBarColor(entry.percent)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {scopeChartData.length > 0 && (
                  <Card>
                    <CardContent className="py-5">
                      <p className="text-xs font-semibold mb-4">Comparativo por Escopo</p>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scopeChartData} margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
                            <RechartsTooltip formatter={(v: number) => [`${v}%`, "Progresso Médio"]} />
                            <Bar dataKey="media" radius={[4, 4, 0, 0]} barSize={40} name="Progresso Médio">
                              {scopeChartData.map((entry, i) => (
                                <Cell key={i} fill={getBarColor(entry.media)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {evolutionChartData.length > 0 && activeGoals.length <= 5 && (
                <Card>
                  <CardContent className="py-5">
                    <p className="text-xs font-semibold mb-4">Evolução Diária do Mês</p>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={evolutionChartData} margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <RechartsTooltip />
                          {activeGoals.slice(0, 3).map((g, i) => {
                            const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
                            return (
                              <Area
                                key={`real_${g.id}`}
                                type="monotone"
                                dataKey={`real_${g.id}`}
                                stroke={colors[i]}
                                fill={`${colors[i].replace(")", " / 0.1)")}`}
                                strokeWidth={2}
                                name={g.title?.slice(0, 20)}
                                connectNulls={false}
                                dot={false}
                              />
                            );
                          })}
                          {activeGoals.slice(0, 3).map((g, i) => {
                            const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
                            return (
                              <Area
                                key={`ideal_${g.id}`}
                                type="monotone"
                                dataKey={`ideal_${g.id}`}
                                stroke={colors[i]}
                                fill="none"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                name={`Ideal: ${g.title?.slice(0, 15)}`}
                                dot={false}
                              />
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Linha sólida = progresso real · Linha pontilhada = ritmo ideal</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Goals List */}
          {goalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Card key={i}><CardContent className="h-40 animate-pulse bg-muted rounded" /></Card>)}
            </div>
          ) : !hasGoals ? (
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
                  onEdit={() => {
                    const g = goal as any;
                    const mesRef = g.period_start ? g.period_start.slice(0, 7) : "";
                    setNovaMeta({
                      title: g.title || "",
                      metric: g.metric || "revenue",
                      target_value: g.target_value || 0,
                      scope: g.scope || "company",
                      team_id: g.team_id || "",
                      assigned_to: g.assigned_to || "",
                      priority: g.priority || "media",
                      mesRef,
                    });
                    setTargetDisplay(isMonetaryMetric(g.metric || "revenue") ? (g.target_value || 0).toLocaleString("pt-BR") : "");
                    setEditingGoal(g);
                    setNovaMetaOpen(true);
                  }}
                  onArchive={() => archiveGoal.mutate(goal.id)}
                />
              ))}
            </div>
          )}
          </div>{/* close metas-report-area */}

          {/* Historic */}
          {historicGoals && historicGoals.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
                <ChevronDown className="w-4 h-4" />
                Histórico de Metas ({historicGoals.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {historicGoals.map(goal => {
                  const pctVal = goal.target_value > 0 ? Math.round(((goal.current_value || 0) / goal.target_value) * 100) : 0;
                  const achieved = pctVal >= 100;
                  return (
                    <Card key={goal.id} className="opacity-70">
                      <CardContent className="py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GoalProgressRing percent={Math.min(pctVal, 100)} size={36} strokeWidth={3} />
                          <div>
                            <p className="text-xs font-medium">{goal.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {goal.period_start && new Date(goal.period_start).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${achieved ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"}`}>
                          {achieved ? "Batida" : `${pctVal}%`}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Nova / Editar Meta */}
      <Dialog open={novaMetaOpen} onOpenChange={(o) => { setNovaMetaOpen(o); if (!o) setEditingGoal(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
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
                    {[anoAtual, anoAtual + 1].flatMap(yr =>
                      MESES_COMPLETOS.map((m, i) => (
                        <SelectItem key={`${yr}-${i}`} value={`${yr}-${String(i + 1).padStart(2, "0")}`}>{m} {yr}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Valor alvo {isMonetaryMetric(novaMeta.metric) && <span className="text-muted-foreground">(R$)</span>}</Label>
                {isMonetaryMetric(novaMeta.metric) ? (
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={targetDisplay}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw) { setTargetDisplay(""); setNovaMeta(p => ({ ...p, target_value: 0 })); return; }
                      const num = parseInt(raw, 10);
                      setTargetDisplay(num.toLocaleString("pt-BR"));
                      setNovaMeta(p => ({ ...p, target_value: num }));
                    }}
                    placeholder="Ex: 50.000"
                    className="text-sm"
                  />
                ) : (
                  <Input
                    type="number"
                    value={novaMeta.target_value || ""}
                    onChange={e => setNovaMeta(p => ({ ...p, target_value: Number(e.target.value) }))}
                    placeholder="Ex: 20"
                    className="text-sm"
                  />
                )}
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
              <Select value={novaMeta.scope} onValueChange={v => setNovaMeta(p => ({ ...p, scope: v, team_id: "", assigned_to: "" }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Empresa (toda a organização)</SelectItem>
                  <SelectItem value="team">Equipe (time específico)</SelectItem>
                  <SelectItem value="individual">Individual (pessoa específica)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {novaMeta.scope === "team" && (
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                {teams && teams.length > 0 ? (
                  <Select value={novaMeta.team_id} onValueChange={v => setNovaMeta(p => ({ ...p, team_id: v }))}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione o time" /></SelectTrigger>
                    <SelectContent>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">Nenhum time cadastrado. Crie times em Configurações &gt; CRM.</p>
                )}
              </div>
            )}
            {novaMeta.scope === "individual" && (
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                {members && members.length > 0 ? (
                  <Select value={novaMeta.assigned_to} onValueChange={v => setNovaMeta(p => ({ ...p, assigned_to: v }))}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name} <span className="text-muted-foreground ml-1">({m.role})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">Nenhum membro encontrado na organização.</p>
                )}
              </div>
            )}
            <Button className="w-full gap-1" onClick={editingGoal ? handleEditMeta : handleAddMeta} disabled={createGoal.isPending || updateGoal.isPending}>
              {editingGoal ? (
                <>{updateGoal.isPending ? "Salvando..." : <><Save className="w-3 h-3" /> Salvar Alterações</>}</>
              ) : (
                <><Plus className="w-3 h-3" /> {createGoal.isPending ? "Criando..." : "Criar Meta"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
