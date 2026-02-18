import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function FinanceiroConfiguracoes() {
  const [impostoPercent, setImpostoPercent] = useState(10);
  const [repasseDefault, setRepasseDefault] = useState(20);
  const [capacidade, setCapacidade] = useState(30);
  const [usdBrl, setUsdBrl] = useState("5.05");
  const [incluiProLabore, setIncluiProLabore] = useState(false);

  const contasFixas = [
    { nome: "Aluguel", valor: 3500, ativa: true },
    { nome: "Internet + Telefone", valor: 350, ativa: true },
    { nome: "Energia", valor: 400, ativa: true },
    { nome: "Jurídico / Contabilidade", valor: 1200, ativa: true },
    { nome: "CapCut Pro", valor: 80, ativa: true },
    { nome: "Canva Pro", valor: 55, ativa: true },
    { nome: "CRM / Automação", valor: 300, ativa: true },
    { nome: "Hosting / Cloud", valor: 200, ativa: true },
  ];

  const [contas, setContas] = useState(contasFixas);

  const toggleConta = (i: number) => {
    const updated = [...contas];
    updated[i] = { ...updated[i], ativa: !updated[i].ativa };
    setContas(updated);
  };

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Regras e parâmetros editáveis</p>
        </div>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="w-4 h-4" /> Salvar
        </Button>
      </div>

      {/* Regra de Imposto */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Regra de Imposto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Percentual de imposto</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={impostoPercent}
                onChange={(e) => setImpostoPercent(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Base de cálculo</label>
            <p className="text-sm text-foreground">Faturamento Bruto + Folha Operacional</p>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={incluiProLabore}
                onChange={() => setIncluiProLabore(!incluiProLabore)}
                className="rounded border-border bg-secondary accent-primary"
              />
              <span className="text-xs text-muted-foreground">Incluir Pró-labore na base</span>
            </label>
          </div>
        </div>
      </div>

      {/* Repasse */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Repasse Franqueado</h3>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Percentual padrão de repasse</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={repasseDefault}
              onChange={(e) => setRepasseDefault(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* Capacidade e Câmbio */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Capacidade e Câmbio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Capacidade atual de clientes</label>
            <input
              type="number"
              value={capacidade}
              onChange={(e) => setCapacidade(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-32 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Câmbio USD/BRL (mês atual)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <input
                type="text"
                value={usdBrl}
                onChange={(e) => setUsdBrl(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contas fixas */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Contas Fixas</h3>
        <div className="space-y-2">
          {contas.map((c, i) => (
            <div key={c.nome} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleConta(i)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${c.ativa ? "bg-primary" : "bg-secondary"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${c.ativa ? "left-[18px] bg-primary-foreground" : "left-0.5 bg-muted-foreground"}`} />
                </button>
                <span className={`text-sm ${c.ativa ? "text-foreground" : "text-muted-foreground line-through"}`}>{c.nome}</span>
              </div>
              <span className={`text-sm font-medium ${c.ativa ? "text-foreground" : "text-muted-foreground"}`}>{formatBRL(c.valor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
