import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, UserX, Rocket, TrendingUp, Plus, Eye } from "lucide-react";
import {
  OnboardingUnit, OnboardingMeeting, OnboardingTask, OnboardingAlert,
  getOnboardingProgress, getCurrentPhase,
  STATUS_COLORS, CS_RESPONSAVEIS, DEFAULT_CHECKLIST,
} from "@/types/onboarding";
import { getOnboardingAlerts } from "@/data/onboardingData";
import { mockUnidades } from "@/data/unidadesData";

interface OnboardingListProps {
  onboardings: OnboardingUnit[];
  meetings: OnboardingMeeting[];
  tasks: OnboardingTask[];
  onSelect: (id: string) => void;
  onAddOnboarding: (ob: OnboardingUnit) => void;
}

export function OnboardingList({ onboardings, meetings, tasks, onSelect, onAddOnboarding }: OnboardingListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [csFilter, setCsFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUnidade, setNewUnidade] = useState("");
  const [newCS, setNewCS] = useState("");
  const [newData, setNewData] = useState("");

  const alerts = getOnboardingAlerts(onboardings, meetings, tasks);
  const avgProgress = onboardings.length > 0
    ? Math.round(onboardings.reduce((acc, ob) => acc + getOnboardingProgress(ob.checklist), 0) / onboardings.length)
    : 0;

  const alertCounts = {
    inatividade: alerts.filter((a) => a.tipo === "inatividade").length,
    kickoff: alerts.filter((a) => a.tipo === "kickoff").length,
    risco: onboardings.filter((o) => o.status === "Em risco").length,
  };

  const filtered = onboardings.filter((ob) => {
    if (statusFilter !== "all" && ob.status !== statusFilter) return false;
    if (csFilter !== "all" && ob.responsavelCS !== csFilter) return false;
    return true;
  });

  const usedUnidadeIds = onboardings.map((o) => o.unidadeId);
  const availableUnidades = mockUnidades.filter((u) => !usedUnidadeIds.includes(u.id));

  const handleCreate = () => {
    if (!newUnidade || !newCS || !newData) return;
    const unidade = mockUnidades.find((u) => u.id === newUnidade);
    if (!unidade) return;
    const newOb: OnboardingUnit = {
      id: `ob-${Date.now()}`,
      unidadeId: unidade.id,
      unidadeNome: unidade.nome,
      responsavelCS: newCS,
      dataInicio: newData,
      status: "Em implantação",
      checklist: DEFAULT_CHECKLIST.map((item, i) => ({ ...item, id: `cl-new-${i}` })),
    };
    onAddOnboarding(newOb);
    setDialogOpen(false);
    setNewUnidade("");
    setNewCS("");
    setNewData("");
  };

  return (
    <div className="space-y-6">
      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <p className="text-2xl font-bold">{alertCounts.inatividade}</p>
            <p className="text-xs text-muted-foreground">Tarefas atrasadas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
            <UserX className="w-4 h-4 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <p className="text-2xl font-bold">{alertCounts.kickoff}</p>
            <p className="text-xs text-muted-foreground">Kickoff pendente</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-300 animate-pulse" />
          </div>
          <div>
            <p className="text-2xl font-bold">{alertCounts.risco}</p>
            <p className="text-xs text-muted-foreground">Em risco</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-2xl font-bold">{avgProgress}%</p>
            <p className="text-xs text-muted-foreground">Progresso médio</p>
          </div>
        </div>
      </div>

      {/* Filters + New */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="Não iniciado">Não iniciado</SelectItem>
            <SelectItem value="Em implantação">Em implantação</SelectItem>
            <SelectItem value="Em acompanhamento">Em acompanhamento</SelectItem>
            <SelectItem value="Implantado com sucesso">Implantado com sucesso</SelectItem>
            <SelectItem value="Em risco">Em risco</SelectItem>
            <SelectItem value="Encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={csFilter} onValueChange={setCsFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Responsável CS" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos CS</SelectItem>
            {CS_RESPONSAVEIS.map((cs) => <SelectItem key={cs} value={cs}>{cs}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Iniciar Onboarding</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Iniciar Onboarding</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={newUnidade} onValueChange={setNewUnidade}>
                    <SelectTrigger><SelectValue placeholder="Selecionar unidade" /></SelectTrigger>
                    <SelectContent>
                      {availableUnidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Responsável CS</Label>
                  <Select value={newCS} onValueChange={setNewCS}>
                    <SelectTrigger><SelectValue placeholder="Selecionar CS" /></SelectTrigger>
                    <SelectContent>
                      {CS_RESPONSAVEIS.map((cs) => <SelectItem key={cs} value={cs}>{cs}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de início</Label>
                  <Input type="date" value={newData} onChange={(e) => setNewData(e.target.value)} />
                </div>
                <Button onClick={handleCreate} className="w-full">Criar Onboarding</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Responsável CS</TableHead>
              <TableHead>Etapa Atual</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ob) => {
              const progress = getOnboardingProgress(ob.checklist);
              const phase = getCurrentPhase(ob.checklist);
              return (
                <TableRow key={ob.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onSelect(ob.id)}>
                  <TableCell className="font-medium">{ob.unidadeNome}</TableCell>
                  <TableCell className="text-sm">{new Date(ob.dataInicio).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">{ob.responsavelCS}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{phase}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUS_COLORS[ob.status]}`}>{ob.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onSelect(ob.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum onboarding encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
