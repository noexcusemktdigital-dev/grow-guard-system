import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Comunicado,
  ComunicadoTipo,
  ComunicadoPrioridade,
  PublicoAlvo,
} from "@/types/comunicados";
import {
  FileText,
  Users,
  Tag,
  Settings2,
  AlertTriangle,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  CalendarClock,
  CalendarX,
  Building2,
} from "lucide-react";
import { useUnits } from "@/hooks/useUnits";

const mockUnidades: string[] = []; // replaced by real units from DB

const tipoOptions: ComunicadoTipo[] = [
  "Informativo", "Atualização de sistema", "Alerta operacional", "Campanha", "Institucional", "Urgente",
];

const prioridadeOptions: ComunicadoPrioridade[] = ["Normal", "Alta", "Crítica"];

const publicoOptions: PublicoAlvo[] = ["Franqueadora", "Franqueados", "Clientes finais", "Todos"];

interface ComunicadoFormProps {
  comunicado?: Comunicado | null;
  onPublish: (data: Partial<Comunicado>) => void;
  onSaveDraft: (data: Partial<Comunicado>) => void;
  onCancel: () => void;
}

export default function ComunicadoForm({ comunicado, onPublish, onSaveDraft, onCancel }: ComunicadoFormProps) {
  const { data: dbUnits } = useUnits();
  const [titulo, setTitulo] = useState(comunicado?.titulo || "");
  const [conteudo, setConteudo] = useState(comunicado?.conteudo || "");
  const [imagemUrl, setImagemUrl] = useState(comunicado?.imagemUrl || "");
  const [linkExterno, setLinkExterno] = useState(comunicado?.linkExterno || "");
  const [anexo, setAnexo] = useState(comunicado?.anexo || "");
  const [publico, setPublico] = useState<PublicoAlvo[]>(comunicado?.publico || []);
  const [unidadesEspecificas, setUnidadesEspecificas] = useState<string[]>(comunicado?.unidadesEspecificas || []);
  const [tipo, setTipo] = useState<ComunicadoTipo>(comunicado?.tipo || "Informativo");
  const [prioridade, setPrioridade] = useState<ComunicadoPrioridade>(comunicado?.prioridade || "Normal");
  const [mostrarDashboard, setMostrarDashboard] = useState(comunicado?.mostrarDashboard ?? true);
  const [mostrarPopup, setMostrarPopup] = useState(comunicado?.mostrarPopup ?? false);
  const [exigirConfirmacao, setExigirConfirmacao] = useState(comunicado?.exigirConfirmacao ?? false);
  const [programar, setProgramar] = useState(!!comunicado?.dataProgramada);
  const [dataProgramada, setDataProgramada] = useState(comunicado?.dataProgramada?.slice(0, 16) || "");
  const [definirExpiracao, setDefinirExpiracao] = useState(!!comunicado?.dataExpiracao);
  const [dataExpiracao, setDataExpiracao] = useState(comunicado?.dataExpiracao?.slice(0, 10) || "");

  const handlePublicoToggle = (p: PublicoAlvo) => {
    if (p === "Todos") {
      setPublico(publico.includes("Todos") ? [] : ["Todos", "Franqueadora", "Franqueados", "Clientes finais"]);
      return;
    }
    const next = publico.includes(p) ? publico.filter((x) => x !== p && x !== "Todos") : [...publico.filter((x) => x !== "Todos"), p];
    setPublico(next);
  };

  const handleUnidadeToggle = (u: string) => {
    setUnidadesEspecificas((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]));
  };

  const buildData = (): Partial<Comunicado> => ({
    titulo,
    conteudo,
    imagemUrl: imagemUrl || undefined,
    linkExterno: linkExterno || undefined,
    anexo: anexo || undefined,
    publico,
    unidadesEspecificas,
    tipo,
    prioridade,
    mostrarDashboard,
    mostrarPopup,
    exigirConfirmacao,
    dataProgramada: programar ? dataProgramada : undefined,
    dataExpiracao: definirExpiracao ? dataExpiracao : undefined,
  });

  return (
    <div className="space-y-6">
      {/* Section 1: Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do comunicado" />
          </div>
          <div>
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea id="conteudo" value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Escreva o conteúdo do comunicado..." className="min-h-[160px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="imagemUrl">Imagem URL</Label>
              <Input id="imagemUrl" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="linkExterno">Link externo</Label>
              <Input id="linkExterno" value={linkExterno} onChange={(e) => setLinkExterno(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="anexo">Anexo</Label>
              <Input id="anexo" value={anexo} onChange={(e) => setAnexo(e.target.value)} placeholder="nome-do-arquivo.pdf" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Audience */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Público-Alvo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {publicoOptions.map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={publico.includes(p)} onCheckedChange={() => handlePublicoToggle(p)} />
                <span className="text-sm">{p}</span>
              </label>
            ))}
          </div>
          {publico.includes("Franqueados") && !publico.includes("Todos") && (
            <div>
              <Separator className="my-3" />
              <Label className="text-xs text-muted-foreground mb-2 block">Unidades específicas (deixe vazio para todas)</Label>
              <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                {(dbUnits ?? []).map((u) => (
                  <label key={u.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={unidadesEspecificas.includes(u.id)} onCheckedChange={() => handleUnidadeToggle(u.id)} />
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs">{u.name}</span>
                  </label>
                ))}
                {(dbUnits ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma unidade cadastrada</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Classificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ComunicadoTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as ComunicadoPrioridade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {prioridadeOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {prioridade === "Crítica" && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 text-red-700 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Comunicados críticos forçam exibição como pop-up ao login.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Display Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Opções de Exibição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={mostrarDashboard} onCheckedChange={(v) => setMostrarDashboard(!!v)} />
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Mostrar no dashboard</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={mostrarPopup} onCheckedChange={(v) => setMostrarPopup(!!v)} />
            <MonitorSmartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Mostrar como pop-up no login</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={exigirConfirmacao} onCheckedChange={(v) => setExigirConfirmacao(!!v)} />
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Exigir confirmação de leitura</span>
          </label>
          <Separator />
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={programar} onCheckedChange={(v) => setProgramar(!!v)} />
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Programar publicação</span>
          </label>
          {programar && (
            <Input type="datetime-local" value={dataProgramada} onChange={(e) => setDataProgramada(e.target.value)} className="max-w-xs ml-6" />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={definirExpiracao} onCheckedChange={(v) => setDefinirExpiracao(!!v)} />
            <CalendarX className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Definir data de expiração</span>
          </label>
          {definirExpiracao && (
            <Input type="date" value={dataExpiracao} onChange={(e) => setDataExpiracao(e.target.value)} className="max-w-xs ml-6" />
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button variant="secondary" onClick={() => onSaveDraft(buildData())}>Salvar Rascunho</Button>
        <Button onClick={() => onPublish(buildData())} disabled={!titulo.trim() || !conteudo.trim() || publico.length === 0}>
          Publicar
        </Button>
      </div>
    </div>
  );
}
