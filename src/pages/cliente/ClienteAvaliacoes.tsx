import { useState, useMemo } from "react";
import { Star, ClipboardCheck, User, ChevronRight, TrendingUp, TrendingDown, Minus, FolderOpen, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useCrmTeam, type TeamMember } from "@/hooks/useCrmTeam";
import { useEvaluations, useEvaluationMutations } from "@/hooks/useEvaluations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = ["Comercial", "Atendimento", "Engajamento", "Proatividade"];

import React from "react";

const StarRating = React.forwardRef<HTMLDivElement, { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }>(
  ({ value, onChange, size = "md" }, ref) => {
    const sizeClass = size === "sm" ? "w-3 h-3" : "w-5 h-5";
    return (
      <div ref={ref} className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => onChange?.(s)} className="focus:outline-none" disabled={!onChange}>
            <Star className={`${sizeClass} transition-colors ${s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
    );
  }
);
StarRating.displayName = "StarRating";

function TrendIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-500 text-[10px] font-medium"><TrendingUp className="w-3 h-3" />+{diff.toFixed(1)}</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-destructive text-[10px] font-medium"><TrendingDown className="w-3 h-3" />{diff.toFixed(1)}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-[10px]"><Minus className="w-3 h-3" />0</span>;
}

function MemberEvolutionSheet({ member, evaluations, open, onOpenChange }: {
  member: { user_id: string; full_name: string; role: string };
  evaluations: Record<string, unknown>[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const { deleteEvaluation } = useEvaluationMutations();
  const userEvals = evaluations.filter((e) => e.user_id === member.user_id).sort((a, b) => a.period.localeCompare(b.period));

  const handleDelete = (id: string) => {
    deleteEvaluation.mutate(id, {
      onSuccess: () => toast.success("Avaliação excluída"),
      onError: () => toast.error("Erro ao excluir"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Evolução — {member.full_name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {userEvals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem avaliações registradas.</p>
          ) : (
            userEvals.map((ev, idx) => {
              const cats = (ev.categories || {}) as Record<string, number>;
              const prevEval = idx > 0 ? userEvals[idx - 1] : null;
              return (
                <Card key={ev.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ev.period}</Badge>
                        <TrendIndicator current={ev.score} previous={prevEval?.score ?? null} />
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={ev.score} size="sm" />
                        <span className="text-sm font-semibold">{ev.score}</span>
                        {ev.evaluator_id === user?.id && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(ev.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {CATEGORIES.map((cat) => (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0">{cat}</span>
                          <Progress value={(cats[cat] ?? 0) * 20} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium w-4 text-right">{cats[cat] ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                    {ev.comment && <p className="text-xs text-muted-foreground italic">"{ev.comment}"</p>}
                    {ev.evaluator_id === ev.user_id && <Badge variant="secondary" className="text-[9px]">Autoavaliação</Badge>}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ClienteAvaliacoes() {
  const { user } = useAuth();
  const { data: team, isLoading: teamLoading } = useCrmTeam();
  const { data: evaluations, isLoading: evalLoading } = useEvaluations();
  const { createEvaluation, deleteEvaluation } = useEvaluationMutations();

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [generalScore, setGeneralScore] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [sheetMember, setSheetMember] = useState<TeamMember | null>(null);

  // Include self for self-evaluation
  const allMembers = team ?? [];
  const members = allMembers;

  // Group evaluations by period for History tab
  const evalsByPeriod = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const ev of evaluations ?? []) {
      if (!grouped[ev.period]) grouped[ev.period] = [];
      grouped[ev.period].push(ev);
    }
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [evaluations]);

  const handleSubmit = () => {
    if (!selectedUser) return toast.error("Selecione um membro");
    const score = generalScore > 0 ? generalScore : Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(scores).length, 1)
    );
    if (score < 1) return toast.error("Preencha a nota geral ou ao menos uma categoria");

    createEvaluation.mutate(
      { user_id: selectedUser, period, score, categories: scores, comment: comment || undefined },
      {
        onSuccess: () => {
          toast.success("Avaliação salva!");
          setOpen(false);
          setScores({});
          setComment("");
          setSelectedUser("");
          setGeneralScore(0);
        },
      }
    );
  };

  const getAvgForUser = (uid: string) => {
    const userEvals = (evaluations ?? []).filter((e) => e.user_id === uid);
    if (userEvals.length === 0) return null;
    return (userEvals.reduce((a, e) => a + e.score, 0) / userEvals.length).toFixed(1);
  };

  const getLatestCatsForUser = (uid: string) => {
    const userEvals = (evaluations ?? []).filter((e) => e.user_id === uid).sort((a, b) => b.period.localeCompare(a.period));
    return (userEvals[0]?.categories || {}) as Record<string, number>;
  };

  const getTrendForUser = (uid: string) => {
    const userEvals = (evaluations ?? []).filter((e) => e.user_id === uid).sort((a, b) => b.period.localeCompare(a.period));
    if (userEvals.length < 2) return null;
    return { current: userEvals[0].score, previous: userEvals[1].score };
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
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name}{m.user_id === user?.id ? " (eu — autoavaliação)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Período</label>
                  <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <span className="text-sm font-medium">Nota Geral</span>
                  <StarRating value={generalScore} onChange={setGeneralScore} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Notas por Categoria</p>
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm">{cat}</span>
                      <StarRating value={scores[cat] ?? 0} onChange={(v) => setScores((s) => ({ ...s, [cat]: v }))} />
                    </div>
                  ))}
                </div>
                <Textarea placeholder="Comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button className="w-full" onClick={handleSubmit} disabled={createEvaluation.isPending}>
                  Salvar Avaliação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="equipe">
        <TabsList>
          <TabsTrigger value="equipe" className="gap-1.5"><User className="w-4 h-4" /> Equipe</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5"><FolderOpen className="w-4 h-4" /> Histórico Mensal</TabsTrigger>
        </TabsList>

        {/* ── TAB EQUIPE ── */}
        <TabsContent value="equipe">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum membro na equipe para avaliar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {members.map((member) => {
                const avg = getAvgForUser(member.user_id);
                const cats = getLatestCatsForUser(member.user_id);
                const trend = getTrendForUser(member.user_id);
                const userEvals = (evaluations ?? []).filter((e) => e.user_id === member.user_id);
                const initials = member.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                const isSelf = member.user_id === user?.id;
                return (
                  <Card key={member.user_id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSheetMember(member)}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{member.full_name}</p>
                            {isSelf && <Badge variant="secondary" className="text-[9px]">Você</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {avg ? (
                              <>
                                <StarRating value={Math.round(Number(avg))} size="sm" />
                                <span className="text-xs font-medium">{avg}</span>
                                {trend && <TrendIndicator current={trend.current} previous={trend.previous} />}
                                <Badge variant="outline" className="text-[9px]">{userEvals.length} aval.</Badge>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Sem avaliações</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                      {/* Category bars */}
                      {Object.keys(cats).length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t">
                          {CATEGORIES.map((cat) => (
                            <div key={cat} className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-20 shrink-0 truncate">{cat}</span>
                              <Progress value={(cats[cat] ?? 0) * 20} className="h-1 flex-1" />
                              <span className="text-[10px] font-medium w-3 text-right">{cats[cat] ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB HISTÓRICO MENSAL ── */}
        <TabsContent value="historico">
          {evalsByPeriod.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada ainda.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="mt-3">
              {evalsByPeriod.map(([periodKey, evals]) => {
                const [year, month] = periodKey.split("-");
                const monthName = format(new Date(Number(year), Number(month) - 1), "MMMM yyyy", { locale: ptBR });
                return (
                  <AccordionItem key={periodKey} value={periodKey}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        <span className="capitalize font-medium">{monthName}</span>
                        <Badge variant="secondary" className="text-[10px]">{evals.length} avaliações</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-7">
                        {evals.map((ev: Record<string, unknown>) => {
                          const member = (team ?? []).find((m) => m.user_id === ev.user_id);
                          const cats = (ev.categories || {}) as Record<string, number>;
                          const isSelfEval = ev.evaluator_id === ev.user_id;
                          return (
                            <Card key={ev.id}>
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{member?.full_name ?? "—"}</span>
                                    {isSelfEval && <Badge variant="secondary" className="text-[9px]">Auto</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StarRating value={ev.score} size="sm" />
                                    <span className="text-xs font-semibold">{ev.score}</span>
                                    {ev.evaluator_id === user?.id && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteEvaluation.mutate(ev.id, {
                                            onSuccess: () => toast.success("Excluída"),
                                            onError: () => toast.error("Erro"),
                                          });
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {Object.keys(cats).length > 0 && (
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {CATEGORIES.map((cat) => (
                                      <div key={cat} className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-20 shrink-0">{cat}</span>
                                        <Progress value={(cats[cat] ?? 0) * 20} className="h-1 flex-1" />
                                        <span className="text-[10px] font-medium">{cats[cat] ?? "—"}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {ev.comment && <p className="text-[10px] text-muted-foreground italic">"{ev.comment}"</p>}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      {/* Evolution Sheet */}
      {sheetMember && (
        <MemberEvolutionSheet
          member={sheetMember}
          evaluations={evaluations ?? []}
          open={!!sheetMember}
          onOpenChange={(o) => !o && setSheetMember(null)}
        />
      )}
    </div>
  );
}
