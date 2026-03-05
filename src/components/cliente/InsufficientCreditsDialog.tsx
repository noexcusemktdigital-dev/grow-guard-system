import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, Coins } from "lucide-react";

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel?: string;
  creditCost?: number;
}

export function InsufficientCreditsDialog({
  open,
  onOpenChange,
  actionLabel = "esta ação",
  creditCost,
}: InsufficientCreditsDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg">
              Créditos insuficientes
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            Você não possui créditos suficientes para aprovar {actionLabel}.
            {creditCost && (
              <span className="block mt-1 font-medium text-foreground">
                Custo: {creditCost.toLocaleString("pt-BR")} créditos
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate("/cliente/plano-creditos");
            }}
          >
            <CreditCard className="h-4 w-4" />
            Comprar Créditos
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate("/cliente/configuracoes?tab=plano");
            }}
          >
            <TrendingUp className="h-4 w-4" />
            Fazer Upgrade de Plano
          </Button>
        </div>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Helper to detect INSUFFICIENT_CREDITS errors from mutations */
export function isInsufficientCreditsError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("INSUFFICIENT_CREDITS") || msg.includes("Créditos insuficientes");
}
