import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, Copy, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useToast } from "@/hooks/use-toast";

export function CrmIntegrations() {
  const { toast } = useToast();
  const { data: orgId } = useUserOrgId();
  const { createLead } = useCrmLeadMutations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [csvData, setCsvData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook/${orgId}` : "Carregando...";

  const copyUrl = () => { navigator.clipboard.writeText(webhookUrl); toast({ title: "URL copiada!" }); };

  // CSV handlers
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast({ title: "CSV vazio ou inválido", variant: "destructive" }); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
        return obj;
      });
      setCsvData(rows);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0, errors = 0;
    for (const row of csvData) {
      try {
        await createLead.mutateAsync({ name: row.nome || row.name || "Sem nome", email: row.email || undefined, phone: row.telefone || row.phone || undefined, company: row.empresa || row.company || undefined, source: row.origem || row.source || "CSV", value: row.valor || row.value ? parseFloat(row.valor || row.value) : undefined, stage: "novo" });
        success++;
      } catch { errors++; }
    }
    setImportResult({ success, errors });
    setCsvData([]);
    setImporting(false);
    toast({ title: `Importação: ${success} leads criados, ${errors} erros` });
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Inbound Webhook */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plug className="w-4 h-4" /> Webhook de Leads (Entrada)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Configure esta URL em plataformas (Meta Leads, Google Ads, formulários, etc.) para receber leads automaticamente.</p>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="text-xs font-mono" />
            <Button size="sm" variant="outline" onClick={copyUrl}><Copy className="w-3.5 h-3.5" /></Button>
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">Payload aceito (POST JSON)</summary>
            <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto mt-1">{`{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "phone": "11999999999",
  "company": "Empresa",
  "source": "Meta Leads",
  "value": 5000,
  "tags": ["ads"]
}`}</pre>
          </details>
        </CardContent>
      </Card>

      {/* CSV Import */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Importar CSV</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Faça upload de um CSV com colunas: nome, email, telefone, empresa, origem, valor</p>
          <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvUpload} className="hidden" />
          <Button size="sm" variant="outline" className="gap-1" onClick={() => fileRef.current?.click()}><Upload className="w-3.5 h-3.5" /> Selecionar arquivo</Button>

          {csvData.length > 0 && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">{csvData.length} leads encontrados</Badge>
              <div className="max-h-40 overflow-auto border rounded p-2">
                {csvData.slice(0, 5).map((row, i) => <p key={i} className="text-[10px] text-muted-foreground truncate">{row.nome || row.name} · {row.email} · {row.telefone || row.phone}</p>)}
                {csvData.length > 5 && <p className="text-[10px] text-muted-foreground">... e mais {csvData.length - 5}</p>}
              </div>
              <Button size="sm" onClick={handleImport} disabled={importing}>{importing ? "Importando..." : `Importar ${csvData.length} leads`}</Button>
            </div>
          )}

          {importResult && (
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /> {importResult.success} sucesso</span>
              {importResult.errors > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" /> {importResult.errors} erros</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
