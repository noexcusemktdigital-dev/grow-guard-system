import { useState, useMemo } from "react";
import { BookOpen, Plus, Copy, Search, ChevronDown, ChevronUp, Sparkles, FileText, Phone, Target, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClienteScripts, type ClienteScript } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

const categoryMeta: Record<string, { icon: React.ElementType; gradient: string; accent: string }> = {
  "Scripts de Vendas": { icon: Target, gradient: "from-blue-500/15 to-blue-600/5", accent: "text-blue-400 border-blue-500/30" },
  "Roteiros de Ligação": { icon: Phone, gradient: "from-emerald-500/15 to-emerald-600/5", accent: "text-emerald-400 border-emerald-500/30" },
  "Modelos de Proposta": { icon: FileText, gradient: "from-purple-500/15 to-purple-600/5", accent: "text-purple-400 border-purple-500/30" },
  "Estratégias": { icon: Lightbulb, gradient: "from-amber-500/15 to-amber-600/5", accent: "text-amber-400 border-amber-500/30" },
};

function ScriptCard({ script, isExpanded, onToggle }: { script: ClienteScript; isExpanded: boolean; onToggle: () => void }) {
  const meta = categoryMeta[script.category] || categoryMeta["Scripts de Vendas"];

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${isExpanded ? "ring-1 ring-primary/30 shadow-lg" : ""}`}
      onClick={onToggle}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-50`} />
      <CardContent className="relative py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${meta.accent} bg-background/50`}>
              <meta.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{script.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{script.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(script.content);
                toast({ title: "Copiado!" });
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {isExpanded && (
          <div className="animate-fade-in mt-3 space-y-3">
            <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg text-sm whitespace-pre-wrap border font-mono text-xs leading-relaxed">
              {script.content}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Atualizado em {script.updatedAt}</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={(e) => { e.stopPropagation(); toast({ title: "Em breve!", description: "Edição de scripts estará disponível." }); }}>
                  Editar
                </Button>
                <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 gap-1" onClick={(e) => { e.stopPropagation(); toast({ title: "Em breve!", description: "Geração com IA estará disponível." }); }}>
                  <Sparkles className="w-2.5 h-2.5" /> Gerar com IA
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isExpanded && (
          <p className="text-[10px] text-muted-foreground">Atualizado em {script.updatedAt}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClienteScripts() {
  const scripts = useMemo(() => getClienteScripts(), []);
  const categories = ["Scripts de Vendas", "Roteiros de Ligação", "Modelos de Proposta", "Estratégias"];
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = (cat: string) =>
    scripts
      .filter(s => s.category === cat)
      .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Scripts & Playbooks"
        subtitle="Biblioteca de scripts, roteiros e estratégias"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Script</Button>}
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar scripts por título ou conteúdo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map(cat => {
          const meta = categoryMeta[cat];
          const count = scripts.filter(s => s.category === cat).length;
          return (
            <div key={cat} className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br ${meta.gradient}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${meta.accent} bg-background/50`}>
                <meta.icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium">{cat.replace("Scripts de ", "").replace("Roteiros de ", "").replace("Modelos de ", "")}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue={categories[0]}>
        <TabsList className="flex-wrap">
          {categories.map(c => (
            <TabsTrigger key={c} value={c} className="text-xs gap-1.5">
              {(() => { const I = categoryMeta[c].icon; return <I className="w-3 h-3" />; })()}
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
            {filtered(cat).map(s => (
              <ScriptCard
                key={s.id}
                script={s}
                isExpanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              />
            ))}
            {filtered(cat).length === 0 && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? `Nenhum resultado para "${search}"` : "Nenhum script nesta categoria"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
