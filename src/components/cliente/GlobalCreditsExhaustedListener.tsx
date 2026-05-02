// @ts-nocheck
import { useEffect, useState } from "react";
import { InsufficientCreditsDialog } from "./InsufficientCreditsDialog";

/**
 * Mounted ONCE in ClienteLayout. Listens for the global "credits:insufficient"
 * window event and shows the upgrade dialog from anywhere in the app.
 *
 * To trigger it from any hook/component:
 *   window.dispatchEvent(new CustomEvent("credits:insufficient", { detail: { actionLabel: "...", creditCost: 30 } }));
 */
export function GlobalCreditsExhaustedListener() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<{ actionLabel?: string; creditCost?: number }>({});

  useEffect(() => {
    function handler(ev: Event) {
      const e = ev as CustomEvent;
      setDetail({
        actionLabel: e?.detail?.actionLabel,
        creditCost: e?.detail?.creditCost,
      });
      setOpen(true);
    }
    window.addEventListener("credits:insufficient", handler as EventListener);
    return () => window.removeEventListener("credits:insufficient", handler as EventListener);
  }, []);

  return (
    <InsufficientCreditsDialog
      open={open}
      onOpenChange={setOpen}
      actionLabel={detail.actionLabel}
      creditCost={detail.creditCost}
    />
  );
}
