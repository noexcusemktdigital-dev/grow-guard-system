import { useState, useMemo } from "react";
import { FileText, Plus, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getClienteConteudos } from "@/data/clienteData";

const statusColors: Record<string, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Agendado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Publicado: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const networkColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-500",
  Facebook: "bg-blue-600/10 text-blue-600",
  LinkedIn: "bg-sky-500/10 text-sky-500",
  TikTok: "bg-purple-500/10 text-purple-500",
};

export default function ClienteConteudos() {
  const conteudos = useMemo(() => getClienteConteudos(), []);
  const [filter, setFilter] = useState("Todas");
  const networks = ["Todas", "Instagram", "Facebook", "LinkedIn", "TikTok"];
  const filtered = filter === "Todas" ? conteudos : conteudos.filter(c => c.network === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Conteúdos"
        subtitle="Planejamento editorial e calendário de publicações"
        icon={<FileText className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Conteúdo</Button>}
      />

      <div className="flex gap-2 flex-wrap">
        {networks.map(n => <Button key={n} variant={filter === n ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(n)}>{n}</Button>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`text-[9px] ${networkColors[c.network]}`}>{c.network}</Badge>
                <Badge variant="outline" className={`text-[9px] ${statusColors[c.status]}`}>{c.status}</Badge>
              </div>
              <p className="text-sm font-semibold">{c.title}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[9px]">{c.type}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {c.date}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
