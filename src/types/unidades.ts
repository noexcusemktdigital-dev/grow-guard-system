// Unidades types (extracted from unidadesData.ts)

export type UnidadeStatus = "Ativa" | "Suspensa" | "Encerrada";
export type UserRole = "Franqueado" | "Comercial" | "Atendimento" | "Performance" | "Criativo" | "Financeiro";
export type UserPermission = "Admin da Unidade" | "Operador" | "Somente leitura";
export type UserStatus = "Ativo" | "Inativo";
export type DocType = "Contrato de franquia" | "Documentos administrativos" | "Arquivos internos" | "Outros";
export type DocVisibility = "Somente Franqueadora" | "Ambos";

export interface Unidade {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  responsavel: string;
  email: string;
  telefone: string;
  dataInicio: string;
  status: UnidadeStatus;
  observacoes: string;
  repassePercent: number;
  royaltiesPercent: number;
  mensalidadeSistema: number;
  sistemaAtivo: boolean;
  observacoesFinanceiras: string;
}

export interface UnidadeUser {
  id: string;
  unidadeId: string;
  nome: string;
  email: string;
  funcao: UserRole;
  permissao: UserPermission;
  status: UserStatus;
}

export interface UnidadeDoc {
  id: string;
  unidadeId: string;
  tipo: DocType;
  nome: string;
  data: string;
  visibilidade: DocVisibility;
  observacao: string;
}
