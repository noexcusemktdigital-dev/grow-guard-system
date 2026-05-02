// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Phone, MapPin, Users, Globe, Briefcase, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { toast } from "sonner";
import logoDark from "@/assets/NOE3.png";

const SEGMENTS = [
  { value: "servicos", label: "Serviços" },
  { value: "varejo", label: "Varejo / Loja" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "saude", label: "Saúde / Estética" },
  { value: "educacao", label: "Educação" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "industria", label: "Indústria" },
  { value: "construcao", label: "Construção" },
  { value: "financeiro", label: "Financeiro" },
  { value: "consultoria", label: "Consultoria" },
  { value: "imobiliario", label: "Imobiliário" },
  { value: "logistica", label: "Logística / Transporte" },
  { value: "outro", label: "Outro" },
];

const EMPLOYEE_OPTIONS = [
  { value: "1", label: "Só eu" },
  { value: "2-5", label: "2 a 5" },
  { value: "6-20", label: "6 a 20" },
  { value: "21-50", label: "21 a 50" },
  { value: "51-200", label: "51 a 200" },
  { value: "200+", label: "200+" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface StepConfig {
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { title: "Sua Empresa", subtitle: "Dados básicos do negócio", icon: Building2 },
  { title: "Localização e Contato", subtitle: "Como encontrar você", icon: MapPin },
  { title: "Sobre o Negócio", subtitle: "Nos conte mais sobre o que faz", icon: Briefcase },
];

export default function ClienteOnboardingCompany() {
  const navigate = useNavigate();
  const { data: org, update, isLoading } = useOrgProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    city: "",
    state: "",
    segment: "",
    product_types: "",
    employee_count: "",
    website: "",
  });

  // Pre-fill when org loads
  const [prefilled, setPrefilled] = useState(false);
  if (org && !prefilled) {
    const o = org as Record<string, any>;
    setForm(prev => ({
      ...prev,
      name: (o.name && !String(o.name).includes("'s Company")) ? String(o.name) : "",
      cnpj: String(o.cnpj || prev.cnpj || ""),
      phone: String(o.phone || prev.phone || ""),
      city: String(o.city || prev.city || ""),
      state: String(o.state || prev.state || ""),
      segment: String(o.segment || prev.segment || ""),
      product_types: Array.isArray(o.product_types) ? (o.product_types as string[]).join(", ") : String(prev.product_types || ""),
      employee_count: String(o.employee_count || prev.employee_count || ""),
      website: String(o.website || prev.website || ""),
    }));
    setPrefilled(true);
  }

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return form.name.trim().length >= 2;
    if (step === 1) return form.phone.trim().length >= 8;
    if (step === 2) return !!form.segment && !!form.employee_count;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const productTypesArray = form.product_types
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      await update.mutateAsync({
        name: form.name,
        cnpj: form.cnpj || undefined,
        phone: form.phone,
        city: form.city,
        state: form.state,
        segment: form.segment,
        product_types: productTypesArray,
        employee_count: form.employee_count,
        website: form.website || undefined,
        onboarding_completed: true,
      } as Record<string, unknown>);
      
      toast.success("Dados salvos! Agora vamos fazer o diagnóstico do seu negócio.");
      navigate("/cliente/gps-negocio");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err) || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step].icon;

  // Redirect if onboarding already completed
  useEffect(() => {
    if (!isLoading && org && (org as any).onboarding_completed === true) {
      navigate("/cliente/inicio", { replace: true });
    }
  }, [org, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-2 w-full max-w-md" />
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <img src={logoDark} alt="NoExcuse" className="h-8 object-contain" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Passo {step + 1} de {STEPS.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 max-w-lg mx-auto w-full">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-primary/10 shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Step header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <StepIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
                    <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
                  </div>
                </div>

                {/* Step 0: Company basics */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Nome da empresa *</Label>
                      <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Studio Design" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/80">CNPJ <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                      <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
                    </div>
                  </div>
                )}

                {/* Step 1: Location & contact */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Telefone / WhatsApp *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(11) 99999-9999" className="pl-10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-foreground/80">Cidade</Label>
                        <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="São Paulo" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground/80">Estado</Label>
                        <Select value={form.state} onValueChange={v => set("state", v)}>
                          <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                          <SelectContent>
                            {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Site <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://suaempresa.com.br" className="pl-10" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: About the business */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Segmento *</Label>
                      <Select value={form.segment} onValueChange={v => set("segment", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione o segmento" /></SelectTrigger>
                        <SelectContent>
                          {SEGMENTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Quantidade de funcionários *</Label>
                      <Select value={form.employee_count} onValueChange={v => set("employee_count", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/80">Principais produtos ou serviços <span className="text-muted-foreground text-xs">(separe por vírgula)</span></Label>
                      <Textarea
                        value={form.product_types}
                        onChange={e => set("product_types", e.target.value)}
                        placeholder="Ex: Consultoria financeira, Planejamento tributário, Assessoria contábil"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  {step > 0 ? (
                    <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                    </Button>
                  ) : <div />}

                  {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} className="bg-primary hover:bg-primary/90">
                      Continuar <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleFinish} disabled={!canAdvance() || saving} className="bg-primary hover:bg-primary/90">
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                      Finalizar e montar plano
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
