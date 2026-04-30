import { AlertOctagon } from "lucide-react";
import { Link } from "react-router-dom";
import { useFeatureGate } from "@/contexts/FeatureGateContext";

export function PaymentBlockedBanner() {
  const { isPaymentBlocked } = useFeatureGate();
  if (!isPaymentBlocked) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shrink-0 border-b border-red-700">
      <AlertOctagon className="w-5 h-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          Acesso suspenso por pagamento em atraso
        </p>
        <p className="text-xs text-red-100 leading-tight mt-0.5">
          Regularize sua mensalidade para restaurar o acesso completo à plataforma.
        </p>
      </div>
      <Link
        to="/cliente/plano-creditos"
        className="shrink-0 bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        Regularizar agora →
      </Link>
    </div>
  );
}
