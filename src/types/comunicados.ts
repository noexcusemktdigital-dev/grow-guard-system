// @ts-nocheck
// Comunicados types and constants

export type ComunicadoStatus = "Ativo" | "Programado" | "Expirado" | "Rascunho" | "Arquivado";
export type ComunicadoTipo = "Informativo" | "Atualização de sistema" | "Alerta operacional" | "Campanha" | "Institucional" | "Urgente";
export type ComunicadoPrioridade = "Normal" | "Alta" | "Crítica";
export type PublicoAlvo = "Franqueadora" | "Internos (Matriz)" | "Franqueados" | "Clientes finais" | "Todos";

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  imagemUrl?: string;
  linkExterno?: string;
  anexo?: string;
  publico: PublicoAlvo[];
  unidadesEspecificas: string[];
  tipo: ComunicadoTipo;
  prioridade: ComunicadoPrioridade;
  mostrarDashboard: boolean;
  mostrarPopup: boolean;
  exigirConfirmacao: boolean;
  dataProgramada?: string;
  dataExpiracao?: string;
  status: ComunicadoStatus;
  autorId: string;
  autorNome: string;
  criadoEm: string;
  atualizadoEm: string;
  attachmentUrl?: string;
}

export interface ComunicadoVisualizacao {
  id: string;
  comunicadoId: string;
  usuarioId: string;
  usuarioNome: string;
  unidadeNome: string;
  visualizadoEm: string;
  confirmadoEm?: string;
}

// Helper functions
export function getStatusColor(status: ComunicadoStatus): string {
  const map: Record<ComunicadoStatus, string> = {
    Ativo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Programado: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    Expirado: "bg-muted text-muted-foreground",
    Rascunho: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    Arquivado: "bg-muted text-muted-foreground/70",
  };
  return map[status];
}

export function getPrioridadeColor(prioridade: ComunicadoPrioridade): string {
  const map: Record<ComunicadoPrioridade, string> = {
    Normal: "bg-muted text-muted-foreground",
    Alta: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    "Crítica": "bg-red-500/15 text-red-700 dark:text-red-400",
  };
  return map[prioridade];
}

export function getTipoColor(tipo: ComunicadoTipo): string {
  const map: Record<ComunicadoTipo, string> = {
    Informativo: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    "Atualização de sistema": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
    "Alerta operacional": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    Campanha: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
    Institucional: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
    Urgente: "bg-red-500/15 text-red-700 dark:text-red-400",
  };
  return map[tipo];
}
