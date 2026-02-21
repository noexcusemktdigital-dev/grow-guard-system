import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Plus, Trash2 } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ItemProgramado {
  id: string;
  descricao: string;
  mes: string;
  valor: number;
  tipo: "Aumento folha" | "Contratação" | "Evento" | "Treinamento";
}

export default function FinanceiroConfiguracoes() {
  const [impostoPercent, setImpostoPercent] = useState(10);
  const [repasseFranqueado, setRepasseFranqueado] = useState(20);
  const [repasseParceiro, setRepasseParceiro] = useState(10);
  const [capacidade, setCapacidade] = useState(30);
  const [incluiProLabore, setIncluiProLabore] = useState(false);
  const [usdBrl, setUsdBrl] = useState(5.80);
  const [runwayMinimo, setRunwayMinimo] = useState(2);
  const [margemMinima, setMargemMinima] = useState(15);

  const [itensProgramados, setItensProgramados] = useState<ItemProgramado[]>([
    { id: "1", descricao: "Aumento Gestor Performance", mes: "2026-03", valor: 500, tipo: "Aumento folha" },
    { id: "2", descricao: "Aumento Gerente Criativa", mes: "2026-03", valor: 500, tipo: "Aumento folha" },
    { id: "3", descricao: "Contratação Atendimento 2", mes: "2026-03", valor: 2500, tipo: "Contratação" },
    { id: "4", descricao: "Aumento Gestor Performance", mes: "2026-04", valor: 500, tipo: "Aumento folha" },
    { id: "5", descricao: "Aumento Gerente Criativa", mes: "2026-04", valor: 500, tipo: "Aumento folha" },
    { id: "6", descricao: "Evento mensal empresários", mes: "2026-04", valor: 3000, tipo: "Evento" },
    { id: "7", descricao: "Treinamento equipe", mes: "2026-04", valor: 2000, tipo: "Treinamento" },
  ]);

  const [newItem, setNewItem] = useState({ descricao: "", mes: "2026-03", valor: 0, tipo: "Aumento folha" as ItemProgramado["tipo"] });

  const addItem = () => {
    if (!newItem.descricao || newItem.valor <= 0) return;
    setItensProgramados(prev => [...prev, { ...newItem, id: `p-${Date.now()}` }]);
    setNewItem({ descricao: "", mes: "2026-03", valor: 0, tipo: "Aumento folha" });
  };

  const removeItem = (id: string) => {
    setItensProgramados(prev => prev.filter(i => i.id !== id));
  };

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
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Configurações Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Motor do sistema — Regras e parâmetros</p>
        </div>
        <Button size="sm" className="gap-2">
          <Save className="w-4 h-4" /> Salvar
        </Button>
      </div>

      {/* Imposto */}
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
              <input type="checkbox" checked={incluiProLabore} onChange={() => setIncluiProLabore(!incluiProLabore)} className="rounded border-border accent-primary" />
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

      {/* Capacidade + Câmbio */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Capacidade e Câmbio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Capacidade máxima de clientes</label>
            <input type="number" value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-32 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">USD/BRL do mês</label>
            <input type="number" step="0.01" value={usdBrl} onChange={(e) => setUsdBrl(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-32 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Limiares de Alerta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Runway mínimo (meses)</label>
            <input type="number" value={runwayMinimo} onChange={(e) => setRunwayMinimo(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Margem mínima (%)</label>
            <input type="number" value={margemMinima} onChange={(e) => setMargemMinima(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-24 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Semáforo: 🟢 Lucro {">"} {margemMinima}% e runway {">"} 3 meses | 🟡 Lucro {">"} 5% e runway {">"} {runwayMinimo} | 🔴 Abaixo desses limites
        </p>
      </div>

      {/* Itens Programados */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Itens Programados</h3>
        <div className="space-y-2">
          {itensProgramados.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{item.tipo}</span>
                <span className="text-sm text-foreground">{item.descricao}</span>
                <span className="text-xs text-muted-foreground">{item.mes}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{formatBRL(item.valor)}</span>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-3">Adicionar item programado</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={newItem.descricao} onChange={e => setNewItem({ ...newItem, descricao: e.target.value })} placeholder="Descrição"
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            <select value={newItem.mes} onChange={e => setNewItem({ ...newItem, mes: e.target.value })}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="2026-03">Mar/26</option>
              <option value="2026-04">Abr/26</option>
              <option value="2026-05">Mai/26</option>
              <option value="2026-06">Jun/26</option>
            </select>
            <input type="number" value={newItem.valor || ""} onChange={e => setNewItem({ ...newItem, valor: Number(e.target.value) })} placeholder="Valor"
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            <Button size="sm" onClick={addItem} className="gap-1"><Plus className="w-3.5 h-3.5" /> Adicionar</Button>
          </div>
        </div>
      </div>

      {/* Plataformas */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Plataformas ({formatBRL(plataformas.reduce((s, p) => s + p.valor, 0))})</h3>
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
        <h3 className="font-semibold text-foreground">Estrutura ({formatBRL(estruturaContas.reduce((s, e) => s + e.valor, 0))})</h3>
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
