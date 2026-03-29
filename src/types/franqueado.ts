// @ts-nocheck
// Franqueado types (extracted from franqueadoData.ts)

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
  diagnosticoId?: string;
  contratoId?: string;
  propostaId?: string;
  tarefas?: { id: string; titulo: string; concluida: boolean; data: string }[];
}

export interface FranqueadoProposta {
  id: string;
  clienteNome: string;
  valor: number;
  valorExcedente?: number;
  emissorExcedente?: "franqueado" | "matriz";
  tipo?: "Recorrente" | "Unitário";
  prazo?: string;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  criadaEm: string;
  validaAte: string;
  servicos: string[];
  leadId?: string;
}

export interface FranqueadoContrato {
  id: string;
  clienteNome: string;
  valorBase: number;
  valorExcedente: number;
  emissorExcedente: "franqueado" | "matriz" | null;
  status: "ativo" | "encerrado" | "pendente" | "vencendo";
  inicioEm: string;
  fimEm: string;
  tipo: "Recorrente" | "Unitário";
  assinado: boolean;
  propostaId?: string;
}

export interface FranqueadoFinanceiroResumo {
  receitaBruta: number;
  repasse: number;
  excedenteGerado: number;
  excedenteEmitido: number;
  valorLiquidoEstimado: number;
  royalties: number;
  sistemaMensalidade: number;
  resultadoEstimado: number;
}

export interface FranqueadoEntrada {
  id: string;
  clienteNome: string;
  tipo: "Recorrente" | "Unitário" | "SaaS" | "Excedente";
  valorContrato: number;
  repasseValor: number;
  excedente: number;
  emissorExcedente: "franqueado" | "matriz" | null;
  valorFinalFranqueado: number;
  statusCobranca: string;
  recebido: boolean;
  data: string;
}

export interface FranqueadoSaida {
  id: string;
  descricao: string;
  tipo: string;
  valor: number;
  categoria: "Pessoas" | "Estrutura" | "Marketing" | "Ferramentas" | "Outros";
  mes: string;
  status: "Pago" | "Pendente" | "Agendado";
}

export interface FranqueadoFechamento {
  id: string;
  mes: string;
  receita: number;
  repasse: number;
  excedenteFranqueado: number;
  royalties: number;
  sistema: number;
  valorLiquido: number;
  status: "Disponível" | "Pago" | "Pendente";
}

export interface FranqueadoAlertaFinanceiro {
  tipo: "warning" | "info" | "clock";
  mensagem: string;
}

export interface MaterialCategoria {
  id: string;
  nome: string;
  descricao: string;
  arquivos: number;
  icone: string;
}

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

export const etapasCRM = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico",
  "Estratégia", "Proposta", "Venda", "Perdido",
] as const;
