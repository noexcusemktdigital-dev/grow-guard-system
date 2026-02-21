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
import { toast } from "@/hooks/use-toast";
import {
  mockModules,
  mockLessons,
  mockQuizzes,
  mockQuizQuestions,
  getLessonsByModule,
  getQuestionsByQuiz,
  type AcademyModule,
  type AcademyLesson,
  type AcademyModuleCategory,
} from "@/data/academyData";

export function AcademyAdmin() {
  const [adminTab, setAdminTab] = useState("modulos");
  const [moduleDialog, setModuleDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState(mockModules[0]?.id ?? "");

  // Module form
  const [moduleForm, setModuleForm] = useState({ title: "", category: "Comercial" as AcademyModuleCategory, description: "", status: "draft" as "draft" | "published" });

  // Lesson form
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", youtubeUrl: "", estimatedMinutes: 30, order: 1 });

  const filteredLessons = getLessonsByModule(selectedModuleFilter);
  const filteredQuiz = mockQuizzes.find((q) => q.moduleId === selectedModuleFilter);
  const filteredQuestions = filteredQuiz ? getQuestionsByQuiz(filteredQuiz.id) : [];

  const extractYoutubeId = (url: string) => {
    const match = url.match(/embed\/([^?]+)/);
    return match ? match[1] : null;
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
            <Button size="sm" className="gap-1" onClick={() => { setModuleForm({ title: "", category: "Comercial", description: "", status: "draft" }); setModuleDialog(true); }}>
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
                {mockModules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{mod.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={mod.status === "published" ? "default" : "secondary"} className="text-[10px]">
                        {mod.status === "published" ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>{mod.lessonsCount}</TableCell>
                    <TableCell>{mod.order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Editar", description: "Funcionalidade mock" })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: mod.status === "published" ? "Despublicado" : "Publicado" })}>
                          {mod.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                {mockModules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1" onClick={() => { setLessonForm({ title: "", description: "", youtubeUrl: "", estimatedMinutes: 30, order: filteredLessons.length + 1 }); setLessonDialog(true); }}>
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
                  <TableHead>YouTube</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((les) => (
                  <TableRow key={les.id}>
                    <TableCell>{les.order}</TableCell>
                    <TableCell className="font-medium">{les.title}</TableCell>
                    <TableCell>{les.estimatedMinutes} min</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{les.youtubeUrl}</TableCell>
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
              {mockModules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
            </SelectContent>
          </Select>

          {filteredQuiz && (
            <Card className="p-4 space-y-3">
              <h4 className="font-semibold text-sm">Configuração da Prova</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Nota mínima</Label><Input type="number" defaultValue={filteredQuiz.passingScore} className="h-8 mt-1" /></div>
                <div><Label className="text-xs">Tentativas</Label><Input type="number" defaultValue={filteredQuiz.attemptsAllowed} className="h-8 mt-1" /></div>
                <div><Label className="text-xs">Tempo (min)</Label><Input type="number" defaultValue={filteredQuiz.timeLimit ?? ""} placeholder="Sem limite" className="h-8 mt-1" /></div>
                <div><Label className="text-xs">Feedback</Label><Input type="text" defaultValue={filteredQuiz.showFeedback ? "Sim" : "Não"} className="h-8 mt-1" readOnly /></div>
              </div>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Questões ({filteredQuestions.length})</h4>
            <Button size="sm" className="gap-1" onClick={() => toast({ title: "Nova questão", description: "Funcionalidade mock" })}>
              <Plus className="w-3.5 h-3.5" /> Nova Questão
            </Button>
          </div>
          <div className="space-y-2">
            {filteredQuestions.map((q, i) => (
              <Card key={q.id} className="p-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{q.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">{q.type === "mcq" ? "Múltipla Escolha" : "V/F"}</Badge>
                      <span className="text-[10px] text-muted-foreground">{q.points} pts</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => toast({ title: "Editar questão" })}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Módulo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={moduleForm.category} onValueChange={(v) => setModuleForm({ ...moduleForm, category: v as AcademyModuleCategory })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Comercial", "Estrategia", "Institucional", "Produtos"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Módulo criado (mock)" }); setModuleDialog(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Aula</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>YouTube URL (embed)</Label>
              <Input value={lessonForm.youtubeUrl} onChange={(e) => setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="mt-1" />
              {lessonForm.youtubeUrl && extractYoutubeId(lessonForm.youtubeUrl) && (
                <div className="mt-2 aspect-video rounded overflow-hidden bg-black max-w-sm">
                  <iframe src={lessonForm.youtubeUrl} className="w-full h-full" title="Preview" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duração (min)</Label><Input type="number" value={lessonForm.estimatedMinutes} onChange={(e) => setLessonForm({ ...lessonForm, estimatedMinutes: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Ordem</Label><Input type="number" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) })} className="mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog(false)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Aula criada (mock)" }); setLessonDialog(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
