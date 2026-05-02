// @ts-nocheck
import { useState } from "react";
import type { ClientDispatch } from "@/hooks/useClienteDispatches";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  Send, Plus, Zap, Settings2, ChevronRight, ChevronLeft,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClienteDispatches, useClienteDispatchMutations } from "@/hooks/useClienteDispatches";
import { useWhatsAppInstance } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DisparoWarningBanner } from "@/components/disparos/DisparoWarningBanner";
import { DisparoWizardStep1 } from "@/components/disparos/DisparoWizardStep1";
import { DisparoWizardStep2 } from "@/components/disparos/DisparoWizardStep2";
import { DisparoWizardStep3 } from "@/components/disparos/DisparoWizardStep3";
import { DisparoDispatchCard } from "@/components/disparos/DisparoDispatchCard";
import { DisparoDetailSheet } from "@/components/disparos/DisparoDetailSheet";
import { AssessoriaPopup } from "@/components/shared/AssessoriaPopup";

const STEP_TITLES = ["Mensagem", "Destinatários", "Confirmar"];

export default function ClienteDisparos() {
  const navigate = useNavigate();
  const { data: dispatches, isLoading, isError, error, refetch } = useClienteDispatches();
  const { createDispatch, deleteDispatch, triggerBulkSend } = useClienteDispatchMutations();
  const { data: instance } = useWhatsAppInstance();

  const isConnected = instance?.status === "connected";

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Detail sheet
  const [detailDispatch, setDetailDispatch] = useState<Record<string, any> | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Wizard state
  const [step1, setStep1] = useState({ name: "", message: "", imageUrl: "" });
  const [recipients, setRecipients] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState("manual");
  const [delaySeconds, setDelaySeconds] = useState(7);
  const [confirmed, setConfirmed] = useState(false);

  const allDispatches = dispatches ?? [];

  const resetWizard = () => {
    setStep(0);
    setStep1({ name: "", message: "", imageUrl: "" });
    setRecipients([]);
    setSourceType("manual");
    setDelaySeconds(7);
    setConfirmed(false);
  };

  const canAdvance = () => {
    if (step === 0) return step1.name.trim() && step1.message.trim();
    if (step === 1) return recipients.length > 0 && recipients.length <= 100;
    if (step === 2) return confirmed;
    return false;
  };

  const handleCreate = async () => {
    try {
      const result = await createDispatch.mutateAsync({
        title: step1.name,
        channel: "whatsapp",
        message: step1.message,
        image_url: step1.imageUrl || undefined,
        recipients,
        delay_seconds: delaySeconds,
        source_type: sourceType,
      });

      if (isConnected && result?.id) {
        triggerBulkSend.mutate(result.id, {
          onSuccess: (data: Record<string, unknown>) => {
            toast({
              title: "Disparo concluído!",
              description: `${(data?.stats as Record<string, unknown>)?.sent || 0} mensagens enviadas.`,
            });
          },
          onError: (err: unknown) => {
            toast({
              title: "Erro no envio",
              description: err instanceof Error ? err.message : String(err),
              variant: "destructive",
            });
          },
        });
        toast({ title: "Disparo criado!", description: "Envio em andamento..." });
      } else {
        toast({ title: "Disparo salvo como rascunho", description: "Conecte o WhatsApp para enviar." });
      }
      setWizardOpen(false);
    } catch (err: unknown) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDispatch.mutateAsync(deleteId);
      toast({ title: "Disparo excluído" });
    } catch (err: unknown) {
      toast({ title: "Erro ao excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleResend = (id: string) => {
    if (!isConnected) {
      toast({ title: "WhatsApp não conectado", description: "Conecte o WhatsApp para enviar.", variant: "destructive" });
      return;
    }
    triggerBulkSend.mutate(id, {
      onSuccess: (data: Record<string, unknown>) => {
        toast({ title: "Disparo enviado!", description: `${(data?.stats as Record<string, unknown>)?.sent || 0} mensagens enviadas.` });
      },
      onError: (err: unknown) => {
        toast({ title: "Erro no envio", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      },
    });
    toast({ title: "Enviando...", description: "Disparo em andamento." });
  };

  // KPI calculations
  const totalSent = allDispatches
    .filter((d) => d.stats)
    .reduce((acc, d) => acc + ((d.stats as Record<string, unknown>)?.sent as number || 0), 0);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Disparos WhatsApp" subtitle="Envie mensagens e campanhas" icon={<Send className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Disparos WhatsApp" subtitle="Envie mensagens e campanhas" icon={<Send className="w-5 h-5 text-primary" />} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive mb-1">Erro ao carregar disparos</h3>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Não foi possível carregar os disparos."}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Disparos WhatsApp"
        subtitle="Envie mensagens, campanhas e follow-ups via WhatsApp"
        icon={<Send className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <FeatureTutorialButton slug="disparos" />
            <Badge variant="outline" className={`text-[10px] gap-1 ${isConnected ? "border-emerald-500/30 text-emerald-400" : "border-orange-500/30 text-orange-400"}`}>
              <Zap className="w-3 h-3" /> {isConnected ? "Izitech Conectado" : "Izitech Desconectado"}
            </Badge>
            <Button size="sm" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Disparo
            </Button>
          </div>
        }
      />

      <DisparoWarningBanner />

      {!isConnected && (
        <Alert className="border-orange-500/30 bg-orange-500/5">
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
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{totalSent}</p><p className="text-[10px] text-muted-foreground uppercase">Mensagens</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{allDispatches.filter((d) => d.status === "draft").length}</p><p className="text-[10px] text-muted-foreground uppercase">Rascunhos</p></CardContent></Card>
      </div>

      {allDispatches.length === 0 ? (
        <EmptyState
          icon={<Send className="w-8 h-8" />}
          title="Nenhum disparo criado"
          description="Crie disparos para enviar mensagens via WhatsApp."
          action={{ label: "Criar Disparo", onClick: () => { resetWizard(); setWizardOpen(true); } }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDispatches.map((d, i) => (
            <DisparoDispatchCard
              key={d.id}
              dispatch={d as ClientDispatch}
              index={i}
              onView={(dispatch) => setDetailDispatch(dispatch)}
              onDelete={(id) => setDeleteId(id)}
              onResend={handleResend}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <DisparoDetailSheet
        dispatch={detailDispatch as ClientDispatch}
        open={!!detailDispatch}
        onOpenChange={(open) => { if (!open) setDetailDispatch(null); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir disparo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O disparo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Wizard Sheet */}
      <Sheet open={wizardOpen} onOpenChange={(open) => { setWizardOpen(open); if (!open) resetWizard(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Disparo — {STEP_TITLES[step]}</SheetTitle>
            <SheetDescription>Etapa {step + 1} de 3</SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-2 mt-4 mb-6">
            {STEP_TITLES.map((t, i) => (
              <div
                key={t}
                className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {step === 0 && <DisparoWizardStep1 data={step1} onChange={setStep1} />}
          {step === 1 && (
            <DisparoWizardStep2
              recipients={recipients}
              sourceType={sourceType}
              onChange={(r, s) => { setRecipients(r); setSourceType(s); }}
            />
          )}
          {step === 2 && (
            <DisparoWizardStep3
              recipientCount={recipients.length}
              message={step1.message}
              hasImage={!!step1.imageUrl}
              delaySeconds={delaySeconds}
              confirmed={confirmed}
              onDelayChange={setDelaySeconds}
              onConfirmChange={setConfirmed}
            />
          )}

          <div className="flex gap-2 mt-8">
            {step > 0 ? (
              <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Voltar
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={() => setWizardOpen(false)}>
                Cancelar
              </Button>
            )}

            {step < 2 ? (
              <Button className="flex-1" disabled={!canAdvance()} onClick={() => setStep(step + 1)}>
                Próximo <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={!canAdvance() || createDispatch.isPending}
                onClick={handleCreate}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {isConnected ? "Criar e Enviar" : "Salvar Rascunho"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <AssessoriaPopup storageKey="noexcuse_popup_disparos_v1" servico="Disparos em Massa de WhatsApp" />
    </div>
  );
}
