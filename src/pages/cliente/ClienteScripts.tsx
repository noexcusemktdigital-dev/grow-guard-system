import { useState, useMemo } from "react";
import { BookOpen, Plus, Copy, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClienteScripts, type ClienteScript } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

function ScriptCard({ script }: { script: ClienteScript }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold">{script.title}</p>
            <p className="text-xs text-muted-foreground">{script.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(script.content); toast({ title: "Copiado!" }); }}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        {expanded && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap border">
            {script.content}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-2">Atualizado em {script.updatedAt}</p>
      </CardContent>
    </Card>
  );
}

export default function ClienteScripts() {
  const scripts = useMemo(() => getClienteScripts(), []);
  const categories = ["Scripts de Vendas", "Roteiros de Ligação", "Modelos de Proposta", "Estratégias"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Scripts & Playbooks"
        subtitle="Biblioteca de scripts, roteiros e estratégias"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Script</Button>}
      />

      <Tabs defaultValue={categories[0]}>
        <TabsList className="flex-wrap">
          {categories.map(c => <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>)}
        </TabsList>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
            {scripts.filter(s => s.category === cat).map(s => <ScriptCard key={s.id} script={s} />)}
            {scripts.filter(s => s.category === cat).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum script nesta categoria</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
