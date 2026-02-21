// ===== DADOS MOCK — CLIENTE FINAL (SaaS NOEXCUSE) =====

export interface ClienteKpi {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
}

export interface ChecklistItem {
  id: string;
  title: string;
  type: "Comercial" | "Marketing" | "Gestão";
  origin: "auto" | "manual";
  done: boolean;
}

export interface ClienteNotificacao {
  id: string;
  type: "Leads" | "Chat" | "Campanhas" | "Metas";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface GamificacaoMedalha {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
}

export interface GamificacaoRanking {
  position: number;
  name: string;
  points: number;
  avatar: string;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  value: number;
  temperature: "Quente" | "Morno" | "Frio";
  stage: "novo" | "contato" | "proposta" | "fechado" | "perdido";
  responsible: string;
  notes: string;
  createdAt: string;
}

export interface ClienteCampanha {
  id: string;
  name: string;
  objective: string;
  status: "Ativa" | "Pausada" | "Finalizada";
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

export interface ClienteConteudo {
  id: string;
  title: string;
  network: "Instagram" | "Facebook" | "LinkedIn" | "TikTok";
  status: "Rascunho" | "Agendado" | "Publicado";
  date: string;
  type: "Post" | "Story" | "Reels" | "Artigo";
}

export interface ClienteScript {
  id: string;
  title: string;
  category: "Scripts de Vendas" | "Roteiros de Ligação" | "Modelos de Proposta" | "Estratégias";
  description: string;
  content: string;
  updatedAt: string;
}

export interface ClienteDisparo {
  id: string;
  type: "Email" | "Mensagem" | "Campanha Interna";
  subject: string;
  recipients: number;
  status: "Enviado" | "Agendado" | "Rascunho";
  sentAt: string;
  openRate?: number;
}

export interface ClienteSite {
  id: string;
  name: string;
  url: string;
  status: "Ativo" | "Inativo";
  leads: number;
  conversion: number;
}

// ===== GETTERS =====

export function getClienteDashboardKpis(): ClienteKpi[] {
  return [
    { label: "Receita Estimada", value: "R$ 47.500", sublabel: "+12% vs mês anterior", trend: "up" },
    { label: "Leads do Mês", value: "134", sublabel: "89 qualificados", trend: "up" },
    { label: "Taxa de Conversão", value: "18,5%", sublabel: "+2.3pp", trend: "up" },
    { label: "Meta vs Realizado", value: "72%", sublabel: "R$ 34.200 / R$ 47.500", trend: "neutral" },
  ];
}

export function getChecklistItems(): ChecklistItem[] {
  return [
    { id: "1", title: "Ligar para 5 leads quentes", type: "Comercial", origin: "auto", done: false },
    { id: "2", title: "Postar conteúdo no Instagram", type: "Marketing", origin: "auto", done: true },
    { id: "3", title: "Ajustar campanha Google Ads", type: "Marketing", origin: "auto", done: false },
    { id: "4", title: "Responder mensagens do chat", type: "Comercial", origin: "auto", done: true },
    { id: "5", title: "Revisar proposta cliente ABC", type: "Comercial", origin: "manual", done: false },
    { id: "6", title: "Atualizar CRM com novos leads", type: "Gestão", origin: "auto", done: false },
    { id: "7", title: "Agendar reunião com equipe", type: "Gestão", origin: "manual", done: true },
    { id: "8", title: "Criar copy para campanha semanal", type: "Marketing", origin: "auto", done: false },
  ];
}

export function getClienteNotificacoes(): ClienteNotificacao[] {
  return [
    { id: "1", type: "Leads", title: "Novo lead captado", description: "João Silva preencheu o formulário de contato", time: "Há 5 min", read: false },
    { id: "2", type: "Chat", title: "Nova mensagem", description: "Maria respondeu no chat interno", time: "Há 15 min", read: false },
    { id: "3", type: "Campanhas", title: "Campanha pausada", description: "Google Ads atingiu limite de orçamento", time: "Há 1h", read: false },
    { id: "4", type: "Metas", title: "Meta atingida!", description: "Você bateu 100% da meta de leads", time: "Há 2h", read: true },
    { id: "5", type: "Leads", title: "Lead qualificado", description: "Ana Costa foi marcada como quente", time: "Há 3h", read: true },
    { id: "6", type: "Chat", title: "Menção em grupo", description: "Carlos mencionou você no canal Vendas", time: "Há 4h", read: true },
    { id: "7", type: "Campanhas", title: "Campanha finalizada", description: "Campanha Black Friday encerrou com sucesso", time: "Ontem", read: true },
    { id: "8", type: "Metas", title: "Ranking atualizado", description: "Você subiu para 2º lugar no ranking", time: "Ontem", read: true },
  ];
}

export function getGamificacaoData() {
  return {
    points: 2450,
    level: 7,
    levelName: "Estrategista",
    nextLevel: 3000,
    medals: [
      { id: "1", name: "Primeiro Lead", emoji: "🎯", description: "Captou o primeiro lead", unlocked: true },
      { id: "2", name: "Vendedor Nato", emoji: "💰", description: "10 vendas fechadas", unlocked: true },
      { id: "3", name: "Maratonista", emoji: "🏃", description: "30 dias seguidos de checklist completo", unlocked: true },
      { id: "4", name: "Influencer", emoji: "📱", description: "50 posts publicados", unlocked: true },
      { id: "5", name: "Mestre do CRM", emoji: "📊", description: "100 leads gerenciados", unlocked: false },
      { id: "6", name: "Top Closer", emoji: "🏆", description: "R$ 100k em vendas", unlocked: false },
    ] as GamificacaoMedalha[],
    ranking: [
      { position: 1, name: "Carlos Mendes", points: 3200, avatar: "CM" },
      { position: 2, name: "Você", points: 2450, avatar: "VS" },
      { position: 3, name: "Ana Costa", points: 2100, avatar: "AC" },
      { position: 4, name: "Pedro Lima", points: 1800, avatar: "PL" },
      { position: 5, name: "Julia Santos", points: 1650, avatar: "JS" },
    ] as GamificacaoRanking[],
  };
}

export function getCrmLeads(): CrmLead[] {
  return [
    { id: "1", name: "João Silva", phone: "(11) 99999-1111", email: "joao@email.com", value: 5000, temperature: "Quente", stage: "novo", responsible: "Você", notes: "Indicação do Google", createdAt: "2026-02-20" },
    { id: "2", name: "Maria Oliveira", phone: "(11) 99999-2222", email: "maria@email.com", value: 12000, temperature: "Quente", stage: "contato", responsible: "Você", notes: "Retornar ligação", createdAt: "2026-02-18" },
    { id: "3", name: "Carlos Mendes", phone: "(11) 99999-3333", email: "carlos@email.com", value: 8000, temperature: "Morno", stage: "proposta", responsible: "Ana", notes: "Aguardando aprovação", createdAt: "2026-02-15" },
    { id: "4", name: "Ana Costa", phone: "(11) 99999-4444", email: "ana@email.com", value: 15000, temperature: "Quente", stage: "fechado", responsible: "Você", notes: "Contrato assinado", createdAt: "2026-02-10" },
    { id: "5", name: "Pedro Lima", phone: "(11) 99999-5555", email: "pedro@email.com", value: 3000, temperature: "Frio", stage: "perdido", responsible: "Carlos", notes: "Sem orçamento", createdAt: "2026-02-08" },
    { id: "6", name: "Fernanda Souza", phone: "(11) 99999-6666", email: "fernanda@email.com", value: 7500, temperature: "Morno", stage: "novo", responsible: "Você", notes: "Veio do Instagram", createdAt: "2026-02-21" },
    { id: "7", name: "Ricardo Alves", phone: "(11) 99999-7777", email: "ricardo@email.com", value: 20000, temperature: "Quente", stage: "contato", responsible: "Ana", notes: "Grande potencial", createdAt: "2026-02-19" },
    { id: "8", name: "Patrícia Nunes", phone: "(11) 99999-8888", email: "patricia@email.com", value: 6000, temperature: "Frio", stage: "proposta", responsible: "Você", notes: "Comparando concorrentes", createdAt: "2026-02-14" },
  ];
}

export function getClienteCampanhas(): ClienteCampanha[] {
  return [
    { id: "1", name: "Lançamento Produto X", objective: "Gerar leads", status: "Ativa", budget: 5000, spent: 3200, leads: 45, conversions: 8, startDate: "2026-02-01", endDate: "2026-02-28" },
    { id: "2", name: "Remarketing Site", objective: "Conversão", status: "Ativa", budget: 2000, spent: 1100, leads: 22, conversions: 5, startDate: "2026-02-05", endDate: "2026-03-05" },
    { id: "3", name: "Black Friday", objective: "Vendas diretas", status: "Finalizada", budget: 8000, spent: 7800, leads: 120, conversions: 32, startDate: "2025-11-20", endDate: "2025-11-30" },
    { id: "4", name: "Institucional Q1", objective: "Brand awareness", status: "Pausada", budget: 3000, spent: 900, leads: 12, conversions: 1, startDate: "2026-01-15", endDate: "2026-03-15" },
  ];
}

export function getClienteConteudos(): ClienteConteudo[] {
  return [
    { id: "1", title: "Dicas de produtividade", network: "Instagram", status: "Publicado", date: "2026-02-20", type: "Post" },
    { id: "2", title: "Bastidores do time", network: "Instagram", status: "Agendado", date: "2026-02-22", type: "Story" },
    { id: "3", title: "Case de sucesso cliente", network: "LinkedIn", status: "Rascunho", date: "2026-02-23", type: "Artigo" },
    { id: "4", title: "Tutorial produto", network: "Instagram", status: "Agendado", date: "2026-02-24", type: "Reels" },
    { id: "5", title: "Promoção relâmpago", network: "Facebook", status: "Publicado", date: "2026-02-19", type: "Post" },
    { id: "6", title: "Tendências 2026", network: "LinkedIn", status: "Rascunho", date: "2026-02-25", type: "Artigo" },
  ];
}

export function getClienteScripts(): ClienteScript[] {
  return [
    { id: "1", title: "Abordagem inicial por telefone", category: "Scripts de Vendas", description: "Script para primeiro contato telefônico", content: "Olá [Nome], aqui é o [Seu Nome] da [Empresa]. Vi que você demonstrou interesse em...", updatedAt: "2026-02-18" },
    { id: "2", title: "Roteiro de qualificação", category: "Roteiros de Ligação", description: "Perguntas-chave para qualificar o lead", content: "1. Qual o principal desafio que você enfrenta hoje?\n2. Qual o orçamento disponível?\n3. Quem é o decisor?", updatedAt: "2026-02-15" },
    { id: "3", title: "Proposta comercial padrão", category: "Modelos de Proposta", description: "Template de proposta para serviços", content: "PROPOSTA COMERCIAL\n\nEmpresa: [Nome]\nData: [Data]\n\nObjetivo: ...\nInvestimento: ...\nPrazo: ...", updatedAt: "2026-02-10" },
    { id: "4", title: "Estratégia de follow-up", category: "Estratégias", description: "Sequência de 7 toques para conversão", content: "Dia 1: Primeiro contato\nDia 3: E-mail de valor\nDia 5: Ligação de acompanhamento\nDia 7: Conteúdo relevante...", updatedAt: "2026-02-12" },
  ];
}

export function getClienteDisparos(): ClienteDisparo[] {
  return [
    { id: "1", type: "Email", subject: "Oferta especial de fevereiro", recipients: 250, status: "Enviado", sentAt: "2026-02-18", openRate: 32.5 },
    { id: "2", type: "Mensagem", subject: "Lembrete de reunião", recipients: 15, status: "Enviado", sentAt: "2026-02-20", openRate: 85 },
    { id: "3", type: "Email", subject: "Newsletter semanal", recipients: 480, status: "Agendado", sentAt: "2026-02-23" },
    { id: "4", type: "Campanha Interna", subject: "Atualização de preços", recipients: 8, status: "Rascunho", sentAt: "" },
  ];
}

export function getClienteSites(): ClienteSite[] {
  return [
    { id: "1", name: "Landing Page Principal", url: "empresa.com/lp", status: "Ativo", leads: 89, conversion: 4.2 },
    { id: "2", name: "Página de Captura Ebook", url: "empresa.com/ebook", status: "Ativo", leads: 45, conversion: 12.8 },
    { id: "3", name: "LP Black Friday", url: "empresa.com/bf", status: "Inativo", leads: 230, conversion: 8.5 },
  ];
}

export function getPlanoVendasDefaults() {
  return {
    // Aba 1 — Visão Geral
    periodo: "mensal" as const,
    receitaAtual: 47500,
    receitaDesejada: 65000,
    mercado: "Serviços digitais",
    tipoVenda: "B2B" as const,
    // Aba 2 — Meta Financeira
    metaFaturamento: 65000,
    ticketMedio: 4500,
    conversaoVenda: 20,
    conversaoProposta: 30,
    // Aba 3 — Estrutura Comercial
    vendedores: 3,
    canais: ["Google Ads", "Instagram", "Indicação"] as string[],
    ferramentas: ["CRM", "WhatsApp", "Email"] as string[],
    tempoFechamento: 15,
    processoEstruturado: true,
    // Aba 4 — Mercado
    concorrentes: ["Concorrente A", "Concorrente B", ""] as string[],
    diferenciais: "Atendimento personalizado e resultados comprovados",
    posicionamento: "Na média",
    saturacao: 5,
    // Aba 5 — Diagnóstico
    respostasDiagnostico: [4, 3, 3, 2, 4] as number[],
    // extras
    vendasRealizadas: 34200,
    leadsAtivos: 134,
  };
}

// backward compat
export function getPlanoVendasData() {
  const d = getPlanoVendasDefaults();
  return {
    metaMensal: d.metaFaturamento,
    ticketMedio: d.ticketMedio,
    taxaConversao: d.conversaoVenda,
    leadsNecessarios: 78,
    vendasRealizadas: d.vendasRealizadas,
    leadsAtivos: d.leadsAtivos,
  };
}

export function getPlanoMarketingData() {
  return {
    objetivo: "Aumentar leads qualificados em 25%",
    orcamento: 12000,
    gasto: 7200,
    canais: [
      { name: "Instagram", active: true, frequency: "Diário" },
      { name: "Facebook", active: true, frequency: "3x/semana" },
      { name: "LinkedIn", active: true, frequency: "2x/semana" },
      { name: "Google Ads", active: true, frequency: "Contínuo" },
      { name: "TikTok", active: false, frequency: "—" },
      { name: "E-mail Marketing", active: true, frequency: "Semanal" },
    ],
  };
}

export function getTrafegoPagoData() {
  return {
    kpis: [
      { label: "Investimento", value: "R$ 7.200", trend: "up" as const },
      { label: "CPC Médio", value: "R$ 2,45", trend: "down" as const },
      { label: "CPL", value: "R$ 18,90", trend: "down" as const },
      { label: "Leads Gerados", value: "380", trend: "up" as const },
      { label: "Conversão", value: "4,8%", trend: "up" as const },
    ],
    campanhas: [
      { name: "Google Search — Produto X", platform: "Google", investment: 2500, leads: 120, cpl: 20.83 },
      { name: "Meta — Remarketing", platform: "Meta", investment: 1800, leads: 95, cpl: 18.95 },
      { name: "Google Display", platform: "Google", investment: 1500, leads: 85, cpl: 17.65 },
      { name: "Meta — Lookalike", platform: "Meta", investment: 1400, leads: 80, cpl: 17.50 },
    ],
  };
}

export function getRelatorioDashboardData() {
  return {
    vendasPorPeriodo: [
      { period: "Sem 1", vendas: 8500, leads: 32 },
      { period: "Sem 2", vendas: 9200, leads: 38 },
      { period: "Sem 3", vendas: 7800, leads: 29 },
      { period: "Sem 4", vendas: 8700, leads: 35 },
    ],
    conversaoPorCanal: [
      { canal: "Google Ads", taxa: 22 },
      { canal: "Instagram", taxa: 15 },
      { canal: "Indicação", taxa: 35 },
      { canal: "Site", taxa: 12 },
      { canal: "LinkedIn", taxa: 8 },
    ],
    receitaAcumulada: [
      { mes: "Set", receita: 38000 },
      { mes: "Out", receita: 42000 },
      { mes: "Nov", receita: 55000 },
      { mes: "Dez", receita: 48000 },
      { mes: "Jan", receita: 44000 },
      { mes: "Fev", receita: 34200 },
    ],
  };
}

export function getChatConversas() {
  return [
    {
      id: "1", name: "Canal Vendas", lastMessage: "Carlos: Fechei o cliente ABC!", time: "10:32",
      messages: [
        { id: "m1", sender: "Carlos", text: "Pessoal, alguém tem o contato do João?", time: "10:15", avatar: "CM" },
        { id: "m2", sender: "Você", text: "Tenho sim, vou enviar por aqui", time: "10:18", avatar: "VS" },
        { id: "m3", sender: "Carlos", text: "Fechei o cliente ABC!", time: "10:32", avatar: "CM" },
      ],
    },
    {
      id: "2", name: "Canal Marketing", lastMessage: "Ana: Post agendado para amanhã", time: "09:45",
      messages: [
        { id: "m1", sender: "Ana", text: "Criei o conteúdo para o reels", time: "09:30", avatar: "AC" },
        { id: "m2", sender: "Ana", text: "Post agendado para amanhã", time: "09:45", avatar: "AC" },
      ],
    },
    {
      id: "3", name: "Equipe Geral", lastMessage: "Pedro: Reunião às 14h confirmada", time: "Ontem",
      messages: [
        { id: "m1", sender: "Pedro", text: "Reunião às 14h confirmada", time: "17:00", avatar: "PL" },
      ],
    },
  ];
}
