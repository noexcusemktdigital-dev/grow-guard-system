import { MessageCircle, Zap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ClienteChat() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Chat WhatsApp"
        subtitle="Central de atendimento integrada ao WhatsApp"
        icon={<MessageCircle className="w-5 h-5 text-primary" />}
      />

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <Badge variant="outline" className="gap-1.5 mb-3 text-emerald-400 border-emerald-500/30">
            <Zap className="w-3 h-3" /> Em breve
          </Badge>
          <p className="text-sm font-medium">Chat integrado em desenvolvimento</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Em breve você poderá gerenciar todas as suas conversas do WhatsApp diretamente por aqui,
            com atendimento humano e IA integrados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
