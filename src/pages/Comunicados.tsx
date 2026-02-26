import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, ArrowLeft, Plus, Inbox } from "lucide-react";
import ComunicadosList from "@/components/comunicados/ComunicadosList";
import ComunicadoForm from "@/components/comunicados/ComunicadoForm";
import ComunicadoDetail from "@/components/comunicados/ComunicadoDetail";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncements, useAnnouncementMutations } from "@/hooks/useAnnouncements";
import { useAuth } from "@/contexts/AuthContext";
import type { Comunicado, PublicoAlvo } from "@/types/comunicados";

type View = "list" | "create" | "edit" | "detail";

export default function Comunicados() {
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: announcements, isLoading } = useAnnouncements();
  const { createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncementMutations();
  const { user } = useAuth();

  const comunicados: Comunicado[] = (announcements ?? []).map(a => ({
    id: a.id,
    titulo: a.title,
    conteudo: a.content || "",
    tipo: (a.type || "Informativo") as any,
    prioridade: (a.priority || "Normal") as any,
    publico: (a.target_roles || []) as PublicoAlvo[],
    unidadesEspecificas: (a.target_unit_ids || []) as string[],
    mostrarDashboard: true,
    mostrarPopup: false,
    exigirConfirmacao: false,
    dataProgramada: undefined,
    dataExpiracao: a.expires_at || undefined,
    status: a.published_at ? "Ativo" : "Rascunho",
    autorId: a.created_by || "",
    autorNome: "Admin",
    criadoEm: a.created_at,
    atualizadoEm: a.updated_at,
    attachmentUrl: (a as any).attachment_url || undefined,
  }));

  const selected = selectedId ? comunicados.find((c) => c.id === selectedId) : null;

  const handleView = (id: string) => { setSelectedId(id); setView("detail"); };
  const handleEdit = (id: string) => { setSelectedId(id); setView("edit"); };

  const handleDuplicate = (id: string) => {
    const orig = comunicados.find(c => c.id === id);
    if (!orig) return;
    createAnnouncement.mutate({
      title: `${orig.titulo} (Cópia)`,
      content: orig.conteudo,
      type: orig.tipo,
      priority: orig.prioridade,
      target_roles: orig.publico,
      target_unit_ids: orig.unidadesEspecificas,
    });
    toast({ title: "Comunicado duplicado", description: "Salvo como rascunho." });
  };

  const handleArchive = (id: string) => {
    updateAnnouncement.mutate({ id, type: "archived" });
    toast({ title: "Comunicado arquivado" });
    if (view === "detail") setView("list");
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deleteAnnouncement.mutate(selectedId);
    toast({ title: "Comunicado excluído" });
    setSelectedId(null);
    setView("list");
  };

  const handlePublish = (data: Partial<Comunicado> & { attachmentUrl?: string }) => {
    const payload: any = {
      title: data.titulo,
      content: data.conteudo,
      type: data.tipo,
      priority: data.prioridade,
      target_roles: data.publico,
      target_unit_ids: data.unidadesEspecificas?.length ? data.unidadesEspecificas : [],
      published_at: new Date().toISOString(),
      expires_at: data.dataExpiracao || null,
      attachment_url: data.attachmentUrl || null,
    };
    if (view === "edit" && selectedId) {
      updateAnnouncement.mutate({ id: selectedId, ...payload });
      toast({ title: "Comunicado atualizado e publicado" });
    } else {
      createAnnouncement.mutate(payload);
      toast({ title: "Comunicado publicado com sucesso" });
    }
    setView("list");
    setSelectedId(null);
  };

  const handleSaveDraft = (data: Partial<Comunicado> & { attachmentUrl?: string }) => {
    const payload: any = {
      title: data.titulo || "Sem título",
      content: data.conteudo || "",
      type: data.tipo || "Informativo",
      priority: data.prioridade || "Normal",
      target_roles: data.publico,
      target_unit_ids: data.unidadesEspecificas?.length ? data.unidadesEspecificas : [],
      attachment_url: data.attachmentUrl || null,
    };
    if (view === "edit" && selectedId) {
      updateAnnouncement.mutate({ id: selectedId, ...payload });
    } else {
      createAnnouncement.mutate(payload);
    }
    toast({ title: "Rascunho salvo" });
    setView("list");
    setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== "list" && (
            <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedId(null); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Megaphone className="w-6 h-6 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Comunicados</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Central de comunicados e avisos da rede</p>
          </div>
        </div>
        {view === "list" && (
          <Button onClick={() => setView("create")}>
            <Plus className="w-4 h-4 mr-1" />
            Novo Comunicado
          </Button>
        )}
      </div>

      {view === "list" && comunicados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum comunicado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie o primeiro comunicado para a rede.</p>
          <Button onClick={() => setView("create")}><Plus className="w-4 h-4 mr-1" /> Novo Comunicado</Button>
        </div>
      )}

      {view === "list" && comunicados.length > 0 && (
        <ComunicadosList comunicados={comunicados} onView={handleView} onEdit={handleEdit} onDuplicate={handleDuplicate} onArchive={handleArchive} />
      )}

      {view === "create" && (
        <ComunicadoForm onPublish={handlePublish} onSaveDraft={handleSaveDraft} onCancel={() => setView("list")} />
      )}

      {view === "edit" && selected && (
        <ComunicadoForm comunicado={selected} onPublish={handlePublish} onSaveDraft={handleSaveDraft} onCancel={() => setView("list")} />
      )}

      {view === "detail" && selected && (
        <ComunicadoDetail comunicado={selected} onEdit={() => setView("edit")} onDuplicate={() => handleDuplicate(selected.id)} onArchive={() => handleArchive(selected.id)} onDelete={handleDelete} />
      )}
    </div>
  );
}
