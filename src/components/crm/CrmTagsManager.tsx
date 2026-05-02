import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/typed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CrmTag {
  name: string;
  count: number;
}

export function CrmTagsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: allTags, isLoading } = useQuery<CrmTag[]>({
    queryKey: ["crm-tags", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("tags")
        .eq("organization_id", orgId!);

      const tagMap: Record<string, number> = {};
      data?.forEach((lead: Pick<Tables<'crm_leads'>, 'tags'>) => {
        (lead.tags || []).forEach((tag: string) => {
          tagMap[tag] = (tagMap[tag] || 0) + 1;
        });
      });

      return Object.entries(tagMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!orgId,
  });

  const createTag = useMutation({
    mutationFn: async (name: string) => {
      // Tags são derivadas dos leads. Para "criar", vinculamos a um lead placeholder
      // ou apenas adicionamos à lista local. Aqui criamos um lead invisível NÃO é desejado.
      // Estratégia: tag só passa a existir quando aplicada a um lead. Apenas validamos duplicidade.
      const exists = (allTags || []).some(t => t.name.toLowerCase() === name.toLowerCase());
      if (exists) throw new Error("Tag já existe");
      return name;
    },
    onSuccess: (name) => {
      // Adiciona localmente para visibilidade imediata (count=0)
      qc.setQueryData<CrmTag[]>(["crm-tags", orgId], (old) => {
        const list = old || [];
        if (list.some(t => t.name === name)) return list;
        return [...list, { name, count: 0 }];
      });
      setNewTagName("");
      setCreating(false);
      toast({ title: "Tag criada. Aplique-a a um lead para persistir." });
    },
    onError: (e: Error) => toast({ title: e.message || "Erro ao criar tag", variant: "destructive" }),
  });

  const renameTag = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!newName.trim() || newName === oldName) return;
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("id, tags")
        .eq("organization_id", orgId!)
        .contains("tags", [oldName]);

      for (const lead of leads || []) {
        const newTags = (lead.tags || []).map((t: string) =>
          t === oldName ? newName : t,
        );
        await supabase.from("crm_leads").update({ tags: newTags }).eq("id", lead.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-tags"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: "Tag renomeada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao renomear tag", variant: "destructive" }),
  });

  const deleteTag = useMutation({
    mutationFn: async (tagName: string) => {
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("id, tags")
        .eq("organization_id", orgId!)
        .contains("tags", [tagName]);

      for (const lead of leads || []) {
        const newTags = (lead.tags || []).filter((t: string) => t !== tagName);
        await supabase.from("crm_leads").update({ tags: newTags }).eq("id", lead.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-tags"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: "Tag removida de todos os leads." });
    },
    onError: () => toast({ title: "Erro ao excluir tag", variant: "destructive" }),
  });

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    createTag.mutate(name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Gerenciar Tags</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tags são usadas para classificar e filtrar leads no CRM
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nova Tag
        </Button>
      </div>

      {creating && (
        <div className="flex gap-2 p-3 border rounded-lg bg-muted/20">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nome da tag..."
            className="h-8 text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateTag} disabled={createTag.isPending}>Criar</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewTagName(""); }}>✕</Button>
        </div>
      )}

      <div className="space-y-1.5">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando tags...</div>
        ) : (
          <>
            {allTags?.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />

                {editingTag === tag.name ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameTag.mutate({ oldName: tag.name, newName: editName.trim() });
                        setEditingTag(null);
                      }
                      if (e.key === "Escape") setEditingTag(null);
                    }}
                  />
                ) : (
                  <span className="text-sm font-medium flex-1">{tag.name}</span>
                )}

                <Badge variant="outline" className="text-xs shrink-0">
                  {tag.count} lead{tag.count !== 1 ? "s" : ""}
                </Badge>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6"
                    onClick={() => {
                      setEditingTag(tag.name);
                      setEditName(tag.name);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 text-destructive"
                    onClick={() => {
                      if (confirm(`Excluir a tag "${tag.name}" de todos os leads?`)) {
                        deleteTag.mutate(tag.name);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {allTags?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Nenhuma tag criada ainda.</p>
                <p className="text-xs mt-1">Crie tags para organizar seus leads.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
