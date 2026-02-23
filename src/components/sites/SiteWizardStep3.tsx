import { useState } from "react";
import {
  Building2, ShoppingBag, Users, Award, Palette, Phone, FileText,
  CheckCircle2, Circle, ChevronDown, ChevronRight, HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface BriefingData {
  nomeEmpresa: string;
  slogan: string;
  descricaoNegocio: string;
  segmento: string;
  servicos: string;
  diferencial: string;
  faixaPreco: string;
  publicoAlvo: string;
  faixaEtaria: string;
  dores: string;
  depoimentos: string;
  numerosImpacto: string;
  logosClientes: string;
  coresPrincipais: string;
  fontesPreferidas: string;
  tomComunicacao: string;
  referenciaVisual: string;
  telefone: string;
  email: string;
  endereco: string;
  redesSociais: string;
  linkWhatsapp: string;
  instrucoes: string;
  estrategia: Record<string, any> | null;
  persona: { nome: string; descricao: string } | null;
  identidade: { paleta: string; fontes: string; estilo: string; tom_visual: string } | null;
}

interface Props {
  data: BriefingData;
  onChange: (field: keyof BriefingData, value: string) => void;
}

// ── Quality calculation ──
const fieldWeights: { field: keyof BriefingData; weight: number }[] = [
  { field: "nomeEmpresa", weight: 2 },
  { field: "descricaoNegocio", weight: 2 },
  { field: "servicos", weight: 2 },
  { field: "diferencial", weight: 2 },
  { field: "telefone", weight: 2 }, // or email
  { field: "publicoAlvo", weight: 1.5 },
  { field: "depoimentos", weight: 1.5 },
  { field: "coresPrincipais", weight: 1.5 },
  { field: "slogan", weight: 1 },
  { field: "segmento", weight: 1 },
  { field: "faixaPreco", weight: 1 },
  { field: "dores", weight: 1 },
  { field: "numerosImpacto", weight: 1 },
  { field: "tomComunicacao", weight: 1 },
  { field: "redesSociais", weight: 1 },
  { field: "referenciaVisual", weight: 1 },
  { field: "instrucoes", weight: 1 },
];

function calcQuality(data: BriefingData): number {
  const totalWeight = fieldWeights.reduce((s, f) => s + f.weight, 0);
  let filled = 0;
  for (const { field, weight } of fieldWeights) {
    if (field === "telefone") {
      if ((data.telefone || "").trim() || (data.email || "").trim()) filled += weight;
    } else {
      const v = data[field];
      if (typeof v === "string" && v.trim()) filled += weight;
    }
  }
  return Math.round((filled / totalWeight) * 100);
}

function QualityBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-destructive";
  const label = score >= 70
    ? "Briefing completo — melhor resultado"
    : score >= 40
      ? "Briefing razoável — pode melhorar"
      : "Briefing fraco — site genérico";

  return (
    <Card className="border-primary/20">
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold">Qualidade do Briefing</p>
          <Badge variant="outline" className="text-[9px]">{score}%</Badge>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
        </div>
        <p className={`text-[10px] font-medium ${score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-destructive"}`}>
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Section wrapper ──
interface SectionProps {
  icon: React.ReactNode;
  title: string;
  required?: boolean;
  defaultOpen?: boolean;
  filled: boolean;
  children: React.ReactNode;
}

function BriefingSection({ icon, title, required, defaultOpen = false, filled, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border ${filled ? "border-border" : required ? "border-destructive/30" : "border-border"}`}>
        <CollapsibleTrigger asChild>
          <CardContent className="py-3 cursor-pointer select-none">
            <div className="flex items-center gap-2">
              {filled ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-muted-foreground shrink-0">{icon}</span>
              <span className="text-xs font-bold flex-1">{title}</span>
              {required ? (
                <Badge variant="destructive" className="text-[8px] h-4">Obrigatório</Badge>
              ) : (
                <Badge variant="outline" className="text-[8px] h-4">Opcional</Badge>
              )}
              {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Field helpers ──
function FieldInput({ label, value, onChange, placeholder, tip }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; tip?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <Label className="text-[10px] font-bold uppercase tracking-wider">{label}</Label>
        {tip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-[10px]">{tip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-xs h-8" />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, tip, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; tip?: string; rows?: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <Label className="text-[10px] font-bold uppercase tracking-wider">{label}</Label>
        {tip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-[10px]">{tip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="text-xs resize-none" />
    </div>
  );
}

// ── Auto-fill cards ──
function AutoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <Label className="text-[10px] font-bold uppercase tracking-wider">{label}</Label>
          <Badge className="text-[8px] ml-auto">Auto</Badge>
        </div>
        <div className="text-[11px] text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──
export function SiteWizardStep3({ data, onChange }: Props) {
  const quality = calcQuality(data);

  const hasSection = (fields: (keyof BriefingData)[]) =>
    fields.some((f) => { const v = data[f]; return typeof v === "string" && v.trim().length > 0; });

  return (
    <div className="space-y-4">
      <QualityBar score={quality} />

      {/* Auto-filled data */}
      {(data.estrategia || data.persona || data.identidade) && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dados pré-carregados da sua base</p>
          {data.estrategia && Object.keys(data.estrategia).length > 0 && (
            <AutoCard label="Estratégia de Marketing">
              {Object.keys(data.estrategia).length} respostas carregadas do seu plano
            </AutoCard>
          )}
          {data.persona && (
            <AutoCard label="Persona">
              <p className="font-medium text-foreground">{data.persona.nome}</p>
              <p className="line-clamp-2">{data.persona.descricao}</p>
            </AutoCard>
          )}
          {data.identidade && (
            <AutoCard label="Identidade Visual">
              Cores: {data.identidade.paleta || "—"} · Fontes: {data.identidade.fontes || "—"}
            </AutoCard>
          )}
        </div>
      )}

      {/* Section 1: Sobre a Empresa */}
      <BriefingSection
        icon={<Building2 className="w-4 h-4" />}
        title="Sobre a Empresa"
        required
        defaultOpen
        filled={hasSection(["nomeEmpresa", "descricaoNegocio"])}
      >
        <FieldInput label="Nome da empresa" value={data.nomeEmpresa} onChange={(v) => onChange("nomeEmpresa", v)} placeholder="Nome oficial ou fantasia" />
        <FieldInput label="Slogan / Tagline" value={data.slogan} onChange={(v) => onChange("slogan", v)} placeholder="Ex: Transformando ideias em resultados" tip="Uma frase curta que resume seu posicionamento" />
        <FieldTextarea label="Descrição do negócio" value={data.descricaoNegocio} onChange={(v) => onChange("descricaoNegocio", v)} placeholder="Descreva em 2-3 frases o que sua empresa faz" rows={3} tip="Será usada na seção 'Sobre' do site" />
        <FieldInput label="Segmento de atuação" value={data.segmento} onChange={(v) => onChange("segmento", v)} placeholder="Ex: Tecnologia, Saúde, Educação..." />
      </BriefingSection>

      {/* Section 2: Serviços */}
      <BriefingSection
        icon={<ShoppingBag className="w-4 h-4" />}
        title="Serviços / Produtos"
        required
        defaultOpen
        filled={hasSection(["servicos", "diferencial"])}
      >
        <FieldTextarea label="Serviços ou produtos principais" value={data.servicos} onChange={(v) => onChange("servicos", v)} placeholder="Liste seus principais serviços, um por linha" rows={3} tip="Serão exibidos na seção de serviços do site" />
        <FieldTextarea label="Diferencial competitivo" value={data.diferencial} onChange={(v) => onChange("diferencial", v)} placeholder="O que te torna único? Ex: 10 anos de experiência, atendimento 24h" tip="Aparecerá em destaque no hero ou seção de features" />
        <FieldInput label="Faixa de preço" value={data.faixaPreco} onChange={(v) => onChange("faixaPreco", v)} placeholder="Ex: A partir de R$199/mês (opcional)" />
      </BriefingSection>

      {/* Section 3: Público-Alvo */}
      <BriefingSection
        icon={<Users className="w-4 h-4" />}
        title="Público-Alvo"
        filled={hasSection(["publicoAlvo", "dores"])}
      >
        <FieldTextarea label="Quem é seu cliente ideal?" value={data.publicoAlvo} onChange={(v) => onChange("publicoAlvo", v)} placeholder="Descreva seu cliente ideal: perfil, comportamento, necessidades" tip="Pré-preenchido da persona se disponível" rows={3} />
        <FieldInput label="Faixa etária" value={data.faixaEtaria} onChange={(v) => onChange("faixaEtaria", v)} placeholder="Ex: 25-45 anos" />
        <FieldTextarea label="Dores que você resolve" value={data.dores} onChange={(v) => onChange("dores", v)} placeholder="Ex: Dificuldade em encontrar profissionais qualificados" tip="O site pode abordar essas dores diretamente" />
      </BriefingSection>

      {/* Section 4: Prova Social */}
      <BriefingSection
        icon={<Award className="w-4 h-4" />}
        title="Prova Social"
        filled={hasSection(["depoimentos", "numerosImpacto"])}
      >
        <FieldTextarea label="Depoimentos de clientes" value={data.depoimentos} onChange={(v) => onChange("depoimentos", v)} placeholder="Cole até 3 depoimentos reais.&#10;Formato: 'Texto' — Nome, Cargo" rows={4} tip="Depoimentos reais geram muito mais confiança" />
        <FieldInput label="Números de impacto" value={data.numerosImpacto} onChange={(v) => onChange("numerosImpacto", v)} placeholder="Ex: +500 clientes, 98% de satisfação, 10 anos" tip="Estatísticas para exibir em destaque" />
        <FieldTextarea label="Clientes ou parceiros" value={data.logosClientes} onChange={(v) => onChange("logosClientes", v)} placeholder="Liste nomes de empresas para menção (opcional)" rows={2} />
      </BriefingSection>

      {/* Section 5: Identidade Visual */}
      <BriefingSection
        icon={<Palette className="w-4 h-4" />}
        title="Identidade Visual"
        filled={hasSection(["coresPrincipais", "tomComunicacao"])}
      >
        <FieldInput label="Cores principais" value={data.coresPrincipais} onChange={(v) => onChange("coresPrincipais", v)} placeholder="Ex: Azul marinho (#1a365d), Branco" tip="Pré-preenchido da identidade visual se disponível" />
        <FieldInput label="Fontes preferidas" value={data.fontesPreferidas} onChange={(v) => onChange("fontesPreferidas", v)} placeholder="Ex: Montserrat, Open Sans" />
        <div>
          <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block">Tom de comunicação</Label>
          <Select value={data.tomComunicacao} onValueChange={(v) => onChange("tomComunicacao", v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecione o tom..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal e Corporativo</SelectItem>
              <SelectItem value="descontraido">Descontraído e Amigável</SelectItem>
              <SelectItem value="tecnico">Técnico e Especializado</SelectItem>
              <SelectItem value="inspiracional">Inspiracional e Motivador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FieldInput label="Site de referência" value={data.referenciaVisual} onChange={(v) => onChange("referenciaVisual", v)} placeholder="Cole um site que você admira (opcional)" tip="Usamos como referência de estilo" />
      </BriefingSection>

      {/* Section 6: Contato */}
      <BriefingSection
        icon={<Phone className="w-4 h-4" />}
        title="Contato e Conversão"
        required
        defaultOpen
        filled={hasSection(["telefone", "email"])}
      >
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Telefone / WhatsApp" value={data.telefone} onChange={(v) => onChange("telefone", v)} placeholder="(11) 99999-9999" />
          <FieldInput label="E-mail" value={data.email} onChange={(v) => onChange("email", v)} placeholder="contato@empresa.com" />
        </div>
        <FieldInput label="Endereço" value={data.endereco} onChange={(v) => onChange("endereco", v)} placeholder="Rua, número — Cidade/UF (opcional)" />
        <FieldInput label="Redes sociais" value={data.redesSociais} onChange={(v) => onChange("redesSociais", v)} placeholder="@suaempresa no Instagram, Facebook, LinkedIn" />
        <FieldInput label="Link do WhatsApp" value={data.linkWhatsapp} onChange={(v) => onChange("linkWhatsapp", v)} placeholder="https://wa.me/5511999999999" tip="Será usado no botão de CTA principal" />
      </BriefingSection>

      {/* Section 7: Extras */}
      <BriefingSection
        icon={<FileText className="w-4 h-4" />}
        title="Instruções Extras"
        filled={!!data.instrucoes.trim()}
      >
        <FieldTextarea
          label="Instruções adicionais"
          value={data.instrucoes}
          onChange={(v) => onChange("instrucoes", v)}
          placeholder="Mencione seções específicas que deseja, textos exatos, ou qualquer detalhe importante"
          rows={4}
          tip="Tudo que não se encaixa nas seções anteriores"
        />
      </BriefingSection>
    </div>
  );
}
