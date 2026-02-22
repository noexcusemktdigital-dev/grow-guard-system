import type { Unidade, UnidadeUser, UnidadeDoc } from "@/types/unidades";

export const mockUnidades: Unidade[] = [
  { id: "u1", nome: "Curitiba", cidade: "Curitiba", estado: "PR", responsavel: "Carlos Mendes", email: "curitiba@franquia.com", telefone: "(41) 99999-0001", dataInicio: "2023-03-15", status: "Ativa", observacoes: "Unidade matriz", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
  { id: "u2", nome: "N3W São Paulo", cidade: "São Paulo", estado: "SP", responsavel: "Fernanda Lima", email: "sp@franquia.com", telefone: "(11) 99999-0002", dataInicio: "2023-06-01", status: "Ativa", observacoes: "", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
  { id: "u3", nome: "Maringá – Gabriel", cidade: "Maringá", estado: "PR", responsavel: "Gabriel Souza", email: "gabriel.maringa@franquia.com", telefone: "(44) 99999-0003", dataInicio: "2023-09-10", status: "Ativa", observacoes: "", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
  { id: "u4", nome: "Maringá – Victor", cidade: "Maringá", estado: "PR", responsavel: "Victor Almeida", email: "victor.maringa@franquia.com", telefone: "(44) 99999-0004", dataInicio: "2024-01-20", status: "Ativa", observacoes: "", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
  { id: "u5", nome: "Bauru – Márcia", cidade: "Bauru", estado: "SP", responsavel: "Márcia Oliveira", email: "marcia.bauru@franquia.com", telefone: "(14) 99999-0005", dataInicio: "2024-04-01", status: "Ativa", observacoes: "", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
  { id: "u6", nome: "Batatais – Alisson", cidade: "Batatais", estado: "SP", responsavel: "Alisson Ferreira", email: "alisson.batatais@franquia.com", telefone: "(16) 99999-0006", dataInicio: "2024-07-15", status: "Ativa", observacoes: "", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
  { id: "u7", nome: "Bahia – Gregory", cidade: "Salvador", estado: "BA", responsavel: "Gregory Santos", email: "gregory.bahia@franquia.com", telefone: "(71) 99999-0007", dataInicio: "2024-10-01", status: "Ativa", observacoes: "", repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "" },
];

export const mockUnidadeUsers: UnidadeUser[] = [
  { id: "uu1", unidadeId: "u1", nome: "Carlos Mendes", email: "carlos@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu2", unidadeId: "u1", nome: "Ana Paula", email: "ana@franquia.com", funcao: "Comercial", permissao: "Operador", status: "Ativo" },
  { id: "uu3", unidadeId: "u2", nome: "Fernanda Lima", email: "fernanda@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu4", unidadeId: "u3", nome: "Gabriel Souza", email: "gabriel@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu5", unidadeId: "u4", nome: "Victor Almeida", email: "victor@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu6", unidadeId: "u4", nome: "Juliana Costa", email: "juliana@franquia.com", funcao: "Atendimento", permissao: "Operador", status: "Ativo" },
  { id: "uu7", unidadeId: "u5", nome: "Márcia Oliveira", email: "marcia@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu8", unidadeId: "u6", nome: "Alisson Ferreira", email: "alisson@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu9", unidadeId: "u7", nome: "Gregory Santos", email: "gregory@franquia.com", funcao: "Franqueado", permissao: "Admin da Unidade", status: "Ativo" },
  { id: "uu10", unidadeId: "u7", nome: "Roberto Dias", email: "roberto@franquia.com", funcao: "Financeiro", permissao: "Operador", status: "Ativo" },
];

export const mockUnidadeDocs: UnidadeDoc[] = [
  { id: "ud1", unidadeId: "u1", tipo: "Contrato de franquia", nome: "Contrato_Curitiba_2023.pdf", data: "2023-03-15", visibilidade: "Ambos", observacao: "Contrato original assinado" },
  { id: "ud2", unidadeId: "u2", tipo: "Contrato de franquia", nome: "Contrato_SP_2023.pdf", data: "2023-06-01", visibilidade: "Ambos", observacao: "" },
  { id: "ud3", unidadeId: "u3", tipo: "Contrato de franquia", nome: "Contrato_Maringa_Gabriel.pdf", data: "2023-09-10", visibilidade: "Ambos", observacao: "" },
  { id: "ud4", unidadeId: "u4", tipo: "Contrato de franquia", nome: "Contrato_Maringa_Victor.pdf", data: "2024-01-20", visibilidade: "Ambos", observacao: "" },
  { id: "ud5", unidadeId: "u5", tipo: "Contrato de franquia", nome: "Contrato_Bauru_Marcia.pdf", data: "2024-04-01", visibilidade: "Ambos", observacao: "" },
  { id: "ud6", unidadeId: "u6", tipo: "Contrato de franquia", nome: "Contrato_Batatais_Alisson.pdf", data: "2024-07-15", visibilidade: "Ambos", observacao: "" },
  { id: "ud7", unidadeId: "u7", tipo: "Contrato de franquia", nome: "Contrato_Bahia_Gregory.pdf", data: "2024-10-01", visibilidade: "Ambos", observacao: "" },
];
