import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AssessoriaTeamBanner } from "./AssessoriaTeamBanner";

interface AssessoriaPopupProps {
  storageKey: string;
  servico?: string;
}

export function AssessoriaPopup({ storageKey, servico }: AssessoriaPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const jaViu = localStorage.getItem(storageKey);
    if (!jaViu) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-6">
          <AssessoriaTeamBanner servico={servico} />
        </div>

        <div className="px-6 pb-5 border-t border-border/40 pt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Você pode acessar essa informação a qualquer momento.
          </p>
          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors shrink-0"
          >
            Fechar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
