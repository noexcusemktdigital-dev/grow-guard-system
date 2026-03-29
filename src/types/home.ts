// @ts-nocheck
// Home types

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
