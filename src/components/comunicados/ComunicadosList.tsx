import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Comunicado,
  ComunicadoStatus,
  ComunicadoTipo,
  ComunicadoPrioridade,
  PublicoAlvo,
  getStatusColor,
  getPrioridadeColor,
  getTipoColor,
} from "@/types/comunicados";
import {
  Eye,
  Edit,
  Copy,
  Archive,
  Search,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAnnouncementViews } from "@/hooks/useAnnouncementViews";

interface ComunicadosListProps {
  comunicados: Comunicado[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function ComunicadosList({ comunicados, onView, onEdit, onDuplicate, onArchive }: ComunicadosListProps) {
  const [search, setSearch] = useState("");
  const [filterPublico, setFilterPublico] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPrioridade, setFilterPrioridade] = useState<string>("all");
  const { data: allViews } = useAnnouncementViews();

  const ativos = comunicados.filter((c) => c.status === "Ativo").length;
  const programados = comunicados.filter((c) => c.status === "Programado").length;
  const confirmacoesPendentes = comunicados.filter(
    (c) => c.status === "Ativo" && c.exigirConfirmacao
  ).length;
  const criticos = comunicados.filter(
    (c) => c.status === "Ativo" && c.prioridade === "Crítica"
  ).length;

  const filtered = comunicados.filter((c) => {
    if (search && !c.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPublico !== "all" && !c.publico.includes(filterPublico as PublicoAlvo)) return false;
    if (filterTipo !== "all" && c.tipo !== filterTipo) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterPrioridade !== "all" && c.prioridade !== filterPrioridade) return false;
    return true;
  });

  const getViewCount = (id: string) => (allViews ?? []).filter((v) => v.announcement_id === id).length;

  const summaryCards = [
    { label: "Ativos", value: ativos, icon: Bell, color: "text-emerald-600" },
    { label: "Programados", value: programados, icon: Clock, color: "text-blue-600" },
    { label: "Confirmações pendentes", value: confirmacoesPendentes, icon: CheckCircle2, color: "text-yellow-600" },
    { label: "Prioridade crítica", value: criticos, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar por título"
            className="pl-9"
          />
        </div>
        <Select value={filterPublico} onValueChange={setFilterPublico}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Público" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos públicos</SelectItem>
            <SelectItem value="Franqueadora">Franqueadora</SelectItem>
            <SelectItem value="Franqueados">Franqueados</SelectItem>
            <SelectItem value="Clientes finais">Clientes finais</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="Informativo">Informativo</SelectItem>
            <SelectItem value="Atualização de sistema">Atualização de sistema</SelectItem>
            <SelectItem value="Alerta operacional">Alerta operacional</SelectItem>
            <SelectItem value="Campanha">Campanha</SelectItem>
            <SelectItem value="Institucional">Institucional</SelectItem>
            <SelectItem value="Urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Programado">Programado</SelectItem>
            <SelectItem value="Expirado">Expirado</SelectItem>
            <SelectItem value="Rascunho">Rascunho</SelectItem>
            <SelectItem value="Arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Público</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className={c.status === "Expirado" ? "opacity-60" : ""}>
                  <TableCell className="font-medium max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{c.titulo}</span>
                      {c.mostrarPopup && <MonitorSmartphone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      {c.exigirConfirmacao && <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.publico.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">{p}</Badge>
                      ))}
                      {c.unidadesEspecificas && c.unidadesEspecificas.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{c.unidadesEspecificas.length} unid.</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getTipoColor(c.tipo)} border-0 text-[10px]`}>{c.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getPrioridadeColor(c.prioridade)} border-0 text-[10px] ${c.prioridade === "Crítica" ? "animate-pulse" : ""}`}>
                      {c.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(c.status)} border-0 text-[10px]`}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(c.criadoEm), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm">{c.autorNome}</TableCell>
                  <TableCell className="text-center text-sm">{getViewCount(c.id)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(c.id)} aria-label="Visualizar"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c.id)} aria-label="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(c.id)} aria-label="Copiar"><Copy className="w-3.5 h-3.5" /></Button>
                      {c.status !== "Arquivado" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onArchive(c.id)} aria-label="Arquivar"><Archive className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum comunicado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
