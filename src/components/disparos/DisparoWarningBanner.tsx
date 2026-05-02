import { memo } from "react";
import { AlertTriangle, ShieldAlert, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const DisparoWarningBanner = memo(function DisparoWarningBanner() {
  return (
    <Alert className="border-orange-500/40 bg-orange-500/5">
      <ShieldAlert className="h-5 w-5 text-orange-400" />
      <AlertTitle className="text-orange-400 font-semibold text-sm">
        ⚠️ Atenção: Risco de bloqueio pelo Meta/WhatsApp
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-1.5">
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Disparos em massa têm <strong className="text-orange-400">risco real de bloqueio</strong> permanente do número pelo Meta/WhatsApp</li>
          <li>Máximo de <strong>100 destinatários</strong> por disparo</li>
          <li>Intervalo automático entre envios para simular comportamento humano</li>
          <li>Não envie conteúdo spam, promocional excessivo ou sem consentimento</li>
          <li>Números novos (sem histórico de conversa) têm maior risco de denúncia</li>
        </ul>
        <a
          href="https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
        >
          <ExternalLink className="w-3 h-3" /> Boas práticas do WhatsApp Business
        </a>
      </AlertDescription>
    </Alert>
  );
});
