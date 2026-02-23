import { Check, CheckCircle2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ApprovalSummaryProps {
  total: number;
  approved: number;
  changesRequested: number;
  rejected: number;
  onApproveAll: () => void;
  onApprovePending?: () => void;
}

export function ApprovalSummary({
  total,
  approved,
  changesRequested,
  rejected,
  onApproveAll,
  onApprovePending,
}: ApprovalSummaryProps) {
  const pending = total - approved - changesRequested - rejected;
  const progress = total > 0 ? (approved / total) * 100 : 0;
  const allDone = approved === total && total > 0;

  return (
    <div className="rounded-xl border p-4 space-y-3 bg-card">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Progresso de Aprovação</span>
          <span className="text-xs font-bold text-primary">{approved} de {total}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {pending > 0 && (
          <Badge variant="outline" className="text-[9px] gap-1 bg-muted text-muted-foreground">
            {pending} pendente{pending > 1 ? "s" : ""}
          </Badge>
        )}
        {approved > 0 && (
          <Badge variant="outline" className="text-[9px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> {approved} aprovado{approved > 1 ? "s" : ""}
          </Badge>
        )}
        {changesRequested > 0 && (
          <Badge variant="outline" className="text-[9px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
            <MessageSquare className="w-3 h-3" /> {changesRequested} alteraç{changesRequested > 1 ? "ões" : "ão"}
          </Badge>
        )}
        {rejected > 0 && (
          <Badge variant="outline" className="text-[9px] gap-1 bg-red-500/10 text-red-600 border-red-500/30">
            <X className="w-3 h-3" /> {rejected} rejeitado{rejected > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Batch actions */}
      {!allDone && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onApproveAll}>
            <Check className="w-3.5 h-3.5" /> Aprovar Todos
          </Button>
          {onApprovePending && pending > 0 && (
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={onApprovePending}>
              <Check className="w-3.5 h-3.5" /> Aprovar Pendentes ({pending})
            </Button>
          )}
        </div>
      )}
      {allDone && (
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-semibold">Todos os itens aprovados! ✓</span>
        </div>
      )}
    </div>
  );
}
