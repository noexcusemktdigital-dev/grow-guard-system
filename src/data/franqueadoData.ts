// ── Franqueado (Unidade) mock data ──

export interface FranqueadoIndicador {
  label: string;
  valor: string;
  trend?: string;
  trendUp?: boolean;
}

export interface FranqueadoMeta {
  label: string;
  atual: number;
  objetivo: number;
  unidade: string;
}

export interface FranqueadoChamado {
  id: string;
  titulo: string;
  status: "aberto" | "em_andamento" | "resolvido";
  prioridade: "urgente" | "alta" | "normal" | "baixa";
  categoria: string;
  criadoEm: string;
  ultimaAtualizacao: string;
  mensagens: { autor: string; texto: string; data: string; isUnidade: boolean }[];
}

export interface FranqueadoLead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
  etapa: string;
  valor?: number;
  origem: string;
  criadoEm: string;
  ultimoContato: string;
  notas?: string;
}

export interface FranqueadoProposta {
  id: string;
  clienteNome: string;
  valor: number;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  criadaEm: string;
  validaAte: string;
  servicos: string[];
}

export interface FranqueadoContrato {
  id: string;
  clienteNome: string;
  valor: number;
  status: "ativo" | "encerrado" | "pendente";
  inicioEm: string;
  fimEm: string;
  tipo: string;
}

export interface FranqueadoFinanceiroResumo {
  clientesAtivos: number;
  receitaMes: number;
  repasse: number;
  royalties: number;
  sistemaMensalidade: number;
  dreDisponivel: boolean;
}

export interface MaterialCategoria {
  id: string;
  nome: string;
  descricao: string;
  arquivos: number;
  icone: string;
}

// ── Helpers ──

export function getFranqueadoIndicadores(): FranqueadoIndicador[] {
  return [
    { label: "Clientes Ativos", valor: "47", trend: "+3 este mês", trendUp: true },
    { label: "Receita do Mês", valor: "R$ 38.500", trend: "+12% vs anterior", trendUp: true },
    { label: "Propostas em Andamento", valor: "8", trend: "3 enviadas hoje", trendUp: true },
    { label: "Leads Novos", valor: "15", trend: "+5 esta semana", trendUp: true },
  ];
}

export function getFranqueadoMetas(): FranqueadoMeta[] {
  return [
    { label: "Faturamento Mensal", atual: 38500, objetivo: 50000, unidade: "R$" },
    { label: "Novos Contratos", atual: 4, objetivo: 8, unidade: "contratos" },
    { label: "Leads Convertidos", atual: 6, objetivo: 12, unidade: "leads" },
  ];
}

export function getFranqueadoRanking() {
  return { posicao: 3, total: 12, pontos: 1850, nivel: "Ouro" as const };
}

export function getFranqueadoChamados(): FranqueadoChamado[] {
  return [
    {
      id: "CH-101", titulo: "Dúvida sobre repasse mensal", status: "em_andamento",
      prioridade: "normal", categoria: "Financeiro", criadoEm: "2026-02-18",
      ultimaAtualizacao: "2026-02-20",
      mensagens: [
        { autor: "Davi", texto: "O repasse deste mês está diferente do esperado", data: "2026-02-18 09:00", isUnidade: true },
        { autor: "Financeiro Matriz", texto: "Vamos verificar. Pode enviar o extrato?", data: "2026-02-18 14:30", isUnidade: false },
        { autor: "Davi", texto: "Segue em anexo", data: "2026-02-19 08:00", isUnidade: true },
      ],
    },
    {
      id: "CH-102", titulo: "Solicitação de material de campanha", status: "aberto",
      prioridade: "baixa", categoria: "Marketing", criadoEm: "2026-02-20",
      ultimaAtualizacao: "2026-02-20",
      mensagens: [
        { autor: "Davi", texto: "Precisamos de artes para campanha local de março", data: "2026-02-20 10:00", isUnidade: true },
      ],
    },
    {
      id: "CH-100", titulo: "Erro no sistema de agendamento", status: "resolvido",
      prioridade: "alta", categoria: "Operações", criadoEm: "2026-02-10",
      ultimaAtualizacao: "2026-02-12",
      mensagens: [
        { autor: "Davi", texto: "Sistema não está salvando agendamentos", data: "2026-02-10 11:00", isUnidade: true },
        { autor: "Suporte Matriz", texto: "Corrigido. Por favor teste novamente.", data: "2026-02-12 16:00", isUnidade: false },
      ],
    },
  ];
}

export const etapasCRM = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico",
  "Estratégia", "Proposta", "Venda", "Perdido",
] as const;

export function getFranqueadoLeads(): FranqueadoLead[] {
  return [
    { id: "L-1", nome: "Carlos Mendes", email: "carlos@empresa.com", telefone: "(41) 99999-1111", empresa: "Tech Solutions", etapa: "Proposta", valor: 4500, origem: "Indicação", criadoEm: "2026-02-01", ultimoContato: "2026-02-20" },
    { id: "L-2", nome: "Ana Beatriz", email: "ana@startup.io", telefone: "(41) 99999-2222", empresa: "StartUp.io", etapa: "Diagnóstico", valor: 3200, origem: "Site", criadoEm: "2026-02-05", ultimoContato: "2026-02-19" },
    { id: "L-3", nome: "Roberto Lima", email: "roberto@corp.com", telefone: "(41) 99999-3333", empresa: "Corp Brasil", etapa: "Primeiro Contato", origem: "Evento", criadoEm: "2026-02-15", ultimoContato: "2026-02-18" },
    { id: "L-4", nome: "Juliana Costa", email: "ju@digital.com", telefone: "(41) 99999-4444", empresa: "Digital Co", etapa: "Follow-up", valor: 2800, origem: "LinkedIn", criadoEm: "2026-02-10", ultimoContato: "2026-02-20" },
    { id: "L-5", nome: "Fernando Alves", email: "fer@agency.com", telefone: "(41) 99999-5555", empresa: "Agency Pro", etapa: "Novo Lead", origem: "Indicação", criadoEm: "2026-02-20", ultimoContato: "2026-02-20" },
    { id: "L-6", nome: "Patricia Rocha", email: "pat@loja.com", telefone: "(41) 99999-6666", empresa: "Loja Express", etapa: "Estratégia", valor: 5000, origem: "Google Ads", criadoEm: "2026-01-28", ultimoContato: "2026-02-17" },
    { id: "L-7", nome: "Marcos Silva", email: "marcos@ind.com", telefone: "(41) 99999-7777", empresa: "Indústria MS", etapa: "Venda", valor: 6200, origem: "Indicação", criadoEm: "2026-01-15", ultimoContato: "2026-02-15" },
    { id: "L-8", nome: "Camila Duarte", email: "camila@rest.com", telefone: "(41) 99999-8888", etapa: "Perdido", valor: 1500, origem: "Site", criadoEm: "2026-01-20", ultimoContato: "2026-02-05" },
  ];
}

export function getFranqueadoPropostas(): FranqueadoProposta[] {
  return [
    { id: "P-1", clienteNome: "Carlos Mendes", valor: 4500, status: "enviada", criadaEm: "2026-02-18", validaAte: "2026-03-18", servicos: ["Marketing Digital", "SEO"] },
    { id: "P-2", clienteNome: "Patricia Rocha", valor: 5000, status: "rascunho", criadaEm: "2026-02-20", validaAte: "2026-03-20", servicos: ["Gestão de Redes", "Tráfego Pago", "CRM"] },
    { id: "P-3", clienteNome: "Marcos Silva", valor: 6200, status: "aceita", criadaEm: "2026-02-01", validaAte: "2026-03-01", servicos: ["Branding", "Marketing Digital", "Consultoria"] },
    { id: "P-4", clienteNome: "Camila Duarte", valor: 1500, status: "recusada", criadaEm: "2026-01-25", validaAte: "2026-02-25", servicos: ["Social Media"] },
  ];
}

export function getFranqueadoContratos(): FranqueadoContrato[] {
  return [
    { id: "CT-1", clienteNome: "Marcos Silva", valor: 6200, status: "ativo", inicioEm: "2026-02-15", fimEm: "2027-02-15", tipo: "Anual" },
    { id: "CT-2", clienteNome: "Tech Solutions", valor: 3800, status: "ativo", inicioEm: "2026-01-01", fimEm: "2026-07-01", tipo: "Semestral" },
    { id: "CT-3", clienteNome: "Digital Agency", valor: 2500, status: "ativo", inicioEm: "2025-12-01", fimEm: "2026-06-01", tipo: "Semestral" },
    { id: "CT-4", clienteNome: "Loja Express", valor: 4000, status: "pendente", inicioEm: "2026-03-01", fimEm: "2027-03-01", tipo: "Anual" },
    { id: "CT-5", clienteNome: "StartUp ABC", valor: 1800, status: "encerrado", inicioEm: "2025-06-01", fimEm: "2025-12-01", tipo: "Semestral" },
  ];
}

export function getFranqueadoFinanceiro(): FranqueadoFinanceiroResumo {
  return {
    clientesAtivos: 47,
    receitaMes: 38500,
    repasse: 7700,
    royalties: 385,
    sistemaMensalidade: 250,
    dreDisponivel: true,
  };
}

export function getMateriaisCategorias(): MaterialCategoria[] {
  return [
    { id: "1", nome: "Redes Sociais", descricao: "Posts e stories mensais", arquivos: 45, icone: "Instagram" },
    { id: "2", nome: "Campanhas", descricao: "Materiais de campanhas sazonais", arquivos: 23, icone: "Megaphone" },
    { id: "3", nome: "Portfólio", descricao: "Cases e apresentações", arquivos: 12, icone: "Briefcase" },
    { id: "4", nome: "Institucional", descricao: "Materiais da marca", arquivos: 18, icone: "Building2" },
    { id: "5", nome: "Arquivos da Marca", descricao: "Logos, fontes e guidelines", arquivos: 8, icone: "Palette" },
    { id: "6", nome: "Fundos de Reunião", descricao: "Backgrounds para videochamadas", arquivos: 6, icone: "Monitor" },
  ];
}

// ── Dados independentes da unidade ──

export interface FranqueadoMensagemDia {
  categoria: string;
  texto: string;
  autor: string;
}

export interface FranqueadoEvento {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  visibilidade: "pessoal" | "unidade" | "rede";
  editavel: boolean;
}

export interface FranqueadoComunicado {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: "Crítica" | "Alta" | "Normal";
  autorNome: string;
  criadoEm: string;
  destinatario: "rede" | "unidade";
  lido: boolean;
}

export function getFranqueadoMensagemDia(): FranqueadoMensagemDia {
  return {
    categoria: "Motivação",
    texto: "Cada cliente que você conquista hoje é a base do faturamento de amanhã. Faça valer cada contato!",
    autor: "Diretoria da Rede",
  };
}

export function getFranqueadoEventos(): FranqueadoEvento[] {
  return [
    { id: "FE-1", titulo: "Reunião com cliente Tech Solutions", data: "2026-02-21", hora: "09:00", tipo: "Reunião", visibilidade: "pessoal", editavel: true },
    { id: "FE-2", titulo: "Treinamento da equipe comercial", data: "2026-02-21", hora: "14:00", tipo: "Treinamento", visibilidade: "unidade", editavel: true },
    { id: "FE-3", titulo: "Workshop de Vendas — Rede Nacional", data: "2026-02-22", hora: "10:00", tipo: "Workshop", visibilidade: "rede", editavel: false },
    { id: "FE-4", titulo: "Follow-up lead Carlos Mendes", data: "2026-02-22", hora: "11:00", tipo: "Comercial", visibilidade: "pessoal", editavel: true },
    { id: "FE-5", titulo: "Apresentação de resultados mensal", data: "2026-02-24", hora: "15:00", tipo: "Gestão", visibilidade: "unidade", editavel: true },
    { id: "FE-6", titulo: "Webinar: Tendências de Marketing 2026", data: "2026-02-25", hora: "19:00", tipo: "Webinar", visibilidade: "rede", editavel: false },
    { id: "FE-7", titulo: "Almoço networking — parceiros locais", data: "2026-02-26", hora: "12:00", tipo: "Networking", visibilidade: "pessoal", editavel: true },
    { id: "FE-8", titulo: "Convenção Anual da Rede", data: "2026-03-05", hora: "08:00", tipo: "Evento", visibilidade: "rede", editavel: false },
    { id: "FE-9", titulo: "Reunião de alinhamento semanal", data: "2026-02-23", hora: "09:30", tipo: "Reunião", visibilidade: "unidade", editavel: true },
    { id: "FE-10", titulo: "Entrega de proposta — Digital Co", data: "2026-02-27", hora: "16:00", tipo: "Comercial", visibilidade: "pessoal", editavel: true },
  ];
}

export function getFranqueadoComunicadosUnidade(): FranqueadoComunicado[] {
  return [
    { id: "FC-1", titulo: "Nova política de repasse atualizada", conteudo: "A partir de março de 2026, o repasse mensal passará a ser calculado com base na receita líquida confirmada, considerando somente os pagamentos efetivamente compensados. Leiam o documento completo no repositório de contratos.", prioridade: "Crítica", autorNome: "Financeiro Matriz", criadoEm: "2026-02-20", destinatario: "rede", lido: false },
    { id: "FC-2", titulo: "Campanha de Março — materiais disponíveis", conteudo: "Os materiais visuais da campanha de março já estão disponíveis na seção Materiais da Marca. Inclui posts para redes sociais, stories animados e banners para site. Façam o download e adaptem com os dados locais da unidade.", prioridade: "Alta", autorNome: "Marketing Matriz", criadoEm: "2026-02-19", destinatario: "rede", lido: false },
    { id: "FC-3", titulo: "Manutenção programada do sistema", conteudo: "O sistema ficará indisponível para manutenção no dia 28/02 das 22h às 02h. Salvem todos os trabalhos em andamento antes desse horário. Nenhum dado será perdido.", prioridade: "Normal", autorNome: "TI Matriz", criadoEm: "2026-02-18", destinatario: "rede", lido: false },
    { id: "FC-4", titulo: "Parabéns pela meta atingida!", conteudo: "A unidade Curitiba atingiu 110% da meta de faturamento em janeiro! Continuem com esse excelente trabalho. A diretoria preparou um bônus especial que será detalhado na próxima reunião mensal.", prioridade: "Normal", autorNome: "Diretoria", criadoEm: "2026-02-17", destinatario: "unidade", lido: false },
    { id: "FC-5", titulo: "Atualização de contrato padrão", conteudo: "O template do contrato padrão foi atualizado para incluir a nova cláusula de LGPD. Todos os novos contratos devem usar o modelo v3.2 disponível no Gerador de Propostas. Contratos antigos não precisam ser alterados.", prioridade: "Alta", autorNome: "Jurídico Matriz", criadoEm: "2026-02-15", destinatario: "rede", lido: false },
    { id: "FC-6", titulo: "Novo módulo Academy disponível", conteudo: "O módulo 'Vendas Consultivas Avançadas' já está liberado no Academy. São 8 aulas com certificado ao final. Prazo recomendado para conclusão: 30 dias. Excelente para a equipe comercial da unidade.", prioridade: "Normal", autorNome: "Academy Matriz", criadoEm: "2026-02-14", destinatario: "rede", lido: false },
  ];
}

export function getDiagnosticoPerguntas() {
  return [
    { id: 1, secao: "Presença Digital", pergunta: "A empresa possui site atualizado?", tipo: "sim_nao" as const },
    { id: 2, secao: "Presença Digital", pergunta: "Quais redes sociais utiliza?", tipo: "multipla" as const, opcoes: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube", "Nenhuma"] },
    { id: 3, secao: "Presença Digital", pergunta: "Frequência de postagens?", tipo: "selecao" as const, opcoes: ["Diário", "Semanal", "Quinzenal", "Mensal", "Irregular", "Não posta"] },
    { id: 4, secao: "Marketing", pergunta: "Investe em tráfego pago?", tipo: "sim_nao" as const },
    { id: 5, secao: "Marketing", pergunta: "Orçamento mensal de marketing?", tipo: "selecao" as const, opcoes: ["Até R$500", "R$500-2.000", "R$2.000-5.000", "R$5.000-10.000", "Acima de R$10.000", "Não investe"] },
    { id: 6, secao: "Vendas", pergunta: "Possui processo de vendas estruturado?", tipo: "sim_nao" as const },
    { id: 7, secao: "Vendas", pergunta: "Utiliza CRM?", tipo: "sim_nao" as const },
    { id: 8, secao: "Vendas", pergunta: "Faturamento mensal médio?", tipo: "selecao" as const, opcoes: ["Até R$10k", "R$10k-50k", "R$50k-100k", "R$100k-500k", "Acima de R$500k"] },
  ];
}
