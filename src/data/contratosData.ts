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
  "Rascunho",
  "Gerado",
  "Enviado",
  "Aguardando Assinatura",
  "Assinado",
  "Vencido",
  "Cancelado",
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
  "{{cliente_nome}}",
  "{{cliente_documento}}",
  "{{cliente_email}}",
  "{{cliente_endereco}}",
  "{{cliente_telefone}}",
  "{{cliente_rg}}",
  "{{produto}}",
  "{{valor_mensal}}",
  "{{valor_total}}",
  "{{valor_parcela}}",
  "{{qtd_parcelas}}",
  "{{duracao_meses}}",
  "{{recorrencia}}",
  "{{data_inicio}}",
  "{{data_fim}}",
  "{{data_geracao}}",
  "{{data_cidade}}",
  "{{servicos_descricao}}",
  "{{franqueado_nome}}",
  "{{franqueado_unidade}}",
  "{{contratada_nome}}",
  "{{contratada_cnpj}}",
  "{{contratada_endereco}}",
  "{{numero_contrato}}",
];

export const mockTemplates: ContratoTemplate[] = [
  {
    id: "tpl-1",
    nome: "Contrato de Assessoria Padrão",
    tipo: "Assessoria",
    descricao: "Contrato completo de prestação de serviços de assessoria com 8 cláusulas",
    conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORIA

Pelo presente instrumento particular de contrato de prestação de serviços, as partes abaixo qualificadas:

CONTRATANTE: {{cliente_nome}}, inscrito(a) no CPF/CNPJ sob nº {{cliente_documento}}, RG nº {{cliente_rg}}, residente e domiciliado(a) na {{cliente_endereco}}, telefone {{cliente_telefone}}, e-mail {{cliente_email}}.

CONTRATADA: {{contratada_nome}}, inscrita no CNPJ sob nº {{contratada_cnpj}}, com sede na {{contratada_endereco}}, neste ato representada por seu responsável legal.

Têm entre si, justo e contratado, o presente Contrato de Prestação de Serviços de Assessoria, que se regerá pelas cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA – DO OBJETO

1.1 O presente contrato tem por objeto a prestação de serviços de assessoria conforme descrito abaixo:

{{servicos_descricao}}

1.2 Os serviços serão prestados de acordo com a tabela de produtos/serviços anexa à proposta comercial vinculada a este contrato.

CLÁUSULA SEGUNDA – DAS ALTERAÇÕES

2.1 Quaisquer alterações no escopo dos serviços deverão ser solicitadas formalmente pela CONTRATANTE, que terá o prazo de 48 (quarenta e oito) horas para aprovar as entregas realizadas.

2.2 Após o prazo de aprovação sem manifestação, as entregas serão consideradas automaticamente aprovadas.

2.3 Cada grupo de alteração será limitado a 2 (duas) rodadas de revisão por entrega, salvo acordo em contrário formalizado por escrito.

CLÁUSULA TERCEIRA – DAS ENTREGAS

3.1 Os prazos de entrega serão definidos em comum acordo entre as partes no início de cada demanda.

3.2 Em caso de atraso por parte da CONTRATADA, o prazo poderá ser prorrogado por igual período mediante justificativa formal.

3.3 A CONTRATANTE compromete-se a fornecer os materiais e informações necessários dentro dos prazos acordados, sob pena de prorrogação automática dos prazos de entrega.

CLÁUSULA QUARTA – DO PRAZO

4.1 O presente contrato terá duração de {{duracao_meses}} meses, com início em {{data_inicio}} e término em {{data_fim}}.

4.2 A renovação do contrato poderá ser realizada mediante termo aditivo assinado por ambas as partes, com antecedência mínima de 30 (trinta) dias do término.

CLÁUSULA QUINTA – DO PAGAMENTO

5.1 Pela prestação dos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor total de R$ {{valor_total}} ({{valor_total}} reais), dividido em {{qtd_parcelas}} parcelas de R$ {{valor_parcela}} cada.

5.2 O pagamento será realizado mensalmente até o dia 10 (dez) de cada mês subsequente ao da prestação dos serviços.

5.3 Em caso de atraso no pagamento, incidirão juros de 2% (dois por cento) ao mês, calculados pro rata die, além de multa de 10% (dez por cento) sobre o valor em atraso.

5.4 A CONTRATADA reserva-se o direito de encaminhar os valores em atraso para protesto após 30 (trinta) dias de inadimplência.

5.5 A suspensão dos serviços poderá ocorrer após 15 (quinze) dias de atraso no pagamento, sem prejuízo da cobrança dos valores devidos.

CLÁUSULA SEXTA – DA RESCISÃO

6.1 O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação por escrito com antecedência mínima de 30 (trinta) dias.

6.2 Em caso de inatividade da CONTRATANTE por período superior a 60 (sessenta) dias consecutivos, sem comunicação formal, a CONTRATADA poderá considerar o contrato rescindido de pleno direito.

6.3 Na hipótese de rescisão, a CONTRATANTE deverá quitar todos os valores devidos até a data efetiva do encerramento dos serviços.

6.4 Não haverá devolução de valores referentes a serviços já prestados.

CLÁUSULA SÉTIMA – DA LGPD

7.1 As partes comprometem-se a tratar os dados pessoais em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais – LGPD).

7.2 A CONTRATADA tratará os dados pessoais fornecidos pela CONTRATANTE exclusivamente para a finalidade de execução dos serviços contratados.

7.3 Ambas as partes se comprometem a manter sigilo sobre os dados pessoais a que tiverem acesso em razão deste contrato.

7.4 Em caso de incidente de segurança envolvendo dados pessoais, a parte responsável deverá notificar a outra no prazo de 24 (vinte e quatro) horas após tomar conhecimento do ocorrido.

CLÁUSULA OITAVA – DO FORO

8.1 As partes elegem o foro da Comarca de Maringá, Estado do Paraná, para dirimir quaisquer dúvidas ou litígios decorrentes do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.

E por estarem justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma.

{{data_cidade}}

_______________________________
CONTRATANTE: {{cliente_nome}}
CPF/CNPJ: {{cliente_documento}}

_______________________________
CONTRATADA: {{contratada_nome}}
CNPJ: {{contratada_cnpj}}

Testemunha 1:
Nome: ___________________________
CPF: ____________________________

Testemunha 2:
Nome: ___________________________
CPF: ____________________________

Contrato nº {{numero_contrato}} | Gerado em {{data_geracao}}`,
    placeholders: [
      "{{cliente_nome}}", "{{cliente_documento}}", "{{cliente_email}}", "{{cliente_endereco}}",
      "{{cliente_telefone}}", "{{cliente_rg}}", "{{contratada_nome}}", "{{contratada_cnpj}}",
      "{{contratada_endereco}}", "{{servicos_descricao}}", "{{duracao_meses}}",
      "{{data_inicio}}", "{{data_fim}}", "{{valor_total}}", "{{qtd_parcelas}}",
      "{{valor_parcela}}", "{{data_cidade}}", "{{numero_contrato}}", "{{data_geracao}}",
    ],
    aprovado: true,
    criadoEm: "2025-01-10",
  },
  {
    id: "tpl-2",
    nome: "Contrato SaaS Anual",
    tipo: "SaaS",
    descricao: "Template para licenciamento SaaS com vigência anual",
    conteudo: `CONTRATO DE LICENCIAMENTO DE SOFTWARE (SaaS)

Contratante: {{cliente_nome}} ({{cliente_documento}})
E-mail: {{cliente_email}}

O presente contrato estabelece os termos de uso da plataforma {{produto}}.

Valor: R$ {{valor_mensal}}/mês | Total: R$ {{valor_total}}
Vigência: {{data_inicio}} a {{data_fim}}
Recorrência: {{recorrencia}}

Contrato nº {{numero_contrato}} | Gerado em {{data_geracao}}.`,
    placeholders: ["{{cliente_nome}}", "{{cliente_documento}}", "{{cliente_email}}", "{{produto}}", "{{valor_mensal}}", "{{valor_total}}", "{{data_inicio}}", "{{data_fim}}", "{{recorrencia}}", "{{numero_contrato}}", "{{data_geracao}}"],
    aprovado: true,
    criadoEm: "2025-02-05",
  },
  {
    id: "tpl-3",
    nome: "Contrato de Franquia",
    tipo: "Franquia",
    descricao: "Template para venda de unidade franqueada",
    conteudo: `CONTRATO DE FRANQUIA

Franqueado: {{cliente_nome}} — {{cliente_documento}}
Unidade: {{franqueado_unidade}}

Valor da Franquia: R$ {{valor_total}}
Data: {{data_inicio}}

Contrato nº {{numero_contrato}} | {{data_geracao}}.`,
    placeholders: ["{{cliente_nome}}", "{{cliente_documento}}", "{{franqueado_unidade}}", "{{valor_total}}", "{{data_inicio}}", "{{numero_contrato}}", "{{data_geracao}}"],
    aprovado: true,
    criadoEm: "2025-01-20",
  },
  {
    id: "tpl-4",
    nome: "Contrato Sistema Básico",
    tipo: "Sistema",
    descricao: "Rascunho para contrato de sistema — aguardando aprovação",
    conteudo: `CONTRATO DE USO DE SISTEMA

Cliente: {{cliente_nome}}
Produto: {{produto}}
Valor: R$ {{valor_mensal}}/mês

Vigência: {{data_inicio}} a {{data_fim}}

Contrato nº {{numero_contrato}}.`,
    placeholders: ["{{cliente_nome}}", "{{produto}}", "{{valor_mensal}}", "{{data_inicio}}", "{{data_fim}}", "{{numero_contrato}}"],
    aprovado: false,
    criadoEm: "2025-03-01",
  },
  {
    id: "tpl-5",
    nome: "Proposta Comercial",
    tipo: "Assessoria",
    descricao: "Proposta comercial com serviços, resumo financeiro e forma de pagamento",
    conteudo: `PROPOSTA COMERCIAL

Data: {{data_geracao}}

Preparado para: {{cliente_nome}}
Documento: {{cliente_documento}}
E-mail: {{cliente_email}}

Duração do Projeto: {{duracao_meses}} meses

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVIÇOS SELECIONADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{servicos_descricao}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESUMO FINANCEIRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Valor Mensal: R$ {{valor_mensal}}
Valor Total do Projeto: R$ {{valor_total}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMA DE PAGAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parcelamento: {{qtd_parcelas}}x de R$ {{valor_parcela}}
Recorrência: {{recorrencia}}
Período: {{data_inicio}} a {{data_fim}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proposta gerada automaticamente pelo sistema.
Validade: 30 dias a partir da data de emissão.

Contratada: {{contratada_nome}} | CNPJ: {{contratada_cnpj}}
Proposta nº {{numero_contrato}} | {{data_geracao}}`,
    placeholders: [
      "{{cliente_nome}}", "{{cliente_documento}}", "{{cliente_email}}",
      "{{servicos_descricao}}", "{{duracao_meses}}", "{{valor_mensal}}",
      "{{valor_total}}", "{{qtd_parcelas}}", "{{valor_parcela}}",
      "{{recorrencia}}", "{{data_inicio}}", "{{data_fim}}",
      "{{contratada_nome}}", "{{contratada_cnpj}}", "{{numero_contrato}}", "{{data_geracao}}",
    ],
    aprovado: true,
    criadoEm: "2025-02-20",
  },
];

export const mockContratos: Contrato[] = [
  {
    id: "ctr-1", numero: "CTR-001", tipo: "Assessoria", dono: "Franqueado",
    clienteNome: "Clínica Saúde Mais", clienteDocumento: "12.345.678/0001-90", clienteEmail: "contato@saudemais.com",
    franqueadoId: "f1", franqueadoNome: "João Silva (Unidade Centro)",
    produto: "Assessoria", recorrencia: "Mensal", valorMensal: 2500, valorTotal: 30000,
    dataInicio: "2025-01-01", dataFim: "2025-12-31", status: "Assinado", templateId: "tpl-1",
    observacoes: "Cliente prioritário", criadoEm: "2024-12-20", atualizadoEm: "2025-01-02",
  },
  {
    id: "ctr-2", numero: "CTR-002", tipo: "SaaS", dono: "Interno",
    clienteNome: "Tech Solutions LTDA", clienteDocumento: "98.765.432/0001-10", clienteEmail: "financeiro@techsolutions.com",
    produto: "SaaS", recorrencia: "Anual", valorMensal: 1200, valorTotal: 14400,
    dataInicio: "2025-02-01", dataFim: "2026-01-31", status: "Aguardando Assinatura", templateId: "tpl-2",
    observacoes: "", criadoEm: "2025-01-25", atualizadoEm: "2025-01-25",
  },
  {
    id: "ctr-3", numero: "CTR-003", tipo: "Franquia", dono: "Interno",
    clienteNome: "Maria Oliveira", clienteDocumento: "123.456.789-00", clienteEmail: "maria@email.com",
    produto: "Franquia", recorrencia: "Unitária", valorMensal: 0, valorTotal: 85000,
    dataInicio: "2025-03-01", dataFim: "2030-02-28", status: "Enviado",
    observacoes: "Franquia região Norte", criadoEm: "2025-02-10", atualizadoEm: "2025-02-15",
  },
  {
    id: "ctr-4", numero: "CTR-004", tipo: "Assessoria", dono: "Franqueado",
    clienteNome: "Padaria Pão Dourado", clienteDocumento: "11.222.333/0001-44", clienteEmail: "padaria@paodourado.com",
    franqueadoId: "f2", franqueadoNome: "Ana Costa (Unidade Sul)",
    produto: "Assessoria", recorrencia: "Mensal", valorMensal: 1800, valorTotal: 21600,
    dataInicio: "2025-01-15", dataFim: "2025-12-31", status: "Assinado", templateId: "tpl-1",
    observacoes: "", criadoEm: "2025-01-10", atualizadoEm: "2025-01-16",
  },
  {
    id: "ctr-5", numero: "CTR-005", tipo: "Sistema", dono: "Parceiro",
    clienteNome: "Escola Futuro Brilhante", clienteDocumento: "55.666.777/0001-88", clienteEmail: "escola@futurobrilhante.com",
    produto: "Sistema", recorrencia: "Mensal", valorMensal: 250, valorTotal: 3000,
    dataInicio: "2024-06-01", dataFim: "2025-05-31", status: "Vencido",
    observacoes: "Renovação pendente", criadoEm: "2024-05-20", atualizadoEm: "2025-06-01",
  },
  {
    id: "ctr-6", numero: "CTR-006", tipo: "SaaS", dono: "Franqueado",
    clienteNome: "Loja Virtual Express", clienteDocumento: "22.333.444/0001-55", clienteEmail: "loja@virtualexpress.com",
    franqueadoId: "f1", franqueadoNome: "João Silva (Unidade Centro)",
    produto: "SaaS", recorrencia: "Mensal", valorMensal: 900, valorTotal: 10800,
    dataInicio: "2025-04-01", dataFim: "2026-03-31", status: "Rascunho",
    observacoes: "Aguardando aprovação do cliente", criadoEm: "2025-03-25", atualizadoEm: "2025-03-25",
  },
  {
    id: "ctr-7", numero: "CTR-007", tipo: "Assessoria", dono: "Interno",
    clienteNome: "Consultório Dr. Mendes", clienteDocumento: "33.444.555/0001-66", clienteEmail: "drmendes@clinica.com",
    produto: "Assessoria", recorrencia: "Mensal", valorMensal: 3200, valorTotal: 38400,
    dataInicio: "2025-02-01", dataFim: "2026-01-31", status: "Gerado",
    observacoes: "", criadoEm: "2025-01-28", atualizadoEm: "2025-01-28",
  },
  {
    id: "ctr-8", numero: "CTR-008", tipo: "Franquia", dono: "Interno",
    clienteNome: "Carlos Ferreira", clienteDocumento: "987.654.321-00", clienteEmail: "carlos.f@email.com",
    produto: "Franquia", recorrencia: "Unitária", valorMensal: 0, valorTotal: 95000,
    dataInicio: "2024-01-01", dataFim: "2029-12-31", status: "Cancelado",
    observacoes: "Desistência do franqueado", criadoEm: "2023-12-01", atualizadoEm: "2024-03-15",
  },
  {
    id: "ctr-9", numero: "CTR-009", tipo: "SaaS", dono: "Franqueado",
    clienteNome: "Agência Criativa", clienteDocumento: "44.555.666/0001-77", clienteEmail: "contato@criativa.com",
    franqueadoId: "f2", franqueadoNome: "Ana Costa (Unidade Sul)",
    produto: "SaaS", recorrencia: "Anual", valorMensal: 1500, valorTotal: 18000,
    dataInicio: "2025-03-01", dataFim: "2026-02-28", status: "Assinado", templateId: "tpl-2",
    observacoes: "", criadoEm: "2025-02-20", atualizadoEm: "2025-03-02",
  },
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
