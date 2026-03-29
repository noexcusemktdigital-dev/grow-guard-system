// @ts-nocheck
// Contratos types and constants (extracted from contratosData.ts)

export type ContratoTipo = "Assessoria" | "SaaS" | "Sistema" | "Franquia";
export type ContratoDono = "Interno" | "Franqueado" | "Parceiro";
export type ContratoRecorrencia = "Mensal" | "Anual" | "Unitária";
export type ContratoStatus =
  | "Rascunho"
  | "Gerado"
  | "Enviado"
  | "Aguardando Assinatura"
  | "Assinado"
  | "Vencido"
  | "Cancelado";

export interface Contrato {
  id: string;
  numero: string;
  tipo: ContratoTipo;
  dono: ContratoDono;
  clienteNome: string;
  clienteDocumento: string;
  clienteEmail: string;
  clienteEndereco?: string;
  clienteRg?: string;
  clienteTelefone?: string;
  franqueadoId?: string;
  franqueadoNome?: string;
  produto: ContratoTipo;
  recorrencia: ContratoRecorrencia;
  valorMensal: number;
  valorTotal: number;
  duracaoMeses?: number;
  qtdParcelas?: number;
  valorParcela?: number;
  servicosDescricao?: string;
  cidade?: string;
  dataInicio: string;
  dataFim: string;
  status: ContratoStatus;
  templateId?: string;
  propostaVinculada?: string;
  arquivoUrl?: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  asaasInvoiceId?: string;
}

export interface ContratoTemplate {
  id: string;
  nome: string;
  tipo: ContratoTipo;
  descricao: string;
  conteudo: string;
  placeholders: string[];
  aprovado: boolean;
  criadoEm: string;
}

export const CONTRATO_STATUS_LIST: ContratoStatus[] = [
  "Rascunho", "Gerado", "Enviado", "Aguardando Assinatura", "Assinado", "Vencido", "Cancelado",
];

export const CONTRATO_STATUS_COLORS: Record<ContratoStatus, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Gerado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Enviado: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "Aguardando Assinatura": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Assinado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Vencido: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const PLACEHOLDERS_DISPONIVEIS = [
  "{{cliente_nome}}", "{{cliente_documento}}", "{{cliente_email}}", "{{cliente_endereco}}",
  "{{cliente_telefone}}", "{{cliente_rg}}", "{{produto}}", "{{valor_mensal}}",
  "{{valor_total}}", "{{valor_parcela}}", "{{qtd_parcelas}}", "{{duracao_meses}}",
  "{{recorrencia}}", "{{data_inicio}}", "{{data_fim}}", "{{data_geracao}}",
  "{{data_cidade}}", "{{servicos_descricao}}", "{{franqueado_nome}}", "{{franqueado_unidade}}",
  "{{contratada_nome}}", "{{contratada_cnpj}}", "{{contratada_endereco}}", "{{numero_contrato}}",
];

export const FRANQUEADOS_LIST = [
  { id: "f1", nome: "João Silva (Unidade Centro)" },
  { id: "f2", nome: "Ana Costa (Unidade Sul)" },
  { id: "f3", nome: "Pedro Santos (Unidade Norte)" },
];

export function getNextContratoNumero(contratos: Contrato[], prefixo = "CTR-"): string {
  const nums = contratos.map(c => parseInt(c.numero.replace(prefixo, "")) || 0);
  const next = Math.max(0, ...nums) + 1;
  return `${prefixo}${String(next).padStart(3, "0")}`;
}
