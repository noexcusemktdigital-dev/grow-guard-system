import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, RefreshCw, Lightbulb, Target, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FranqueadoProspeccaoIA() {
  const [regiao, setRegiao] = useState("");
  const [nicho, setNicho] = useState("");
  const [gerandoPlano, setGerandoPlano] = useState(false);
  const [planoGerado, setPlanoGerado] = useState(false);

  const gerarPlano = () => {
    if (!regiao.trim() || !nicho.trim()) { toast.error("Preencha região e nicho"); return; }
    setGerandoPlano(true);
    setTimeout(() => { setPlanoGerado(true); setGerandoPlano(false); toast.success("Plano gerado com IA!"); }, 1500);
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Prospecção IA" subtitle="Planeje prospecções e gere scripts comerciais com IA" />

      <Tabs defaultValue="planejamento">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planejamento"><Lightbulb className="w-4 h-4 mr-1" /> Planejamento</TabsTrigger>
          <TabsTrigger value="script"><MessageSquare className="w-4 h-4 mr-1" /> Script Comercial</TabsTrigger>
        </TabsList>

        <TabsContent value="planejamento" className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Configurar Prospecção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Região</label><Input value={regiao} onChange={e => setRegiao(e.target.value)} placeholder="Ex: Curitiba e região" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nicho</label><Input value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ex: Clínicas de estética" /></div>
              </div>
              <Button onClick={gerarPlano} className="w-full" disabled={gerandoPlano}>
                {gerandoPlano ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {gerandoPlano ? "Gerando..." : "Gerar Plano de Prospecção"}
              </Button>
            </CardContent>
          </Card>

          {planoGerado && (
            <Card className="glass-card">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">O plano de prospecção será gerado com IA quando a integração estiver ativa. Configure a IA no painel de administração.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="script" className="space-y-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Scripts comerciais gerados por IA estarão disponíveis em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
