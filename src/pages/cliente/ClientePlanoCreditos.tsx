import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function ClientePlanoCreditos() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Plano & Créditos" subtitle="Gerencie sua assinatura" icon={<CreditCard className="w-5 h-5 text-primary" />} />
      <Card><CardContent className="py-12 text-center text-muted-foreground">Em breve — detalhes do plano, uso de créditos e upgrade.</CardContent></Card>
    </div>
  );
}
