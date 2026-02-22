import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, ClipboardCheck } from "lucide-react";

export default function FranqueadoDiagnostico() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Diagnóstico NOE" subtitle="Formulário estruturado de diagnóstico do cliente" />

      <div className="text-center py-16">
        <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Nenhum diagnóstico disponível</p>
        <p className="text-xs text-muted-foreground mt-1">O diagnóstico NOE será habilitado quando integrado ao CRM real.</p>
      </div>
    </div>
  );
}
