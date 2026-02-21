import { Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function ClienteConfiguracoes() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Configurações" subtitle="Preferências da conta" icon={<Settings className="w-5 h-5 text-primary" />} />
      <Card><CardContent className="py-12 text-center text-muted-foreground">Em breve — perfil, notificações e preferências.</CardContent></Card>
    </div>
  );
}
