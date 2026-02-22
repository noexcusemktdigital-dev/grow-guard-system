import type {
  OnboardingStatus, OnboardingPhase, MeetingStatus, TaskStatus,
  ChecklistItem, OnboardingUnit, OnboardingMeeting, OnboardingIndicators,
  OnboardingTask, OnboardingAlert,
} from "@/types/onboarding";

// ── Default Checklist ──

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

function buildChecklist(completedCount: number): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map((item, i) => ({
    ...item,
    id: `cl-${i + 1}`,
    concluido: i < completedCount,
    data: i < completedCount ? "2025-01-15" : undefined,
    responsavel: i < completedCount ? "CS" : undefined,
  }));
}

// ── Mock Data ──

export const mockOnboardings: OnboardingUnit[] = [
  { id: "ob1", unidadeId: "u5", unidadeNome: "Bauru – Márcia", responsavelCS: "Davi", dataInicio: "2025-01-10", status: "Em implantação", checklist: buildChecklist(9) },
  { id: "ob2", unidadeId: "u6", unidadeNome: "Batatais – Alisson", responsavelCS: "Lucas", dataInicio: "2024-11-01", status: "Em acompanhamento", checklist: buildChecklist(13) },
  { id: "ob3", unidadeId: "u3", unidadeNome: "Maringá – Gabriel", responsavelCS: "Amanda", dataInicio: "2024-06-01", status: "Implantado com sucesso", checklist: buildChecklist(16) },
  { id: "ob4", unidadeId: "u7", unidadeNome: "Bahia – Gregory", responsavelCS: "Davi", dataInicio: "2025-01-20", status: "Em risco", checklist: buildChecklist(5) },
  { id: "ob5", unidadeId: "u4", unidadeNome: "Maringá – Victor", responsavelCS: "Lucas", dataInicio: "2025-02-15", status: "Não iniciado", checklist: buildChecklist(0) },
];

export const mockMeetings: OnboardingMeeting[] = [
  { id: "mt1", onboardingId: "ob1", tipo: "Kickoff", data: "2025-01-12", status: "Realizada", resumo: "Apresentação da estrutura e cronograma de implantação.", proximosPassos: "Liberar acessos e agendar treinamento." },
  { id: "mt2", onboardingId: "ob1", tipo: "Estratégica", data: "2025-01-25", status: "Realizada", resumo: "Definição de metas comerciais para os primeiros 30 dias.", proximosPassos: "Configurar funil e iniciar prospecção." },
  { id: "mt3", onboardingId: "ob2", tipo: "Kickoff", data: "2024-11-05", status: "Realizada", resumo: "Alinhamento inicial com franqueado.", proximosPassos: "Iniciar configuração comercial." },
  { id: "mt4", onboardingId: "ob2", tipo: "Performance", data: "2025-01-15", status: "Agendada", resumo: "Revisão de indicadores do primeiro trimestre.", proximosPassos: "Ajustar metas se necessário." },
  { id: "mt5", onboardingId: "ob4", tipo: "Kickoff", data: "2025-02-01", status: "Cancelada", resumo: "Kickoff cancelado pelo franqueado.", proximosPassos: "Reagendar urgentemente." },
];

export const mockIndicators: OnboardingIndicators[] = [
  { onboardingId: "ob1", clientesAtivos: 8, receita: 12500, propostasEnviadas: 15, metaAtingidaPct: 62, leadsGerados: 34 },
  { onboardingId: "ob2", clientesAtivos: 14, receita: 28700, propostasEnviadas: 22, metaAtingidaPct: 85, leadsGerados: 51 },
  { onboardingId: "ob3", clientesAtivos: 22, receita: 45000, propostasEnviadas: 35, metaAtingidaPct: 100, leadsGerados: 78 },
  { onboardingId: "ob4", clientesAtivos: 2, receita: 3200, propostasEnviadas: 5, metaAtingidaPct: 18, leadsGerados: 9 },
];

export const mockTasks: OnboardingTask[] = [
  { id: "tk1", onboardingId: "ob1", tarefa: "Configurar funil de vendas", responsavel: "Franqueado", prazo: "2025-02-01", status: "Concluída" },
  { id: "tk2", onboardingId: "ob1", tarefa: "Realizar primeira campanha de prospecção", responsavel: "CS", prazo: "2025-02-10", status: "Aberta" },
  { id: "tk3", onboardingId: "ob2", tarefa: "Analisar DRE do primeiro mês", responsavel: "CS", prazo: "2025-01-30", status: "Concluída" },
  { id: "tk4", onboardingId: "ob4", tarefa: "Reagendar reunião de Kickoff", responsavel: "CS", prazo: "2025-02-05", status: "Atrasada" },
  { id: "tk5", onboardingId: "ob4", tarefa: "Liberar acessos do sistema", responsavel: "CS", prazo: "2025-01-25", status: "Atrasada", observacao: "Franqueado não respondeu" },
];

// ── Helpers ──

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
    if (!kickoff) alerts.push({ tipo: "kickoff", mensagem: "Kickoff não realizado", onboardingId: ob.id, unidadeNome: ob.unidadeNome });
    if (ob.status === "Em risco") alerts.push({ tipo: "progresso_baixo", mensagem: "Unidade em risco", onboardingId: ob.id, unidadeNome: ob.unidadeNome });
    const atrasadas = tasks.filter((t) => t.onboardingId === ob.id && t.status === "Atrasada");
    if (atrasadas.length > 0) alerts.push({ tipo: "inatividade", mensagem: `${atrasadas.length} tarefa(s) atrasada(s)`, onboardingId: ob.id, unidadeNome: ob.unidadeNome });
  }
  return alerts;
}

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
