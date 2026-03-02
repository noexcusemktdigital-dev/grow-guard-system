import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Lock } from "lucide-react";

export default function ContratosConfiguracoes() {
  const { toast } = useToast();
  const [prefixo, setPrefixo] = useState("CTR-");
  const [sequencia, setSequencia] = useState(10);
  const [validadeMeses, setValidadeMeses] = useState(12);
  const [tipos, setTipos] = useState({ Assessoria: true, SaaS: true, Sistema: true, Franquia: true });
  const [recorrencias, setRecorrencias] = useState({ Mensal: true, Anual: true, "Unitária": true });
  const [obsPadrao, setObsPadrao] = useState("");

  function handleSave() {
    toast({ title: "Configurações salvas com sucesso!" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header-title">Configurações de Contratos</h1>
        <Badge variant="secondary" className="mt-1">Franqueadora (acesso total)</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Numeração Automática</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Prefixo</Label><Input value={prefixo} onChange={e => setPrefixo(e.target.value)} /></div>
            <div><Label>Próxima sequência</Label><Input type="number" value={sequencia} onChange={e => setSequencia(Number(e.target.value))} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Próximo contrato: <span className="font-mono font-bold">{prefixo}{String(sequencia).padStart(3, "0")}</span></p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Validade Padrão</h2>
          <div><Label>Validade (meses)</Label><Input type="number" value={validadeMeses} onChange={e => setValidadeMeses(Number(e.target.value))} /></div>
          <p className="text-xs text-muted-foreground">Novos contratos terão {validadeMeses} meses de vigência por padrão.</p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Tipos Habilitados</h2>
          {Object.entries(tipos).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <Checkbox checked={v} onCheckedChange={c => setTipos({ ...tipos, [k]: !!c })} />
              <Label>{k}</Label>
            </div>
          ))}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Recorrências Habilitadas</h2>
          {Object.entries(recorrencias).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <Checkbox checked={v} onCheckedChange={c => setRecorrencias({ ...recorrencias, [k]: !!c })} />
              <Label>{k}</Label>
            </div>
          ))}
        </Card>

        <Card className="p-6 space-y-4 md:col-span-2">
          <h2 className="font-semibold">Observação Padrão</h2>
          <Textarea value={obsPadrao} onChange={e => setObsPadrao(e.target.value)} placeholder="Texto padrão para o campo de observações em novos contratos..." rows={3} />
        </Card>

        <Card className="p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Integração Asaas</h2>
            <Badge variant="secondary" className="text-[10px]">Ativo</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>API Key Asaas</Label><Input placeholder="Chave configurada via variáveis de ambiente" readOnly /></div>
            <div><Label>Webhook URL</Label><Input value={`${window.location.origin}/api/asaas-webhook`} readOnly /></div>
          </div>
          <p className="text-xs text-muted-foreground">A integração Asaas está configurada. As cobranças são processadas automaticamente via edge functions.</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}><Save className="w-4 h-4 mr-1" />Salvar Configurações</Button>
      </div>
    </div>
  );
}
