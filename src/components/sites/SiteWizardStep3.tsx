import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BriefingData {
  servicos: string;
  diferencial: string;
  depoimentos: string;
  contato: string;
  instrucoes: string;
  estrategia: Record<string, any> | null;
  persona: { nome: string; descricao: string } | null;
  identidade: { paleta: string; fontes: string; estilo: string; tom_visual: string } | null;
}

interface Props {
  data: BriefingData;
  onChange: (field: keyof BriefingData, value: string) => void;
}

function BriefingBlock({ label, value, onChange, filled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  filled: boolean;
}) {
  return (
    <Card className={`border ${filled ? "border-border" : "border-destructive/30 bg-destructive/5"}`}>
      <CardContent className="py-3">
        <div className="flex items-center gap-2 mb-1.5">
          {filled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          )}
          <Label className="text-[10px] font-bold uppercase tracking-wider">{label}</Label>
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="text-xs resize-none"
          placeholder={!filled ? "Preencha para um resultado melhor..." : ""}
        />
      </CardContent>
    </Card>
  );
}

export function SiteWizardStep3({ data, onChange }: Props) {
  const filledCount = [data.servicos, data.diferencial, data.depoimentos, data.contato]
    .filter((v) => v.trim().length > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Dados coletados automaticamente da sua base</p>
        <Badge variant="outline" className="text-[9px]">{filledCount}/4 campos</Badge>
      </div>

      {data.estrategia && Object.keys(data.estrategia).length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Estratégia de Marketing</Label>
              <Badge className="text-[8px] ml-auto">Auto</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {Object.keys(data.estrategia).length} respostas carregadas do seu plano de marketing
            </p>
          </CardContent>
        </Card>
      )}

      {data.persona && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Persona</Label>
              <Badge className="text-[8px] ml-auto">Auto</Badge>
            </div>
            <p className="text-xs font-medium">{data.persona.nome}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{data.persona.descricao}</p>
          </CardContent>
        </Card>
      )}

      {data.identidade && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Identidade Visual</Label>
              <Badge className="text-[8px] ml-auto">Auto</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cores: {data.identidade.paleta || "—"} · Fontes: {data.identidade.fontes || "—"}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <BriefingBlock label="Serviços / Produtos" value={data.servicos} onChange={(v) => onChange("servicos", v)} filled={!!data.servicos.trim()} />
        <BriefingBlock label="Diferencial" value={data.diferencial} onChange={(v) => onChange("diferencial", v)} filled={!!data.diferencial.trim()} />
        <BriefingBlock label="Depoimentos" value={data.depoimentos} onChange={(v) => onChange("depoimentos", v)} filled={!!data.depoimentos.trim()} />
        <BriefingBlock label="Contato" value={data.contato} onChange={(v) => onChange("contato", v)} filled={!!data.contato.trim()} />
      </div>

      <div>
        <Label className="text-[10px] font-bold uppercase tracking-wider">Instruções Adicionais</Label>
        <Textarea
          value={data.instrucoes}
          onChange={(e) => onChange("instrucoes", e.target.value)}
          rows={3}
          className="mt-1.5 text-xs resize-none"
          placeholder="Qualquer detalhe extra que queira incluir no site..."
        />
      </div>
    </div>
  );
}
