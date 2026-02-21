import { useState } from "react";
import { Bot, Copy, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const agents = {
  vendas: [
    { id: "v1", name: "Gerador de Mensagens", desc: "Crie mensagens de abordagem para leads" },
    { id: "v2", name: "Quebra de Objeções", desc: "Respostas inteligentes para objeções comuns" },
  ],
  marketing: [
    { id: "m1", name: "Criador de Copy", desc: "Textos persuasivos para anúncios e posts" },
    { id: "m2", name: "Gerador de Headlines", desc: "Títulos chamativos para campanhas" },
  ],
  gestao: [
    { id: "g1", name: "Plano Estratégico", desc: "Crie estratégias de crescimento" },
    { id: "g2", name: "Análise de Cenário", desc: "Avaliação de mercado e concorrência" },
  ],
};

function AgentCard({ agent }: { agent: { id: string; name: string; desc: string } }) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  const generate = () => {
    if (!prompt.trim()) return;
    setResult(`[Resultado gerado pela IA]\n\nBaseado no seu prompt: "${prompt}"\n\nAqui está uma sugestão estratégica completa que pode ser personalizada e adaptada ao seu contexto específico. Esta funcionalidade será integrada com IA real em breve.`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">{agent.name}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{agent.desc}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea placeholder="Descreva o que você precisa..." value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} />
        <Button size="sm" className="w-full" onClick={generate}><Send className="w-3 h-3 mr-1" /> Gerar</Button>
        {result && (
          <div className="relative">
            <div className="bg-muted/30 p-4 rounded-xl text-sm whitespace-pre-wrap">{result}</div>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { navigator.clipboard.writeText(result); toast({ title: "Copiado!" }); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClienteAgentesIA() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Agentes de IA"
        subtitle="Inteligência artificial para vendas, marketing e gestão"
        icon={<Bot className="w-5 h-5 text-primary" />}
        badge="Beta"
      />

      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="gestao">Gestão</TabsTrigger>
        </TabsList>
        {Object.entries(agents).map(([key, list]) => (
          <TabsContent key={key} value={key} className="space-y-4 mt-4">
            {list.map(a => <AgentCard key={a.id} agent={a} />)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
