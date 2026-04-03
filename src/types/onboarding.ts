// Onboarding types and constants (extracted from onboardingData.ts)

export type OnboardingStatus = "Não iniciado" | "Em implantação" | "Em acompanhamento" | "Implantado com sucesso" | "Em risco" | "Encerrado";
export type OnboardingPhase = "Pré-Implantação" | "Estruturação" | "Primeiros Movimentos" | "Consolidação";
export type MeetingType = "Kickoff" | "Estratégica" | "Comercial" | "Performance" | "Revisão mensal";
export type MeetingStatus = "Agendada" | "Realizada" | "Cancelada";
export type TaskStatus = "Aberta" | "Concluída" | "Atrasada";

export interface ChecklistItem {
  id: string;
  phase: OnboardingPhase;
  descricao: string;
  concluido: boolean;
  data?: string;
  responsavel?: string;
  observacao?: string;
}

export interface OnboardingUnit {
  id: string;
  unidadeId: string;
  unidadeNome: string;
  responsavelCS: string;
  dataInicio: string;
  status: OnboardingStatus;
  checklist: ChecklistItem[];
}

export interface OnboardingMeeting {
  id: string;
  onboardingId: string;
  tipo: MeetingType;
  data: string;
  status: MeetingStatus;
  resumo: string;
  proximosPassos: string;
  anexo?: string;
}

export interface OnboardingIndicators {
  onboardingId: string;
  clientesAtivos: number;
  receita: number;
  propostasEnviadas: number;
  metaAtingidaPct: number;
  leadsGerados: number;
}

export interface OnboardingTask {
  id: string;
  onboardingId: string;
  tarefa: string;
  responsavel: string;
  prazo: string;
  status: TaskStatus;
  observacao?: string;
}

export interface OnboardingAlert {
  tipo: "inatividade" | "kickoff" | "sem_cliente" | "progresso_baixo";
  mensagem: string;
  onboardingId: string;
  unidadeNome: string;
}

// Constants
export const STATUS_COLORS: Record<OnboardingStatus, string> = {
  "Não iniciado": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  "Em implantação": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Em acompanhamento": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "Implantado com sucesso": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Em risco": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Encerrado": "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  "Agendada": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Realizada": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Cancelada": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  "Aberta": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Concluída": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Atrasada": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const CS_RESPONSAVEIS = ["Davi", "Lucas", "Amanda"];

export const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id">[] = [
  { phase: "Pré-Implantação", descricao: "Assinatura do contrato", concluido: false },
  { phase: "Pré-Implantação", descricao: "Pagamento da taxa", concluido: false },
  { phase: "Pré-Implantação", descricao: "Acesso ao sistema liberado", concluido: false },
  { phase: "Pré-Implantação", descricao: "Acesso Academy liberado", concluido: false },
  { phase: "Estruturação", descricao: "Configuração comercial", concluido: false },
  { phase: "Estruturação", descricao: "Definição de metas", concluido: false },
  { phase: "Estruturação", descricao: "Treinamento inicial", concluido: false },
  { phase: "Estruturação", descricao: "Apresentação dos produtos", concluido: false },
  { phase: "Primeiros Movimentos", descricao: "Primeiro lead gerado", concluido: false },
  { phase: "Primeiros Movimentos", descricao: "Primeira proposta enviada", concluido: false },
  { phase: "Primeiros Movimentos", descricao: "Primeiro contrato fechado", concluido: false },
  { phase: "Primeiros Movimentos", descricao: "Primeira campanha ativa", concluido: false },
  { phase: "Consolidação", descricao: "Pipeline organizado", concluido: false },
  { phase: "Consolidação", descricao: "Metas ativas", concluido: false },
  { phase: "Consolidação", descricao: "Primeira DRE analisada", concluido: false },
  { phase: "Consolidação", descricao: "Ajustes estratégicos", concluido: false },
];

// Helpers
export function getOnboardingProgress(checklist: ChecklistItem[]): number {
  if (checklist.length === 0) return 0;
  return Math.round((checklist.filter((c) => c.concluido).length / checklist.length) * 100);
}

export function getCurrentPhase(checklist: ChecklistItem[]): OnboardingPhase {
  const phases: OnboardingPhase[] = ["Pré-Implantação", "Estruturação", "Primeiros Movimentos", "Consolidação"];
  for (const phase of phases) {
    const items = checklist.filter((c) => c.phase === phase);
    if (items.some((c) => !c.concluido)) return phase;
  }
  return "Consolidação";
}

export function getOnboardingAlerts(onboardings: OnboardingUnit[], meetings: OnboardingMeeting[], tasks: OnboardingTask[]): OnboardingAlert[] {
  const alerts: OnboardingAlert[] = [];
  for (const ob of onboardings) {
    if (ob.status === "Implantado com sucesso" || ob.status === "Encerrado") continue;
    const kickoff = meetings.find((m) => m.onboardingId === ob.id && m.tipo === "Kickoff" && m.status === "Realizada");
    if (!kickoff) {
      alerts.push({ tipo: "kickoff", mensagem: "Kickoff não realizado", onboardingId: ob.id, unidadeNome: ob.unidadeNome });
    }
    if (ob.status === "Em risco") {
      alerts.push({ tipo: "progresso_baixo", mensagem: "Unidade em risco", onboardingId: ob.id, unidadeNome: ob.unidadeNome });
    }
    const atrasadas = tasks.filter((t) => t.onboardingId === ob.id && t.status === "Atrasada");
    if (atrasadas.length > 0) {
      alerts.push({ tipo: "inatividade", mensagem: `${atrasadas.length} tarefa(s) atrasada(s)`, onboardingId: ob.id, unidadeNome: ob.unidadeNome });
    }
  }
  return alerts;
}
