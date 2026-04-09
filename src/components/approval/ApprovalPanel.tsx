// @ts-nocheck
import { useState } from "react";
import { Check, CheckCircle2, MessageSquare, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type ApprovalStatus = "pending" | "approved" | "changes_requested" | "rejected";

interface ApprovalPanelProps {
  status: ApprovalStatus;
  onApprove: () => void;
  onRequestChanges: (note: string) => void;
  onReject?: () => void;
  changeNote?: string;
  showReject?: boolean;
  helpText?: string;
}

const statusConfig: Record<ApprovalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: null },
  approved: { label: "Aprovado", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  changes_requested: { label: "Alteração Solicitada", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: <X className="w-3.5 h-3.5" /> },
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const cfg = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[9px] gap-1 ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

export function ApprovalPanel({
  status,
  onApprove,
  onRequestChanges,
  onReject,
  changeNote,
  showReject = true,
  helpText = "Ao aprovar, este conteúdo está pronto para publicação/uso.",
}: ApprovalPanelProps) {
  const [showChangeField, setShowChangeField] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmitChange = () => {
    if (!note.trim()) return;
    onRequestChanges(note.trim());
    setNote("");
    setShowChangeField(false);
  };

  return (
    <div className="rounded-xl border p-4 space-y-3 bg-card">
      {/* Current status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <ApprovalStatusBadge status={status} />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-muted-foreground/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              <p className="text-xs">{helpText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Change note display */}
      {status === "changes_requested" && changeNote && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
          <p className="text-[10px] font-semibold text-amber-600 mb-1">Alteração solicitada:</p>
          <p className="text-xs text-muted-foreground">{changeNote}</p>
        </div>
      )}

      {/* Change note input */}
      {showChangeField && (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Descreva o que gostaria de alterar..."
            rows={3}
            className="text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 text-xs gap-1" onClick={handleSubmitChange} disabled={!note.trim()}>
              <MessageSquare className="w-3.5 h-3.5" /> Enviar Solicitação
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setShowChangeField(false); setNote(""); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showChangeField && (
        <div className="flex gap-2">
          {status !== "approved" ? (
            <Button size="sm" className="flex-1 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onApprove}>
              <Check className="w-3.5 h-3.5" /> Aprovar
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs text-emerald-600 border-emerald-500/30" disabled>
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado ✓
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/5"
            onClick={() => setShowChangeField(true)}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Solicitar Alteração
          </Button>

          {showReject && onReject && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-500/30 hover:bg-red-500/5">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rejeitar conteúdo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Este conteúdo será marcado como rejeitado e não será utilizado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onReject} className="bg-red-600 hover:bg-red-700">
                    Rejeitar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
