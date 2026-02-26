import { useState, useMemo, useEffect } from "react";
import {
  Megaphone, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Lightbulb, FileText, Share2, Globe, DollarSign, TrendingUp,
  Target, Sparkles, RotateCcw, Clock, ChevronRight, Activity,
  Building2, Users, Wallet, Eye, Swords, BarChart3, Database,
  Link, ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DiagnosticoTermometro } from "@/components/diagnostico/DiagnosticoTermometro";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy } from "@/hooks/useMarketingStrategy";
import { toast } from "@/hooks/use-toast";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, SOFIA_STEPS } from "@/components/cliente/briefingAgents";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
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
  condition?: (answers: Answers) => boolean;
}

interface StrategySection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  questions: StrategyQuestion[];
}

/* ══════════════════════════════════════════════
   SECTIONS & QUESTIONS (~30 questions in 9 screens)
   ══════════════════════════════════════════════ */

const strategySections: StrategySection[] = [
  {
    id: "negocio", title: "Seu Negócio", subtitle: "Conte sobre sua empresa para entendermos o cenário",
    icon: Building2,
    questions: [
      {
        id: "segmento", question: "Qual é o segmento da sua empresa?",
        helpText: "O segmento define o tipo de mercado em que você atua. Isso ajuda a personalizar toda a estratégia.",
        type: "choice",
        options: [
          { label: "Serviços", value: "servicos" }, { label: "Varejo / Loja", value: "varejo" },
          { label: "Alimentação", value: "alimentacao" }, { label: "Saúde / Estética", value: "saude" },
          { label: "Educação", value: "educacao" }, { label: "Tecnologia", value: "tecnologia" },
          { label: "Indústria", value: "industria" }, { label: "Outro", value: "outro" },
        ],
      },
      {
        id: "tempo_mercado", question: "Há quanto tempo está no mercado?",
        helpText: "Empresas mais novas precisam de estratégias de awareness, enquanto empresas maduras focam em escala e retenção.",
        type: "choice",
        options: [
          { label: "Menos de 1 ano", value: "0-1" }, { label: "1 a 3 anos", value: "1-3" },
          { label: "3 a 5 anos", value: "3-5" }, { label: "Mais de 5 anos", value: "5+" },
        ],
      },
      {
        id: "modelo_negocio", question: "Qual o modelo de negócio?",
        helpText: "B2B e B2C demandam canais, tom e funis completamente diferentes.",
        type: "choice",
        options: [
          { label: "B2B (empresas)", value: "b2b" }, { label: "B2C (consumidor final)", value: "b2c" },
          { label: "Ambos", value: "ambos" },
        ],
      },
      {
        id: "num_funcionarios", question: "Quantos funcionários?",
        helpText: "O tamanho da equipe influencia a capacidade de execução do marketing.",
        type: "choice",
        options: [
          { label: "1 a 5", value: "1-5" }, { label: "6 a 20", value: "6-20" },
          { label: "21 a 50", value: "21-50" }, { label: "51 a 200", value: "51-200" },
          { label: "200+", value: "200+" },
        ],
      },
    ],
  },
  {
    id: "financeiro", title: "Financeiro", subtitle: "Entenda seus números para dimensionar a estratégia",
    icon: Wallet,
    questions: [
      {
        id: "faturamento", question: "Qual o faturamento mensal aproximado?",
        helpText: "O faturamento ajuda a dimensionar o investimento ideal em marketing (recomendado: 5-15% do faturamento).",
        type: "choice",
        options: [
          { label: "Até R$ 10 mil", value: "0-10k" }, { label: "R$ 10-30 mil", value: "10-30k" },
          { label: "R$ 30-50 mil", value: "30-50k" }, { label: "R$ 50-100 mil", value: "50-100k" },
          { label: "R$ 100-300 mil", value: "100-300k" }, { label: "R$ 300 mil - 1 M", value: "300k-1m" },
          { label: "R$ 1-5 milhões", value: "1-5m" }, { label: "R$ 5-10 milhões", value: "5-10m" },
        ],
      },
      {
        id: "ticket_medio", question: "Qual o ticket médio do seu produto/serviço?",
        helpText: "Ticket médio é o valor médio de cada venda. Influencia diretamente no ROI das campanhas.",
        type: "choice",
        options: [
          { label: "Até R$ 100", value: "0-100" }, { label: "R$ 100-500", value: "100-500" },
          { label: "R$ 500-2 mil", value: "500-2k" }, { label: "R$ 2-5 mil", value: "2-5k" },
          { label: "R$ 5-15 mil", value: "5-15k" }, { label: "R$ 15 mil+", value: "15k+" },
        ],
      },
    ],
  },
  {
    id: "publico", title: "Seu Público", subtitle: "Quem é o seu cliente e como ele se comporta",
    icon: Users,
    questions: [
      {
        id: "cliente_ideal", question: "Descreva seu cliente ideal",
        helpText: "A persona é uma representação semi-fictícia do seu cliente ideal. Quanto mais detalhada, melhor será a segmentação das campanhas.",
        type: "text",
        placeholder: "Ex: Mulheres de 25-40 anos, classe B, que buscam praticidade...",
      },
      {
        id: "faixa_etaria", question: "Faixa etária principal do público",
        helpText: "A faixa etária define tom, canal e formato de conteúdo mais eficaz.",
        type: "choice",
        options: [
          { label: "18-24 anos", value: "18-24" }, { label: "25-34 anos", value: "25-34" },
          { label: "35-44 anos", value: "35-44" }, { label: "45+ anos", value: "45+" },
        ],
      },
      {
        id: "onde_esta", question: "Onde seu público está mais presente?",
        helpText: "Saber onde seu público navega ajuda a direcionar investimento e conteúdo nos canais certos.",
        type: "multi-choice",
        options: [
          { label: "Instagram", value: "instagram" }, { label: "Facebook", value: "facebook" },
          { label: "TikTok", value: "tiktok" }, { label: "Google", value: "google" },
          { label: "WhatsApp", value: "whatsapp" }, { label: "YouTube", value: "youtube" },
          { label: "LinkedIn", value: "linkedin" },
        ],
      },
      {
        id: "como_decide", question: "Como o cliente decide a compra?",
        helpText: "Entender o processo decisório ajuda a criar conteúdos para cada etapa do funil.",
        type: "multi-choice",
        options: [
          { label: "Indicação", value: "indicacao" }, { label: "Pesquisa no Google", value: "google" },
          { label: "Redes sociais", value: "redes" }, { label: "Preço", value: "preco" },
          { label: "Confiança na marca", value: "marca" }, { label: "Visita presencial", value: "presencial" },
        ],
      },
    ],
  },
  {
    id: "concorrencia", title: "Concorrência", subtitle: "Entenda o cenário competitivo do seu mercado",
    icon: Swords,
    questions: [
      {
        id: "qtd_concorrentes", question: "Quantos concorrentes diretos você tem?",
        helpText: "Concorrentes diretos são empresas que vendem produtos/serviços similares para o mesmo público.",
        type: "choice",
        options: [
          { label: "1 a 3", value: "1-3" }, { label: "4 a 10", value: "4-10" },
          { label: "Mais de 10", value: "10+" }, { label: "Não sei", value: "nao_sei" },
        ],
      },
      {
        id: "concorrentes_digital", question: "Seus concorrentes investem em marketing digital?",
        helpText: "Se seus concorrentes investem pesado, você precisa ser mais estratégico para competir.",
        type: "choice",
        options: [
          { label: "Não investem", value: "nao" }, { label: "Pouco", value: "pouco" },
          { label: "Sim, bastante", value: "bastante" }, { label: "São referência", value: "referencia" },
        ],
      },
      {
        id: "diferencial", question: "Qual seu principal diferencial competitivo?",
        helpText: "Seu diferencial é o que te torna único. Ele será a base da comunicação da marca.",
        type: "text",
        placeholder: "Ex: Atendimento personalizado, preço justo, rapidez na entrega...",
      },
    ],
  },
  {
    id: "presenca_digital", title: "Presença Digital", subtitle: "Suas redes, site e canais de comunicação",
    icon: Share2,
    questions: [
      {
        id: "redes_ativas", question: "Quais redes sociais sua empresa usa ativamente?",
        helpText: "Redes ativas são aquelas que você publica pelo menos 1x por semana.",
        type: "multi-choice",
        options: [
          { label: "Instagram", value: "instagram" }, { label: "Facebook", value: "facebook" },
          { label: "TikTok", value: "tiktok" }, { label: "LinkedIn", value: "linkedin" },
          { label: "YouTube", value: "youtube" }, { label: "Twitter / X", value: "twitter" },
          { label: "Nenhuma", value: "nenhuma" },
        ],
      },
      {
        id: "url_rede", question: "Link do Instagram ou principal rede social",
        helpText: "Usamos para analisar sua presença atual e sugerir melhorias.",
        type: "text",
        placeholder: "https://instagram.com/suaempresa", optional: true,
        condition: (ans) => {
          const redes = ans.redes_ativas;
          return Array.isArray(redes) && redes.length > 0 && !redes.includes("nenhuma");
        },
      },
      {
        id: "freq_publicacao", question: "Com que frequência publica conteúdo?",
        helpText: "Consistência é mais importante que volume. Publicar regularmente aumenta o alcance orgânico.",
        type: "choice",
        options: [
          { label: "Não publico", value: "nunca" }, { label: "Esporadicamente", value: "esporadico" },
          { label: "Semanalmente", value: "semanal" }, { label: "Diariamente", value: "diario" },
        ],
      },
      {
        id: "tem_site", question: "Possui site ou landing page?",
        helpText: "Um site otimizado é essencial para captura de leads e credibilidade da marca.",
        type: "choice",
        options: [
          { label: "Não possui", value: "nao" }, { label: "Sim, desatualizado", value: "desatualizado" },
          { label: "Sim, atualizado", value: "atualizado" }, { label: "Sim, otimizado p/ SEO", value: "otimizado" },
        ],
      },
      {
        id: "url_site", question: "URL do site", type: "text",
        helpText: "Analisamos para verificar SEO, velocidade e conversão.",
        placeholder: "https://suaempresa.com.br", optional: true,
        condition: (ans) => ans.tem_site !== "nao" && !!ans.tem_site,
      },
    ],
  },
  {
    id: "trafego_vendas", title: "Tráfego e Vendas", subtitle: "Investimento em mídia e resultados comerciais",
    icon: TrendingUp,
    questions: [
      {
        id: "investe_trafego", question: "Investe em tráfego pago atualmente?",
        helpText: "Tráfego pago (Meta Ads, Google Ads) é a forma mais rápida de gerar leads qualificados.",
        type: "choice",
        options: [
          { label: "Nunca investi", value: "nunca" }, { label: "Já testei sem resultado", value: "testou" },
          { label: "Invisto mensalmente", value: "mensal" }, { label: "Tenho campanha otimizada", value: "otimizado" },
        ],
      },
      {
        id: "valor_trafego", question: "Quanto investe em tráfego por mês?",
        helpText: "O investimento ideal em tráfego depende do CAC desejado e do ticket médio.",
        type: "choice",
        options: [
          { label: "Não invisto", value: "0" }, { label: "Até R$ 500", value: "0-500" },
          { label: "R$ 500-2 mil", value: "500-2k" }, { label: "R$ 2-5 mil", value: "2-5k" },
          { label: "R$ 5-15 mil", value: "5-15k" }, { label: "R$ 15 mil+", value: "15k+" },
        ],
      },
      {
        id: "leads_mes", question: "Quantos leads recebe por mês?",
        helpText: "Leads são potenciais clientes que demonstraram interesse no seu produto/serviço.",
        type: "choice",
        options: [
          { label: "0 a 10", value: "0-10" }, { label: "11 a 30", value: "11-30" },
          { label: "31 a 100", value: "31-100" }, { label: "100 a 500", value: "100-500" },
          { label: "500+", value: "500+" },
        ],
      },
      {
        id: "taxa_conversao", question: "Taxa de conversão estimada (lead → venda)",
        helpText: "A taxa de conversão é o percentual de leads que se tornam clientes. Média do mercado: 5-15%.",
        type: "choice",
        options: [
          { label: "Não sei", value: "nao_sei" }, { label: "Menos de 5%", value: "0-5" },
          { label: "5% a 15%", value: "5-15" }, { label: "15% a 30%", value: "15-30" },
          { label: "Mais de 30%", value: "30+" },
        ],
      },
    ],
  },
  {
    id: "cac_ltv", title: "Métricas CAC / LTV", subtitle: "Custo de aquisição e valor do ciclo de vida do cliente",
    icon: BarChart3,
    questions: [
      {
        id: "sabe_cac", question: "Sabe quanto custa adquirir um cliente (CAC)?",
        helpText: "CAC (Custo de Aquisição de Cliente) é o total investido em marketing e vendas dividido pelo número de clientes adquiridos no período.",
        type: "choice",
        options: [
          { label: "Não sei", value: "nao_sei" }, { label: "Até R$ 50", value: "0-50" },
          { label: "R$ 50-200", value: "50-200" }, { label: "R$ 200-500", value: "200-500" },
          { label: "R$ 500+", value: "500+" },
        ],
      },
      {
        id: "ltv_medio", question: "Quanto tempo em média um cliente fica com você?",
        helpText: "LTV (Lifetime Value) é a receita total que um cliente gera durante todo o relacionamento. Quanto maior o LTV vs CAC, mais saudável o negócio.",
        type: "choice",
        options: [
          { label: "Compra única", value: "unica" }, { label: "1 a 3 meses", value: "1-3" },
          { label: "3 a 12 meses", value: "3-12" }, { label: "Mais de 1 ano", value: "1ano+" },
        ],
      },
      {
        id: "processo_recompra", question: "Tem processo de recompra / fidelização?",
        helpText: "Um programa de fidelização pode reduzir o CAC em até 60% ao gerar recompra e indicações.",
        type: "choice",
        options: [
          { label: "Não tenho", value: "nao" }, { label: "Informal", value: "informal" },
          { label: "Sim, estruturado", value: "estruturado" },
        ],
      },
    ],
  },
  {
    id: "gestao_dados", title: "Gestão de Dados", subtitle: "Como você organiza informações e estratégias além do digital",
    icon: Database,
    questions: [
      {
        id: "usa_crm", question: "Usa algum CRM ou planilha para gerenciar leads/clientes?",
        helpText: "CRM (Customer Relationship Management) centraliza dados de leads e clientes para acompanhar o funil de vendas.",
        type: "choice",
        options: [
          { label: "Não gerencio", value: "nao" }, { label: "Planilha", value: "planilha" },
          { label: "CRM básico", value: "crm_basico" }, { label: "CRM profissional", value: "crm_pro" },
        ],
      },
      {
        id: "historico_dados", question: "Tem histórico de dados dos seus clientes?",
        helpText: "Dados históricos permitem segmentar campanhas e personalizar comunicações.",
        type: "choice",
        options: [
          { label: "Nenhum", value: "nenhum" }, { label: "Parcial", value: "parcial" },
          { label: "Sim, completo", value: "completo" },
        ],
      },
      {
        id: "estrategias_offline", question: "Usa estratégias de marketing além do digital?",
        helpText: "Integrar estratégias offline com digital amplia o alcance e permite medir resultados.",
        type: "multi-choice",
        options: [
          { label: "Eventos", value: "eventos" }, { label: "Panfletos", value: "panfletos" },
          { label: "Networking", value: "networking" }, { label: "Parcerias locais", value: "parcerias" },
          { label: "Indicação", value: "indicacao" }, { label: "Nenhuma", value: "nenhuma" },
        ],
      },
    ],
  },
  {
    id: "objetivos_dores", title: "Objetivos e Dores", subtitle: "Onde quer chegar e o que está no caminho",
    icon: Target,
    questions: [
      {
        id: "meta_principal", question: "Qual seu objetivo principal com o marketing?",
        helpText: "Definir um objetivo claro permite focar os esforços e medir o sucesso das campanhas.",
        type: "choice",
        options: [
          { label: "Gerar mais leads", value: "leads", icon: Target },
          { label: "Aumentar vendas", value: "vendas", icon: DollarSign },
          { label: "Construir autoridade", value: "autoridade", icon: Sparkles },
          { label: "Reconhecimento de marca", value: "reconhecimento", icon: Megaphone },
        ],
      },
      {
        id: "prazo", question: "Em quanto tempo espera ver resultados?",
        helpText: "Marketing digital geralmente leva 3-6 meses para resultados consistentes. Expectativas alinhadas evitam frustrações.",
        type: "choice",
        options: [
          { label: "1-2 meses", value: "1-2" }, { label: "3-4 meses", value: "3-4" },
          { label: "5-6 meses", value: "5-6" }, { label: "Mais de 6 meses", value: "6+" },
        ],
      },
      {
        id: "dificuldades", question: "Quais são suas maiores dificuldades?",
        helpText: "Conhecer suas dores permite priorizar ações e recomendar soluções específicas.",
        type: "multi-choice",
        options: [
          { label: "Falta de tempo", value: "tempo" }, { label: "Não sei o que postar", value: "conteudo" },
          { label: "Não gero leads", value: "leads" }, { label: "Não tenho equipe", value: "equipe" },
          { label: "Baixo engajamento", value: "engajamento" }, { label: "Não sei usar tráfego pago", value: "trafego" },
          { label: "Não sei meu CAC/LTV", value: "cac_ltv" }, { label: "Dados desorganizados", value: "dados" },
          { label: "Concorrência forte", value: "concorrencia" },
        ],
      },
      {
        id: "tentativas", question: "O que já tentou que não funcionou?",
        helpText: "Saber o que não funcionou evita repetir erros e direciona para abordagens mais eficazes.",
        type: "text",
        placeholder: "Ex: Contratei um social media, mas não deu resultado...", optional: true,
      },
    ],
  },
];

/* ══════════════════════════════════════════════
   SCORING LOGIC — 7 AXES (unchanged)
   ══════════════════════════════════════════════ */

function computeScores(answers: Answers) {
  const scoreMap: Record<string, number> = {
    "Presença Digital": 0, "Estratégia": 0, "Conteúdo": 0,
    "Tráfego": 0, "Branding": 0, "Gestão de Dados": 0, "Vendas e Retenção": 0,
  };
  const maxMap: Record<string, number> = {
    "Presença Digital": 12, "Estratégia": 10, "Conteúdo": 6,
    "Tráfego": 12, "Branding": 9, "Gestão de Dados": 9, "Vendas e Retenção": 9,
  };

  // ── Presença Digital
  const redes = answers.redes_ativas;
  if (Array.isArray(redes) && !redes.includes("nenhuma"))
    scoreMap["Presença Digital"] += Math.min(redes.length, 3);

  const site = answers.tem_site as string;
  if (site === "otimizado") scoreMap["Presença Digital"] += 3;
  else if (site === "atualizado") scoreMap["Presença Digital"] += 2;
  else if (site === "desatualizado") scoreMap["Presença Digital"] += 1;

  const freq = answers.freq_publicacao as string;
  if (freq === "diario") scoreMap["Presença Digital"] += 3;
  else if (freq === "semanal") scoreMap["Presença Digital"] += 2;
  else if (freq === "esporadico") scoreMap["Presença Digital"] += 1;

  if (answers.url_site) scoreMap["Presença Digital"] += 1;
  if (answers.url_rede) scoreMap["Presença Digital"] += 2;

  // ── Estratégia
  if (answers.meta_principal) scoreMap["Estratégia"] += 2;
  if (answers.prazo) scoreMap["Estratégia"] += 2;
  if (answers.cliente_ideal && String(answers.cliente_ideal).length > 10) scoreMap["Estratégia"] += 3;
  else if (answers.cliente_ideal) scoreMap["Estratégia"] += 1;
  if (answers.modelo_negocio) scoreMap["Estratégia"] += 1;
  if (answers.como_decide && (answers.como_decide as string[]).length > 0) scoreMap["Estratégia"] += 2;

  // ── Conteúdo
  if (freq === "diario") scoreMap["Conteúdo"] += 3;
  else if (freq === "semanal") scoreMap["Conteúdo"] += 2;
  else if (freq === "esporadico") scoreMap["Conteúdo"] += 1;
  if (Array.isArray(redes) && !redes.includes("nenhuma"))
    scoreMap["Conteúdo"] += Math.min(redes.length, 3);

  // ── Tráfego
  const trafego = answers.investe_trafego as string;
  if (trafego === "otimizado") scoreMap["Tráfego"] += 3;
  else if (trafego === "mensal") scoreMap["Tráfego"] += 2;
  else if (trafego === "testou") scoreMap["Tráfego"] += 1;

  const valTrafego = answers.valor_trafego as string;
  if (valTrafego === "15k+") scoreMap["Tráfego"] += 3;
  else if (valTrafego === "5-15k") scoreMap["Tráfego"] += 3;
  else if (valTrafego === "2-5k") scoreMap["Tráfego"] += 2;
  else if (valTrafego === "500-2k") scoreMap["Tráfego"] += 1;

  const leads = answers.leads_mes as string;
  if (leads === "500+") scoreMap["Tráfego"] += 3;
  else if (leads === "100-500") scoreMap["Tráfego"] += 2;
  else if (leads === "31-100") scoreMap["Tráfego"] += 1;

  const conv = answers.taxa_conversao as string;
  if (conv === "30+") scoreMap["Tráfego"] += 3;
  else if (conv === "15-30") scoreMap["Tráfego"] += 2;
  else if (conv === "5-15") scoreMap["Tráfego"] += 1;

  // ── Branding
  const tempo = answers.tempo_mercado as string;
  if (tempo === "5+") scoreMap["Branding"] += 3;
  else if (tempo === "3-5") scoreMap["Branding"] += 2;
  else if (tempo === "1-3") scoreMap["Branding"] += 1;
  if (answers.segmento) scoreMap["Branding"] += 3;
  if (answers.diferencial && String(answers.diferencial).length > 5) scoreMap["Branding"] += 3;
  else if (answers.diferencial) scoreMap["Branding"] += 1;

  // ── Gestão de Dados
  const crm = answers.usa_crm as string;
  if (crm === "crm_pro") scoreMap["Gestão de Dados"] += 3;
  else if (crm === "crm_basico") scoreMap["Gestão de Dados"] += 2;
  else if (crm === "planilha") scoreMap["Gestão de Dados"] += 1;

  const hist = answers.historico_dados as string;
  if (hist === "completo") scoreMap["Gestão de Dados"] += 3;
  else if (hist === "parcial") scoreMap["Gestão de Dados"] += 1;

  if (answers.sabe_cac && answers.sabe_cac !== "nao_sei") scoreMap["Gestão de Dados"] += 3;

  // ── Vendas e Retenção
  if (conv === "30+") scoreMap["Vendas e Retenção"] += 3;
  else if (conv === "15-30") scoreMap["Vendas e Retenção"] += 2;
  else if (conv === "5-15") scoreMap["Vendas e Retenção"] += 1;

  const ltv = answers.ltv_medio as string;
  if (ltv === "1ano+") scoreMap["Vendas e Retenção"] += 3;
  else if (ltv === "3-12") scoreMap["Vendas e Retenção"] += 2;
  else if (ltv === "1-3") scoreMap["Vendas e Retenção"] += 1;

  const recompra = answers.processo_recompra as string;
  if (recompra === "estruturado") scoreMap["Vendas e Retenção"] += 3;
  else if (recompra === "informal") scoreMap["Vendas e Retenção"] += 1;

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
  { id: 1, label: "Iniciante", cor: "#dc2626", desc: "Seu marketing precisa de atenção urgente. Comece pelo básico." },
  { id: 2, label: "Básico", cor: "#ea580c", desc: "Você tem alguma estrutura, mas faltam consistência e estratégia." },
  { id: 3, label: "Intermediário", cor: "#eab308", desc: "Marketing organizado. Hora de otimizar e escalar resultados." },
  { id: 4, label: "Avançado", cor: "#16a34a", desc: "Marketing maduro e integrado. Foque em otimização contínua." },
];

function getNivel(pct: number) {
  if (pct <= 25) return niveis[0];
  if (pct <= 50) return niveis[1];
  if (pct <= 75) return niveis[2];
  return niveis[3];
}

/* ══════════════════════════════════════════════
   INSIGHTS, PROJECTIONS, ACTION PLAN (unchanged logic)
   ══════════════════════════════════════════════ */

function generateInsights(answers: Answers, scoreMap: Record<string, number>, maxMap: Record<string, number>) {
  const insights: { text: string; type: "success" | "warning" | "opportunity"; icon: React.ElementType }[] = [];
  const pct = (k: string) => maxMap[k] > 0 ? (scoreMap[k] / maxMap[k]) * 100 : 0;

  if (pct("Presença Digital") >= 70) insights.push({ text: "Sua presença digital está sólida. Continue investindo em conteúdo consistente.", type: "success", icon: CheckCircle2 });
  else insights.push({ text: "Sua presença digital precisa de atenção. Ative mais canais e publique com frequência.", type: "warning", icon: AlertCircle });

  if (pct("Tráfego") < 50) insights.push({ text: "Você não está aproveitando o potencial do tráfego pago. Campanhas estruturadas podem acelerar seus resultados.", type: "opportunity", icon: Lightbulb });
  if (pct("Conteúdo") < 50) insights.push({ text: "A produção de conteúdo está baixa. Com roteiros gerados por IA, você publica mais sem esforço.", type: "opportunity", icon: Lightbulb });
  else insights.push({ text: "Você já produz conteúdo regularmente. Diversifique formatos para aumentar o alcance.", type: "success", icon: CheckCircle2 });
  if (pct("Estratégia") < 50) insights.push({ text: "Falta clareza na estratégia. Defina persona, funil e KPIs para direcionar suas ações.", type: "warning", icon: AlertCircle });

  const siteVal = answers.tem_site as string;
  if (siteVal === "nao" || siteVal === "desatualizado") insights.push({ text: "Você precisa de um site ou landing page otimizada para capturar leads e converter visitantes.", type: "opportunity", icon: Lightbulb });
  if (answers.sabe_cac === "nao_sei") insights.push({ text: "Você não sabe seu CAC — sem isso, é impossível medir o ROI das suas campanhas de marketing.", type: "warning", icon: AlertCircle });
  if (pct("Gestão de Dados") < 50) insights.push({ text: "Seus dados não estão organizados. O CRM centraliza leads, pipeline e histórico de clientes.", type: "opportunity", icon: Lightbulb });
  if (answers.concorrentes_digital === "bastante" || answers.concorrentes_digital === "referencia") insights.push({ text: "Seus concorrentes investem forte em digital. Você precisa acelerar para não perder mercado.", type: "warning", icon: AlertCircle });
  if (pct("Vendas e Retenção") < 50) insights.push({ text: "Sem processo de fidelização, você perde receita recorrente. LTV baixo encarece o CAC.", type: "warning", icon: AlertCircle });
  if (answers.taxa_conversao === "0-5") insights.push({ text: "Taxa de conversão abaixo de 5%. Foque na qualificação de leads e melhoria do funil de vendas.", type: "opportunity", icon: Lightbulb });

  const offline = answers.estrategias_offline;
  if (Array.isArray(offline) && offline.length > 0 && !offline.includes("nenhuma")) insights.push({ text: "Você usa estratégias offline — integre com digital para medir ROI e amplificar resultados.", type: "opportunity", icon: Lightbulb });

  return insights;
}

function getLeadsProjection(pct: number) {
  const base = Math.round(pct * 0.5);
  return [
    { mes: "Mês 1", atual: base, comEstrategia: base + 10 },
    { mes: "Mês 2", atual: base + 3, comEstrategia: base + 25 },
    { mes: "Mês 3", atual: base + 5, comEstrategia: base + 45 },
    { mes: "Mês 4", atual: base + 6, comEstrategia: base + 70 },
    { mes: "Mês 5", atual: base + 7, comEstrategia: base + 95 },
    { mes: "Mês 6", atual: base + 8, comEstrategia: base + 125 },
  ];
}

function getRevenueProjection(answers: Answers, pct: number) {
  const ticketMap: Record<string, number> = { "0-100": 75, "100-500": 300, "500-2k": 1250, "2-5k": 3500, "5-15k": 10000, "15k+": 20000 };
  const convMap: Record<string, number> = { "nao_sei": 0.05, "0-5": 0.03, "5-15": 0.10, "15-30": 0.22, "30+": 0.35 };
  const ticket = ticketMap[answers.ticket_medio as string] || 500;
  const conv = convMap[answers.taxa_conversao as string] || 0.05;
  const baseLeads = Math.round(pct * 0.5);
  return [
    { mes: "Mês 1", atual: Math.round(baseLeads * conv * ticket), comEstrategia: Math.round((baseLeads + 10) * conv * ticket * 1.1) },
    { mes: "Mês 2", atual: Math.round((baseLeads + 3) * conv * ticket), comEstrategia: Math.round((baseLeads + 25) * conv * ticket * 1.15) },
    { mes: "Mês 3", atual: Math.round((baseLeads + 5) * conv * ticket), comEstrategia: Math.round((baseLeads + 45) * conv * ticket * 1.2) },
    { mes: "Mês 4", atual: Math.round((baseLeads + 6) * conv * ticket), comEstrategia: Math.round((baseLeads + 70) * conv * ticket * 1.25) },
    { mes: "Mês 5", atual: Math.round((baseLeads + 7) * conv * ticket), comEstrategia: Math.round((baseLeads + 95) * conv * ticket * 1.3) },
    { mes: "Mês 6", atual: Math.round((baseLeads + 8) * conv * ticket), comEstrategia: Math.round((baseLeads + 125) * conv * ticket * 1.35) },
  ];
}

function generateActionPlan(scoreMap: Record<string, number>, maxMap: Record<string, number>, answers: Answers) {
  const pct = (k: string) => maxMap[k] > 0 ? (scoreMap[k] / maxMap[k]) * 100 : 0;
  const fase1: string[] = ["Definir persona e posicionamento de marca"];
  const fase2: string[] = ["Implementar calendário editorial semanal"];
  const fase3: string[] = ["Otimizar campanhas com base em dados e ROI"];

  if (pct("Gestão de Dados") < 50) fase1.push("Implantar CRM e organizar base de clientes");
  if (pct("Presença Digital") < 50) fase1.push("Criar perfis profissionais e começar a publicar");
  if (answers.tem_site === "nao") fase1.push("Criar landing page de captura de leads");
  else if (answers.tem_site === "desatualizado") fase1.push("Atualizar site e otimizar para conversão");
  if (answers.sabe_cac === "nao_sei") fase1.push("Implementar rastreamento de CAC e métricas básicas");
  if (fase1.length < 3) fase1.push("Criar identidade visual e guia de comunicação");

  if (pct("Tráfego") < 50) fase2.push("Iniciar campanhas de tráfego pago com orçamento controlado");
  if (answers.concorrentes_digital === "bastante" || answers.concorrentes_digital === "referencia") fase2.push("Análise competitiva e estratégia de diferenciação");
  if (pct("Conteúdo") < 50) fase2.push("Diversificar formatos: carrossel, reels, stories");
  fase2.push("Configurar funil de nutrição por WhatsApp");
  if (fase2.length < 3) fase2.push("Otimizar conversões com A/B testing");

  if (pct("Vendas e Retenção") < 50) fase3.push("Criar programa de fidelização e recompra");
  fase3.push("Automatizar geração de conteúdo com IA");
  if (pct("Gestão de Dados") >= 50) fase3.push("Integrar dados do CRM com campanhas de marketing");
  else fase3.push("Escalar investimento nos canais com melhor retorno");

  const offline = answers.estrategias_offline;
  if (Array.isArray(offline) && offline.length > 0 && !offline.includes("nenhuma")) fase3.push("Integrar estratégias offline com rastreamento digital");

  return [
    { fase: "Fase 1 — Fundação", periodo: "Mês 1-2", cor: "hsl(var(--chart-blue))", items: fase1.slice(0, 5) },
    { fase: "Fase 2 — Crescimento", periodo: "Mês 3-4", cor: "hsl(var(--chart-orange))", items: fase2.slice(0, 5) },
    { fase: "Fase 3 — Escala", periodo: "Mês 5-6", cor: "hsl(var(--chart-green))", items: fase3.slice(0, 5) },
  ];
}

/* ══════════════════════════════════════════════
   PRODUCT CARDS
   ══════════════════════════════════════════════ */

interface ProductCard { name: string; description: string; icon: React.ElementType; path: string; scoreKey: string; kpi: string; }

const products: ProductCard[] = [
  { name: "Conteúdos", description: "Roteiros com IA baseados na sua estratégia. Feed, Stories e Reels planejados.", icon: FileText, path: "/cliente/conteudos", scoreKey: "Conteúdo", kpi: "0 roteiros gerados" },
  { name: "Redes Sociais", description: "Artes prontas para Feed e Story todo mês, com identidade visual da sua marca.", icon: Share2, path: "/cliente/redes-sociais", scoreKey: "Presença Digital", kpi: "0 artes criadas" },
  { name: "Sites", description: "Landing page otimizada para captura de leads e conversão de visitantes.", icon: Globe, path: "/cliente/sites", scoreKey: "Presença Digital", kpi: "Nenhum site criado" },
  { name: "Tráfego Pago", description: "Campanhas estruturadas para Meta, Google e TikTok Ads.", icon: DollarSign, path: "/cliente/trafego-pago", scoreKey: "Tráfego", kpi: "R$ 0 investidos" },
  { name: "CRM", description: "Centralize leads, pipeline e histórico. Gerencie dados para medir CAC, LTV e ROI.", icon: Database, path: "/cliente/crm", scoreKey: "Gestão de Dados", kpi: "0 leads no CRM" },
];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */

export default function ClientePlanoMarketing() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("estrategia");

  // Persistence hooks
  const { data: activeStrategy, isLoading: loadingStrategy } = useActiveStrategy();
  const { data: historyData = [], isLoading: loadingHistory } = useStrategyHistory();
  const saveStrategy = useSaveStrategy();

  // Load active strategy on mount
  useEffect(() => {
    if (activeStrategy) {
      setAnswers(activeStrategy.answers as Answers);
      setCompleted(true);
    }
  }, [activeStrategy]);

  const { scoreMap, maxMap, radarData, percentage } = useMemo(() => computeScores(answers), [answers]);
  const nivel = getNivel(percentage);
  const insights = useMemo(() => generateInsights(answers, scoreMap, maxMap), [answers, scoreMap, maxMap]);
  const leadsProjection = useMemo(() => getLeadsProjection(percentage), [percentage]);
  const revenueProjection = useMemo(() => getRevenueProjection(answers, percentage), [answers, percentage]);
  const actionPlan = useMemo(() => generateActionPlan(scoreMap, maxMap, answers), [scoreMap, maxMap, answers]);

  const handleChatComplete = (chatAnswers: Record<string, any>) => {
    setAnswers(chatAnswers as Answers);
    setCompleted(true);
    const result = computeScores(chatAnswers as Answers);
    const nivelResult = getNivel(result.percentage);
    saveStrategy.mutate(
      { answers: chatAnswers, score_percentage: result.percentage, nivel: nivelResult.label },
      {
        onSuccess: () => toast({ title: "Estratégia salva!", description: "Seu diagnóstico foi salvo e pode ser consultado a qualquer momento." }),
        onError: () => toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" }),
      }
    );
  };

  const handleRestart = () => {
    setAnswers({}); setCompleted(false); setActiveTab("estrategia");
  };

  const getPriorityBadge = (scoreKey: string) => {
    const pct = maxMap[scoreKey] > 0 ? (scoreMap[scoreKey] / maxMap[scoreKey]) * 100 : 0;
    if (pct < 50) return { label: "Prioridade Alta", className: "bg-destructive/10 text-destructive border-destructive/20" };
    if (pct < 75) return { label: "Recomendado", className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "Otimizar", className: "bg-success/10 text-success border-success/20" };
  };

  /* ── Main Render ── */
  if (loadingStrategy) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Estratégia de Marketing" subtitle="Carregando..." icon={<Megaphone className="w-5 h-5 text-primary" />} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Estratégia de Marketing"
        subtitle="Consultoria interativa para diagnosticar e evoluir seu marketing"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="estrategia" className="text-xs gap-1.5"><Activity className="w-3.5 h-3.5" /> Estratégia</TabsTrigger>
          <TabsTrigger value="produtos" className="text-xs gap-1.5" disabled={!completed}><Sparkles className="w-3.5 h-3.5" /> Produtos Recomendados</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><Clock className="w-3.5 h-3.5" /> Histórico de Estratégias</TabsTrigger>
        </TabsList>

        {/* ═══════ ESTRATÉGIA ═══════ */}
        <TabsContent value="estrategia" className="mt-4">
          {!completed ? (
            <ChatBriefing
              agent={AGENTS.sofia}
              steps={SOFIA_STEPS}
              onComplete={handleChatComplete}
              onCancel={() => navigate("/cliente/inicio")}
            />
          ) : (
            /* ── RESULT ── */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label mb-1">SUA ESTRATÉGIA DE MARKETING</p>
                  <p className="text-sm text-muted-foreground">Resultado baseado nas suas respostas</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRestart} className="gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Refazer Estratégia
                </Button>
              </div>

              {/* Termômetro + Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DiagnosticoTermometro pontuacao={percentage} nivel={nivel} />
                <Card className="glass-card">
                  <CardContent className="py-6">
                    <p className="section-label mb-4">RADAR POR ÁREA — 7 EIXOS</p>
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
                <p className="section-label mb-3">INSIGHTS DA SUA ESTRATÉGIA</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((ins, i) => (
                    <Card key={i} className={`border-l-4 ${
                      ins.type === "success" ? "border-l-success" :
                      ins.type === "warning" ? "border-l-destructive" : "border-l-chart-blue"
                    }`}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                            ins.type === "success" ? "text-success" :
                            ins.type === "warning" ? "text-destructive" : "text-chart-blue"
                          }`} />
                          <p className="text-sm flex-1">{ins.text}</p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={() => setActiveTab("produtos")}>
                            Iniciar agora <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Projeção Leads */}
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="section-label mb-4">PROJEÇÃO DE RESULTADOS — LEADS</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Sem Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={leadsProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...leadsProjection.map(d => d.comEstrategia))]} />
                            <Tooltip />
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
                            <Tooltip />
                            <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} name="Com Estratégia" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projeção Faturamento */}
              <Card className="glass-card">
                <CardContent className="py-6">
                  <p className="section-label mb-4">PROJEÇÃO DE FATURAMENTO ESTIMADO</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Sem Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...revenueProjection.map(d => d.comEstrategia))]} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]} />
                            <Area type="monotone" dataKey="atual" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted) / 0.3)" strokeWidth={2} name="Cenário Atual" strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-success mb-2">Com Estratégia</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, Math.max(...revenueProjection.map(d => d.comEstrategia))]} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]} />
                            <Area type="monotone" dataKey="comEstrategia" stroke="hsl(var(--chart-green))" fill="hsl(var(--chart-green) / 0.1)" strokeWidth={2} name="Com Estratégia" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plano de Ação Dinâmico */}
              <div>
                <p className="section-label mb-3">PLANO DE AÇÃO EM 3 FASES</p>
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

              {/* CTA */}
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold">Veja os produtos recomendados para você</p>
                      <p className="text-xs text-muted-foreground">Baseado na sua estratégia, indicamos as melhores ferramentas</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab("produtos")} className="gap-2">
                    Ver Produtos <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ═══════ PRODUTOS ═══════ */}
        <TabsContent value="produtos" className="mt-4 space-y-6">
          <div>
            <p className="section-label mb-1">PRODUTOS RECOMENDADOS</p>
            <p className="text-sm text-muted-foreground">Ferramentas que vão acelerar sua estratégia de marketing</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => {
              const badge = getPriorityBadge(p.scoreKey);
              return (
                <Card key={p.name} className="glass-card hover-lift group cursor-pointer" onClick={() => navigate(p.path)}>
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                          <p.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-base font-bold">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{p.kpi}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${badge.className}`}>{badge.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-medium">Acessar módulo</span>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════ HISTÓRICO ═══════ */}
        <TabsContent value="historico" className="mt-4 space-y-6">
          <div>
            <p className="section-label mb-1">HISTÓRICO DE ESTRATÉGIAS</p>
            <p className="text-sm text-muted-foreground">Acompanhe a evolução do seu marketing ao longo do tempo</p>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : historyData.length === 0 && !activeStrategy ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">Nenhuma estratégia gerada ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Complete o wizard para ver seu primeiro diagnóstico aqui</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Current active strategy */}
              {activeStrategy && (
                <Card className="glass-card ring-2 ring-primary/20">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {new Date(activeStrategy.created_at).toLocaleDateString("pt-BR")}
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">Ativa</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">Score: {activeStrategy.score_percentage}% — {activeStrategy.nivel}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{activeStrategy.nivel}</Badge>
                  </CardContent>
                </Card>
              )}
              {/* Past strategies */}
              {historyData.map((h, i) => (
                <Card key={h.id} className="glass-card">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        {i < historyData.length - 1 && <div className="w-0.5 h-6 bg-border mt-1" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{new Date(h.created_at).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs text-muted-foreground">Score: {h.score_percentage}% — {h.nivel}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{h.nivel}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
