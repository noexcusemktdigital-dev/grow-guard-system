// === DADOS REAIS DO MÓDULO FINANCEIRO ===

// ── INTERFACES ──

export interface Cliente {
  id: string;
  nome: string;
  valor: number;
  status: "Ativo" | "Pausado" | "Cancelado";
  tipoReceita: "Recorrente" | "Unitária" | "Sistema";
  origem: "Venda Interna" | "Franqueado" | "Parceiro";
  produto: "Assessoria Noexcuse" | "SaaS" | "Sistema";
  geraRepasse: boolean;
  percentualRepasse: number;
  franqueadoVinculado?: string;
  inicio: string;
  notaFiscalEmitida: boolean;
  pago: boolean;
  observacoes: string;
  // Asaas placeholders
  idCobrancaAsaas?: string;
  tipoCobrancaAsaas?: "Assinatura" | "Unitária";
  statusCobrancaAsaas?: string;
}

export interface Receita {
  id: string;
  mes: string;
  tipo: "Recorrente" | "Unitária" | "Franquia" | "SaaS" | "Sistema";
  clienteId?: string;
  clienteNome?: string;
  franqueadoId?: string;
  valorBruto: number;
  aplicaRepasse: boolean;
  origemRepasse: "Franqueado" | "Parceiro" | "Venda Interna" | "";
  percentualRepasse: number;
  valorRepasse: number;
  valorLiquido: number;
  notaFiscalEmitida: boolean;
  pago: boolean;
  geraImposto: boolean;
  dataRecebimento?: string;
  notas: string;
}

export interface Despesa {
  id: string;
  mes: string;
  categoria: "Pessoas" | "Plataformas" | "Estrutura" | "Empréstimos" | "Investimentos" | "Eventos" | "Treinamentos" | "Impostos";
  subcategoria: string;
  recorrente: boolean;
  valor: number;
  vencimento: number;
  status: "Previsto" | "Pago" | "Atrasado" | "Cancelado";
  notas: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  funcao: string;
  valorMensal: number;
  tipo: "Folha operacional" | "Pró-labore";
  inicio: string;
  fim?: string;
  reajustes: { mes: string; valor: number }[];
}

export interface Franqueado {
  id: string;
  nomeUnidade: string;
  status: "Ativo" | "Inativo";
  percentualRepasse: number;
  mensalidadeSistema: number;
  observacoes: string;
}

export interface Parcela {
  id: string;
  nome: string;
  tipo: "Empréstimo" | "Investimento";
  valorMensal: number;
  parcelaAtual: number;
  totalParcelas: number;
  inicio: string;
  fimEstimado: string;
  status: "Ativo" | "Encerrado";
}

export interface MesRegistro {
  mes: string;
  caixaInicial: number;
  caixaFinal?: number;
  observacoes: string;
}

// ── DADOS REAIS ──

export const meses: MesRegistro[] = [
  { mes: "2026-01", caixaInicial: 45000, caixaFinal: 42500, observacoes: "Início do ano" },
  { mes: "2026-02", caixaInicial: 42500, caixaFinal: 48200, observacoes: "" },
  { mes: "2026-03", caixaInicial: 48200, observacoes: "Novos clientes + reajustes equipe" },
];

export const clientes: Cliente[] = [
  // 🟢 RECORRENTE – VENDA INTERNA (Assessoria)
  { id: "c1", nome: "AllePets", valor: 1450, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-06-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c2", nome: "Ariadine Casarini", valor: 1843, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-07-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c3", nome: "Balpas", valor: 3000, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-08-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c4", nome: "Klir Mga", valor: 4305, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-06-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c5", nome: "Moro", valor: 900, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-09-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c6", nome: "P2Y Nordeste", valor: 2836.67, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-10-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c7", nome: "Saura Mais BB", valor: 2400, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-08-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c8", nome: "Silvan Cult", valor: 1800, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-11-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c9", nome: "Titânia Comex", valor: 2405, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-07-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c10", nome: "Tortteria", valor: 3796, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-09-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c11", nome: "Triangulo Consórcio", valor: 6563, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-06-01", notaFiscalEmitida: true, pago: true, observacoes: "" },

  // 🟡 RECORRENTE – PARCEIRO
  { id: "c12", nome: "Bruna Felber", valor: 2000, status: "Ativo", tipoReceita: "Recorrente", origem: "Parceiro", produto: "Assessoria Noexcuse", geraRepasse: true, percentualRepasse: 10, inicio: "2025-10-01", notaFiscalEmitida: true, pago: true, observacoes: "Parceiro - repasse 10%" },

  // 🟠 VENDA UNITÁRIA – VENDA INTERNA
  { id: "c13", nome: "LP Saura Agro", valor: 1400, status: "Ativo", tipoReceita: "Unitária", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2026-02-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c14", nome: "Allure Site", valor: 1280, status: "Ativo", tipoReceita: "Unitária", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2026-02-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c15", nome: "LP China", valor: 800, status: "Ativo", tipoReceita: "Unitária", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2026-02-01", notaFiscalEmitida: true, pago: false, observacoes: "" },

  // 🔵 SISTEMA
  { id: "c16", nome: "Maria Gleice", valor: 171, status: "Ativo", tipoReceita: "Sistema", origem: "Venda Interna", produto: "Sistema", geraRepasse: false, percentualRepasse: 0, inicio: "2025-12-01", notaFiscalEmitida: false, pago: true, observacoes: "" },

  // 🔴 VENDA UNITÁRIA – FRANQUEADO
  { id: "c17", nome: "Mecfilter", valor: 2800, status: "Ativo", tipoReceita: "Unitária", origem: "Franqueado", produto: "Assessoria Noexcuse", geraRepasse: true, percentualRepasse: 20, franqueadoVinculado: "f1", inicio: "2026-02-01", notaFiscalEmitida: true, pago: true, observacoes: "" },

  // ⚪ CLASSIFICAÇÃO: RECORRENTE – VENDA INTERNA
  { id: "c18", nome: "Massago", valor: 1800, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-11-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c19", nome: "Massaru", valor: 1680, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2025-12-01", notaFiscalEmitida: true, pago: true, observacoes: "" },
  { id: "c20", nome: "Moreira", valor: 0, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna", produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2026-01-01", notaFiscalEmitida: false, pago: false, observacoes: "Valor a definir" },
];

export const franqueados: Franqueado[] = [
  { id: "f1", nomeUnidade: "Franquia São Paulo Centro", status: "Ativo", percentualRepasse: 20, mensalidadeSistema: 250, observacoes: "Primeira franquia" },
  { id: "f2", nomeUnidade: "Franquia Campinas", status: "Ativo", percentualRepasse: 20, mensalidadeSistema: 250, observacoes: "Segunda franquia" },
];

export const colaboradores: Colaborador[] = [
  { id: "e1", nome: "Davi", funcao: "CEO", valorMensal: 6500, tipo: "Pró-labore", inicio: "2025-01-01", reajustes: [] },
  { id: "e2", nome: "Atendimento 1", funcao: "Atendimento", valorMensal: 2500, tipo: "Folha operacional", inicio: "2025-03-01", reajustes: [] },
  { id: "e3", nome: "Atendimento 2", funcao: "Atendimento", valorMensal: 2500, tipo: "Folha operacional", inicio: "2026-03-01", reajustes: [] },
  { id: "e4", nome: "Gestor Performance", funcao: "Gestor Performance", valorMensal: 3000, tipo: "Folha operacional", inicio: "2025-06-01", reajustes: [{ mes: "2026-03", valor: 500 }, { mes: "2026-04", valor: 500 }] },
  { id: "e5", nome: "Gerente Criativa", funcao: "Gerente Criativa", valorMensal: 3000, tipo: "Folha operacional", inicio: "2025-06-01", reajustes: [{ mes: "2026-03", valor: 500 }, { mes: "2026-04", valor: 500 }] },
];

export const parcelas: Parcela[] = [
  { id: "p1", nome: "Empréstimo 9/60", tipo: "Empréstimo", valorMensal: 2197, parcelaAtual: 9, totalParcelas: 60, inicio: "2025-06-01", fimEstimado: "2030-06-01", status: "Ativo" },
  { id: "p2", nome: "Empréstimo 3/12", tipo: "Empréstimo", valorMensal: 1885.60, parcelaAtual: 3, totalParcelas: 12, inicio: "2025-12-01", fimEstimado: "2026-12-01", status: "Ativo" },
  { id: "p3", nome: "Móveis Sala 3/6", tipo: "Investimento", valorMensal: 646.67, parcelaAtual: 3, totalParcelas: 6, inicio: "2025-12-01", fimEstimado: "2026-06-01", status: "Ativo" },
  { id: "p4", nome: "CNP 11/12", tipo: "Investimento", valorMensal: 2533, parcelaAtual: 11, totalParcelas: 12, inicio: "2025-04-01", fimEstimado: "2026-04-01", status: "Ativo" },
];

// ── DESPESAS FIXAS ──

const plataformas = [
  { nome: "CapCut", valor: 65.90 },
  { nome: "Freepik", valor: 48.33 },
  { nome: "Captions", valor: 124.99 },
  { nome: "Google", valor: 49.99 },
  { nome: "ChatGPT", valor: 100 },
  { nome: "Lovable", valor: 210 },
  { nome: "Envato", valor: 165 },
  { nome: "Ekyte", valor: 625 },
];

const estrutura = [
  { nome: "Aluguel + Estrutura", valor: 5192.25 },
  { nome: "Jurídico", valor: 800 },
  { nome: "RH", valor: 1733.33 },
];

// ── HELPERS ──

export function getActiveClientsForMonth(mes: string): Cliente[] {
  return clientes.filter(c => {
    if (c.status === "Cancelado") return false;
    if (c.status === "Pausado") return false;
    if (c.tipoReceita === "Unitária") {
      return c.inicio.substring(0, 7) === mes;
    }
    return c.inicio <= mes + "-31";
  });
}

export function getFolhaForMonth(mes: string): { total: number; operacional: number; proLabore: number } {
  let operacional = 0;
  let proLabore = 0;
  colaboradores.forEach(c => {
    if (c.inicio > mes + "-31") return;
    if (c.fim && c.fim < mes + "-01") return;
    let valor = c.valorMensal;
    c.reajustes.forEach(r => {
      if (r.mes <= mes) valor += r.valor;
    });
    if (c.tipo === "Pró-labore") proLabore += valor;
    else operacional += valor;
  });
  return { total: operacional + proLabore, operacional, proLabore };
}

export function getReceitasForMonth(mes: string): Receita[] {
  const activeClients = getActiveClientsForMonth(mes);
  const receitas: Receita[] = activeClients.map(c => {
    const repasse = c.geraRepasse ? c.valor * (c.percentualRepasse / 100) : 0;
    const geraImposto = c.notaFiscalEmitida;
    let origemRepasse: Receita["origemRepasse"] = "";
    if (c.geraRepasse) {
      origemRepasse = c.origem as "Franqueado" | "Parceiro" | "Venda Interna";
    }
    return {
      id: `r-${c.id}-${mes}`,
      mes,
      tipo: c.tipoReceita === "Sistema" ? "Sistema" : c.tipoReceita === "Unitária" ? "Unitária" : "Recorrente",
      clienteId: c.id,
      clienteNome: c.nome,
      franqueadoId: c.franqueadoVinculado,
      valorBruto: c.valor,
      aplicaRepasse: c.geraRepasse,
      origemRepasse,
      percentualRepasse: c.percentualRepasse,
      valorRepasse: repasse,
      valorLiquido: c.valor - repasse,
      notaFiscalEmitida: c.notaFiscalEmitida,
      pago: c.pago,
      geraImposto: geraImposto,
      notas: c.observacoes,
    };
  });

  // Sistema Franqueado (R$ 250/franqueado ativo)
  franqueados.filter(f => f.status === "Ativo").forEach(f => {
    receitas.push({
      id: `r-sist-${f.id}-${mes}`,
      mes,
      tipo: "Sistema",
      clienteNome: `Sistema ${f.nomeUnidade}`,
      valorBruto: f.mensalidadeSistema,
      aplicaRepasse: false,
      origemRepasse: "",
      percentualRepasse: 0,
      valorRepasse: 0,
      valorLiquido: f.mensalidadeSistema,
      notaFiscalEmitida: true,
      pago: true,
      geraImposto: true,
      notas: "Sistema franqueado mensal",
    });
  });

  return receitas;
}

export function getDespesasForMonth(mes: string): Despesa[] {
  const despesas: Despesa[] = [];

  // Pessoas (Folha)
  colaboradores.forEach(c => {
    if (c.inicio > mes + "-31") return;
    if (c.fim && c.fim < mes + "-01") return;
    let valor = c.valorMensal;
    c.reajustes.forEach(r => { if (r.mes <= mes) valor += r.valor; });
    despesas.push({
      id: `d-eq-${c.id}-${mes}`, mes, categoria: "Pessoas", subcategoria: `${c.funcao} - ${c.nome}`,
      recorrente: true, valor, vencimento: 5, status: "Pago", notas: c.tipo,
    });
  });

  // Plataformas
  plataformas.forEach(p => {
    despesas.push({
      id: `d-plat-${p.nome.toLowerCase()}-${mes}`, mes, categoria: "Plataformas", subcategoria: p.nome,
      recorrente: true, valor: p.valor, vencimento: 1, status: "Pago", notas: "",
    });
  });

  // Estrutura
  estrutura.forEach(e => {
    despesas.push({
      id: `d-est-${e.nome.toLowerCase().replace(/\s/g, "-")}-${mes}`, mes, categoria: "Estrutura", subcategoria: e.nome,
      recorrente: true, valor: e.valor, vencimento: 10, status: "Pago", notas: "",
    });
  });

  // Empréstimos e Investimentos
  parcelas.forEach(p => {
    if (p.status === "Encerrado") return;
    if (p.inicio > mes + "-31") return;
    const cat = p.tipo === "Empréstimo" ? "Empréstimos" : "Investimentos";
    despesas.push({
      id: `d-parc-${p.id}-${mes}`, mes, categoria: cat as Despesa["categoria"], subcategoria: p.nome,
      recorrente: true, valor: p.valorMensal, vencimento: 15, status: "Pago", notas: `${p.parcelaAtual}/${p.totalParcelas}`,
    });
  });

  // Eventos (a partir de abril)
  if (mes >= "2026-04") {
    despesas.push({ id: `d-ev-${mes}`, mes, categoria: "Eventos", subcategoria: "Evento mensal empresários", recorrente: true, valor: 3000, vencimento: 25, status: "Previsto", notas: "" });
    despesas.push({ id: `d-tr-${mes}`, mes, categoria: "Treinamentos", subcategoria: "Treinamento equipe", recorrente: true, valor: 2000, vencimento: 25, status: "Previsto", notas: "" });
  }

  // Impostos (gerado automaticamente)
  const impostoInfo = getImpostoDespesa(mes);
  despesas.push(impostoInfo);

  return despesas;
}

// ── IMPOSTO COMO DESPESA ──

export function getImpostoDespesa(mes: string): Despesa {
  const receitas = getReceitasForMonth(mes);
  const folha = getFolhaForMonth(mes);
  const faturamentoComNF = receitas.filter(r => r.notaFiscalEmitida).reduce((sum, r) => sum + r.valorBruto, 0);
  const baseCalculo = faturamentoComNF + folha.operacional;
  const valorImposto = baseCalculo * 0.10;

  return {
    id: `d-imp-${mes}`,
    mes,
    categoria: "Impostos",
    subcategoria: "Imposto mensal (10%)",
    recorrente: true,
    valor: valorImposto,
    vencimento: 20,
    status: mes <= "2026-02" ? "Pago" : "Previsto",
    notas: `Base: ${faturamentoComNF.toFixed(0)} (NF) + ${folha.operacional.toFixed(0)} (folha op.)`,
  };
}

// ── RESUMO MENSAL ──

export function getMonthSummary(mes: string) {
  const receitas = getReceitasForMonth(mes);
  const despesas = getDespesasForMonth(mes);
  const folha = getFolhaForMonth(mes);
  const mesData = meses.find(m => m.mes === mes);

  const receitaBruta = receitas.reduce((sum, r) => sum + r.valorBruto, 0);
  const totalRepasse = receitas.reduce((sum, r) => sum + r.valorRepasse, 0);
  const receitaLiquida = receitaBruta - totalRepasse;

  const custosDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);

  // Imposto já está incluído nas despesas agora
  const faturamentoComNF = receitas.filter(r => r.notaFiscalEmitida).reduce((sum, r) => sum + r.valorBruto, 0);
  const baseImposto = faturamentoComNF + folha.operacional;
  const impostos = baseImposto * 0.10;

  const investimentos = parcelas
    .filter(p => p.status === "Ativo" && p.tipo === "Investimento" && p.inicio <= mes + "-31")
    .reduce((s, p) => s + p.valorMensal, 0);

  const custosTotal = custosDespesas;
  const resultado = receitaLiquida - custosTotal;

  const caixaInicial = mesData?.caixaInicial || 0;
  const caixaAtual = caixaInicial + resultado;

  const runway = custosTotal > 0 ? Math.round((caixaAtual / custosTotal) * 10) / 10 : 0;

  // Despesas por categoria
  const despesasPorCategoria: Record<string, number> = {};
  despesas.forEach(d => {
    despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] || 0) + d.valor;
  });

  // Receita por tipo
  const receitaPorTipo: Record<string, number> = {};
  receitas.forEach(r => {
    receitaPorTipo[r.tipo] = (receitaPorTipo[r.tipo] || 0) + r.valorBruto;
  });

  // Receita por produto
  const clientesAtivos = getActiveClientsForMonth(mes);
  const receitaPorProduto: Record<string, number> = {};
  clientesAtivos.forEach(c => {
    receitaPorProduto[c.produto] = (receitaPorProduto[c.produto] || 0) + c.valor;
  });

  // Alertas
  const nfNaoEmitidas = receitas.filter(r => !r.notaFiscalEmitida).length;
  const inadimplentes = receitas.filter(r => !r.pago).length;
  const repassePendente = receitas.filter(r => r.aplicaRepasse).length;

  return {
    receitaBruta,
    totalRepasse,
    receitaLiquida,
    impostos,
    custosDespesas,
    investimentos,
    custosTotal,
    resultado,
    caixaInicial,
    caixaAtual,
    runway,
    folha,
    despesasPorCategoria,
    receitaPorTipo,
    receitaPorProduto,
    totalClientes: receitas.length,
    clientesCapacidade: 30,
    nfNaoEmitidas,
    inadimplentes,
    repassePendente,
  };
}

// ── HISTÓRICO ──

export function getHistoricalData() {
  const data = [
    { mes: "Out/25", receitaLiquida: 18000, custos: 22000, resultado: -4000 },
    { mes: "Nov/25", receitaLiquida: 22000, custos: 23000, resultado: -1000 },
    { mes: "Dez/25", receitaLiquida: 25000, custos: 23500, resultado: 1500 },
    { mes: "Jan/26", receitaLiquida: 28000, custos: 24000, resultado: 4000 },
  ];

  const febSummary = getMonthSummary("2026-02");
  const marSummary = getMonthSummary("2026-03");

  data.push({ mes: "Fev/26", receitaLiquida: febSummary.receitaLiquida, custos: febSummary.custosTotal, resultado: febSummary.resultado });
  data.push({ mes: "Mar/26", receitaLiquida: marSummary.receitaLiquida, custos: marSummary.custosTotal, resultado: marSummary.resultado });

  return data;
}

// ── PROJEÇÃO (CAMADA 3) ──

export function getProjection(mesesFuturos: number): { mes: string; label: string; receitaRecorrente: number; folha: number; parcelas: number; eventos: number; impostos: number; resultado: number }[] {
  const baseYear = 2026;
  const baseM = 2;

  const results: ReturnType<typeof getProjection> = [];

  for (let i = 1; i <= mesesFuturos; i++) {
    const m = baseM + i;
    const year = baseYear + Math.floor((m - 1) / 12);
    const month = ((m - 1) % 12) + 1;
    const mesStr = `${year}-${String(month).padStart(2, "0")}`;
    const labels = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const label = `${labels[month]}/${String(year).slice(2)}`;

    const activeClients = clientes.filter(c => {
      if (c.status !== "Ativo") return false;
      if (c.tipoReceita !== "Recorrente" && c.tipoReceita !== "Sistema") return false;
      return c.inicio <= mesStr + "-31";
    });
    const receitaRecorrente = activeClients.reduce((s, c) => s + c.valor, 0)
      + franqueados.filter(f => f.status === "Ativo").reduce((s, f) => s + f.mensalidadeSistema, 0);

    const folha = getFolhaForMonth(mesStr);

    const parcelasAtivas = parcelas.filter(p => {
      if (p.status === "Encerrado") return false;
      if (p.inicio > mesStr + "-31") return false;
      const parcelasRestantes = p.totalParcelas - p.parcelaAtual;
      return i <= parcelasRestantes;
    });
    const totalParcelas = parcelasAtivas.reduce((s, p) => s + p.valorMensal, 0);

    const eventos = mesStr >= "2026-04" ? 5000 : 0;
    const fixos = plataformas.reduce((s, p) => s + p.valor, 0) + estrutura.reduce((s, e) => s + e.valor, 0);

    const custoTotal = folha.total + totalParcelas + eventos + fixos;

    const faturamentoComNF = activeClients.filter(c => c.notaFiscalEmitida).reduce((s, c) => s + c.valor, 0)
      + franqueados.filter(f => f.status === "Ativo").reduce((s, f) => s + f.mensalidadeSistema, 0);
    const impostos = (faturamentoComNF + folha.operacional) * 0.10;

    const totalRepasse = activeClients.filter(c => c.geraRepasse).reduce((s, c) => s + c.valor * (c.percentualRepasse / 100), 0);
    const receitaLiquida = receitaRecorrente - totalRepasse;
    const resultado = receitaLiquida - custoTotal - impostos;

    results.push({ mes: mesStr, label, receitaRecorrente, folha: folha.total, parcelas: totalParcelas, eventos, impostos, resultado });
  }

  return results;
}

export function getBreakEven(): { custoMensal: number; ticketMedio: number; clientesNecessarios: number; clientesAtuais: number } {
  const summary = getMonthSummary("2026-02");
  const activeClients = getActiveClientsForMonth("2026-02").filter(c => c.tipoReceita === "Recorrente");
  const custoMensal = summary.custosTotal;
  const ticketMedio = activeClients.length > 0 ? activeClients.reduce((s, c) => s + c.valor, 0) / activeClients.length : 0;
  const clientesNecessarios = ticketMedio > 0 ? Math.ceil(custoMensal / ticketMedio) : 0;
  return { custoMensal, ticketMedio, clientesNecessarios, clientesAtuais: activeClients.length };
}

export function getInvestmentSignal(mes: string = "2026-02"): "green" | "yellow" | "red" {
  const summary = getMonthSummary(mes);
  const margemLucro = summary.receitaLiquida > 0 ? summary.resultado / summary.receitaLiquida : 0;
  const runway = summary.runway;

  if (margemLucro > 0.15 && runway > 3) return "green";
  if (margemLucro > 0.05 && runway > 2) return "yellow";
  return "red";
}

// ── DRE POR FRANQUEADO ──

export interface DREFranqueado {
  franqueadoId: string;
  franqueadoNome: string;
  mes: string;
  clientesAtivos: { nome: string; valor: number }[];
  receitaBruta: number;
  royalties: number;
  impostoProporcional: number;
  sistema: number;
  repasseMatriz: number;
  resultadoLiquido: number;
}

export function getDREFranqueado(franqueadoId: string, mes: string): DREFranqueado | null {
  const franqueado = franqueados.find(f => f.id === franqueadoId);
  if (!franqueado) return null;

  const clientesDoFranqueado = clientes.filter(c =>
    c.franqueadoVinculado === franqueadoId && c.status === "Ativo"
  );

  const receitaBruta = clientesDoFranqueado.reduce((s, c) => s + c.valor, 0);
  const royalties = receitaBruta * 0.01;

  // Imposto proporcional
  const receitasDoMes = getReceitasForMonth(mes);
  const receitaTotalMes = receitasDoMes.reduce((s, r) => s + r.valorBruto, 0);
  const summary = getMonthSummary(mes);
  const impostoTotalMes = summary.impostos;
  const impostoProporcional = receitaTotalMes > 0 ? (receitaBruta / receitaTotalMes) * impostoTotalMes : 0;

  const sistema = franqueado.mensalidadeSistema;

  const repasseMatriz = clientesDoFranqueado
    .filter(c => c.geraRepasse)
    .reduce((s, c) => s + c.valor * (c.percentualRepasse / 100), 0);

  const resultadoLiquido = receitaBruta - royalties - impostoProporcional - sistema - repasseMatriz;

  return {
    franqueadoId,
    franqueadoNome: franqueado.nomeUnidade,
    mes,
    clientesAtivos: clientesDoFranqueado.map(c => ({ nome: c.nome, valor: c.valor })),
    receitaBruta,
    royalties,
    impostoProporcional,
    sistema,
    repasseMatriz,
    resultadoLiquido,
  };
}
