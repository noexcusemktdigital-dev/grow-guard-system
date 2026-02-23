import { useState } from "react";
import {
  DollarSign, Save, Edit3, Check, Sparkles, BookOpen, Target,
  Users, Globe, BarChart3, Zap, Eye, MousePointer, TrendingUp,
  CheckCircle2, PlayCircle, ExternalLink, ChevronRight,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ── Knowledge Base ── */
interface KBField {
  key: string;
  label: string;
  type: "text" | "textarea" | "checklist";
  value: string;
}

const initialFields: KBField[] = [
  { key: "publico", label: "Público-alvo Detalhado (idade, localização, interesses)", type: "textarea", value: "Empreendedores 30-55 anos, São Paulo e região, interessados em franquias, gestão empresarial, marketing digital" },
  { key: "orcamento", label: "Orçamento Mensal Disponível (R$)", type: "text", value: "5.000" },
  { key: "plataformas", label: "Plataformas de Interesse", type: "text", value: "Google, Meta, LinkedIn" },
  { key: "historico", label: "Histórico de Campanhas Anteriores", type: "textarea", value: "Meta Ads: 3 campanhas de leads com CPA médio de R$ 12\nGoogle Ads: Search Brand com CPC de R$ 1.50" },
  { key: "lps", label: "Páginas de Destino (URLs)", type: "textarea", value: "https://noexcuse.com.br/demo\nhttps://noexcuse.com.br/promo-marco" },
  { key: "pixels", label: "Pixel/Tags Instalados?", type: "text", value: "Meta Pixel: Sim | Google Tag: Sim | LinkedIn Insight: Não" },
  { key: "objetivos", label: "Objetivos de Negócio", type: "text", value: "Gerar 200 leads/mês, CPA máximo R$ 15" },
];

/* ── Platform campaigns ── */
interface CampaignSuggestion {
  platform: "Google" | "Meta" | "TikTok" | "LinkedIn";
  name: string;
  objective: string;
  audience: string;
  budget: string;
  copy: string;
  creative: string;
  kpis: { reach: string; clicks: string; cpc: string };
}

const mockCampaigns: CampaignSuggestion[] = [
  {
    platform: "Meta", name: "Leads — Franquias Interessados", objective: "Geração de Leads",
    audience: "Empreendedores 30-55 anos, interesse em franquias, gestão empresarial",
    budget: "R$ 2.000/mês", copy: "Triplique os resultados da sua franquia com IA. Agende uma demo gratuita!",
    creative: "Carrossel com 3 slides: Problema → Solução → CTA",
    kpis: { reach: "45.000", clicks: "1.350", cpc: "R$ 1.48" },
  },
  {
    platform: "Google", name: "Search — CRM Franquias", objective: "Conversão",
    audience: "Pessoas buscando 'crm franquia', 'gestão franquia', 'marketing franquia'",
    budget: "R$ 1.500/mês", copy: "CRM completo para franquias. Teste grátis por 14 dias.",
    creative: "Anúncio de texto responsivo + extensões de site",
    kpis: { reach: "12.000", clicks: "720", cpc: "R$ 2.08" },
  },
  {
    platform: "LinkedIn", name: "Awareness — Decisores", objective: "Reconhecimento de Marca",
    audience: "CEOs, Diretores e Gerentes de Franquias, empresas 50+ funcionários",
    budget: "R$ 1.000/mês", copy: "A gestão da sua rede de franquias precisa de IA. Descubra como.",
    creative: "Single Image Ad + Document Ad com whitepaper",
    kpis: { reach: "25.000", clicks: "500", cpc: "R$ 2.00" },
  },
  {
    platform: "TikTok", name: "Awareness — Jovens Empreendedores", objective: "Tráfego",
    audience: "Empreendedores 25-40 anos, interesse em negócios e tecnologia",
    budget: "R$ 500/mês", copy: "3 erros que todo franqueado comete (e como evitar). Link na bio!",
    creative: "Vídeo curto 15s — formato talking head + texto na tela",
    kpis: { reach: "80.000", clicks: "2.400", cpc: "R$ 0.21" },
  },
];

const platformIcons: Record<string, React.ReactNode> = {
  Google: <Globe className="w-5 h-5" />,
  Meta: <Users className="w-5 h-5" />,
  TikTok: <PlayCircle className="w-5 h-5" />,
  LinkedIn: <BarChart3 className="w-5 h-5" />,
};

const platformColors: Record<string, string> = {
  Google: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Meta: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TikTok: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LinkedIn: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

/* ── Tutorials ── */
interface Tutorial {
  platform: string;
  steps: string[];
  tips: string[];
  checklist: string[];
}

const tutorials: Tutorial[] = [
  {
    platform: "Meta",
    steps: ["Acesse o Gerenciador de Anúncios do Meta", "Clique em 'Criar' para nova campanha", "Selecione o objetivo (Leads, Tráfego, Conversão)", "Defina o público-alvo com interesses e comportamentos", "Configure o orçamento diário ou vitalício", "Crie o anúncio (imagem/vídeo + copy)", "Revise e publique a campanha"],
    tips: ["Use Lookalike de clientes existentes para melhor performance", "Teste pelo menos 3 criativos diferentes", "Comece com orçamento baixo e escale o que funciona"],
    checklist: ["Pixel Meta instalado no site", "Evento de conversão configurado", "Público-alvo definido", "Criativos aprovados", "Landing page testada"],
  },
  {
    platform: "Google",
    steps: ["Acesse o Google Ads (ads.google.com)", "Crie uma nova campanha Search", "Defina as palavras-chave alvo", "Escreva os anúncios responsivos (títulos + descrições)", "Configure extensões (sitelinks, callouts)", "Defina o orçamento e lances", "Ative a campanha e monitore"],
    tips: ["Use correspondência de frase para palavras-chave", "Adicione palavras-chave negativas desde o início", "Configure o acompanhamento de conversões"],
    checklist: ["Google Tag Manager instalado", "Conversão configurada no GA4", "Lista de palavras-chave negativas", "Anúncios responsivos criados", "Extensões configuradas"],
  },
  {
    platform: "TikTok",
    steps: ["Crie uma conta no TikTok Ads Manager", "Instale o pixel do TikTok no seu site", "Crie uma campanha com objetivo de Tráfego ou Conversão", "Defina a segmentação por idade, interesses e comportamento", "Faça upload do vídeo criativo (9:16, até 60s)", "Configure o orçamento e período", "Publique e acompanhe os resultados"],
    tips: ["Use vídeos nativos e autênticos (não polidos demais)", "Os primeiros 3 segundos são cruciais — comece com impacto", "Teste diferentes hooks e CTAs"],
    checklist: ["Pixel TikTok instalado", "Vídeo no formato 9:16", "CTA claro no vídeo e descrição", "Landing page mobile-first"],
  },
  {
    platform: "LinkedIn",
    steps: ["Acesse o Campaign Manager do LinkedIn", "Crie uma nova campanha com objetivo de Awareness ou Leads", "Segmente por cargo, setor, tamanho da empresa", "Escolha o formato (Single Image, Carousel, Document)", "Escreva o copy profissional e objetivo", "Defina orçamento e lances", "Publique e acompanhe métricas"],
    tips: ["Conteúdo educativo performa melhor que comercial", "Use Document Ads para distribuir whitepapers", "Segmente decisores (C-level, Diretores)"],
    checklist: ["LinkedIn Insight Tag instalado", "Formulário de Lead Gen configurado", "Criativo profissional aprovado", "Segmentação por cargo definida"],
  },
];

export default function ClienteTrafegoPago() {
  const [fields, setFields] = useState(initialFields);
  const [isEditing, setIsEditing] = useState(false);

  // Briefing
  const [objetivo, setObjetivo] = useState("Gerar 200 leads qualificados");
  const [promocoes, setPromocoes] = useState("20% off plano anual");
  const [orcamento, setOrcamento] = useState("5.000");

  const filledCount = fields.filter(f => f.value.trim()).length;

  const updateField = (key: string, value: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Tráfego Pago"
        subtitle="Base de conhecimento, campanhas e tutoriais por plataforma"
        icon={<DollarSign className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="campanhas" className="text-xs gap-1.5"><Zap className="w-3.5 h-3.5" /> Campanhas</TabsTrigger>
          <TabsTrigger value="tutoriais" className="text-xs gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> Tutoriais</TabsTrigger>
        </TabsList>

        {/* ═══ BASE ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{filledCount}/{fields.length} campos preenchidos</Badge>
            </div>
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
            {fields.map(f => (
              <Card key={f.key} className="glass-card">
                <CardContent className="py-4">
                  <Label className="text-xs font-medium">{f.label}</Label>
                  {isEditing ? (
                    f.type === "textarea" ? (
                      <Textarea value={f.value} onChange={e => updateField(f.key, e.target.value)} rows={3} className="mt-1.5" />
                    ) : (
                      <Input value={f.value} onChange={e => updateField(f.key, e.target.value)} className="mt-1.5" />
                    )
                  ) : (
                    <p className="text-sm mt-1.5 whitespace-pre-line">{f.value || <span className="text-muted-foreground italic">Não preenchido</span>}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ CAMPANHAS ═══ */}
        <TabsContent value="campanhas" className="space-y-5 mt-4">
          {/* Briefing */}
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <p className="section-label mb-3">BRIEFING MENSAL</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2"><Label className="text-xs">Objetivo do Mês</Label><Input value={objetivo} onChange={e => setObjetivo(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Promoções</Label><Input value={promocoes} onChange={e => setPromocoes(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs">Orçamento Total (R$)</Label><Input value={orcamento} onChange={e => setOrcamento(e.target.value)} /></div>
              </div>
              <Button className="w-full gap-2" onClick={() => toast({ title: "Campanhas geradas!", description: "4 estruturas de campanha criadas para Google, Meta, TikTok e LinkedIn." })}>
                <Sparkles className="w-4 h-4" /> Gerar Estrutura de Campanhas
              </Button>
            </CardContent>
          </Card>

          {/* Campaign cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {mockCampaigns.map(c => (
              <Card key={c.name} className={`glass-card hover-lift border-l-4 ${platformColors[c.platform].split(" ").find(s => s.startsWith("border-")) || ""}`}>
                <CardContent className="py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${platformColors[c.platform]}`}>
                        {platformIcons[c.platform]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{c.name}</p>
                        <Badge className={`text-[9px] mt-0.5 ${platformColors[c.platform]}`}>{c.platform}</Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{c.objective}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-muted/30 border">
                      <p className="text-[10px] font-medium text-muted-foreground">PÚBLICO</p>
                      <p className="text-xs mt-1">{c.audience}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border">
                      <p className="text-[10px] font-medium text-muted-foreground">COPY DO ANÚNCIO</p>
                      <p className="text-xs mt-1 italic">"{c.copy}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-muted/30 border">
                        <p className="text-[10px] font-medium text-muted-foreground">ORÇAMENTO</p>
                        <p className="text-sm font-bold mt-1">{c.budget}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border">
                        <p className="text-[10px] font-medium text-muted-foreground">CRIATIVO</p>
                        <p className="text-xs mt-1">{c.creative}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated KPIs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/20">
                      <Eye className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-bold">{c.kpis.reach}</p>
                      <p className="text-[9px] text-muted-foreground">Alcance</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/20">
                      <MousePointer className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-bold">{c.kpis.clicks}</p>
                      <p className="text-[9px] text-muted-foreground">Cliques</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/20">
                      <TrendingUp className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-bold">{c.kpis.cpc}</p>
                      <p className="text-[9px] text-muted-foreground">CPC Est.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ TUTORIAIS ═══ */}
        <TabsContent value="tutoriais" className="space-y-5 mt-4">
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-start gap-3">
              <PlayCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Guias Passo a Passo</p>
                <p className="text-xs text-muted-foreground mt-1">Aprenda a criar campanhas em cada plataforma com tutoriais práticos e checklists.</p>
              </div>
            </CardContent>
          </Card>

          {tutorials.map(t => (
            <Card key={t.platform} className="glass-card">
              <CardContent className="py-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-2.5 rounded-xl ${platformColors[t.platform]}`}>
                    {platformIcons[t.platform]}
                  </div>
                  <div>
                    <p className="text-sm font-bold">Como Criar Campanhas no {t.platform}</p>
                    <p className="text-[10px] text-muted-foreground">{t.steps.length} passos · {t.checklist.length} itens no checklist</p>
                  </div>
                </div>

                {/* Steps */}
                <p className="section-label mb-3">PASSO A PASSO</p>
                <div className="space-y-2 mb-5">
                  {t.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <p className="section-label mb-3">DICAS</p>
                <div className="space-y-2 mb-5">
                  {t.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-chart-blue/5 border border-chart-blue/10">
                      <Sparkles className="w-3.5 h-3.5 text-chart-blue mt-0.5 shrink-0" />
                      <p className="text-xs">{tip}</p>
                    </div>
                  ))}
                </div>

                {/* Checklist */}
                <p className="section-label mb-3">CHECKLIST DE CONFIGURAÇÃO</p>
                <div className="space-y-2">
                  {t.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <Checkbox id={`${t.platform}-${i}`} />
                      <Label htmlFor={`${t.platform}-${i}`} className="text-xs cursor-pointer">{item}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
