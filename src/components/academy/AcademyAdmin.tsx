import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import type { AcademyModuleCategory } from "@/types/academy";
import {
  useAcademyModules, useAcademyLessons, useAcademyQuizzes,
  useAcademyQuizQuestions, useAcademyMutations,
} from "@/hooks/useAcademy";

export function AcademyAdmin() {
  const { data: modules = [] } = useAcademyModules();
  const { data: allLessons = [] } = useAcademyLessons();
  const { data: quizzes = [] } = useAcademyQuizzes();
  const { createModule, updateModule, createLesson, createQuizQuestion } = useAcademyMutations();

  const [adminTab, setAdminTab] = useState("modulos");
  const [moduleDialog, setModuleDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState(modules[0]?.id ?? "");

  // Update selected filter when modules load
  if (!selectedModuleFilter && modules.length > 0) {
    setSelectedModuleFilter(modules[0].id);
  }

  const [moduleForm, setModuleForm] = useState({ title: "", category: "Comercial" as AcademyModuleCategory, description: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", videoUrl: "", durationMinutes: 30, sortOrder: 1 });

  const filteredLessons = allLessons.filter(l => l.module_id === selectedModuleFilter).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const filteredQuiz = quizzes.find(q => q.module_id === selectedModuleFilter);
  const [quizQuestions, setQuizQuestionsId] = useState<string | undefined>(undefined);

  // Load questions for selected quiz
  const activeQuizId = filteredQuiz?.id;

  return (
    <AcademyAdminInner
      modules={modules}
      allLessons={allLessons}
      quizzes={quizzes}
      adminTab={adminTab}
      setAdminTab={setAdminTab}
      moduleDialog={moduleDialog}
      setModuleDialog={setModuleDialog}
      lessonDialog={lessonDialog}
      setLessonDialog={setLessonDialog}
      selectedModuleFilter={selectedModuleFilter}
      setSelectedModuleFilter={setSelectedModuleFilter}
      moduleForm={moduleForm}
      setModuleForm={setModuleForm}
      lessonForm={lessonForm}
      setLessonForm={setLessonForm}
      filteredLessons={filteredLessons}
      filteredQuiz={filteredQuiz}
      activeQuizId={activeQuizId}
      createModule={createModule}
      updateModule={updateModule}
      createLesson={createLesson}
      createQuizQuestion={createQuizQuestion}
    />
  );
}

function AcademyAdminInner({
  modules, allLessons, quizzes,
  adminTab, setAdminTab,
  moduleDialog, setModuleDialog,
  lessonDialog, setLessonDialog,
  selectedModuleFilter, setSelectedModuleFilter,
  moduleForm, setModuleForm,
  lessonForm, setLessonForm,
  filteredLessons, filteredQuiz, activeQuizId,
  createModule, updateModule, createLesson, createQuizQuestion,
}: any) {
  const { data: questions = [] } = useAcademyQuizQuestions(activeQuizId);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [questionForm, setQuestionForm] = useState({ question: "", options: ["", "", "", ""], correctAnswer: 0 });

  const extractYoutubeId = (url: string) => {
    const match = url.match(/embed\/([^?]+)/);
    return match ? match[1] : null;
  };

  const handleCreateModule = () => {
    createModule.mutate(
      { title: moduleForm.title, description: moduleForm.description, category: moduleForm.category },
      {
        onSuccess: () => { toast({ title: "Módulo criado!" }); setModuleDialog(false); },
        onError: () => toast({ title: "Erro ao criar módulo", variant: "destructive" }),
      }
    );
  };

  const handleCreateLesson = () => {
    createLesson.mutate(
      {
        title: lessonForm.title,
        module_id: selectedModuleFilter,
        content: lessonForm.content,
        video_url: lessonForm.videoUrl,
        duration_minutes: lessonForm.durationMinutes,
        sort_order: lessonForm.sortOrder,
      },
      {
        onSuccess: () => { toast({ title: "Aula criada!" }); setLessonDialog(false); },
        onError: () => toast({ title: "Erro ao criar aula", variant: "destructive" }),
      }
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
            <Button size="sm" className="gap-1" onClick={() => { setModuleForm({ title: "", category: "Comercial", description: "" }); setModuleDialog(true); }}>
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
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod: any) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{mod.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={mod.is_published ? "default" : "secondary"} className="text-[10px]">
                        {mod.is_published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>{allLessons.filter((l: any) => l.module_id === mod.id).length}</TableCell>
                    <TableCell>{mod.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Editar" })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          updateModule.mutate({ id: mod.id, is_published: !mod.is_published }, {
                            onSuccess: () => toast({ title: mod.is_published ? "Despublicado" : "Publicado" }),
                          });
                        }}>
                          {mod.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1" onClick={() => { setLessonForm({ title: "", content: "", videoUrl: "", durationMinutes: 30, sortOrder: filteredLessons.length + 1 }); setLessonDialog(true); }}>
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
                {filteredLessons.map((les: any) => (
                  <TableRow key={les.id}>
                    <TableCell>{les.sort_order}</TableCell>
                    <TableCell className="font-medium">{les.title}</TableCell>
                    <TableCell>{les.duration_minutes} min</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{les.video_url}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Editar aula" })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => toast({ title: "Excluir aula" })}>
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
              {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
            </SelectContent>
          </Select>

          {filteredQuiz && (
            <Card className="p-4 space-y-3">
              <h4 className="font-semibold text-sm">Configuração da Prova</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Nota mínima</Label><Input type="number" defaultValue={filteredQuiz.passing_score ?? 70} className="h-8 mt-1" /></div>
                <div><Label className="text-xs">Tentativas</Label><Input type="number" defaultValue={3} className="h-8 mt-1" /></div>
              </div>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Questões ({questions.length})</h4>
            <Button size="sm" className="gap-1" onClick={() => {
              if (!activeQuizId) { toast({ title: "Selecione um módulo com prova", variant: "destructive" }); return; }
              setQuestionForm({ question: "", options: ["", "", "", ""], correctAnswer: 0 });
              setQuestionDialog(true);
            }}>
              <Plus className="w-3.5 h-3.5" /> Nova Questão
            </Button>
          </div>
          <div className="space-y-2">
            {questions.map((q: any, i: number) => {
              const options = (q.options as string[]) ?? [];
              return (
                <Card key={q.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{options.length === 2 ? "V/F" : "Múltipla Escolha"}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => toast({ title: "Editar questão" })}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Módulo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={moduleForm.title} onChange={(e: any) => setModuleForm({ ...moduleForm, title: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={moduleForm.category} onValueChange={(v: any) => setModuleForm({ ...moduleForm, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Comercial", "Estrategia", "Institucional", "Produtos"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={moduleForm.description} onChange={(e: any) => setModuleForm({ ...moduleForm, description: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateModule} disabled={createModule.isPending}>
              {createModule.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Aula</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={lessonForm.title} onChange={(e: any) => setLessonForm({ ...lessonForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={lessonForm.content} onChange={(e: any) => setLessonForm({ ...lessonForm, content: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>YouTube URL (embed)</Label>
              <Input value={lessonForm.videoUrl} onChange={(e: any) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="mt-1" />
              {lessonForm.videoUrl && extractYoutubeId(lessonForm.videoUrl) && (
                <div className="mt-2 aspect-video rounded overflow-hidden bg-black max-w-sm">
                  <iframe src={lessonForm.videoUrl} className="w-full h-full" title="Preview" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duração (min)</Label><Input type="number" value={lessonForm.durationMinutes} onChange={(e: any) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Ordem</Label><Input type="number" value={lessonForm.sortOrder} onChange={(e: any) => setLessonForm({ ...lessonForm, sortOrder: Number(e.target.value) })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateLesson} disabled={createLesson.isPending}>
              {createLesson.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Question Dialog */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Questão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Textarea value={questionForm.question} onChange={(e: any) => setQuestionForm({ ...questionForm, question: e.target.value })} className="mt-1" placeholder="Digite a pergunta..." />
            </div>
            <div className="space-y-2">
              <Label>Opções (marque a correta)</Label>
              <RadioGroup value={String(questionForm.correctAnswer)} onValueChange={(v) => setQuestionForm({ ...questionForm, correctAnswer: Number(v) })}>
                {questionForm.options.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                    <Input
                      value={opt}
                      onChange={(e: any) => {
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
              disabled={createQuizQuestion.isPending || !questionForm.question.trim() || questionForm.options.filter((o: string) => o.trim()).length < 2}
              onClick={() => {
                const validOptions = questionForm.options.filter((o: string) => o.trim());
                createQuizQuestion.mutate(
                  {
                    quiz_id: activeQuizId!,
                    question: questionForm.question,
                    options: validOptions,
                    correct_answer: questionForm.correctAnswer,
                    sort_order: questions.length + 1,
                  },
                  {
                    onSuccess: () => { toast({ title: "Questão criada!" }); setQuestionDialog(false); },
                    onError: () => toast({ title: "Erro ao criar questão", variant: "destructive" }),
                  }
                );
              }}
            >
              {createQuizQuestion.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
