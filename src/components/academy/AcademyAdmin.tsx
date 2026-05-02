import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import type { AcademyModuleCategory } from "@/types/academy";
import {
  useAcademyModules, useAcademyLessons, useAcademyQuizzes,
  useAcademyQuizQuestions, useAcademyMutations,
  type DbModule, type DbLesson, type DbQuiz, type DbQuizQuestion,
} from "@/hooks/useAcademy";

export function AcademyAdmin() {
  const { data: modules = [] } = useAcademyModules();
  const { data: allLessons = [] } = useAcademyLessons();
  const { data: quizzes = [] } = useAcademyQuizzes();
  const {
    createModule, updateModule, deleteModule,
    createLesson, updateLesson, deleteLesson,
    createQuiz, updateQuiz,
    createQuizQuestion, updateQuizQuestion, deleteQuizQuestion,
  } = useAcademyMutations();

  const [adminTab, setAdminTab] = useState("modulos");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState(modules[0]?.id ?? "");

  if (!selectedModuleFilter && modules.length > 0) {
    setSelectedModuleFilter(modules[0].id);
  }

  const filteredLessons = allLessons.filter(l => l.module_id === selectedModuleFilter).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const filteredQuiz = quizzes.find(q => q.module_id === selectedModuleFilter);
  const activeQuizId = filteredQuiz?.id;

  return (
    <AcademyAdminInner
      modules={modules}
      allLessons={allLessons}
      quizzes={quizzes}
      adminTab={adminTab}
      setAdminTab={setAdminTab}
      selectedModuleFilter={selectedModuleFilter}
      setSelectedModuleFilter={setSelectedModuleFilter}
      filteredLessons={filteredLessons}
      filteredQuiz={filteredQuiz}
      activeQuizId={activeQuizId}
      mutations={{
        createModule, updateModule, deleteModule,
        createLesson, updateLesson, deleteLesson,
        createQuiz, updateQuiz,
        createQuizQuestion, updateQuizQuestion, deleteQuizQuestion,
      }}
    />
  );
}

type AcademyMutations = ReturnType<typeof useAcademyMutations>;

interface AcademyAdminInnerProps {
  modules: DbModule[];
  allLessons: DbLesson[];
  quizzes: DbQuiz[];
  adminTab: string;
  setAdminTab: (tab: string) => void;
  selectedModuleFilter: string;
  setSelectedModuleFilter: (id: string) => void;
  filteredLessons: DbLesson[];
  filteredQuiz: DbQuiz | undefined;
  activeQuizId: string | undefined;
  mutations: AcademyMutations;
}

function AcademyAdminInner({
  modules, allLessons, quizzes,
  adminTab, setAdminTab,
  selectedModuleFilter, setSelectedModuleFilter,
  filteredLessons, filteredQuiz, activeQuizId,
  mutations,
}: AcademyAdminInnerProps) {
  const { data: questions = [] } = useAcademyQuizQuestions(activeQuizId);

  // Module dialog
  const [moduleDialog, setModuleDialog] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", category: "Comercial" as AcademyModuleCategory, description: "" });

  // Lesson dialog
  const [lessonDialog, setLessonDialog] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", videoUrl: "", durationMinutes: 30, sortOrder: 1 });

  // Question dialog
  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: "", options: ["", "", "", ""], correctAnswer: 0 });

  // Delete confirmations
  const [deleteTarget, setDeleteTarget] = useState<{ type: "module" | "lesson" | "question"; id: string; label: string } | null>(null);

  // Quiz config
  const [passingScore, setPassingScore] = useState<number>(filteredQuiz?.passing_score ?? 70);

  const openEditModule = (mod: DbModule) => {
    setEditingModuleId(mod.id);
    setModuleForm({ title: mod.title, category: mod.category || "Comercial", description: mod.description || "" });
    setModuleDialog(true);
  };

  const openNewModule = () => {
    setEditingModuleId(null);
    setModuleForm({ title: "", category: "Comercial", description: "" });
    setModuleDialog(true);
  };

  const handleSaveModule = () => {
    if (editingModuleId) {
      mutations.updateModule.mutate(
        { id: editingModuleId, title: moduleForm.title, description: moduleForm.description, category: moduleForm.category },
        { onSuccess: () => { toast({ title: "Módulo atualizado!" }); setModuleDialog(false); }, onError: () => toast({ title: "Erro", variant: "destructive" }) }
      );
    } else {
      mutations.createModule.mutate(
        { title: moduleForm.title, description: moduleForm.description, category: moduleForm.category },
        { onSuccess: () => { toast({ title: "Módulo criado!" }); setModuleDialog(false); }, onError: () => toast({ title: "Erro", variant: "destructive" }) }
      );
    }
  };

  const openEditLesson = (les: DbLesson) => {
    setEditingLessonId(les.id);
    setLessonForm({ title: les.title, content: les.content || "", videoUrl: les.video_url || "", durationMinutes: les.duration_minutes || 30, sortOrder: les.sort_order || 1 });
    setLessonDialog(true);
  };

  const openNewLesson = () => {
    setEditingLessonId(null);
    setLessonForm({ title: "", content: "", videoUrl: "", durationMinutes: 30, sortOrder: filteredLessons.length + 1 });
    setLessonDialog(true);
  };

  const handleSaveLesson = () => {
    if (editingLessonId) {
      mutations.updateLesson.mutate(
        { id: editingLessonId, title: lessonForm.title, content: lessonForm.content, video_url: lessonForm.videoUrl, duration_minutes: lessonForm.durationMinutes, sort_order: lessonForm.sortOrder },
        { onSuccess: () => { toast({ title: "Aula atualizada!" }); setLessonDialog(false); }, onError: () => toast({ title: "Erro", variant: "destructive" }) }
      );
    } else {
      mutations.createLesson.mutate(
        { title: lessonForm.title, module_id: selectedModuleFilter, content: lessonForm.content, video_url: lessonForm.videoUrl, duration_minutes: lessonForm.durationMinutes, sort_order: lessonForm.sortOrder },
        { onSuccess: () => { toast({ title: "Aula criada!" }); setLessonDialog(false); }, onError: () => toast({ title: "Erro", variant: "destructive" }) }
      );
    }
  };

  const openEditQuestion = (q: DbQuizQuestion) => {
    setEditingQuestionId(q.id);
    const opts = (q.options as string[]) ?? [];
    setQuestionForm({ question: q.question, options: [...opts, "", "", "", ""].slice(0, 4), correctAnswer: q.correct_answer });
    setQuestionDialog(true);
  };

  const openNewQuestion = () => {
    if (!activeQuizId) { toast({ title: "Selecione um módulo com prova", variant: "destructive" }); return; }
    setEditingQuestionId(null);
    setQuestionForm({ question: "", options: ["", "", "", ""], correctAnswer: 0 });
    setQuestionDialog(true);
  };

  const handleSaveQuestion = () => {
    const validOptions = questionForm.options.filter((o: string) => o.trim());
    if (editingQuestionId) {
      mutations.updateQuizQuestion.mutate(
        { id: editingQuestionId, question: questionForm.question, options: validOptions, correct_answer: questionForm.correctAnswer },
        { onSuccess: () => { toast({ title: "Questão atualizada!" }); setQuestionDialog(false); }, onError: () => toast({ title: "Erro", variant: "destructive" }) }
      );
    } else {
      mutations.createQuizQuestion.mutate(
        { quiz_id: activeQuizId!, question: questionForm.question, options: validOptions, correct_answer: questionForm.correctAnswer, sort_order: questions.length + 1 },
        { onSuccess: () => { toast({ title: "Questão criada!" }); setQuestionDialog(false); }, onError: () => toast({ title: "Erro", variant: "destructive" }) }
      );
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    const mutationMap = { module: mutations.deleteModule, lesson: mutations.deleteLesson, question: mutations.deleteQuizQuestion };
    mutationMap[type].mutate(id, {
      onSuccess: () => { toast({ title: "Excluído com sucesso!" }); setDeleteTarget(null); },
      onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
    });
  };

  const handleSaveQuizConfig = () => {
    if (!filteredQuiz) return;
    mutations.updateQuiz.mutate(
      { id: filteredQuiz.id, passing_score: passingScore },
      { onSuccess: () => toast({ title: "Configuração salva!" }), onError: () => toast({ title: "Erro", variant: "destructive" }) }
    );
  };

  const handleCreateQuiz = () => {
    const mod = modules.find((m) => m.id === selectedModuleFilter);
    mutations.createQuiz.mutate(
      { title: `Prova - ${mod?.title || "Módulo"}`, module_id: selectedModuleFilter, passing_score: 70 },
      { onSuccess: () => toast({ title: "Prova criada!" }), onError: () => toast({ title: "Erro", variant: "destructive" }) }
    );
  };

  return (
    <div className="space-y-5">
      <Tabs value={adminTab} onValueChange={setAdminTab}>
        <TabsList>
          <TabsTrigger value="modulos">Módulos</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="provas">Provas</TabsTrigger>
        </TabsList>

        {/* MODULES TAB */}
        <TabsContent value="modulos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Módulos cadastrados</h3>
            <Button size="sm" className="gap-1" onClick={openNewModule}>
              <Plus className="w-3.5 h-3.5" /> Novo Módulo
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aulas</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{mod.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={mod.is_published ? "default" : "secondary"} className="text-[10px]">
                        {mod.is_published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>{allLessons.filter((l) => l.module_id === mod.id).length}</TableCell>
                    <TableCell>{mod.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModule(mod)} aria-label="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          mutations.updateModule.mutate({ id: mod.id, is_published: !mod.is_published }, {
                            onSuccess: () => toast({ title: mod.is_published ? "Despublicado" : "Publicado" }),
                          });
                        }} aria-label={mod.is_published ? "Ocultar" : "Visualizar"}>
                          {mod.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "module", id: mod.id, label: mod.title })} aria-label="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* LESSONS TAB */}
        <TabsContent value="aulas" className="space-y-4">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <Select value={selectedModuleFilter} onValueChange={setSelectedModuleFilter}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder="Selecione o módulo" /></SelectTrigger>
              <SelectContent>
                {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1" onClick={openNewLesson}>
              <Plus className="w-3.5 h-3.5" /> Nova Aula
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Vídeo</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((les) => (
                  <TableRow key={les.id}>
                    <TableCell>{les.sort_order}</TableCell>
                    <TableCell className="font-medium">{les.title}</TableCell>
                    <TableCell>{les.duration_minutes} min</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{les.video_url}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLesson(les)} aria-label="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "lesson", id: les.id, label: les.title })} aria-label="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* QUIZZES TAB */}
        <TabsContent value="provas" className="space-y-4">
          <Select value={selectedModuleFilter} onValueChange={setSelectedModuleFilter}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Selecione o módulo" /></SelectTrigger>
            <SelectContent>
              {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
            </SelectContent>
          </Select>

          {filteredQuiz ? (
            <Card className="p-4 space-y-3">
              <h4 className="font-semibold text-sm">Configuração da Prova</h4>
              <div className="flex items-end gap-3">
                <div>
                  <Label className="text-xs">Nota mínima (%)</Label>
                  <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="h-8 mt-1 w-24" />
                </div>
                <Button size="sm" onClick={handleSaveQuizConfig} disabled={mutations.updateQuiz.isPending}>
                  Salvar Config
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Este módulo ainda não tem prova.</p>
              <Button size="sm" onClick={handleCreateQuiz} disabled={mutations.createQuiz.isPending}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Criar Prova
              </Button>
            </Card>
          )}

          {filteredQuiz && (
            <>
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Questões ({questions.length})</h4>
                <Button size="sm" className="gap-1" onClick={openNewQuestion}>
                  <Plus className="w-3.5 h-3.5" /> Nova Questão
                </Button>
              </div>
              <div className="space-y-2">
                {questions.map((q, i: number) => {
                  const options = (q.options as string[]) ?? [];
                  return (
                    <Card key={q.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{q.question}</p>
                          <Badge variant="secondary" className="text-[10px] mt-1">{options.length === 2 ? "V/F" : "Múltipla Escolha"}</Badge>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditQuestion(q)} aria-label="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "question", id: q.id, label: q.question })} aria-label="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingModuleId ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={moduleForm.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleForm({ ...moduleForm, title: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={moduleForm.category} onValueChange={(v) => setModuleForm({ ...moduleForm, category: v as AcademyModuleCategory })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Comercial", "Estrategia", "Institucional", "Produtos"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={moduleForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModuleForm({ ...moduleForm, description: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule} disabled={mutations.createModule.isPending || mutations.updateModule.isPending}>
              {(mutations.createModule.isPending || mutations.updateModule.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLessonId ? "Editar Aula" : "Nova Aula"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={lessonForm.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={lessonForm.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLessonForm({ ...lessonForm, content: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>YouTube URL (embed)</Label>
              <Input value={lessonForm.videoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duração (min)</Label><Input type="number" value={lessonForm.durationMinutes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Ordem</Label><Input type="number" value={lessonForm.sortOrder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, sortOrder: Number(e.target.value) })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveLesson} disabled={mutations.createLesson.isPending || mutations.updateLesson.isPending}>
              {(mutations.createLesson.isPending || mutations.updateLesson.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingQuestionId ? "Editar Questão" : "Nova Questão"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Textarea value={questionForm.question} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionForm({ ...questionForm, question: e.target.value })} className="mt-1" placeholder="Digite a pergunta..." />
            </div>
            <div className="space-y-2">
              <Label>Opções (marque a correta)</Label>
              <RadioGroup value={String(questionForm.correctAnswer)} onValueChange={(v) => setQuestionForm({ ...questionForm, correctAnswer: Number(v) })}>
                {questionForm.options.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                    <Input
                      value={opt}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newOpts = [...questionForm.options];
                        newOpts[i] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }}
                      placeholder={`Opção ${i + 1}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog(false)}>Cancelar</Button>
            <Button
              disabled={mutations.createQuizQuestion.isPending || mutations.updateQuizQuestion.isPending || !questionForm.question.trim() || questionForm.options.filter((o: string) => o.trim()).length < 2}
              onClick={handleSaveQuestion}
            >
              {(mutations.createQuizQuestion.isPending || mutations.updateQuizQuestion.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteTarget?.label}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
