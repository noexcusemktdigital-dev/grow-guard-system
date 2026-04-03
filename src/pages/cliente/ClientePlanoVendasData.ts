import {
  Building2, Wallet, Users, Target, Megaphone, Layers, Zap, BarChart3,
} from "lucide-react";

/* ══════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════ */

export type Answers = Record<string, string | string[] | number>;

export interface StrategyQuestion {
  id: string;
  question: string;
  subtitle?: string;
  helpText?: string;
  type: "choice" | "multi-choice" | "text";
  options?: { label: string; value: string; icon?: React.ElementType }[];
  placeholder?: string;
  optional?: boolean;
}

export interface StrategySection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  questions: StrategyQuestion[];
}

/* ══════════════════════════════════════════════
   METRIC OPTIONS (shared)
   ══════════════════════════════════════════════ */
export const METRIC_OPTIONS = [
  { value: "revenue", label: "Faturamento" },
  { value: "leads", label: "Leads Gerados" },
  { value: "conversions", label: "Taxa de Conversão" },
  { value: "contracts", label: "Contratos Fechados" },
  { value: "meetings", label: "Reuniões" },
  { value: "avg_ticket", label: "Ticket Médio" },
];

export const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* ══════════════════════════════════════════════
   DIAGNOSTIC SECTIONS & QUESTIONS (~25 questions in 8 sections)
   ══════════════════════════════════════════════ */

export const salesSections: StrategySection[] = [
  {
    id: "negocio", title: "Sobre o Negócio", subtitle: "Contexto básico para entender sua operação",
    icon: Building2,
    questions: [
      {
        id: "segmento", question: "Qual é o segmento da sua empresa?", type: "choice",
        helpText: "Identifique o setor principal de atuação para personalizar as recomendações do plano.",
        options: [
          { label: "Serviços", value: "servicos" }, { label: "Varejo / Loja", value: "varejo" },
          { label: "Alimentação / Restaurante", value: "alimentacao" }, { label: "Saúde / Clínica", value: "saude" },
          { label: "Estética / Beleza", value: "estetica" }, { label: "Educação / Cursos", value: "educacao" },
          { label: "Tecnologia / SaaS", value: "tecnologia" }, { label: "Indústria", value: "industria" },
          { label: "Construção / Engenharia", value: "construcao" }, { label: "Financeiro / Contábil", value: "financeiro" },
          { label: "Advocacia / Jurídico", value: "advocacia" }, { label: "Imobiliário", value: "imobiliario" },
          { label: "Automotivo", value: "automotivo" }, { label: "Agronegócio", value: "agronegocio" },
          { label: "Moda / Vestuário", value: "moda" }, { label: "Fitness / Academia", value: "fitness" },
          { label: "Turismo / Hotelaria", value: "turismo" }, { label: "Logística / Transporte", value: "logistica" },
          { label: "Marketing / Publicidade", value: "marketing" }, { label: "Consultoria", value: "consultoria" },
          { label: "Pet / Veterinário", value: "pet" }, { label: "Eventos / Entretenimento", value: "eventos" },
          { label: "Energia / Solar", value: "energia" }, { label: "Franquias", value: "franquias" },
          { label: "E-commerce", value: "ecommerce" }, { label: "Seguros", value: "seguros" },
          { label: "Odontologia", value: "odontologia" }, { label: "Psicologia / Coaching", value: "psicologia" },
          { label: "Arquitetura / Design", value: "arquitetura" }, { label: "Fotografia / Audiovisual", value: "fotografia" },
          { label: "Outro (digitar)", value: "outro" },
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
   NIVEIS
   ══════════════════════════════════════════════ */

export const niveis = [
  { id: 1, label: "Inicial", cor: "#dc2626", desc: "Seu comercial precisa ser construído do zero. Priorize documentar o processo." },
  { id: 2, label: "Estruturando", cor: "#ea580c", desc: "Algumas bases existem, mas falta consistência e padronização." },
  { id: 3, label: "Escalável", cor: "#eab308", desc: "Estrutura sólida, pronta para escalar com ajustes pontuais." },
  { id: 4, label: "Alta Performance", cor: "#16a34a", desc: "Máquina comercial rodando com previsibilidade e dados." },
];

export function getNivel(pct: number) {
  if (pct <= 25) return niveis[0];
  if (pct <= 50) return niveis[1];
  if (pct <= 75) return niveis[2];
  return niveis[3];
}
