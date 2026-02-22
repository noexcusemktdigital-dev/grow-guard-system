import { useState } from "react";
import {
  Send, Plus, MessageSquare, Zap, Clock, Filter,
  ChevronDown, ChevronUp, Play, Pause, Settings2,
  ArrowRight, Check, Users, FileText, Target
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useClienteDispatches, useClienteDispatchMutations } from "@/hooks/useClienteDispatches";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  draft: "bg-muted text-muted-foreground",
  sending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const statusLabels: Record<string, string> = {
  sent: "Enviado",
  scheduled: "Agendado",
  draft: "Rascunho",
  sending: "Enviando",
};

export default function ClienteDisparos() {
  const { data: dispatches, isLoading } = useClienteDispatches();
  const { createDispatch } = useClienteDispatchMutations();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({ name: "", channel: "whatsapp", message: "" });

  const allDispatches = dispatches ?? [];

  const resetWizard = () => {
    setWizardStep(1);
    setWizardData({ name: "", channel: "whatsapp", message: "" });
  };

  const handleSend = () => {
    createDispatch.mutate({ title: wizardData.name, channel: wizardData.channel, message: wizardData.message }, {
      onSuccess: () => {
        setWizardOpen(false);
        toast({ title: "Disparo criado!", description: `"${wizardData.name}" foi adicionado.` });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader title="Disparos WhatsApp" subtitle="Envie mensagens e campanhas" icon={<Send className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Disparos WhatsApp"
        subtitle="Envie mensagens, campanhas e follow-ups via WhatsApp"
        icon={<Send className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-400"><Zap className="w-3 h-3" /> Z-API</Badge>
            <Button size="sm" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Disparo
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.length}</p><p className="text-[10px] text-muted-foreground uppercase">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter(d => d.status === "sent").length}</p><p className="text-[10px] text-muted-foreground uppercase">Enviados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter(d => d.status === "scheduled").length}</p><p className="text-[10px] text-muted-foreground uppercase">Agendados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter(d => d.status === "draft").length}</p><p className="text-[10px] text-muted-foreground uppercase">Rascunhos</p></CardContent></Card>
      </div>

      {allDispatches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Send className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">Nenhum disparo criado</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Crie disparos para enviar mensagens via WhatsApp.</p>
            <Button size="sm" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Criar Disparo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDispatches.map((d, i) => {
            const stats = d.stats as any;
            return (
              <Card key={d.id} className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{d.channel}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[d.status] || ""}`}>
                      {statusLabels[d.status] || d.status}
                    </Badge>
                  </div>
                  {d.message && <p className="text-xs text-muted-foreground line-clamp-2">{d.message}</p>}
                  <p className="text-[10px] text-muted-foreground">
                    {d.sent_at ? `Enviado em ${new Date(d.sent_at).toLocaleDateString("pt-BR")}` :
                     d.scheduled_at ? `Agendado para ${new Date(d.scheduled_at).toLocaleDateString("pt-BR")}` :
                     `Criado em ${new Date(d.created_at).toLocaleDateString("pt-BR")}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Wizard Sheet */}
      <Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Disparo WhatsApp</SheetTitle>
            <SheetDescription>Preencha as etapas para criar seu disparo</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label className="text-xs">Nome do disparo</Label>
              <Input placeholder="Ex: Promoção de março" value={wizardData.name} onChange={e => setWizardData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Canal</Label>
              <Select value={wizardData.channel} onValueChange={v => setWizardData(p => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Mensagem</Label>
              <Textarea placeholder="Digite a mensagem..." className="min-h-[120px]" value={wizardData.message} onChange={e => setWizardData(p => ({ ...p, message: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-8">
            <Button variant="outline" className="flex-1" onClick={() => setWizardOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSend} disabled={!wizardData.name.trim() || createDispatch.isPending}>
              <Send className="w-3.5 h-3.5 mr-1" /> Criar Disparo
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
