// Comunicados types and constants (extracted from comunicadosData.ts)

export type ComunicadoStatus = "Ativo" | "Programado" | "Expirado" | "Rascunho" | "Arquivado";
export type ComunicadoTipo = "Informativo" | "Atualização de sistema" | "Alerta operacional" | "Campanha" | "Institucional" | "Urgente";
export type ComunicadoPrioridade = "Normal" | "Alta" | "Crítica";
export type PublicoAlvo = "Franqueadora" | "Franqueados" | "Clientes finais" | "Todos";

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

// Mock data (placeholder for UI display until fully backed by database)
export const mockComunicados: Comunicado[] = [
  { id: "com-1", titulo: "Alteração na Taxa de Royalties — Vigência Março 2026", conteudo: "<p>Informamos que a partir de <strong>01/03/2026</strong>, a taxa de royalties será reajustada.</p>", publico: ["Franqueados"], unidadesEspecificas: [], tipo: "Urgente", prioridade: "Crítica", mostrarDashboard: true, mostrarPopup: true, exigirConfirmacao: true, status: "Ativo", autorId: "u1", autorNome: "Davi", criadoEm: "2026-02-10T09:00:00", atualizadoEm: "2026-02-10T09:00:00" },
  { id: "com-2", titulo: "Campanha de Verão 2026 — Kit de Materiais", conteudo: "<p>A campanha de verão já está no ar!</p>", publico: ["Franqueados", "Clientes finais"], unidadesEspecificas: [], tipo: "Campanha", prioridade: "Alta", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, status: "Ativo", autorId: "u3", autorNome: "Amanda", criadoEm: "2026-02-05T14:30:00", atualizadoEm: "2026-02-05T14:30:00" },
  { id: "com-3", titulo: "Atualização do Sistema v3.2", conteudo: "<p>O sistema foi atualizado para a versão 3.2.</p>", publico: ["Todos"], unidadesEspecificas: [], tipo: "Atualização de sistema", prioridade: "Normal", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, status: "Ativo", autorId: "u2", autorNome: "Lucas", criadoEm: "2026-02-18T10:00:00", atualizadoEm: "2026-02-18T10:00:00" },
  { id: "com-7", titulo: "Boas-vindas aos Novos Colaboradores", conteudo: "<p>Damos as boas-vindas a todos os novos colaboradores!</p>", publico: ["Todos"], unidadesEspecificas: [], tipo: "Institucional", prioridade: "Normal", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, status: "Ativo", autorId: "u1", autorNome: "Davi", criadoEm: "2026-02-01T08:00:00", atualizadoEm: "2026-02-01T08:00:00" },
  { id: "com-8", titulo: "Manutenção Programada — Servidor dia 25/02", conteudo: "<p>O sistema ficará indisponível das 02:00 às 06:00.</p>", publico: ["Franqueadora", "Franqueados"], unidadesEspecificas: [], tipo: "Alerta operacional", prioridade: "Alta", mostrarDashboard: true, mostrarPopup: true, exigirConfirmacao: false, status: "Ativo", autorId: "u2", autorNome: "Lucas", criadoEm: "2026-02-20T15:00:00", atualizadoEm: "2026-02-20T15:00:00" },
];

export const mockVisualizacoes: ComunicadoVisualizacao[] = [
  { id: "v1", comunicadoId: "com-1", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-10T10:15:00", confirmadoEm: "2026-02-10T10:16:00" },
  { id: "v2", comunicadoId: "com-1", usuarioId: "f2", usuarioNome: "Ana Costa", unidadeNome: "Unidade Norte", visualizadoEm: "2026-02-10T11:30:00", confirmadoEm: "2026-02-10T11:32:00" },
  { id: "v5", comunicadoId: "com-2", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-06T08:00:00" },
  { id: "v8", comunicadoId: "com-3", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-18T12:00:00" },
];

export function getVisualizacoes(comunicadoId: string): ComunicadoVisualizacao[] {
  return mockVisualizacoes.filter((v) => v.comunicadoId === comunicadoId);
}
