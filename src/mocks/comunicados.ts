import type {
  Comunicado, ComunicadoVisualizacao, ComunicadoStatus,
  ComunicadoPrioridade, ComunicadoTipo,
} from "@/types/comunicados";
import { format } from "date-fns";

export { type Comunicado, type ComunicadoVisualizacao };

export const mockComunicados: Comunicado[] = [
  { id: "com-1", titulo: "Alteração na Taxa de Royalties — Vigência Março 2026", conteudo: "<p>Informamos que a partir de <strong>01/03/2026</strong>, a taxa de royalties será reajustada de 5% para 5,5% sobre o faturamento bruto.</p><p>Essa atualização está prevista em contrato (cláusula 12.3) e visa acompanhar os investimentos em tecnologia e suporte da rede.</p><p>Qualquer dúvida, entre em contato com o setor financeiro.</p>", publico: ["Franqueados"], unidadesEspecificas: [], tipo: "Urgente", prioridade: "Crítica", mostrarDashboard: true, mostrarPopup: true, exigirConfirmacao: true, status: "Ativo", autorId: "u1", autorNome: "Davi", criadoEm: "2026-02-10T09:00:00", atualizadoEm: "2026-02-10T09:00:00" },
  { id: "com-2", titulo: "Campanha de Verão 2026 — Kit de Materiais", conteudo: "<p>A campanha de verão já está no ar! Acessem o Drive Corporativo para baixar os materiais gráficos atualizados.</p><p>Prazo para implementação nas unidades: até 28/02/2026.</p>", imagemUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600", linkExterno: "https://drive.google.com", publico: ["Franqueados", "Clientes finais"], unidadesEspecificas: [], tipo: "Campanha", prioridade: "Alta", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, status: "Ativo", autorId: "u3", autorNome: "Amanda", criadoEm: "2026-02-05T14:30:00", atualizadoEm: "2026-02-05T14:30:00" },
  { id: "com-3", titulo: "Atualização do Sistema v3.2 — Novo Módulo de Atendimento", conteudo: "<p>O sistema foi atualizado para a versão 3.2. Principais novidades:</p><ul><li>Kanban de atendimento com drag-and-drop</li><li>Filtros avançados por prioridade</li><li>Histórico de interações</li></ul><p>Recomendamos que todos acessem o módulo para se familiarizar.</p>", publico: ["Todos"], unidadesEspecificas: [], tipo: "Atualização de sistema", prioridade: "Normal", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, status: "Ativo", autorId: "u2", autorNome: "Lucas", criadoEm: "2026-02-18T10:00:00", atualizadoEm: "2026-02-18T10:00:00" },
  { id: "com-4", titulo: "Convenção Nacional de Franqueados 2026", conteudo: "<p>A Convenção Nacional será realizada nos dias 15 e 16 de abril em São Paulo. Inscrições abertas a partir de 01/03/2026.</p><p>Mais detalhes serão enviados por e-mail.</p>", publico: ["Franqueados", "Franqueadora"], unidadesEspecificas: [], tipo: "Institucional", prioridade: "Normal", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, dataProgramada: "2026-03-01T08:00:00", status: "Programado", autorId: "u1", autorNome: "Davi", criadoEm: "2026-02-20T16:00:00", atualizadoEm: "2026-02-20T16:00:00" },
  { id: "com-5", titulo: "Promoção Black Friday 2025 — Encerrada", conteudo: "<p>A campanha Black Friday 2025 foi encerrada com sucesso. Resultados consolidados disponíveis no módulo Metas & Ranking.</p>", publico: ["Franqueados"], unidadesEspecificas: [], tipo: "Campanha", prioridade: "Normal", mostrarDashboard: false, mostrarPopup: false, exigirConfirmacao: false, dataExpiracao: "2025-12-01T23:59:00", status: "Expirado", autorId: "u3", autorNome: "Amanda", criadoEm: "2025-11-20T09:00:00", atualizadoEm: "2025-12-01T23:59:00" },
  { id: "com-6", titulo: "Nova Política de Trocas e Devoluções", conteudo: "<p>Rascunho da nova política de trocas. Aguardando aprovação jurídica antes de publicação.</p>", anexo: "politica-trocas-v2.pdf", publico: ["Franqueados", "Clientes finais"], unidadesEspecificas: [], tipo: "Informativo", prioridade: "Normal", mostrarDashboard: false, mostrarPopup: false, exigirConfirmacao: true, status: "Rascunho", autorId: "u2", autorNome: "Lucas", criadoEm: "2026-02-19T11:00:00", atualizadoEm: "2026-02-19T11:00:00" },
  { id: "com-7", titulo: "Boas-vindas aos Novos Colaboradores — Fevereiro 2026", conteudo: "<p>Damos as boas-vindas a todos os novos colaboradores que ingressaram na rede em fevereiro!</p><p>Acessem o módulo Treinamentos para completar o onboarding obrigatório.</p>", publico: ["Todos"], unidadesEspecificas: [], tipo: "Institucional", prioridade: "Normal", mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false, status: "Ativo", autorId: "u1", autorNome: "Davi", criadoEm: "2026-02-01T08:00:00", atualizadoEm: "2026-02-01T08:00:00" },
  { id: "com-8", titulo: "Manutenção Programada — Servidor dia 25/02", conteudo: "<p><strong>Atenção:</strong> O sistema ficará indisponível das 02:00 às 06:00 do dia 25/02 para manutenção programada no servidor.</p><p>Planejem suas atividades com antecedência.</p>", publico: ["Franqueadora", "Franqueados"], unidadesEspecificas: [], tipo: "Alerta operacional", prioridade: "Alta", mostrarDashboard: true, mostrarPopup: true, exigirConfirmacao: false, status: "Ativo", autorId: "u2", autorNome: "Lucas", criadoEm: "2026-02-20T15:00:00", atualizadoEm: "2026-02-20T15:00:00" },
];

export const mockVisualizacoes: ComunicadoVisualizacao[] = [
  { id: "v1", comunicadoId: "com-1", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-10T10:15:00", confirmadoEm: "2026-02-10T10:16:00" },
  { id: "v2", comunicadoId: "com-1", usuarioId: "f2", usuarioNome: "Ana Costa", unidadeNome: "Unidade Norte", visualizadoEm: "2026-02-10T11:30:00", confirmadoEm: "2026-02-10T11:32:00" },
  { id: "v3", comunicadoId: "com-1", usuarioId: "f3", usuarioNome: "Roberto Lima", unidadeNome: "Unidade Sul", visualizadoEm: "2026-02-11T08:00:00" },
  { id: "v4", comunicadoId: "com-1", usuarioId: "f4", usuarioNome: "Juliana Ferreira", unidadeNome: "Unidade Leste", visualizadoEm: "2026-02-11T09:45:00", confirmadoEm: "2026-02-11T09:50:00" },
  { id: "v5", comunicadoId: "com-2", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-06T08:00:00" },
  { id: "v6", comunicadoId: "com-2", usuarioId: "f2", usuarioNome: "Ana Costa", unidadeNome: "Unidade Norte", visualizadoEm: "2026-02-06T10:20:00" },
  { id: "v7", comunicadoId: "com-2", usuarioId: "f5", usuarioNome: "Marcos Silva", unidadeNome: "Unidade Oeste", visualizadoEm: "2026-02-07T14:00:00" },
  { id: "v8", comunicadoId: "com-3", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-18T12:00:00" },
  { id: "v9", comunicadoId: "com-3", usuarioId: "f3", usuarioNome: "Roberto Lima", unidadeNome: "Unidade Sul", visualizadoEm: "2026-02-18T14:30:00" },
  { id: "v10", comunicadoId: "com-7", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-02T09:00:00" },
  { id: "v11", comunicadoId: "com-7", usuarioId: "f2", usuarioNome: "Ana Costa", unidadeNome: "Unidade Norte", visualizadoEm: "2026-02-02T10:15:00" },
  { id: "v12", comunicadoId: "com-8", usuarioId: "f1", usuarioNome: "Carlos Mendes", unidadeNome: "Unidade Centro", visualizadoEm: "2026-02-20T16:00:00" },
  { id: "v13", comunicadoId: "com-8", usuarioId: "f4", usuarioNome: "Juliana Ferreira", unidadeNome: "Unidade Leste", visualizadoEm: "2026-02-20T17:30:00" },
  { id: "v14", comunicadoId: "com-8", usuarioId: "f5", usuarioNome: "Marcos Silva", unidadeNome: "Unidade Oeste", visualizadoEm: "2026-02-21T08:00:00" },
];

// ── Helpers ──

export function getComunicadosByStatus(status: ComunicadoStatus): Comunicado[] {
  return mockComunicados.filter((c) => c.status === status);
}

export function getVisualizacoes(comunicadoId: string): ComunicadoVisualizacao[] {
  return mockVisualizacoes.filter((v) => v.comunicadoId === comunicadoId);
}

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
