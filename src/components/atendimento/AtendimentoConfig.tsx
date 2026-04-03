import { useState } from "react";
import { CATEGORIES, SUBCATEGORIES_MAP, SLA_DEADLINES, RESPONSAVEIS, TicketCategory, TicketPriority } from "@/types/atendimento";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Clock, Users, Tag, Zap } from "lucide-react";

export function AtendimentoConfig() {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [sla, setSla] = useState<Record<TicketPriority, number>>({ ...SLA_DEADLINES });

  return (
    <div className="space-y-6">
      {/* Categorias */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Categorias e Subcategorias</h3>
        </div>
        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <button
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted/50 text-sm"
                onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
              >
                {expandedCat === cat ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span className="font-medium">{cat}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">{SUBCATEGORIES_MAP[cat].length}</Badge>
              </button>
              {expandedCat === cat && (
                <div className="ml-8 mb-2 space-y-1">
                  {SUBCATEGORIES_MAP[cat].map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground py-1 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* SLA */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">SLA por Prioridade</h3>
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo (horas)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.keys(sla) as TicketPriority[]).map(p => (
              <TableRow key={p}>
                <TableCell className="text-sm font-medium">{p}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={sla[p]}
                    onChange={e => setSla(prev => ({ ...prev, [p]: Number(e.target.value) }))}
                    className="w-20 h-8 text-sm"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Responsáveis */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Responsáveis Disponíveis</h3>
        </div>
        <div className="space-y-2">
          {RESPONSAVEIS.map(r => (
            <div key={r.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded bg-muted/30">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {r.nome[0]}
              </div>
              {r.nome}
            </div>
          ))}
        </div>
      </Card>

      {/* Automação */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Regras de Automação</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Notificar equipe ao abrir chamado</span>
            <Switch defaultChecked />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Atribuição automática por categoria</p>
            {CATEGORIES.slice(0, 4).map(cat => (
              <div key={cat} className="flex items-center gap-3 text-sm">
                <span className="w-24">{cat}</span>
                <Select defaultValue="">
                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {RESPONSAVEIS.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
