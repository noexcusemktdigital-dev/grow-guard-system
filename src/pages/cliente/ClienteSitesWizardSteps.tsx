// @ts-nocheck
import React from "react";
import { Check, Info, Globe, FileText, ShoppingCart, Briefcase, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ─── Site Types ────────────────────────────────────────────────────────────

export interface SiteTypeConfig {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  sections: string[];
  specificSteps: string[];
}

export const SITE_TYPES: SiteTypeConfig[] = [
  {
    id: "landing_page",
    label: "Landing Page de Captação",
    desc: "Página única focada em captar leads com formulário e CTA forte",
    icon: FileText,
    sections: ["hero", "problema", "solucao", "beneficios", "prova-social", "formulario", "cta-final", "footer"],
    specificSteps: ["oferta"],
  },
  {
    id: "institucional",
    label: "Site Institucional",
    desc: "Apresente sua empresa, equipe, serviços e valores",
    icon: Briefcase,
    sections: ["hero", "sobre", "equipe", "servicos", "valores", "contato", "footer"],
    specificSteps: ["equipe"],
  },
  {
    id: "vendas",
    label: "Site de Vendas",
    desc: "Foco total em conversão: produto, benefícios, preço e garantia",
    icon: ShoppingCart,
    sections: ["hero", "produto", "beneficios", "preco", "depoimentos", "garantia", "cta-final", "faq", "footer"],
    specificSteps: ["produto_vendas"],
  },
  {
    id: "portfolio",
    label: "Portfólio",
    desc: "Mostre seus trabalhos, projetos e processo criativo",
    icon: Globe,
    sections: ["hero", "projetos", "sobre", "processo", "contato", "footer"],
    specificSteps: ["projetos"],
  },
  {
    id: "link_bio",
    label: "Link na Bio",
    desc: "Página de links para redes sociais e contato rápido",
    icon: Link2,
    sections: ["hero", "links", "redes", "mini-sobre", "footer"],
    specificSteps: ["links_bio"],
  },
];

// ─── Steps config ──────────────────────────────────────────────────────────

export const BASE_STEPS = [
  { id: "tipo_site", label: "Tipo de Site" },
  { id: "empresa", label: "Empresa" },
  { id: "publico", label: "Público-alvo" },
  { id: "servicos", label: "Serviços & Diferenciais" },
  { id: "provas", label: "Prova Social" },
  { id: "contato", label: "Contato" },
  { id: "cta", label: "CTA" },
  { id: "estilo", label: "Estilo & Tom" },
  { id: "revisao", label: "Revisão" },
];

// Specific steps inserted after "empresa"
const SPECIFIC_STEP_MAP: Record<string, { id: string; label: string }> = {
  oferta: { id: "oferta", label: "Oferta & Formulário" },
  equipe: { id: "equipe", label: "Equipe & Missão" },
  produto_vendas: { id: "produto_vendas", label: "Produto & Preço" },
  projetos: { id: "projetos", label: "Projetos" },
  links_bio: { id: "links_bio", label: "Links" },
};

export function getStepsForType(siteTypeId: string) {
  const siteType = SITE_TYPES.find(t => t.id === siteTypeId);
  if (!siteType) return BASE_STEPS;

  const steps = [...BASE_STEPS];
  // Insert specific steps after "empresa" (index 1)
  const specificSteps = siteType.specificSteps.map(s => SPECIFIC_STEP_MAP[s]).filter(Boolean);
  steps.splice(2, 0, ...specificSteps);
  return steps;
}

// ─── Re-exported constants ─────────────────────────────────────────────────

export const SEGMENTO_OPTIONS = [
  { value: "consultoria", label: "Consultoria" },
  { value: "servicos", label: "Empresa de Serviços" },
  { value: "clinica", label: "Clínica / Saúde" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "franquia", label: "Franquia" },
  { value: "educacao", label: "Educação" },
  { value: "tecnologia", label: "Tecnologia" },
];

export const PUBLICO_CHIPS = [
  "Empresários", "Executivos C-Level", "Gestores de Marketing",
  "Profissionais de Saúde", "Profissionais Liberais", "Consumidores Finais",
  "PMEs", "Startups", "Produtores Rurais", "Estudantes",
];

export const PROVA_OPTIONS = [
  { value: "depoimentos", label: "Depoimentos de Clientes" },
  { value: "numeros", label: "Números da Empresa" },
  { value: "experiencia", label: "Anos de Experiência" },
  { value: "cases", label: "Cases de Sucesso" },
];

export const CTA_OPTIONS = [
  { value: "orcamento", label: "Pedir Orçamento" },
  { value: "whatsapp", label: "Falar no WhatsApp" },
  { value: "reuniao", label: "Agendar Reunião" },
  { value: "comprar", label: "Comprar Produto" },
];

export const ESTILO_OPTIONS = [
  { value: "moderno", label: "Moderno e Clean", desc: "Minimalismo sofisticado, espaço em branco, tipografia sans-serif" },
  { value: "corporativo", label: "Corporativo", desc: "Tons sóbrios, layout clássico, tipografia serifada" },
  { value: "ousado", label: "Ousado e Colorido", desc: "Cores vibrantes, gradientes, impactante" },
  { value: "minimalista", label: "Minimalista", desc: "Essencial, poucos elementos, elegante" },
  { value: "sofisticado", label: "Sofisticado / Premium", desc: "Dark mode, dourado, luxuoso" },
  { value: "tecnologico", label: "Tecnológico", desc: "Futurista, neon, grids geométricos" },
];

export const TOM_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Linguagem profissional e vocabulário técnico" },
  { value: "descontraido", label: "Descontraído", desc: "Linguagem leve e próxima do leitor" },
  { value: "tecnico", label: "Técnico", desc: "Foco em dados, especificações e autoridade" },
  { value: "inspiracional", label: "Inspiracional", desc: "Frases de impacto e storytelling emocional" },
];

// ─── Shared sub-components ─────────────────────────────────────────────────

export function ChipSelect({ options, selected, onToggle, multi = true }: {
  options: { value: string; label: string }[] | string[];
  selected: string[];
  onToggle: (v: string) => void;
  multi?: boolean;
}) {
  const items = typeof options[0] === "string"
    ? (options as string[]).map(s => ({ value: s, label: s }))
    : options as { value: string; label: string }[];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(o => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {active && <Check className="w-3 h-3 inline mr-1" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function AutoBadge({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
      <Info className="w-3 h-3 text-primary shrink-0" />
      <span className="font-medium text-foreground">{label}:</span>
      <span className="truncate max-w-[200px]">{value}</span>
    </div>
  );
}

// ─── Wizard Step Renderer ──────────────────────────────────────────────────

interface WizardStepContentProps {
  stepId: string;
  form: Record<string, any>;
  updateForm: (key: string, value: string | boolean | number) => void;
  toggleArray: (key: string, value: string) => void;
  strategyAnswers: Record<string, any>;
  approvedContents: Array<{ id: string; title: string }>;
  viPalette: string | undefined;
  viFonts: string | undefined;
  viStyle: string | undefined;
  whatsappLink: string;
  qualityFields: { fields: { label: string; value: string }[]; filled: number; total: number };
}

export function WizardStepContent({
  stepId, form, updateForm, toggleArray, strategyAnswers,
  approvedContents, viPalette, viFonts, viStyle, whatsappLink, qualityFields,
}: WizardStepContentProps) {
  switch (stepId) {
    // ── TYPE SELECTION (new first step)
    case "tipo_site":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Qual tipo de site você precisa? Isso define a estrutura e as seções.</p>
          <div className="grid gap-3">
            {SITE_TYPES.map(t => {
              const Icon = t.icon;
              const active = form.tipo_site === t.id;
              return (
                <button key={t.id} onClick={() => updateForm("tipo_site", t.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.sections.map(s => (
                        <Badge key={s} variant="outline" className="text-[9px] capitalize">{s.replace("-", " ")}</Badge>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );

    // ── EMPRESA
    case "empresa":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Informações básicas da sua empresa para personalizar o site.</p>
          <div>
            <label className="text-[11px] font-medium text-foreground">Nome da empresa *</label>
            <Input placeholder="Ex: Agência NoExcuse" value={form.nome_empresa} onChange={e => updateForm("nome_empresa", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Slogan / Tagline</label>
            <Input placeholder="Ex: Transformando negócios com marketing inteligente" value={form.slogan} onChange={e => updateForm("slogan", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Descrição do negócio</label>
            <Textarea placeholder="Descreva o que sua empresa faz. Esse texto será usado na seção 'Sobre' do site." value={form.descricao_negocio} onChange={e => updateForm("descricao_negocio", e.target.value)} rows={3} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Segmento</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SEGMENTO_OPTIONS.map(o => (
                <button key={o.value} onClick={() => updateForm("segmento", o.value)}
                  className={`p-2.5 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                    form.segmento === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}>{o.label}</button>
              ))}
            </div>
          </div>
          {strategyAnswers.empresa && <AutoBadge label="Da Estratégia" value={strategyAnswers.empresa} />}
        </div>
      );

    // ── SPECIFIC: Oferta & Formulário (Landing Page)
    case "oferta":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Detalhes da oferta e do formulário de captação.</p>
          <div>
            <label className="text-[11px] font-medium text-foreground">Qual é a oferta principal? *</label>
            <Input placeholder="Ex: Diagnóstico gratuito, E-book, Consultoria grátis" value={form.oferta_principal} onChange={e => updateForm("oferta_principal", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Lead magnet (isca digital)</label>
            <Textarea placeholder="O que o visitante recebe em troca dos dados? Ex: PDF com 10 dicas, acesso a vídeo exclusivo..." value={form.lead_magnet} onChange={e => updateForm("lead_magnet", e.target.value)} rows={2} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Campos do formulário</label>
            <Input placeholder="Ex: Nome, Email, Telefone, Empresa" value={form.campos_formulario} onChange={e => updateForm("campos_formulario", e.target.value)} className="mt-1" />
            <p className="text-[10px] text-muted-foreground mt-1">Separe por vírgula. Quanto menos campos, mais conversões.</p>
          </div>
        </div>
      );

    // ── SPECIFIC: Equipe & Missão (Institucional)
    case "equipe":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Informações sobre equipe e valores da empresa.</p>
          <div>
            <label className="text-[11px] font-medium text-foreground">História da empresa</label>
            <Textarea placeholder="Conte brevemente a história da empresa, quando foi fundada, motivação..." value={form.historia_empresa} onChange={e => updateForm("historia_empresa", e.target.value)} rows={3} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Membros da equipe</label>
            <Textarea placeholder="Nome — Cargo (um por linha)&#10;Ex: João Silva — CEO&#10;Maria Santos — Diretora de Marketing" value={form.membros_equipe} onChange={e => updateForm("membros_equipe", e.target.value)} rows={4} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Missão, Visão e Valores</label>
            <Textarea placeholder="Missão: ...&#10;Visão: ...&#10;Valores: ..." value={form.missao_visao} onChange={e => updateForm("missao_visao", e.target.value)} rows={3} className="mt-1" />
          </div>
        </div>
      );

    // ── SPECIFIC: Produto & Preço (Vendas)
    case "produto_vendas":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Detalhes do produto ou serviço que será vendido.</p>
          <div>
            <label className="text-[11px] font-medium text-foreground">Nome do produto/serviço *</label>
            <Input placeholder="Ex: Curso Completo de Marketing Digital" value={form.produto_nome} onChange={e => updateForm("produto_nome", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Preço</label>
            <Input placeholder="Ex: R$ 497 ou 12x de R$ 49,70" value={form.produto_preco} onChange={e => updateForm("produto_preco", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Garantia</label>
            <Input placeholder="Ex: 7 dias de garantia incondicional" value={form.produto_garantia} onChange={e => updateForm("produto_garantia", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Urgência / Escassez</label>
            <Input placeholder="Ex: Vagas limitadas, Oferta por tempo limitado" value={form.produto_urgencia} onChange={e => updateForm("produto_urgencia", e.target.value)} className="mt-1" />
          </div>
        </div>
      );

    // ── SPECIFIC: Projetos (Portfólio)
    case "projetos":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Descreva os projetos que deseja destacar.</p>
          <div>
            <label className="text-[11px] font-medium text-foreground">Quantos projetos destacar?</label>
            <Input type="number" min={1} max={12} placeholder="Ex: 6" value={form.num_projetos} onChange={e => updateForm("num_projetos", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Categorias de projeto</label>
            <Input placeholder="Ex: Branding, Web Design, Fotografia" value={form.categorias_projetos} onChange={e => updateForm("categorias_projetos", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Descreva seus principais projetos</label>
            <Textarea placeholder="Projeto 1: Nome — Descrição breve&#10;Projeto 2: Nome — Descrição breve" value={form.descricao_projetos} onChange={e => updateForm("descricao_projetos", e.target.value)} rows={4} className="mt-1" />
          </div>
        </div>
      );

    // ── SPECIFIC: Links (Link na Bio)
    case "links_bio":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Quais links e redes sociais devem aparecer?</p>
          <div>
            <label className="text-[11px] font-medium text-foreground">Links importantes (um por linha)</label>
            <Textarea placeholder="Nome do link — URL&#10;Ex: Meu curso — https://curso.com&#10;Minha loja — https://loja.com" value={form.links_lista} onChange={e => updateForm("links_lista", e.target.value)} rows={5} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Redes sociais (URLs)</label>
            <Textarea placeholder="Instagram: https://instagram.com/...&#10;TikTok: https://tiktok.com/...&#10;YouTube: https://youtube.com/..." value={form.redes_lista} onChange={e => updateForm("redes_lista", e.target.value)} rows={3} className="mt-1" />
          </div>
        </div>
      );

    // ── PÚBLICO
    case "publico":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Para quem o site é direcionado?</p>
          <ChipSelect options={PUBLICO_CHIPS} selected={form.publico_chips} onToggle={v => toggleArray("publico_chips", v)} />
          <Input placeholder="Outro público..." value={form.publico_custom} onChange={e => updateForm("publico_custom", e.target.value)} />
          <div>
            <label className="text-[11px] font-medium text-foreground">Principais dores / problemas do público</label>
            <Textarea placeholder="Ex: Dificuldade em gerar leads qualificados, processos desorganizados, falta de presença digital..." value={form.dores} onChange={e => updateForm("dores", e.target.value)} rows={3} className="mt-1" />
          </div>
          {strategyAnswers.publico && <AutoBadge label="Da Estratégia" value={strategyAnswers.publico} />}
          {strategyAnswers.problema && <AutoBadge label="Problema da Estratégia" value={strategyAnswers.problema} />}
        </div>
      );

    // ── SERVIÇOS
    case "servicos":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quais são os principais serviços ou produtos?</p>
            <Textarea placeholder="Liste seus serviços ou produtos principais..." value={form.servicos} onChange={e => updateForm("servicos", e.target.value)} rows={3} />
            {strategyAnswers.produto && <AutoBadge label="Da Estratégia" value={strategyAnswers.produto} />}
          </div>
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">O que torna sua empresa diferente?</p>
            <Textarea placeholder="Ex: Metodologia própria, tecnologia exclusiva, experiência de 15 anos..." value={form.diferenciais} onChange={e => updateForm("diferenciais", e.target.value)} rows={3} />
            {strategyAnswers.diferencial && <AutoBadge label="Da Estratégia" value={strategyAnswers.diferencial} />}
          </div>
          {approvedContents.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-[10px] text-muted-foreground font-medium mb-1">Conteúdos aprovados disponíveis ({approvedContents.length})</p>
              <div className="flex gap-1 flex-wrap">
                {approvedContents.slice(0, 3).map(c => (
                  <Badge key={c.id} variant="outline" className="text-[9px]">{c.title}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    // ── PROVAS
    case "provas":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Você possui algum desses elementos de prova social?</p>
          <ChipSelect options={PROVA_OPTIONS} selected={form.provas} onToggle={v => toggleArray("provas", v)} />
          {(form.provas as string[]).includes("depoimentos") && (
            <Textarea placeholder="Cole os depoimentos de clientes..." value={form.provas_depoimentos} onChange={e => updateForm("provas_depoimentos", e.target.value)} rows={3} />
          )}
          {(form.provas as string[]).includes("numeros") && (
            <Input placeholder="Ex: 500+ clientes, 98% satisfação, 10 anos no mercado" value={form.provas_numeros} onChange={e => updateForm("provas_numeros", e.target.value)} />
          )}
          {(form.provas as string[]).includes("cases") && (
            <Textarea placeholder="Descreva brevemente seus cases de sucesso..." value={form.provas_cases} onChange={e => updateForm("provas_cases", e.target.value)} rows={3} />
          )}
        </div>
      );

    // ── CONTATO
    case "contato":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Dados de contato reais para o site.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-foreground">Telefone</label>
              <Input placeholder="(11) 99999-9999" value={form.telefone} onChange={e => updateForm("telefone", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground">WhatsApp</label>
              <Input placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => updateForm("whatsapp", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Email</label>
            <Input placeholder="contato@empresa.com.br" value={form.email_contato} onChange={e => updateForm("email_contato", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-foreground">Endereço</label>
            <Input placeholder="Rua, número — Cidade/UF" value={form.endereco} onChange={e => updateForm("endereco", e.target.value)} className="mt-1" />
          </div>
          <div className="border-t pt-3">
            <p className="text-[11px] font-medium text-foreground mb-2">Redes Sociais</p>
            <div className="space-y-2">
              <Input placeholder="@seuinstagram" value={form.instagram} onChange={e => updateForm("instagram", e.target.value)} />
              <Input placeholder="facebook.com/suaempresa" value={form.facebook} onChange={e => updateForm("facebook", e.target.value)} />
              <Input placeholder="linkedin.com/company/suaempresa" value={form.linkedin} onChange={e => updateForm("linkedin", e.target.value)} />
            </div>
          </div>
          {whatsappLink && (
            <div className="bg-primary/10 rounded-lg p-2 text-[11px] text-primary">
              Link WhatsApp gerado: <span className="font-mono">{whatsappLink}</span>
            </div>
          )}
        </div>
      );

    // ── CTA
    case "cta":
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">O que você quer que o visitante faça no site?</p>
          <ChipSelect options={CTA_OPTIONS} selected={form.cta ? [form.cta] : []}
            onToggle={v => updateForm("cta", form.cta === v ? "" : v)} multi={false} />
          <button onClick={() => updateForm("cta", "outro")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              form.cta === "outro" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"
            }`}>Personalizado...</button>
          {form.cta === "outro" && (
            <Input placeholder="Ex: Agende uma demonstração" value={form.cta_custom} onChange={e => updateForm("cta_custom", e.target.value)} />
          )}
          {whatsappLink && form.cta === "whatsapp" && (
            <div className="bg-primary/10 rounded-lg p-2 text-[11px] text-primary">
              O CTA usará o WhatsApp configurado no passo anterior
            </div>
          )}
        </div>
      );

    // ── ESTILO
    case "estilo":
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Estilo visual do site</p>
            <div className="grid grid-cols-2 gap-2">
              {ESTILO_OPTIONS.map(o => (
                <button key={o.value} onClick={() => updateForm("estilo", o.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.estilo === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}>
                  <p className="text-xs font-bold">{o.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Tom de comunicação</p>
            <div className="grid grid-cols-2 gap-2">
              {TOM_OPTIONS.map(o => (
                <button key={o.value} onClick={() => updateForm("tom", o.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.tom === o.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}>
                  <p className="text-xs font-bold">{o.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t pt-3">
            <label className="text-[11px] font-medium text-foreground">URL de referência visual (opcional)</label>
            <Input placeholder="https://sitequeadmiro.com.br" value={form.referencia_url} onChange={e => updateForm("referencia_url", e.target.value)} className="mt-1" />
          </div>
          {viStyle && <AutoBadge label="Da Identidade Visual" value={viStyle} />}
          {viPalette && <AutoBadge label="Cores" value={viPalette} />}
          {viFonts && <AutoBadge label="Fontes" value={viFonts} />}
        </div>
      );

    // ── REVISÃO
    case "revisao":
      return <ReviewStep qualityFields={qualityFields} viPalette={viPalette} viFonts={viFonts} siteType={form.tipo_site} />;

    default:
      return null;
  }
}

// ─── Review step ───────────────────────────────────────────────────────────

interface ReviewStepProps {
  qualityFields: { fields: { label: string; value: string }[]; filled: number; total: number };
  viPalette: string | undefined;
  viFonts: string | undefined;
  siteType?: string;
}

function ReviewStep({ qualityFields, viPalette, viFonts, siteType }: ReviewStepProps) {
  const pct = Math.round((qualityFields.filled / qualityFields.total) * 100);
  const color = pct >= 80 ? "text-green-500" : pct >= 50 ? "text-yellow-500" : "text-destructive";
  const selectedType = SITE_TYPES.find(t => t.id === siteType);

  return (
    <div className="space-y-4">
      {selectedType && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <selectedType.icon className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">{selectedType.label}</p>
            <p className="text-[10px] text-muted-foreground">{selectedType.sections.length} seções</p>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium text-muted-foreground">Qualidade do briefing</span>
          <span className={`text-xs font-bold ${color}`}>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-[10px] text-muted-foreground">
          {pct >= 80 ? "Excelente! O site será bem direcionado." : pct >= 50 ? "Bom, mas campos adicionais melhoram o resultado." : "Preencha mais campos para um site de qualidade."}
        </p>
      </div>
      <div className="space-y-2">
        {qualityFields.fields.map(f => (
          <div key={f.label} className="flex items-center justify-between text-[11px] border-b border-border/50 pb-1">
            <span className="text-muted-foreground">{f.label}</span>
            {f.value ? (
              <span className="text-foreground font-medium truncate max-w-[180px] text-right">{f.value}</span>
            ) : (
              <span className="text-destructive/60 italic">Não preenchido</span>
            )}
          </div>
        ))}
      </div>
      {viPalette && <AutoBadge label="Cores da Identidade Visual" value={viPalette} />}
      {viFonts && <AutoBadge label="Fontes" value={viFonts} />}
    </div>
  );
}
