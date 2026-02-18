// === MOCK DATA FOR FINANCEIRO MODULE ===

export interface Cliente {
  id: string;
  nome: string;
  status: "Ativo" | "Pausado" | "Cancelado";
  mensalidade: number;
  isFranqueado: boolean;
  franqueadoVinculado?: string;
  percentualRepasse: number;
  inicio: string;
  observacoes: string;
}

export interface Receita {
  id: string;
  mes: string;
  tipo: "Cliente recorrente" | "Upsell" | "Franquia" | "Produto SaaS";
  clienteId?: string;
  clienteNome?: string;
  franqueadoId?: string;
  valorBruto: number;
  aplicaRepasse: boolean;
  percentualRepasse: number;
  valorRepasse: number;
  valorLiquido: number;
  notas: string;
}

export interface Despesa {
  id: string;
  mes: string;
  categoria: "Equipe" | "Estrutura" | "Plataformas" | "Empréstimos" | "Investimentos" | "Eventos" | "Treinamentos" | "Outros";
  subcategoria: string;
  recorrente: boolean;
  valor: number;
  vencimento: number;
  status: "Previsto" | "Pago";
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
  usdBrl: number;
  observacoes: string;
}

// --- SEED DATA ---

export const meses: MesRegistro[] = [
  { mes: "2026-01", caixaInicial: 45000, caixaFinal: 42500, usdBrl: 5.10, observacoes: "Mês de início do ano" },
  { mes: "2026-02", caixaInicial: 42500, caixaFinal: 48200, usdBrl: 5.05, observacoes: "" },
  { mes: "2026-03", caixaInicial: 48200, usdBrl: 5.15, observacoes: "Novos clientes + reajustes equipe" },
];

export const clientes: Cliente[] = [
  { id: "c1", nome: "Studio Bella", status: "Ativo", mensalidade: 2500, isFranqueado: false, percentualRepasse: 0, inicio: "2025-06-01", observacoes: "Cliente direto" },
  { id: "c2", nome: "Academia Fit+", status: "Ativo", mensalidade: 3000, isFranqueado: true, franqueadoVinculado: "f1", percentualRepasse: 20, inicio: "2025-08-01", observacoes: "" },
  { id: "c3", nome: "Clínica VidaSã", status: "Ativo", mensalidade: 2000, isFranqueado: true, franqueadoVinculado: "f1", percentualRepasse: 20, inicio: "2025-09-01", observacoes: "" },
  { id: "c4", nome: "Restaurante Sabor", status: "Ativo", mensalidade: 1800, isFranqueado: false, percentualRepasse: 0, inicio: "2025-10-01", observacoes: "Upsell vídeo mensal" },
  { id: "c5", nome: "Loja TechShop", status: "Ativo", mensalidade: 3500, isFranqueado: false, percentualRepasse: 0, inicio: "2025-11-01", observacoes: "" },
  { id: "c6", nome: "Pet Care Plus", status: "Ativo", mensalidade: 2200, isFranqueado: true, franqueadoVinculado: "f2", percentualRepasse: 20, inicio: "2025-12-01", observacoes: "" },
  { id: "c7", nome: "Escola Infantil ABC", status: "Ativo", mensalidade: 2800, isFranqueado: false, percentualRepasse: 0, inicio: "2026-01-01", observacoes: "" },
  { id: "c8", nome: "Barbearia Corte Certo", status: "Pausado", mensalidade: 1500, isFranqueado: false, percentualRepasse: 0, inicio: "2025-07-01", observacoes: "Pausou em Jan/26" },
  { id: "c9", nome: "Padaria Doce Pão", status: "Ativo", mensalidade: 2000, isFranqueado: true, franqueadoVinculado: "f1", percentualRepasse: 20, inicio: "2026-02-01", observacoes: "" },
  { id: "c10", nome: "Studio Yoga Zen", status: "Ativo", mensalidade: 2500, isFranqueado: false, percentualRepasse: 0, inicio: "2026-02-01", observacoes: "" },
  // Março novos
  { id: "c11", nome: "Construtora Alfa", status: "Ativo", mensalidade: 3000, isFranqueado: true, franqueadoVinculado: "f1", percentualRepasse: 20, inicio: "2026-03-01", observacoes: "Novo Mar/26 - franqueado" },
  { id: "c12", nome: "Ótica Visão", status: "Ativo", mensalidade: 2200, isFranqueado: true, franqueadoVinculado: "f2", percentualRepasse: 20, inicio: "2026-03-01", observacoes: "Novo Mar/26 - franqueado" },
  { id: "c13", nome: "Farmácia Central", status: "Ativo", mensalidade: 2500, isFranqueado: true, franqueadoVinculado: "f1", percentualRepasse: 20, inicio: "2026-03-01", observacoes: "Novo Mar/26 - franqueado" },
  { id: "c14", nome: "Cafeteria Grão", status: "Ativo", mensalidade: 1800, isFranqueado: false, percentualRepasse: 0, inicio: "2026-03-01", observacoes: "Novo Mar/26 - direto" },
  { id: "c15", nome: "Escritório Contábil JL", status: "Cancelado", mensalidade: 2000, isFranqueado: false, percentualRepasse: 0, inicio: "2025-05-01", observacoes: "Cancelou Fev/26" },
];

export const franqueados: Franqueado[] = [
  { id: "f1", nomeUnidade: "Franquia São Paulo Centro", status: "Ativo", percentualRepasse: 20, mensalidadeSistema: 0, observacoes: "Primeira franquia" },
  { id: "f2", nomeUnidade: "Franquia Campinas", status: "Ativo", percentualRepasse: 20, mensalidadeSistema: 0, observacoes: "Segunda franquia" },
];

export const colaboradores: Colaborador[] = [
  { id: "e1", nome: "Davi", funcao: "CEO", valorMensal: 8000, tipo: "Pró-labore", inicio: "2025-01-01", reajustes: [] },
  { id: "e2", nome: "Ana", funcao: "Gestora de Projetos", valorMensal: 4000, tipo: "Folha operacional", inicio: "2025-03-01", reajustes: [{ mes: "2026-03", valor: 500 }, { mes: "2026-04", valor: 500 }] },
  { id: "e3", nome: "Lucas", funcao: "Gerente Comercial", valorMensal: 3500, tipo: "Folha operacional", inicio: "2025-06-01", reajustes: [{ mes: "2026-03", valor: 500 }, { mes: "2026-04", valor: 500 }] },
  { id: "e4", nome: "Maria", funcao: "Designer", valorMensal: 3000, tipo: "Folha operacional", inicio: "2025-09-01", reajustes: [] },
  { id: "e5", nome: "Carlos", funcao: "Atendimento", valorMensal: 2500, tipo: "Folha operacional", inicio: "2026-03-01", reajustes: [] },
];

export const parcelas: Parcela[] = [
  { id: "p1", nome: "Empréstimo Inicial 9/60", tipo: "Empréstimo", valorMensal: 1800, parcelaAtual: 9, totalParcelas: 60, inicio: "2025-06-01", fimEstimado: "2030-06-01", status: "Ativo" },
  { id: "p2", nome: "Móveis Escritório 3/6", tipo: "Investimento", valorMensal: 800, parcelaAtual: 3, totalParcelas: 6, inicio: "2025-12-01", fimEstimado: "2026-06-01", status: "Ativo" },
  { id: "p3", nome: "Equipamento Vídeo 2/12", tipo: "Investimento", valorMensal: 500, parcelaAtual: 2, totalParcelas: 12, inicio: "2026-01-01", fimEstimado: "2027-01-01", status: "Ativo" },
];

// Helper: get active clients for a given month
export function getActiveClientsForMonth(mes: string): Cliente[] {
  return clientes.filter(c => {
    if (c.status === "Cancelado") return false;
    if (c.status === "Pausado" && mes >= "2026-01") return false;
    return c.inicio <= mes + "-31";
  });
}

// Helper: calculate folha for a month
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

// Generate receitas for a month
export function getReceitasForMonth(mes: string): Receita[] {
  const activeClients = getActiveClientsForMonth(mes);
  return activeClients.map(c => {
    const repasse = c.isFranqueado ? c.mensalidade * (c.percentualRepasse / 100) : 0;
    return {
      id: `r-${c.id}-${mes}`,
      mes,
      tipo: "Cliente recorrente" as const,
      clienteId: c.id,
      clienteNome: c.nome,
      franqueadoId: c.franqueadoVinculado,
      valorBruto: c.mensalidade,
      aplicaRepasse: c.isFranqueado,
      percentualRepasse: c.percentualRepasse,
      valorRepasse: repasse,
      valorLiquido: c.mensalidade - repasse,
      notas: "",
    };
  });
}

// Generate despesas for a month  
export function getDespesasForMonth(mes: string): Despesa[] {
  const despesas: Despesa[] = [];
  const folha = getFolhaForMonth(mes);
  
  // Equipe
  colaboradores.forEach(c => {
    if (c.inicio > mes + "-31") return;
    if (c.fim && c.fim < mes + "-01") return;
    let valor = c.valorMensal;
    c.reajustes.forEach(r => { if (r.mes <= mes) valor += r.valor; });
    despesas.push({
      id: `d-eq-${c.id}-${mes}`, mes, categoria: "Equipe", subcategoria: `${c.funcao} - ${c.nome}`,
      recorrente: true, valor, vencimento: 5, status: "Pago", notas: c.tipo,
    });
  });

  // Estrutura
  despesas.push({ id: `d-est-aluguel-${mes}`, mes, categoria: "Estrutura", subcategoria: "Aluguel", recorrente: true, valor: 3500, vencimento: 10, status: "Pago", notas: "" });
  despesas.push({ id: `d-est-internet-${mes}`, mes, categoria: "Estrutura", subcategoria: "Internet + Telefone", recorrente: true, valor: 350, vencimento: 15, status: "Pago", notas: "" });
  despesas.push({ id: `d-est-energia-${mes}`, mes, categoria: "Estrutura", subcategoria: "Energia", recorrente: true, valor: 400, vencimento: 20, status: "Pago", notas: "" });
  despesas.push({ id: `d-est-juridico-${mes}`, mes, categoria: "Estrutura", subcategoria: "Jurídico / Contabilidade", recorrente: true, valor: 1200, vencimento: 10, status: "Pago", notas: "" });

  // Plataformas
  despesas.push({ id: `d-plat-capcut-${mes}`, mes, categoria: "Plataformas", subcategoria: "CapCut Pro", recorrente: true, valor: 80, vencimento: 1, status: "Pago", notas: "" });
  despesas.push({ id: `d-plat-canva-${mes}`, mes, categoria: "Plataformas", subcategoria: "Canva Pro", recorrente: true, valor: 55, vencimento: 1, status: "Pago", notas: "" });
  despesas.push({ id: `d-plat-crm-${mes}`, mes, categoria: "Plataformas", subcategoria: "CRM / Automação", recorrente: true, valor: 300, vencimento: 5, status: "Pago", notas: "" });
  despesas.push({ id: `d-plat-hosting-${mes}`, mes, categoria: "Plataformas", subcategoria: "Hosting / Cloud", recorrente: true, valor: 200, vencimento: 1, status: "Pago", notas: "" });

  // Parcelas
  parcelas.forEach(p => {
    if (p.status === "Encerrado") return;
    if (p.inicio > mes + "-31") return;
    despesas.push({
      id: `d-parc-${p.id}-${mes}`, mes, categoria: "Empréstimos", subcategoria: p.nome,
      recorrente: true, valor: p.valorMensal, vencimento: 15, status: "Pago", notas: `${p.parcelaAtual}/${p.totalParcelas}`,
    });
  });

  // Eventos/Treinamento (a partir de abril)
  if (mes >= "2026-04") {
    despesas.push({ id: `d-ev-${mes}`, mes, categoria: "Eventos", subcategoria: "Eventos mensais", recorrente: true, valor: 3000, vencimento: 25, status: "Previsto", notas: "" });
    despesas.push({ id: `d-tr-${mes}`, mes, categoria: "Treinamentos", subcategoria: "Treinamentos equipe", recorrente: true, valor: 2000, vencimento: 25, status: "Previsto", notas: "" });
  }

  return despesas;
}

// Monthly summary calculation
export function getMonthSummary(mes: string) {
  const receitas = getReceitasForMonth(mes);
  const despesas = getDespesasForMonth(mes);
  const folha = getFolhaForMonth(mes);
  const mesData = meses.find(m => m.mes === mes);

  const receitaBruta = receitas.reduce((sum, r) => sum + r.valorBruto, 0);
  const totalRepasse = receitas.reduce((sum, r) => sum + r.valorRepasse, 0);
  const receitaLiquida = receitaBruta - totalRepasse;

  const custosDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  
  // Imposto: 10% sobre (faturamento bruto + folha operacional), excluindo pró-labore
  const baseImposto = receitaBruta + folha.operacional;
  const impostos = baseImposto * 0.10;

  const custosTotal = custosDespesas + impostos;
  const resultado = receitaLiquida - custosTotal;

  const caixaInicial = mesData?.caixaInicial || 0;
  const caixaAtual = caixaInicial + resultado;
  
  const custoMensalMedio = custosTotal;
  const runway = custoMensalMedio > 0 ? Math.round((caixaAtual / custoMensalMedio) * 10) / 10 : 0;

  // Despesas por categoria
  const despesasPorCategoria: Record<string, number> = {};
  despesas.forEach(d => {
    despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] || 0) + d.valor;
  });

  return {
    receitaBruta,
    totalRepasse,
    receitaLiquida,
    impostos,
    custosDespesas,
    custosTotal,
    resultado,
    caixaInicial,
    caixaAtual,
    runway,
    folha,
    despesasPorCategoria,
    totalClientes: receitas.length,
    clientesCapacidade: 30,
  };
}

// Historical data for charts (last 6 months)
export function getHistoricalData() {
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  const labels = ["Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26"];
  
  // Simplified historical values
  const data = [
    { mes: "Out/25", receitaLiquida: 18000, custos: 22000, resultado: -4000 },
    { mes: "Nov/25", receitaLiquida: 22000, custos: 23000, resultado: -1000 },
    { mes: "Dez/25", receitaLiquida: 25000, custos: 23500, resultado: 1500 },
    { mes: "Jan/26", receitaLiquida: 28000, custos: 24000, resultado: 4000 },
  ];

  // Feb and Mar from calculations
  const febSummary = getMonthSummary("2026-02");
  const marSummary = getMonthSummary("2026-03");
  
  data.push({ mes: "Fev/26", receitaLiquida: febSummary.receitaLiquida, custos: febSummary.custosTotal, resultado: febSummary.resultado });
  data.push({ mes: "Mar/26", receitaLiquida: marSummary.receitaLiquida, custos: marSummary.custosTotal, resultado: marSummary.resultado });

  return data;
}
