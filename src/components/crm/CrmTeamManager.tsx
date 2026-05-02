// @ts-nocheck
import { useState } from "react";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useCrmTeams, useCrmTeamMutations } from "@/hooks/useCrmTeams";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users2, Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CrmTeamManager() {
  const { toast } = useToast();
  const { data: members, isLoading: membersLoading } = useCrmTeam();
  const { data: teams, isLoading: teamsLoading } = useCrmTeams();
  const { data: leads } = useCrmLeads();
  const { data: funnels } = useCrmFunnels();
  const { createTeam, updateTeam, deleteTeam } = useCrmTeamMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; description?: string; members: string[]; funnel_ids: string[] } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);

  const isLoading = membersLoading || teamsLoading;

  const leadsCountByUser = (leads || []).reduce((acc, l) => {
    if (l.assigned_to) acc[l.assigned_to] = (acc[l.assigned_to] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const openNewTeam = () => {
    setEditingTeam(null);
    setTeamName("");
    setTeamDesc("");
    setSelectedMembers([]);
    setSelectedFunnels([]);
    setDialogOpen(true);
  };

  const openEditTeam = (team: { id: string; name: string; description?: string; members: string[]; funnel_ids: string[] }) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDesc(team.description || "");
    setSelectedMembers(team.members || []);
    setSelectedFunnels(team.funnel_ids || []);
    setDialogOpen(true);
  };

  const handleSaveTeam = () => {
    if (!teamName.trim()) { toast({ title: "Informe o nome do time", variant: "destructive" }); return; }
    const payload = { name: teamName.trim(), description: teamDesc || null, members: selectedMembers, funnel_ids: selectedFunnels };
    if (editingTeam) {
      updateTeam.mutate({ id: editingTeam.id, ...payload });
      toast({ title: "Time atualizado" });
    } else {
      createTeam.mutate(payload);
      toast({ title: "Time criado" });
    }
    setDialogOpen(false);
  };

  const toggleMember = (uid: string) => {
    setSelectedMembers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const toggleFunnel = (fid: string) => {
    setSelectedFunnels(prev => prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]);
  };

  if (isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      <Tabs defaultValue="teams">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="teams" className="text-xs">Times</TabsTrigger>
          <TabsTrigger value="members" className="text-xs">Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Users2 className="w-4 h-4" /> Times</h3>
            <Button size="sm" className="gap-1" onClick={openNewTeam}><Plus className="w-3.5 h-3.5" /> Novo time</Button>
          </div>

          {(!teams || teams.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Users2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum time criado.</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={openNewTeam}><Plus className="w-3 h-3" /> Criar time</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <Card key={team.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      {team.description && <p className="text-[10px] text-muted-foreground">{team.description}</p>}
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px]">{team.members.length} membros</Badge>
                        <Badge variant="secondary" className="text-[9px]">{team.funnel_ids.length} funis</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditTeam(team)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => { deleteTeam.mutate(team.id); toast({ title: "Time excluído" }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-3">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users2 className="w-4 h-4" /> Membros da organização</CardTitle></CardHeader>
            <CardContent>
              {(!members || members.length === 0) ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum membro encontrado.</p>
              ) : (
                <div className="space-y-2">
                  {members.map(m => {
                    const memberTeams = (teams || []).filter(t => t.members.includes(m.user_id));
                    return (
                      <div key={m.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {m.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{m.full_name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                            {memberTeams.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {memberTeams.map(t => <Badge key={t.id} variant="secondary" className="text-[8px]">{t.name}</Badge>)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{leadsCountByUser[m.user_id] || 0} leads</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTeam ? "Editar Time" : "Novo Time"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome do time *</Label><Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Ex: Time Comercial" /></div>
            <div><Label className="text-xs">Descrição</Label><Input value={teamDesc} onChange={e => setTeamDesc(e.target.value)} placeholder="Opcional" /></div>

            <div>
              <Label className="text-xs mb-2 block">Membros</Label>
              <div className="space-y-1.5 max-h-40 overflow-auto border rounded p-2">
                {(members || []).map(m => (
                  <label key={m.user_id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <Checkbox checked={selectedMembers.includes(m.user_id)} onCheckedChange={() => toggleMember(m.user_id)} />
                    {m.full_name}
                  </label>
                ))}
              </div>
            </div>

            {funnels && funnels.length > 0 && (
              <div>
                <Label className="text-xs mb-2 block">Funis vinculados</Label>
                <div className="space-y-1.5 max-h-32 overflow-auto border rounded p-2">
                  {funnels.map(f => (
                    <label key={f.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <Checkbox checked={selectedFunnels.includes(f.id)} onCheckedChange={() => toggleFunnel(f.id)} />
                      {f.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTeam}>{editingTeam ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
