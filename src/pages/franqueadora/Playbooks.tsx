import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BookOpen, Search, ChevronDown, Copy, Check, Target, AlertTriangle, MessageSquare, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { performanceData, criacaoData, type PlaybookData, type ScriptCard } from "@/constants/playbooksData";

function PlaybookSections({ data, search }: { data: PlaybookData; search: string }) {
  const q = search.toLowerCase();
  const filteredSections = useMemo(() => {
    if (!q) return data.playbook.sections;
    return data.playbook.sections.filter(
      (s) =>
        s.titulo.toLowerCase().includes(q) ||
        s.conteudo.some((c) => c.toLowerCase().includes(q))
    );
  }, [data.playbook.sections, q]);

  if (filteredSections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Nenhuma seção encontrada</p>
        <p className="text-sm mt-1">Tente outra pesquisa</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{data.playbook.titulo}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{data.playbook.subtitulo}</p>
      <Accordion type="multiple" className="space-y-2">
        {filteredSections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card px-1">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline px-3">
              {section.titulo}
            </AccordionTrigger>
            <AccordionContent className="px-3">
              <ul className="space-y-2.5">
                {section.conteudo.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-primary/60 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function ScriptCardComponent({ script }: { script: ScriptCard }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="border-border/60 hover:border-primary/20 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="outline" className="text-[10px] shrink-0 font-bold">
              #{script.numero}
            </Badge>
            <h4 className="text-sm font-semibold truncate">{script.titulo}</h4>
          </div>
        </div>

        <div className="grid gap-2 text-xs">
          <div className="flex gap-2 items-start">
            <Target className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Situação:</span>{" "}
              <span className="text-muted-foreground">{script.situacao}</span>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Objetivo:</span>{" "}
              <span className="text-muted-foreground">{script.objetivo}</span>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">O que o cliente precisa entender:</span>{" "}
              <span className="text-muted-foreground">{script.oQueClientePrecisaEntender}</span>
            </div>
          </div>
        </div>

        {/* Script curto */}
        <div className="bg-muted/50 rounded-lg p-3 relative group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Script curto</span>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(script.scriptCurto, `curto-${script.id}`)}
             aria-label="Copiar">
              {copiedField === `curto-${script.id}` ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-foreground">{script.scriptCurto}</p>
        </div>

        {/* Script completo — accordion */}
        <Accordion type="single" collapsible>
          <AccordionItem value="full" className="border-0">
            <AccordionTrigger className="text-xs font-semibold py-1.5 hover:no-underline text-primary">
              Ver script completo
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 relative group">
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(script.scriptCompleto, `completo-${script.id}`)}
                 aria-label="Copiar">
                  {copiedField === `completo-${script.id}` ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
                  {script.scriptCompleto}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Tom e erro */}
        <div className="flex flex-wrap gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium text-foreground">Tom:</span>
            <span className="text-muted-foreground">{script.tomIdeal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="font-medium text-foreground">Evitar:</span>
            <span className="text-muted-foreground">{script.erroAEvitar}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ManualBlocos({ data, search }: { data: PlaybookData; search: string }) {
  const q = search.toLowerCase();
  const filteredBlocos = useMemo(() => {
    if (!q) return data.manual.blocos;
    return data.manual.blocos
      .map((bloco) => ({
        ...bloco,
        scripts: bloco.scripts.filter(
          (s) =>
            s.titulo.toLowerCase().includes(q) ||
            s.situacao.toLowerCase().includes(q) ||
            s.scriptCurto.toLowerCase().includes(q) ||
            s.scriptCompleto.toLowerCase().includes(q) ||
            s.objetivo.toLowerCase().includes(q)
        ),
      }))
      .filter((bloco) => bloco.scripts.length > 0);
  }, [data.manual.blocos, q]);

  if (filteredBlocos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Nenhum script encontrado</p>
        <p className="text-sm mt-1">Tente outra pesquisa</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{data.manual.titulo}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{data.manual.subtitulo}</p>
      <Accordion type="multiple" defaultValue={filteredBlocos.map((b) => b.id)} className="space-y-3">
        {filteredBlocos.map((bloco) => (
          <AccordionItem key={bloco.id} value={bloco.id} className="border rounded-lg bg-card px-1">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline px-3">
              <div className="flex items-center gap-2">
                {bloco.titulo}
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {bloco.scripts.length} scripts
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 space-y-3">
              {bloco.scripts.map((script) => (
                <ScriptCardComponent key={script.id} script={script} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function TabContent({ data, search }: { data: PlaybookData; search: string }) {
  return (
    <div>
      <PlaybookSections data={data} search={search} />
      <ManualBlocos data={data} search={search} />
    </div>
  );
}

export default function Playbooks() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbooks & Scripts"
        subtitle="Banco de conhecimento operacional da equipe"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        badge="OPERAÇÃO"
      />

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar scripts, ações, situações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="performance">⚡ Performance</TabsTrigger>
          <TabsTrigger value="criacao">🎨 Criação</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <TabContent data={performanceData} search={search} />
        </TabsContent>

        <TabsContent value="criacao" className="mt-6">
          <TabContent data={criacaoData} search={search} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
