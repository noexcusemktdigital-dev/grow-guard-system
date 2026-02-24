import { PageHeader } from "@/components/PageHeader";
import { ClipboardCheck } from "lucide-react";

export default function FranqueadoEstrategia() {
  return (
    <div className="w-full space-y-6">
      <PageHeader title="Criador de Estratégia" subtitle="Diagnóstico profundo e criação de estratégia comercial" />
      <div className="text-center py-16">
        <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Nenhuma estratégia criada</p>
        <p className="text-xs text-muted-foreground mt-1">O módulo completo será implementado na próxima etapa.</p>
      </div>
    </div>
  );
}
