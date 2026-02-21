import { useState } from "react";
import {
  Globe, Save, Edit3, Check, Sparkles, Download, ExternalLink,
  Eye, Code, Upload, BookOpen, Target, MessageSquare, Phone,
  Palette, Link, Award, Clock, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

/* ── Knowledge Base ── */
interface KBField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "upload" | "checklist";
  value: string;
  options?: string[];
}

const initialFields: KBField[] = [
  { key: "objetivo", label: "Qual o objetivo do site?", type: "select", value: "Captura de Leads", options: ["Captura de Leads", "Institucional", "Vendas / E-commerce", "Portfólio"] },
  { key: "servicos", label: "Quais serviços/produtos oferece?", type: "textarea", value: "Plataforma de gestão comercial para franquias\nCRM integrado\nAutomação de marketing\nIA para vendas" },
  { key: "diferencial", label: "Qual o diferencial da empresa?", type: "textarea", value: "Única plataforma que integra vendas + marketing + IA para redes de franquias" },
  { key: "depoimentos", label: "Depoimentos de clientes", type: "textarea", value: "\"A NoExcuse triplicou nossos leads em 3 meses\" — João, Franqueado\n\"Melhor plataforma de gestão que já usamos\" — Maria, CEO" },
  { key: "contato", label: "Informações de contato", type: "textarea", value: "contato@noexcuse.com.br\n(11) 99999-0000\nAv. Paulista, 1000 — São Paulo/SP" },
  { key: "imagens", label: "Possui imagens próprias?", type: "upload", value: "" },
  { key: "cores", label: "Cores e estilo visual preferido", type: "text", value: "Vermelho (#E63946), Azul escuro (#1D3557), Branco" },
  { key: "referencias", label: "Referência de sites que gosta (links)", type: "textarea", value: "https://www.hubspot.com\nhttps://www.salesforce.com\nhttps://www.pipedrive.com" },
];

/* ── Generated sites history ── */
interface GeneratedSite {
  id: string;
  name: string;
  status: "Rascunho" | "Publicado";
  createdAt: string;
  url?: string;
}

const mockSites: GeneratedSite[] = [
  { id: "1", name: "LP Captura — Promo Março", status: "Publicado", createdAt: "2026-02-15", url: "https://noexcuse.com.br/promo-marco" },
  { id: "2", name: "Site Institucional v2", status: "Rascunho", createdAt: "2026-02-20" },
];

export default function ClienteSites() {
  const [fields, setFields] = useState(initialFields);
  const [isEditing, setIsEditing] = useState(false);
  const [sites, setSites] = useState(mockSites);
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(false);

  const filledCount = fields.filter(f => f.value.trim() && f.type !== "upload").length;
  const totalCount = fields.filter(f => f.type !== "upload").length;
  const progress = Math.round((filledCount / totalCount) * 100);

  const updateField = (key: string, value: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedPreview(true);
      toast({ title: "Site gerado com sucesso!", description: "Revise o preview e publique quando estiver pronto." });
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Sites & Landing Pages"
        subtitle="Base de conhecimento e criação de sites com IA"
        icon={<Globe className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="gerar" className="text-xs gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Gerar Site</TabsTrigger>
        </TabsList>

        {/* ═══ BASE ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Preenchimento da Base</span>
                <span className="text-xs text-muted-foreground">{filledCount}/{totalCount} campos</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1"
              onClick={() => {
                if (isEditing) toast({ title: "Base salva!" });
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? <><Check className="w-3.5 h-3.5" /> Salvar</> : <><Edit3 className="w-3.5 h-3.5" /> Editar Base</>}
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map(field => (
              <Card key={field.key} className="glass-card">
                <CardContent className="py-4">
                  <Label className="text-xs font-medium">{field.label}</Label>
                  {!isEditing ? (
                    field.type === "upload" ? (
                      <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center">
                        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhuma imagem enviada</p>
                      </div>
                    ) : (
                      <p className="text-sm mt-1.5 whitespace-pre-line">{field.value || <span className="text-muted-foreground italic">Não preenchido</span>}</p>
                    )
                  ) : field.type === "select" ? (
                    <Select value={field.value} onValueChange={v => updateField(field.key, v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea value={field.value} onChange={e => updateField(field.key, e.target.value)} rows={3} className="mt-1.5" />
                  ) : field.type === "upload" ? (
                    <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Arraste ou clique para upload</p>
                    </div>
                  ) : (
                    <Input value={field.value} onChange={e => updateField(field.key, e.target.value)} className="mt-1.5" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ GERAR SITE ═══ */}
        <TabsContent value="gerar" className="space-y-5 mt-4">
          {/* Summary of KB */}
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold">Resumo da Base de Conhecimento</p>
                <Badge variant="outline" className="text-[9px] ml-auto">{progress}% preenchido</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.filter(f => f.type !== "upload" && f.value).map(f => (
                  <div key={f.key} className="p-3 rounded-xl bg-background border">
                    <p className="text-[10px] text-muted-foreground font-medium">{f.label}</p>
                    <p className="text-xs mt-1 line-clamp-2">{f.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2" size="lg" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-4 h-4" />
            {generating ? "Gerando site..." : "Gerar Site com IA"}
          </Button>

          {/* Generated preview */}
          {generatedPreview && (
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                {/* Mock preview */}
                <div className="bg-gradient-to-b from-primary/10 to-background">
                  <div className="max-w-2xl mx-auto py-12 px-6 text-center space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 mx-auto flex items-center justify-center">
                      <span className="text-xl font-black text-primary">N</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Gestão Completa para Sua Franquia</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Única plataforma que integra vendas + marketing + IA para redes de franquias. Triplique seus leads em 3 meses.
                    </p>
                    <Button className="gap-2"><Sparkles className="w-4 h-4" /> Agende Sua Demo Gratuita</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 px-6 pb-8 max-w-2xl mx-auto">
                    {["CRM Integrado", "Marketing com IA", "Relatórios"].map(b => (
                      <div key={b} className="p-4 rounded-xl bg-card border text-center">
                        <Award className="w-5 h-5 text-primary mx-auto mb-2" />
                        <p className="text-xs font-medium">{b}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 pb-8 max-w-2xl mx-auto">
                    <div className="p-4 rounded-xl bg-muted/30 border text-center">
                      <p className="text-xs italic text-muted-foreground">"A NoExcuse triplicou nossos leads em 3 meses"</p>
                      <p className="text-[10px] text-muted-foreground mt-1">— João, Franqueado</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 border-t space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Button className="w-full gap-2" onClick={() => toast({ title: "Site publicado!", description: "Seu site está no ar." })}>
                      <ExternalLink className="w-4 h-4" /> Publicar Site
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => toast({ title: "Código baixado!" })}>
                      <Download className="w-4 h-4" /> Baixar Código
                    </Button>
                    <Button variant="outline" className="w-full gap-2">
                      <Edit3 className="w-4 h-4" /> Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <div>
            <p className="section-label mb-3">HISTÓRICO DE SITES</p>
            <div className="space-y-3">
              {sites.map(s => (
                <Card key={s.id} className="glass-card">
                  <CardContent className="py-4 flex items-center gap-4">
                    <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={s.status === "Publicado" ? "default" : "outline"} className="text-[9px]">{s.status}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.createdAt}
                        </span>
                      </div>
                    </div>
                    {s.url && (
                      <Button variant="ghost" size="sm" className="text-xs gap-1">
                        <ExternalLink className="w-3.5 h-3.5" /> Ver
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
