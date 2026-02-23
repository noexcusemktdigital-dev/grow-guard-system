import { useState } from "react";
import { Star, ClipboardCheck, User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useEvaluations, useEvaluationMutations } from "@/hooks/useEvaluations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = ["Comercial", "Atendimento", "Engajamento", "Proatividade"];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="focus:outline-none">
          <Star
            className={`w-5 h-5 transition-colors ${s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ClienteAvaliacoes() {
  const { user } = useAuth();
  const { data: team, isLoading: teamLoading } = useCrmTeam();
  const { data: evaluations, isLoading: evalLoading } = useEvaluations();
  const { createEvaluation } = useEvaluationMutations();

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  const members = (team ?? []).filter((m) => m.user_id !== user?.id);

  const handleSubmit = () => {
    if (!selectedUser) return toast.error("Selecione um membro");
    const avgScore = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(scores).length, 1)
    );
    if (avgScore < 1) return toast.error("Preencha ao menos uma categoria");

    createEvaluation.mutate(
      { user_id: selectedUser, period, score: avgScore, categories: scores, comment: comment || undefined },
      {
        onSuccess: () => {
          toast.success("Avaliação salva!");
          setOpen(false);
          setScores({});
          setComment("");
          setSelectedUser("");
        },
      }
    );
  };

  const getAvgForUser = (uid: string) => {
    const userEvals = (evaluations ?? []).filter((e) => e.user_id === uid);
    if (userEvals.length === 0) return null;
    return (userEvals.reduce((a, e) => a + e.score, 0) / userEvals.length).toFixed(1);
  };

  if (teamLoading || evalLoading) {
    return (
      <div className="w-full space-y-5">
        <PageHeader title="Avaliações" subtitle="Avalie sua equipe" icon={<ClipboardCheck className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Avaliações"
        subtitle="Avalie o desempenho da sua equipe"
        icon={<ClipboardCheck className="w-5 h-5 text-primary" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Star className="w-4 h-4 mr-1" /> Nova Avaliação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Avaliar Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Membro</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Período</label>
                  <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm">{cat}</span>
                    <StarRating value={scores[cat] ?? 0} onChange={(v) => setScores((s) => ({ ...s, [cat]: v }))} />
                  </div>
                ))}
                <Textarea placeholder="Comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button className="w-full" onClick={handleSubmit} disabled={createEvaluation.isPending}>
                  Salvar Avaliação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {members.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum membro na equipe para avaliar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((member) => {
            const avg = getAvgForUser(member.user_id);
            const userEvals = (evaluations ?? []).filter((e) => e.user_id === member.user_id);
            const initials = member.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <Card key={member.user_id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4 flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {avg ? (
                        <>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= Math.round(Number(avg)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                          <span className="text-xs font-medium">{avg}</span>
                          <Badge variant="outline" className="text-[9px]">{userEvals.length} avaliações</Badge>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sem avaliações</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent evaluations */}
      {(evaluations ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Avaliações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(evaluations ?? []).slice(0, 10).map((ev) => {
                const member = (team ?? []).find((m) => m.user_id === ev.user_id);
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= ev.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member?.full_name ?? "—"}</p>
                      {ev.comment && <p className="text-[10px] text-muted-foreground truncate">{ev.comment}</p>}
                    </div>
                    <Badge variant="outline" className="text-[9px]">{ev.period}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
