// @ts-nocheck

import { useState } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { Bot, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClienteAgents, useClienteAgentMutations } from "@/hooks/useClienteAgents";
import { AgentCard } from "@/components/cliente/AgentCard";
import { AgentFormSheet } from "@/components/cliente/AgentFormSheet";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AiAgent } from "@/types/cliente";
import { AssessoriaPopup } from "@/components/shared/AssessoriaPopup";

export default function ClienteAgentesIA() {
  const { data: agents, isLoading } = useClienteAgents();
  const { createAgent, updateAgent, deleteAgent, duplicateAgent, reactivateAgentContacts } = useClienteAgentMutations();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AiAgent> | null>(null);
  const [deleting, setDeleting] = useState<AiAgent | null>(null);

  const handleNew = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (agent: AiAgent) => { setEditing(agent); setSheetOpen(true); };

  const handleSave = (agent: Partial<AiAgent>) => {
    if (editing?.id) {
      updateAgent.mutate({ id: editing.id, ...agent }, {
        onSuccess: () => { toast({ title: "Agente atualizado com sucesso!" }); setSheetOpen(false); },
        onError: () => toast({ title: "Erro ao atualizar agente", variant: "destructive" }),
      });
    } else {
      createAgent.mutate(agent, {
        onSuccess: () => { playSound("success"); toast({ title: "Agente criado com sucesso!" }); setSheetOpen(false); },
        onError: () => { playSound("warning"); toast({ title: "Erro ao criar agente", variant: "destructive" }); },
      });
    }
  };

  const handleDuplicate = (agent: AiAgent) => {
    duplicateAgent.mutate(agent, {
      onSuccess: () => { playSound("success"); toast({ title: "Agente duplicado!" }); },
      onError: () => toast({ title: "Erro ao duplicar", variant: "destructive" }),
    });
  };

  const handleToggleStatus = (agent: AiAgent) => {
    const newStatus = agent.status === "active" ? "paused" : "active";
    updateAgent.mutate({ id: agent.id, status: newStatus } as Record<string, unknown>, {
      onSuccess: () => {
        toast({ title: newStatus === "active" ? "Agente ativado!" : "Agente pausado!" });
        // When activating, offer to reassociate contacts
        if (newStatus === "active") {
          reactivateAgentContacts.mutate(agent.id);
        }
      },
      onError: () => toast({ title: "Erro ao alterar status", variant: "destructive" }),
    });
  };

  const handleReactivateContacts = (agent: AiAgent) => {
    reactivateAgentContacts.mutate(agent.id, {
      onSuccess: () => {
        playSound("success");
        toast({ title: "Contatos reassociados ao modo IA!" });
      },
      onError: () => toast({ title: "Erro ao reativar contatos", variant: "destructive" }),
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteAgent.mutate(deleting.id, {
      onSuccess: () => { playSound("success"); toast({ title: "Agente excluído" }); setDeleting(null); },
      onError: () => toast({ title: "Erro ao excluir agente", variant: "destructive" }),
    });
  };

  const hasAgents = agents && agents.length > 0;

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Agentes de IA" subtitle="Crie e gerencie seus agentes inteligentes" icon={<Bot className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <FeatureTutorialButton slug="agentes_ia" />
            <Button onClick={handleNew} size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Agente</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2].map((i) => (<Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/20" /></Card>))}
        </div>
      ) : hasAgents ? (
        <div className="grid gap-3 md:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onEdit={handleEdit} onDuplicate={handleDuplicate} onDelete={setDeleting} onToggleStatus={handleToggleStatus} onReactivateContacts={handleReactivateContacts} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4"><Bot className="w-7 h-7 text-muted-foreground/30" /></div>
            <Badge variant="outline" className="gap-1.5 mb-3 text-purple-400 border-purple-500/30"><Sparkles className="w-3 h-3" /> Comece agora</Badge>
            <p className="text-sm font-medium">Nenhum agente criado</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">Crie seu primeiro agente de IA para automatizar prospecção, atendimento e pós-venda.</p>
            <Button onClick={handleNew} size="sm" className="mt-4 gap-1.5"><Plus className="w-4 h-4" /> Criar primeiro agente</Button>
          </CardContent>
        </Card>
      )}

      <AgentFormSheet open={sheetOpen} onOpenChange={setSheetOpen} agent={editing} onSave={handleSave} isSaving={createAgent.isPending || updateAgent.isPending} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agente</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o agente "{deleting?.name}"? Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
