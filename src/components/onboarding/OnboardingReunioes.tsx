import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Video, Target, BarChart3, TrendingUp, CalendarCheck } from "lucide-react";
import type { OnboardingMeeting, MeetingType, MeetingStatus } from "@/types/onboarding";
import { MEETING_STATUS_COLORS } from "@/types/onboarding";

const MEETING_ICONS: Record<MeetingType, React.ElementType> = {
  Kickoff: Video,
  "Estratégica": Target,
  Comercial: TrendingUp,
  Performance: BarChart3,
  "Revisão mensal": CalendarCheck,
};

const MEETING_TYPES: MeetingType[] = ["Kickoff", "Estratégica", "Comercial", "Performance", "Revisão mensal"];

interface OnboardingReunioesProps {
  meetings: OnboardingMeeting[];
  onboardingId: string;
  onAdd: (meeting: OnboardingMeeting) => void;
}

export function OnboardingReunioes({ meetings, onboardingId, onAdd }: OnboardingReunioesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState<MeetingType>("Kickoff");
  const [data, setData] = useState("");
  const [resumo, setResumo] = useState("");
  const [proximosPassos, setProximosPassos] = useState("");

  const sorted = [...meetings].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const handleAdd = () => {
    if (!data) return;
    onAdd({
      id: `mt-${Date.now()}`,
      onboardingId,
      tipo,
      data,
      status: "Agendada",
      resumo,
      proximosPassos,
    });
    setDialogOpen(false);
    setTipo("Kickoff");
    setData("");
    setResumo("");
    setProximosPassos("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Agendar Reunião</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar Reunião</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as MeetingType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Resumo</Label>
                <Textarea value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="Resumo da reunião..." />
              </div>
              <div className="space-y-2">
                <Label>Próximos passos</Label>
                <Input value={proximosPassos} onChange={(e) => setProximosPassos(e.target.value)} placeholder="O que fazer depois?" />
              </div>
              <Button onClick={handleAdd} className="w-full">Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 space-y-6">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
        {sorted.map((m) => {
          const Icon = MEETING_ICONS[m.tipo] || Video;
          return (
            <div key={m.id} className="relative">
              <div className="absolute -left-5 top-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                <Icon className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.tipo}</span>
                    <Badge className={`text-xs ${MEETING_STATUS_COLORS[m.status]}`}>{m.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(m.data).toLocaleDateString("pt-BR")}</span>
                </div>
                {m.resumo && <p className="text-sm text-muted-foreground">{m.resumo}</p>}
                {m.proximosPassos && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Próximos passos:</span> {m.proximosPassos}</p>
                )}
                {m.anexo && <p className="text-xs text-muted-foreground">📎 {m.anexo}</p>}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião registrada.</p>
        )}
      </div>
    </div>
  );
}
