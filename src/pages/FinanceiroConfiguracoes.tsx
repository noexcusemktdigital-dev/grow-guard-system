import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroConfiguracoes() {
  const [impostoPercent, setImpostoPercent] = useState(10);
  const [repasseFranqueado, setRepasseFranqueado] = useState(20);
  const [repasseParceiro, setRepasseParceiro] = useState(10);
  const [capacidade, setCapacidade] = useState(30);
  const [incluiProLabore, setIncluiProLabore] = useState(false);

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

  const estruturaContas = [
    { nome: "Aluguel + Estrutura", valor: 5192.25 },
    { nome: "Jurídico", valor: 800 },
    { nome: "RH", valor: 1733.33 },
  ];

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
              <input type="number" value={impostoPercent} onChange={(e) => setImpostoPercent(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Base de cálculo</label>
            <p className="text-sm text-foreground">Faturamento com NF + Folha Operacional</p>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={incluiProLabore} onChange={() => setIncluiProLabore(!incluiProLabore)}
                className="rounded border-border bg-secondary accent-primary" />
              <span className="text-xs text-muted-foreground">Incluir Pró-labore na base</span>
            </label>
          </div>
        </div>
      </div>

      {/* Repasse */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Repasse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Franqueado</label>
            <div className="flex items-center gap-2">
              <input type="number" value={repasseFranqueado} onChange={(e) => setRepasseFranqueado(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Parceiro</label>
            <div className="flex items-center gap-2">
              <input type="number" value={repasseParceiro} onChange={(e) => setRepasseParceiro(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capacidade */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Capacidade</h3>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Capacidade atual de clientes</label>
          <input type="number" value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-32 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {/* Plataformas */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Plataformas (Total: {formatBRL(plataformas.reduce((s, p) => s + p.valor, 0))})</h3>
        <div className="space-y-2">
          {plataformas.map(p => (
            <div key={p.nome} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-foreground">{p.nome}</span>
              <span className="text-sm font-medium text-foreground">{formatBRL(p.valor)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Estrutura */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Estrutura (Total: {formatBRL(estruturaContas.reduce((s, e) => s + e.valor, 0))})</h3>
        <div className="space-y-2">
          {estruturaContas.map(e => (
            <div key={e.nome} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-foreground">{e.nome}</span>
              <span className="text-sm font-medium text-foreground">{formatBRL(e.valor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
