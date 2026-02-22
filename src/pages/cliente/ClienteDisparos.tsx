import { useState } from "react";
import {
  Send, Plus, Zap, AlertTriangle, Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClienteDispatches, useClienteDispatchMutations } from "@/hooks/useClienteDispatches";
import { useWhatsAppInstance, useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const { data: dispatches, isLoading } = useClienteDispatches();
  const { createDispatch } = useClienteDispatchMutations();
  const { data: instance } = useWhatsAppInstance();
  const sendWhatsApp = useSendWhatsAppMessage();

  const isConnected = instance?.status === "connected";

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardData, setWizardData] = useState({ name: "", channel: "whatsapp", message: "", recipients: "" });

  const allDispatches = dispatches ?? [];

  const resetWizard = () => {
    setWizardData({ name: "", channel: "whatsapp", message: "", recipients: "" });
  };

  const handleSend = () => {
    createDispatch.mutate(
      { title: wizardData.name, channel: wizardData.channel, message: wizardData.message },
      {
        onSuccess: () => {
          // If WhatsApp channel and connected, send messages
          if (wizardData.channel === "whatsapp" && isConnected && wizardData.recipients.trim()) {
            const phones = wizardData.recipients
              .split(/[,;\n]+/)
              .map((p) => p.trim())
              .filter(Boolean);

            phones.forEach((phone) => {
              sendWhatsApp.mutate({ contactPhone: phone, message: wizardData.message });
            });

            toast({
              title: "Disparo criado e enviado!",
              description: `Enviando para ${phones.length} destinatário(s).`,
            });
          } else {
            toast({ title: "Disparo criado!", description: `"${wizardData.name}" foi adicionado.` });
          }
          setWizardOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader title="Disparos WhatsApp" subtitle="Envie mensagens e campanhas" icon={<Send className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
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
            <Badge variant="outline" className={`text-[10px] gap-1 ${isConnected ? "border-emerald-500/30 text-emerald-400" : "border-orange-500/30 text-orange-400"}`}>
              <Zap className="w-3 h-3" /> {isConnected ? "Z-API Conectado" : "Z-API Desconectado"}
            </Badge>
            <Button size="sm" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Disparo
            </Button>
          </div>
        }
      />

      {!isConnected && (
        <Alert className="border-orange-500/30 bg-orange-500/5">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">WhatsApp não conectado. Disparos serão salvos como rascunho.</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/cliente/integracoes")}>
              <Settings2 className="w-3.5 h-3.5 mr-1" /> Configurar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.length}</p><p className="text-[10px] text-muted-foreground uppercase">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter((d) => d.status === "sent").length}</p><p className="text-[10px] text-muted-foreground uppercase">Enviados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter((d) => d.status === "scheduled").length}</p><p className="text-[10px] text-muted-foreground uppercase">Agendados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter((d) => d.status === "draft").length}</p><p className="text-[10px] text-muted-foreground uppercase">Rascunhos</p></CardContent></Card>
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
          {allDispatches.map((d, i) => (
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
                  {d.sent_at
                    ? `Enviado em ${new Date(d.sent_at).toLocaleDateString("pt-BR")}`
                    : d.scheduled_at
                      ? `Agendado para ${new Date(d.scheduled_at).toLocaleDateString("pt-BR")}`
                      : `Criado em ${new Date(d.created_at).toLocaleDateString("pt-BR")}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wizard Sheet */}
      <Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Disparo WhatsApp</SheetTitle>
            <SheetDescription>Preencha os dados para criar seu disparo</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label className="text-xs">Nome do disparo</Label>
              <Input placeholder="Ex: Promoção de março" value={wizardData.name} onChange={(e) => setWizardData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Canal</Label>
              <Select value={wizardData.channel} onValueChange={(v) => setWizardData((p) => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {wizardData.channel === "whatsapp" && (
              <div className="space-y-2">
                <Label className="text-xs">Destinatários (telefones)</Label>
                <Textarea
                  placeholder="5511999999999&#10;5511888888888&#10;(um por linha ou separados por vírgula)"
                  className="min-h-[80px] font-mono text-xs"
                  value={wizardData.recipients}
                  onChange={(e) => setWizardData((p) => ({ ...p, recipients: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground">
                  {wizardData.recipients.split(/[,;\n]+/).filter((p) => p.trim()).length} destinatário(s)
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs">Mensagem</Label>
              <Textarea placeholder="Digite a mensagem..." className="min-h-[120px]" value={wizardData.message} onChange={(e) => setWizardData((p) => ({ ...p, message: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-8">
            <Button variant="outline" className="flex-1" onClick={() => setWizardOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSend} disabled={!wizardData.name.trim() || createDispatch.isPending}>
              <Send className="w-3.5 h-3.5 mr-1" />
              {wizardData.channel === "whatsapp" && isConnected && wizardData.recipients.trim() ? "Criar e Enviar" : "Criar Disparo"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
