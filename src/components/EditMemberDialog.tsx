import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { MemberPermissionsEditor } from "@/components/cliente/MemberPermissionsEditor";
import { ModuleAccessEditor } from "@/components/cliente/ModuleAccessEditor";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    user_id: string;
    full_name: string | null;
    job_title: string | null;
    role: string;
  } | null;
  organizationId: string;
  roleOptions: { value: string; label: string }[];
  /** Optional: render extra content below role selector (e.g. team selector) */
  extraContent?: React.ReactNode;
  /** Called after successful update/remove so parent can refresh */
  onSuccess?: () => void;
}

export function EditMemberDialog({ open, onOpenChange, member, organizationId, roleOptions, extraContent, onSuccess }: EditMemberDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Sync state when member changes
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  if (member && member.user_id !== lastUserId) {
    setFullName(member.full_name || "");
    setJobTitle(member.job_title || "");
    setRole(member.role);
    setLastUserId(member.user_id);
  }

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    try {
      const { data, error } = await invokeEdge("manage-member", {
        body: { user_id: member.user_id, organization_id: organizationId, action: "update", full_name: fullName, job_title: jobTitle, role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Membro atualizado!" });
      qc.invalidateQueries({ queryKey: ["org-members"] });
      qc.invalidateQueries({ queryKey: ["pending-invitations"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      toast({ title: "Erro ao atualizar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!member) return;
    setRemoving(true);
    try {
      const { data, error } = await invokeEdge("manage-member", {
        body: { user_id: member.user_id, organization_id: organizationId, action: "remove" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Membro removido!" });
      qc.invalidateQueries({ queryKey: ["org-members"] });
      qc.invalidateQueries({ queryKey: ["pending-invitations"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      toast({ title: "Erro ao remover", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Editar Membro</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do membro" />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Cargo na empresa" />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {member && (
            <>
              <MemberPermissionsEditor
                userId={member.user_id}
                userName={member.full_name || "Usuário"}
              />
              <p className="text-[10px] text-muted-foreground text-center">
                💡 Salve as permissões acima separadamente antes de fechar.
              </p>
              <ModuleAccessEditor userId={member.user_id} />
            </>
          )}
          {extraContent}
        </div>
        <DialogFooter className="border-t px-6 py-4 shrink-0 bg-background flex items-center justify-between sm:justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5" disabled={removing}>
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação vai remover <strong>{fullName || "este membro"}</strong> da organização. Não é possível desfazer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {removing ? "Removendo..." : "Confirmar Remoção"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
