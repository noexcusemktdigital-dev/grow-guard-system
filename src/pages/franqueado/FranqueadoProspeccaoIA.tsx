import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const tipos = [
  { id: "abordagem", label: "Primeira Abordagem" },
  { id: "followup", label: "Follow-up" },
  { id: "reengajamento", label: "Reengajamento" },
  { id: "proposta", label: "Envio de Proposta" },
  { id: "copy_instagram", label: "Copy para Instagram" },
  { id: "copy_email", label: "Copy para E-mail" },
];

const exemplos: Record<string, string> = {
  abordagem: "Olá [Nome]! Tudo bem? Sou o Davi, da [Unidade Curitiba]. Vi que sua empresa tem um potencial incrível para crescer no digital. Posso te mostrar como podemos acelerar seus resultados em apenas 30 dias? Que tal agendarmos uma conversa rápida de 15 minutos?",
  followup: "Oi [Nome]! Passando para dar continuidade à nossa conversa. Preparei algumas ideias personalizadas para o [Empresa]. Posso te enviar? Tenho certeza que vai gostar!",
  reengajamento: "Oi [Nome]! Faz um tempo que não conversamos. Desde a última vez, desenvolvemos novas estratégias que estão gerando ótimos resultados para empresas do seu segmento. Quer saber mais?",
  proposta: "Olá [Nome]! Conforme combinamos, segue a proposta personalizada para o [Empresa]. Incluí tudo que discutimos, com condições especiais válidas até [Data]. Qualquer dúvida, estou à disposição!",
  copy_instagram: "🚀 Seu negócio merece mais visibilidade!\n\nDescubra como transformar seguidores em clientes com estratégias que realmente funcionam.\n\n✅ Mais alcance\n✅ Mais engajamento\n✅ Mais vendas\n\nFale com a gente e comece sua transformação digital hoje!\n\n#MarketingDigital #Resultados #Crescimento",
  copy_email: "Assunto: [Nome], seu plano de crescimento está pronto!\n\nOlá [Nome],\n\nAnalisamos o cenário atual do [Empresa] e identificamos oportunidades concretas de crescimento.\n\nNosso diagnóstico revelou:\n- [Ponto 1]\n- [Ponto 2]\n- [Ponto 3]\n\nGostaria de agendar uma apresentação dos resultados?\n\nAbraços,\nDavi | Unidade Curitiba",
};

export default function FranqueadoProspeccaoIA() {
  const [tipo, setTipo] = useState("abordagem");
  const [contexto, setContexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [gerando, setGerando] = useState(false);

  const gerar = () => {
    setGerando(true);
    setTimeout(() => {
      setResultado(exemplos[tipo] || exemplos.abordagem);
      setGerando(false);
    }, 800);
  };

  const copiar = () => {
    navigator.clipboard.writeText(resultado);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Prospecção IA" subtitle="Gere mensagens e abordagens com inteligência artificial" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Configurar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Mensagem</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contexto adicional (opcional)</label>
              <Textarea value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Ex: empresa de tecnologia, 50 funcionários, nunca investiu em marketing..." rows={4} />
            </div>
            <Button onClick={gerar} className="w-full" disabled={gerando}>
              {gerando ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {gerando ? "Gerando..." : "Gerar Mensagem"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="space-y-3">
                <div className="bg-muted/20 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed">{resultado}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copiar}><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</Button>
                  <Button variant="outline" size="sm" onClick={gerar}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerar</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Configure e clique em "Gerar Mensagem"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
