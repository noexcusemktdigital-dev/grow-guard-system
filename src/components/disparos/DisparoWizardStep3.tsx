import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, MessageSquare, Image } from "lucide-react";

interface Props {
  recipientCount: number;
  message: string;
  hasImage: boolean;
  delaySeconds: number;
  confirmed: boolean;
  onDelayChange: (v: number) => void;
  onConfirmChange: (v: boolean) => void;
}

export function DisparoWizardStep3({
  recipientCount,
  message,
  hasImage,
  delaySeconds,
  confirmed,
  onDelayChange,
  onConfirmChange,
}: Props) {
  const estimatedMinutes = Math.ceil((recipientCount * delaySeconds) / 60);

  return (
    <div className="space-y-5">
      {/* Delay config */}
      <div className="space-y-3">
        <Label className="text-xs">Intervalo entre envios: {delaySeconds}s</Label>
        <Slider
          min={5}
          max={15}
          step={1}
          value={[delaySeconds]}
          onValueChange={([v]) => onDelayChange(v)}
        />
        <p className="text-[10px] text-muted-foreground">
          Intervalo randomizado (±2s) para simular comportamento humano. Maior intervalo = menor risco.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Resumo do disparo</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold">{recipientCount}</p>
                <p className="text-[10px] text-muted-foreground">Destinatários</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold">~{estimatedMinutes}min</p>
                <p className="text-[10px] text-muted-foreground">Tempo estimado</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold">{message.length} chars</p>
                <p className="text-[10px] text-muted-foreground">Mensagem</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold">{hasImage ? "Sim" : "Não"}</p>
                <p className="text-[10px] text-muted-foreground">Imagem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 p-3 border border-orange-500/30 bg-orange-500/5 rounded-lg cursor-pointer">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(v) => onConfirmChange(!!v)}
          className="mt-0.5"
        />
        <div>
          <p className="text-xs font-medium">Entendo os riscos de bloqueio e assumo a responsabilidade</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Ao confirmar, você reconhece que disparos em massa podem resultar em bloqueio permanente do seu número pelo Meta/WhatsApp.
          </p>
        </div>
      </label>
    </div>
  );
}
