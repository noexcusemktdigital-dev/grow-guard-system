import { Bot, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClienteAgentesIA() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Agentes de IA"
        subtitle="Crie e gerencie seus agentes inteligentes"
        icon={<Bot className="w-5 h-5 text-primary" />}
      />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <Badge variant="outline" className="gap-1.5 mb-3 text-purple-400 border-purple-500/30">
            <Sparkles className="w-3 h-3" /> Em breve
          </Badge>
          <p className="text-sm font-medium">Configure seus agentes de IA</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Em breve você poderá criar agentes de IA personalizados para automatizar prospecção,
            atendimento e pós-venda via WhatsApp.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
