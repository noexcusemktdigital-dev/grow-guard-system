import { Link } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function ClienteIntegracoes() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Integrações" subtitle="Conecte ferramentas externas" icon={<Link className="w-5 h-5 text-primary" />} />
      <Card><CardContent className="py-12 text-center text-muted-foreground">Em breve — integrações com WhatsApp, Google, Meta e mais.</CardContent></Card>
    </div>
  );
}
