import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Globe, Search, MessageCircle, FileText, Zap, FileSpreadsheet,
  Copy, Upload, CheckCircle, AlertCircle, ArrowLeft, ArrowRight,
  ExternalLink, Send, Facebook
} from "lucide-react";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IntegrationSource {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  method: string;
  color: string;
  steps: { title: string; content: string; hasWebhook?: boolean; hasCode?: boolean; codeSnippet?: string }[];
}

const SOURCES: IntegrationSource[] = [
  {
    id: "site",
    name: "Site / Landing Page",
    icon: <Globe className="w-6 h-6" />,
    description: "Receba leads diretamente do formulário do seu site ou landing page",
    method: "Webhook direto",
    color: "text-blue-500",
    steps: [
      { title: "Copie a URL do webhook", content: "Use a URL abaixo para receber leads automaticamente no CRM sempre que alguém preencher o formulário do seu site.", hasWebhook: true },
      { title: "Adicione ao seu site", content: "No código do formulário do seu site, envie um POST para a URL copiada quando o formulário for submetido. Veja o exemplo abaixo:", hasCode: true, codeSnippet: `fetch("SUA_URL_WEBHOOK", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Nome do Lead",
    email: "email@exemplo.com",
    phone: "11999999999",
    company: "Empresa",
    source: "Site",
    value: 5000
  })
});` },
      { title: "Campos aceitos", content: "name (obrigatório), email, phone, company, source, value, tags (array). Envie quantos campos quiser — os não reconhecidos serão ignorados." },
      { title: "Teste a integração", content: "Clique no botão abaixo para enviar um lead de teste e verificar se tudo está funcionando corretamente." },
    ],
  },
  {
    id: "meta",
    name: "Meta Lead Ads",
    icon: <Facebook className="w-6 h-6" />,
    description: "Conecte formulários de lead do Facebook e Instagram Ads",
    method: "Webhook nativo",
    color: "text-blue-600",
    steps: [], // Custom UI rendered in dialog
  },
  {
    id: "google",
    name: "Google Ads",
    icon: <Search className="w-6 h-6" />,
    description: "Receba leads das extensões de formulário do Google Ads",
    method: "Via Zapier ou Make",
    color: "text-yellow-600",
    steps: [
      { title: "Por que usar Zapier/Make?", content: "As extensões de formulário do Google Ads não suportam webhook direto. Use o Zapier ou Make como intermediário para enviar os leads para o CRM." },
      { title: "Configure no Zapier ou Make", content: "1. Crie um novo Zap ou cenário\n2. Trigger: 'Nova resposta de Lead Form Extension (Google Ads)'\n3. Ação: 'Webhook POST'\n4. Cole a URL abaixo no campo de URL do webhook", hasWebhook: true },
      { title: "Mapeie os campos", content: "No Zapier/Make, mapeie os campos do formulário Google para o formato do webhook:\n\n• Nome → name\n• E-mail → email\n• Telefone → phone\n• Empresa → company\n\nDefina source como 'Google Ads'." },
      { title: "Teste a integração", content: "Ative o Zap/cenário e preencha o formulário de teste no Google Ads, ou envie um lead de teste clicando abaixo." },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: <MessageCircle className="w-6 h-6" />,
    description: "Leads que chegam via WhatsApp pela integração Izitech",
    method: "Integração Izitech",
    color: "text-green-500",
    steps: [
      { title: "Integração automática", content: "Sua integração WhatsApp via Izitech já sincroniza contatos automaticamente. Todos os contatos que interagem no WhatsApp ficam disponíveis na aba 'Contatos' do CRM." },
      { title: "Converter contato em negociação", content: "Para transformar um contato do WhatsApp em um lead no pipeline:\n\n1. Acesse a aba 'Contatos' do CRM\n2. Encontre o contato desejado\n3. Clique em 'Criar negociação'\n\nO lead será criado automaticamente com os dados do contato." },
      { title: "Configurar instância WhatsApp", content: "Se ainda não configurou o WhatsApp, vá em Configurações > Integrações > WhatsApp e adicione sua instância Izitech." },
    ],
  },
  {
    id: "form",
    name: "Formulário Externo",
    icon: <FileText className="w-6 h-6" />,
    description: "Typeform, Google Forms, JotForm e outros formulários",
    method: "Webhook direto",
    color: "text-purple-500",
    steps: [
      { title: "Copie a URL do webhook", content: "Use a URL abaixo para receber leads de qualquer formulário externo que suporte webhooks.", hasWebhook: true },
      { title: "Configure no seu formulário", content: "Cada plataforma tem um local diferente para configurar webhooks:\n\n• Typeform: Configurações > Integrações > Webhooks\n• Google Forms: Use o add-on 'Form Notifications' ou Zapier\n• JotForm: Configurações > Integrações > Webhooks\n• Tally: Integrações > Webhook" },
      { title: "Mapeie os campos", content: "Configure o webhook para enviar os campos no formato JSON:\n\n• name (obrigatório)\n• email\n• phone\n• company\n• source (ex: 'Typeform')\n• value\n• tags (array)" },
      { title: "Teste a integração", content: "Preencha o formulário uma vez para testar, ou envie um lead de teste clicando abaixo." },
    ],
  },
  {
    id: "zapier",
    name: "Zapier / Make",
    icon: <Zap className="w-6 h-6" />,
    description: "Use plataformas de automação como intermediário universal",
    method: "Webhook + automação",
    color: "text-orange-500",
    steps: [
      { title: "Crie um Zap ou cenário", content: "Acesse zapier.com ou make.com e crie uma nova automação.\n\nEscolha o trigger que desejar (ex: nova resposta em formulário, novo e-mail, novo registro em planilha, etc.)" },
      { title: "Adicione a ação Webhook", content: "Na etapa de ação, escolha 'Webhooks by Zapier' (POST) ou módulo 'HTTP' no Make. Cole a URL abaixo:", hasWebhook: true },
      { title: "Mapeie os campos", content: "Configure o body da requisição com os campos mapeados:\n\n{\n  \"name\": \"{{Nome}}\",\n  \"email\": \"{{Email}}\",\n  \"phone\": \"{{Telefone}}\",\n  \"source\": \"Zapier\",\n  \"company\": \"{{Empresa}}\"\n}" },
      { title: "Teste e ative", content: "Teste o Zap/cenário para verificar se o lead chega corretamente. Depois, ative a automação." },
    ],
  },
  {
    id: "csv",
    name: "Importar Planilha",
    icon: <FileSpreadsheet className="w-6 h-6" />,
    description: "Importe leads em massa via arquivo CSV",
    method: "Upload manual",
    color: "text-emerald-500",
    steps: [],
  },
];

export function CrmIntegrationHub() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: orgId } = useUserOrgId();
  const { createLead } = useCrmLeadMutations();
  const { data: funnels } = useCrmFunnels();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sendingTest, setSendingTest] = useState(false);

  // CSV state
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [metaConfig, setMetaConfig] = useState({
    funnel_id: "",
    default_stage: "novo",
    field_mapping: {
      name: "full_name",
      email: "email",
      phone: "phone_number",
      company: "company_name",
    }
  });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook/${orgId}` : "Carregando...";

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL copiada!" });
  };

  const sendTestLead = async () => {
    if (!orgId) return;
    setSendingTest(true);
    try {
      await createLead.mutateAsync({
        name: "Lead de Teste",
        email: "teste@exemplo.com",
        phone: "11999999999",
        company: "Empresa Teste",
        source: "Teste de Integração",
        stage: "novo",
      });
      toast({ title: "Lead de teste enviado com sucesso!", description: "Verifique o pipeline do CRM." });
    } catch {
      toast({ title: "Erro ao enviar lead de teste", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  // CSV handlers
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast({ title: "CSV vazio ou inválido", variant: "destructive" }); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
        return obj;
      });
      setCsvData(rows);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0, errors = 0;
    for (const row of csvData) {
      try {
        await createLead.mutateAsync({
          name: row.nome || row.name || "Sem nome",
          email: row.email || undefined,
          phone: row.telefone || row.phone || undefined,
          company: row.empresa || row.company || undefined,
          source: row.origem || row.source || "CSV",
          value: row.valor || row.value ? parseFloat(row.valor || row.value) : undefined,
          stage: "novo",
        });
        success++;
      } catch { errors++; }
    }
    setImportResult({ success, errors });
    setCsvData([]);
    setImporting(false);
    toast({ title: `Importação concluída`, description: `${success} leads criados${errors > 0 ? `, ${errors} erros` : ""}` });
  };

  const source = SOURCES.find(s => s.id === selectedSource);
  const isLastStep = source ? currentStep >= source.steps.length - 1 : false;

  const openSource = (id: string) => {
    if (id === "csv") {
      setShowCsvDialog(true);
      return;
    }
    if (id === "meta") {
      // Detectar contexto de portal e navegar para a página dedicada
      const path = window.location.pathname;
      const base = path.startsWith("/franqueadora") ? "/franqueadora"
        : path.startsWith("/franqueado") ? "/franqueado"
        : "/cliente";
      navigate(`${base}/crm/integracoes/meta-lead-ads`);
      return;
    }
    setSelectedSource(id);
    setCurrentStep(0);
  };

  const closeSource = () => {
    setSelectedSource(null);
    setCurrentStep(0);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Educational block */}
      <Card className="border-emerald-200/30 bg-emerald-500/[0.03]">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium">Centralize todos os seus leads em um só lugar</p>
              <p className="text-[11px] text-muted-foreground">
                Configure integrações para que leads de qualquer origem — site, redes sociais, formulários ou WhatsApp — cheguem automaticamente ao seu CRM. Assim você não perde nenhuma oportunidade.
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Escolha abaixo de onde vêm seus leads e siga o passo a passo 👇</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SOURCES.map((s) => (
          <Card
            key={s.id}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => openSource(s.id)}
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                  {s.icon}
                </div>
                <Badge variant="outline" className="text-[10px]">{s.method}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tutorial Dialog */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && closeSource()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {source && <span className={source.color}>{source.icon}</span>}
              {source?.name}
            </DialogTitle>
            <DialogDescription>{source?.description}</DialogDescription>
          </DialogHeader>

          {source?.id === "meta" && (
            <div className="space-y-4">
              {/* Passo 1 — URL do Webhook */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] h-5">1</Badge>
                  <span className="text-sm font-medium">URL do Webhook</span>
                </div>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="text-xs font-mono" />
                  <Button size="sm" variant="outline" onClick={copyUrl} aria-label="Copiar"><Copy className="w-3.5 h-3.5" /></Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cole esta URL em <strong>Meta Business Suite → Gerenciador de Anúncios → Formulários de Lead → Integrações → Webhook</strong>.
                </p>
              </div>

              {/* Passo 2 — Mapear campos */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] h-5">2</Badge>
                  <span className="text-sm font-medium">Mapeie os campos do formulário</span>
                </div>
                <p className="text-[11px] text-muted-foreground">O webhook aceita os seguintes campos JSON:</p>
                <div className="space-y-1">
                  {[
                    ["name", "Nome completo", true],
                    ["email", "E-mail", false],
                    ["phone", "Telefone", false],
                    ["company", "Empresa", false],
                    ["source", "Origem (ex: Meta Ads)", false],
                    ["funnel_id", "ID do funil de destino", false],
                  ].map(([key, desc, req]) => (
                    <div key={key as string} className="flex items-center gap-2 text-[11px]">
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">{key as string}</code>
                      <span className="text-muted-foreground flex-1">{desc as string}</span>
                      {req && <Badge variant="destructive" className="text-[9px] h-4 px-1.5">obrigatório</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Passo 3 — Funil destino opcional */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] h-5">3</Badge>
                  <span className="text-sm font-medium">Funil de destino (opcional)</span>
                </div>
                <Select value={metaConfig.funnel_id} onValueChange={v => setMetaConfig(p => ({ ...p, funnel_id: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Padrão (funil principal)" /></SelectTrigger>
                  <SelectContent>
                    {(funnels || []).map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {metaConfig.funnel_id && (
                  <p className="text-[10px] text-muted-foreground">
                    Adicione <code className="font-mono">funnel_id: "{metaConfig.funnel_id}"</code> no payload para direcionar leads a este funil.
                  </p>
                )}
              </div>

              {/* Passo 4 — Testar */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] h-5">4</Badge>
                  <span className="text-sm font-medium">Enviar lead de teste</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={sendTestLead} disabled={sendingTest} className="gap-1.5">
                    {sendingTest && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    <Send className="w-3.5 h-3.5" /> Enviar lead de teste
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Cria um lead de teste no CRM para validar a integração.</p>
              </div>

              {/* Alternativa Zapier/Make */}
              <div className="p-3 rounded-lg border border-dashed bg-muted/10">
                <p className="text-[11px] text-muted-foreground">
                  💡 Prefere usar <strong>Zapier</strong> ou <strong>Make</strong>? Use a mesma URL acima como destino do webhook no seu cenário.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button size="sm" variant="outline" onClick={closeSource}>Concluir</Button>
              </div>
            </div>
          )}

          {source && source.steps.length > 0 && (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-1">
                {source.steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentStep ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>

              {/* Step content */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px]">Passo {currentStep + 1}/{source.steps.length}</Badge>
                  <span className="text-sm font-medium">{source.steps[currentStep].title}</span>
                </div>

                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {source.steps[currentStep].content}
                </p>

                {/* Webhook URL */}
                {source.steps[currentStep].hasWebhook && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Sua URL de webhook:</label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="text-xs font-mono" />
                      <Button size="sm" variant="outline" onClick={copyUrl} aria-label="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Code snippet */}
                {source.steps[currentStep].hasCode && source.steps[currentStep].codeSnippet && (
                  <pre className="bg-muted p-3 rounded text-[10px] font-mono overflow-x-auto">
                    {source.steps[currentStep].codeSnippet}
                  </pre>
                )}

                {/* Test button on last step */}
                {isLastStep && source.id !== "whatsapp" && (
                  <Button size="sm" className="gap-1.5" onClick={sendTestLead} disabled={sendingTest}>
                    <Send className="w-3.5 h-3.5" />
                    {sendingTest ? "Enviando..." : "Enviar lead de teste"}
                  </Button>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Anterior
                </Button>
                {!isLastStep ? (
                  <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                    Próximo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={closeSource}>
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              Importar Planilha CSV
            </DialogTitle>
            <DialogDescription>
              Faça upload de um CSV com colunas: nome, email, telefone, empresa, origem, valor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvUpload} className="hidden" />
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> Selecionar arquivo
            </Button>

            {csvData.length > 0 && (
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">{csvData.length} leads encontrados</Badge>
                <div className="max-h-40 overflow-auto border rounded p-2">
                  {csvData.slice(0, 5).map((row, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground truncate">
                      {row.nome || row.name} · {row.email} · {row.telefone || row.phone}
                    </p>
                  ))}
                  {csvData.length > 5 && <p className="text-[10px] text-muted-foreground">... e mais {csvData.length - 5}</p>}
                </div>
                <Button size="sm" onClick={handleImport} disabled={importing}>
                  {importing ? "Importando..." : `Importar ${csvData.length} leads`}
                </Button>
              </div>
            )}

            {importResult && (
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-3 h-3" /> {importResult.success} sucesso
                </span>
                {importResult.errors > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3 h-3" /> {importResult.errors} erros
                  </span>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
