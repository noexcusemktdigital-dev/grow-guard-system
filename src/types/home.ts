// Home types (extracted from homeData.ts)

export type MensagemCategoria = "Mentalidade" | "Vendas" | "Gestão" | "Marketing" | "Liderança";
export type MensagemStatus = "Ativo" | "Programado" | "Arquivado";
export type PublicoAlvo = "Franqueadora" | "Franqueados" | "Clientes finais" | "Todos";

export interface MensagemDoDia {
  id: string;
  texto: string;
  categoria: MensagemCategoria;
  autor: string;
  publico: PublicoAlvo[];
  dataPublicacao: string;
  status: MensagemStatus;
  criadoEm: string;
}

export interface AlertaHome {
  id: string;
  tipo: "chamado" | "prova" | "onboarding" | "contrato" | "fechamento" | "comunicado";
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  link: string;
  moduloOrigem: string;
  criadoEm: string;
}

export interface PrioridadeDoDia {
  id: string;
  titulo: string;
  descricao: string;
  tipo: AlertaHome["tipo"];
  link: string;
  urgencia: 1 | 2 | 3;
}

export const MENSAGEM_CATEGORIAS: MensagemCategoria[] = ["Mentalidade", "Vendas", "Gestão", "Marketing", "Liderança"];

export function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// Mock messages (placeholder until fully backed by database)
export const mockMensagens: MensagemDoDia[] = [
  { id: "msg-1", texto: "O sucesso não é sobre ser o melhor. É sobre ser melhor do que você era ontem.", categoria: "Mentalidade", autor: "Davi", publico: ["Todos"], dataPublicacao: new Date().toISOString().slice(0, 10), status: "Ativo", criadoEm: "2026-02-15T08:00:00" },
  { id: "msg-2", texto: "Cada 'não' te aproxima de um 'sim'. Continue prospectando com consistência.", categoria: "Vendas", autor: "Gabriel", publico: ["Franqueados"], dataPublicacao: "2026-02-22", status: "Programado", criadoEm: "2026-02-14T10:00:00" },
  { id: "msg-3", texto: "Gestão é transformar dados em decisões. Olhe seu DRE toda semana.", categoria: "Gestão", autor: "Davi", publico: ["Franqueadora", "Franqueados"], dataPublicacao: "2026-02-23", status: "Programado", criadoEm: "2026-02-14T11:00:00" },
  { id: "msg-4", texto: "Marketing não é custo, é investimento. Meça o ROI de cada campanha.", categoria: "Marketing", autor: "Amanda", publico: ["Franqueados"], dataPublicacao: "2026-02-24", status: "Programado", criadoEm: "2026-02-13T09:00:00" },
  { id: "msg-5", texto: "Um líder não cria seguidores. Um líder cria outros líderes.", categoria: "Liderança", autor: "Davi", publico: ["Todos"], dataPublicacao: "2026-02-18", status: "Arquivado", criadoEm: "2026-02-10T08:00:00" },
];
