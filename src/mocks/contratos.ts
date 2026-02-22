import type { Contrato, ContratoTemplate, ContratoStatus } from "@/types/contratos";

// ── Constants ──

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

// ── Mock Templates (re-exported from data for now — content is large) ──
// Templates have large string content, importing from original source
export { mockTemplates } from "@/data/contratosData";

// ── Mock Contracts ──

export const mockContratos: Contrato[] = [
  { id: "ctr-1", numero: "CTR-001", tipo: "Assessoria", dono: "Franqueado", clienteNome: "Clínica Saúde Mais", clienteDocumento: "12.345.678/0001-90", clienteEmail: "contato@saudemais.com", franqueadoId: "f1", franqueadoNome: "João Silva (Unidade Centro)", produto: "Assessoria", recorrencia: "Mensal", valorMensal: 2500, valorTotal: 30000, dataInicio: "2025-01-01", dataFim: "2025-12-31", status: "Assinado", templateId: "tpl-1", observacoes: "Cliente prioritário", criadoEm: "2024-12-20", atualizadoEm: "2025-01-02" },
  { id: "ctr-2", numero: "CTR-002", tipo: "SaaS", dono: "Interno", clienteNome: "Tech Solutions LTDA", clienteDocumento: "98.765.432/0001-10", clienteEmail: "financeiro@techsolutions.com", produto: "SaaS", recorrencia: "Anual", valorMensal: 1200, valorTotal: 14400, dataInicio: "2025-02-01", dataFim: "2026-01-31", status: "Aguardando Assinatura", templateId: "tpl-2", observacoes: "", criadoEm: "2025-01-25", atualizadoEm: "2025-01-25" },
  { id: "ctr-3", numero: "CTR-003", tipo: "Franquia", dono: "Interno", clienteNome: "Maria Oliveira", clienteDocumento: "123.456.789-00", clienteEmail: "maria@email.com", produto: "Franquia", recorrencia: "Unitária", valorMensal: 0, valorTotal: 85000, dataInicio: "2025-03-01", dataFim: "2030-02-28", status: "Enviado", observacoes: "Franquia região Norte", criadoEm: "2025-02-10", atualizadoEm: "2025-02-15" },
  { id: "ctr-4", numero: "CTR-004", tipo: "Assessoria", dono: "Franqueado", clienteNome: "Padaria Pão Dourado", clienteDocumento: "11.222.333/0001-44", clienteEmail: "padaria@paodourado.com", franqueadoId: "f2", franqueadoNome: "Ana Costa (Unidade Sul)", produto: "Assessoria", recorrencia: "Mensal", valorMensal: 1800, valorTotal: 21600, dataInicio: "2025-01-15", dataFim: "2025-12-31", status: "Assinado", templateId: "tpl-1", observacoes: "", criadoEm: "2025-01-10", atualizadoEm: "2025-01-16" },
  { id: "ctr-5", numero: "CTR-005", tipo: "Sistema", dono: "Parceiro", clienteNome: "Escola Futuro Brilhante", clienteDocumento: "55.666.777/0001-88", clienteEmail: "escola@futurobrilhante.com", produto: "Sistema", recorrencia: "Mensal", valorMensal: 250, valorTotal: 3000, dataInicio: "2024-06-01", dataFim: "2025-05-31", status: "Vencido", observacoes: "Renovação pendente", criadoEm: "2024-05-20", atualizadoEm: "2025-06-01" },
  { id: "ctr-6", numero: "CTR-006", tipo: "SaaS", dono: "Franqueado", clienteNome: "Loja Virtual Express", clienteDocumento: "22.333.444/0001-55", clienteEmail: "loja@virtualexpress.com", franqueadoId: "f1", franqueadoNome: "João Silva (Unidade Centro)", produto: "SaaS", recorrencia: "Mensal", valorMensal: 900, valorTotal: 10800, dataInicio: "2025-04-01", dataFim: "2026-03-31", status: "Rascunho", observacoes: "Aguardando aprovação do cliente", criadoEm: "2025-03-25", atualizadoEm: "2025-03-25" },
  { id: "ctr-7", numero: "CTR-007", tipo: "Assessoria", dono: "Interno", clienteNome: "Consultório Dr. Mendes", clienteDocumento: "33.444.555/0001-66", clienteEmail: "drmendes@clinica.com", produto: "Assessoria", recorrencia: "Mensal", valorMensal: 3200, valorTotal: 38400, dataInicio: "2025-02-01", dataFim: "2026-01-31", status: "Gerado", observacoes: "", criadoEm: "2025-01-28", atualizadoEm: "2025-01-28" },
  { id: "ctr-8", numero: "CTR-008", tipo: "Franquia", dono: "Interno", clienteNome: "Carlos Ferreira", clienteDocumento: "987.654.321-00", clienteEmail: "carlos.f@email.com", produto: "Franquia", recorrencia: "Unitária", valorMensal: 0, valorTotal: 95000, dataInicio: "2024-01-01", dataFim: "2029-12-31", status: "Cancelado", observacoes: "Desistência do franqueado", criadoEm: "2023-12-01", atualizadoEm: "2024-03-15" },
  { id: "ctr-9", numero: "CTR-009", tipo: "SaaS", dono: "Franqueado", clienteNome: "Agência Criativa", clienteDocumento: "44.555.666/0001-77", clienteEmail: "contato@criativa.com", franqueadoId: "f2", franqueadoNome: "Ana Costa (Unidade Sul)", produto: "SaaS", recorrencia: "Anual", valorMensal: 1500, valorTotal: 18000, dataInicio: "2025-03-01", dataFim: "2026-02-28", status: "Assinado", templateId: "tpl-2", observacoes: "", criadoEm: "2025-02-20", atualizadoEm: "2025-03-02" },
];

// ── Helpers ──

export function getNextContratoNumero(contratos: Contrato[], prefixo = "CTR-"): string {
  const nums = contratos.map(c => parseInt(c.numero.replace(prefixo, "")) || 0);
  const next = Math.max(0, ...nums) + 1;
  return `${prefixo}${String(next).padStart(3, "0")}`;
}
