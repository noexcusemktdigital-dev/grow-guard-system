import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeamChat";

interface Props {
  members: TeamMember[];
  onCreateGroup: (name: string, description: string, memberIds: string[]) => Promise<void>;
  currentUserId: string;
}

export function CreateGroupDialog({ members, onCreateGroup, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const otherMembers = members.filter((m) => m.user_id !== currentUserId);

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreateGroup(name.trim(), description.trim(), selectedIds);
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Adicionar">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">Nome do grupo</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Projeto X" />
          </div>
          <div>
            <Label htmlFor="group-desc">Descrição (opcional)</Label>
            <Textarea id="group-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sobre o que é este grupo..." rows={2} />
          </div>
          <div>
            <Label>Membros ({selectedIds.length} selecionados)</Label>
            <ScrollArea className="h-48 border rounded-md mt-1">
              <div className="p-2 space-y-1">
                {otherMembers.map((m) => (
                  <label
                    key={m.user_id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Checkbox checked={selectedIds.includes(m.user_id)} onCheckedChange={() => toggleMember(m.user_id)} />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px] bg-muted">{getInitials(m.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{m.full_name}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
          <Button onClick={handleCreate} disabled={!name.trim() || loading} className="w-full">
            {loading ? "Criando..." : "Criar Grupo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
