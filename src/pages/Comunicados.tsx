import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, ArrowLeft, Plus } from "lucide-react";
import { mockComunicados, Comunicado } from "@/data/comunicadosData";
import ComunicadosList from "@/components/comunicados/ComunicadosList";
import ComunicadoForm from "@/components/comunicados/ComunicadoForm";
import ComunicadoDetail from "@/components/comunicados/ComunicadoDetail";
import { toast } from "@/components/ui/use-toast";

type View = "list" | "create" | "edit" | "detail";

export default function Comunicados() {
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comunicados, setComunicados] = useState<Comunicado[]>(mockComunicados);

  const selected = selectedId ? comunicados.find((c) => c.id === selectedId) : null;

  const handleView = (id: string) => { setSelectedId(id); setView("detail"); };
  const handleEdit = (id: string) => { setSelectedId(id); setView("edit"); };

  const handleDuplicate = (id: string) => {
    const orig = comunicados.find((c) => c.id === id);
    if (!orig) return;
    const dup: Comunicado = {
      ...orig,
      id: `com-${Date.now()}`,
      titulo: `${orig.titulo} (Cópia)`,
      status: "Rascunho",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    setComunicados((prev) => [dup, ...prev]);
    toast({ title: "Comunicado duplicado", description: "Salvo como rascunho." });
  };

  const handleArchive = (id: string) => {
    setComunicados((prev) => prev.map((c) => c.id === id ? { ...c, status: "Arquivado" as const, atualizadoEm: new Date().toISOString() } : c));
    toast({ title: "Comunicado arquivado" });
    if (view === "detail") setView("list");
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setComunicados((prev) => prev.filter((c) => c.id !== selectedId));
    toast({ title: "Comunicado excluído" });
    setSelectedId(null);
    setView("list");
  };

  const handlePublish = (data: Partial<Comunicado>) => {
    const now = new Date().toISOString();
    if (view === "edit" && selectedId) {
      setComunicados((prev) => prev.map((c) => c.id === selectedId ? { ...c, ...data, status: "Ativo" as const, atualizadoEm: now } : c));
      toast({ title: "Comunicado atualizado e publicado" });
    } else {
      const novo: Comunicado = {
        id: `com-${Date.now()}`,
        titulo: data.titulo || "",
        conteudo: data.conteudo || "",
        imagemUrl: data.imagemUrl,
        linkExterno: data.linkExterno,
        anexo: data.anexo,
        publico: data.publico || [],
        unidadesEspecificas: data.unidadesEspecificas || [],
        tipo: data.tipo || "Informativo",
        prioridade: data.prioridade || "Normal",
        mostrarDashboard: data.mostrarDashboard ?? true,
        mostrarPopup: data.mostrarPopup ?? false,
        exigirConfirmacao: data.exigirConfirmacao ?? false,
        dataProgramada: data.dataProgramada,
        dataExpiracao: data.dataExpiracao,
        status: data.dataProgramada ? "Programado" : "Ativo",
        autorId: "u1",
        autorNome: "Davi",
        criadoEm: now,
        atualizadoEm: now,
      };
      setComunicados((prev) => [novo, ...prev]);
      toast({ title: "Comunicado publicado com sucesso" });
    }
    setView("list");
    setSelectedId(null);
  };

  const handleSaveDraft = (data: Partial<Comunicado>) => {
    const now = new Date().toISOString();
    if (view === "edit" && selectedId) {
      setComunicados((prev) => prev.map((c) => c.id === selectedId ? { ...c, ...data, status: "Rascunho" as const, atualizadoEm: now } : c));
    } else {
      const novo: Comunicado = {
        id: `com-${Date.now()}`,
        titulo: data.titulo || "Sem título",
        conteudo: data.conteudo || "",
        publico: data.publico || [],
        unidadesEspecificas: data.unidadesEspecificas || [],
        tipo: data.tipo || "Informativo",
        prioridade: data.prioridade || "Normal",
        mostrarDashboard: data.mostrarDashboard ?? false,
        mostrarPopup: data.mostrarPopup ?? false,
        exigirConfirmacao: data.exigirConfirmacao ?? false,
        dataProgramada: data.dataProgramada,
        dataExpiracao: data.dataExpiracao,
        status: "Rascunho",
        autorId: "u1",
        autorNome: "Davi",
        criadoEm: now,
        atualizadoEm: now,
      };
      setComunicados((prev) => [novo, ...prev]);
    }
    toast({ title: "Rascunho salvo" });
    setView("list");
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Content */}
      {view === "list" && (
        <ComunicadosList
          comunicados={comunicados}
          onView={handleView}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
        />
      )}

      {view === "create" && (
        <ComunicadoForm
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
          onCancel={() => setView("list")}
        />
      )}

      {view === "edit" && selected && (
        <ComunicadoForm
          comunicado={selected}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
          onCancel={() => setView("list")}
        />
      )}

      {view === "detail" && selected && (
        <ComunicadoDetail
          comunicado={selected}
          onEdit={() => setView("edit")}
          onDuplicate={() => handleDuplicate(selected.id)}
          onArchive={() => handleArchive(selected.id)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
