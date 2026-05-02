import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";

/**
 * Banner não-intrusivo que aparece quando há update disponível.
 * User decide quando atualizar (evita interromper fluxo).
 */
export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Verificar update a cada hora
      r && setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-primary">
        <CardContent className="pt-6 space-y-3">
          {offlineReady && !needRefresh && (
            <>
              <p className="text-sm">App pronto para uso offline.</p>
              <Button size="sm" variant="ghost" onClick={() => setOfflineReady(false)}>
                <X className="h-4 w-4 mr-1" /> OK
              </Button>
            </>
          )}
          {needRefresh && (
            <>
              <p className="text-sm font-medium">Nova versão disponível</p>
              <p className="text-xs text-muted-foreground">Atualize para receber as últimas melhorias.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateServiceWorker(true)}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Atualizar agora
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
                  <X className="h-4 w-4 mr-1" /> Depois
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
