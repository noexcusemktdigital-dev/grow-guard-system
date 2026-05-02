import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCrmContactMutations } from "@/hooks/useCrmContacts";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import type { TablesInsert } from "@/integrations/supabase/typed";

const CSV_TEMPLATE_HEADERS = "nome;email;telefone;empresa;cargo;origem;tags;notas";
const CSV_TEMPLATE_EXAMPLE = 'João Silva;joao@email.com;11999999999;Empresa XYZ;Diretor;Indicação;"tag1, tag2";Observações aqui';

const COLUMN_MAP: Record<string, string> = {
  nome: "name", name: "name",
  email: "email",
  telefone: "phone", phone: "phone", celular: "phone",
  empresa: "company", company: "company",
  cargo: "position", position: "position",
  origem: "source", source: "source",
  tags: "tags",
  notas: "notes", notes: "notes", observacoes: "notes",
};

const DISPLAY_COLUMNS = [
  { key: "name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "company", label: "Empresa" },
  { key: "position", label: "Cargo" },
  { key: "source", label: "Origem" },
  { key: "tags", label: "Tags" },
  { key: "notes", label: "Notas" },
];

interface ParsedRow {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: string;
  tags: string;
  notes: string;
}

function parseCsvText(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Auto-detect delimiter: semicolon (BR Excel) vs comma
  const firstLine = lines[0];
  const delimiter = (firstLine.split(";").length > firstLine.split(",").length) ? ";" : ",";

  const rawHeaders = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const mappedHeaders = rawHeaders.map(h => COLUMN_MAP[h] || h);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === delimiter && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());

    const row: ParsedRow = { name: "", email: "", phone: "", company: "", position: "", source: "", tags: "", notes: "" };
    mappedHeaders.forEach((h, idx) => {
      if (Object.prototype.hasOwnProperty.call(row, h)) row[h] = values[idx] || "";
    });
    if (row.name) rows.push(row);
  }
  return { headers: mappedHeaders, rows };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrmCsvImportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { createContact } = useCrmContactMutations();
  const { data: orgId } = useUserOrgId();
  const { data: subscription } = useClienteSubscription();
  const orgPlan = subscription?.plan_id ?? "starter";
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const reset = () => {
    setStep(1);
    setParsedRows([]);
    setMappedHeaders([]);
    setImporting(false);
    setProgress(0);
    setImportedCount(0);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const content = `\uFEFF${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_contatos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsvText(text);
      if (rows.length === 0) {
        toast({ title: "Nenhum contato encontrado no arquivo", variant: "destructive" });
        return;
      }
      setMappedHeaders(headers);
      setParsedRows(rows);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const MAX_IMPORT = orgPlan === "enterprise" || orgPlan === "pro" ? 5000 : 500;
    if (parsedRows.length > MAX_IMPORT) {
      toast({
        title: "Limite excedido",
        description: `Seu plano permite importar até ${MAX_IMPORT} contatos por vez.`,
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setImportedCount(0);

    const rows: TablesInsert<'crm_contacts'>[] = parsedRows.map(row => ({
      organization_id: orgId ?? "",
      name: row.name,
      email: row.email || null,
      phone: row.phone || null,
      company: row.company || null,
      position: row.position || null,
      source: row.source || "CSV",
      notes: row.notes || null,
      tags: row.tags ? row.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    }));

    const BATCH_SIZE = 100;
    const batches: typeof rows[] = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      batches.push(rows.slice(i, i + BATCH_SIZE));
    }

    let success = 0;
    let errors = 0;
    let imported = 0;

    for (const batch of batches) {
      const { error } = await supabase.from("crm_contacts").insert(batch);
      if (error) {
        errors += batch.length;
      } else {
        success += batch.length;
      }
      imported += batch.length;
      setImportedCount(imported);
      setProgress(Math.round((imported / rows.length) * 100));
    }

    setResult({ success, errors });
    setImporting(false);
    setStep(3);
    toast({
      title: "Planilha aceita!",
      description: `${success} contatos foram gerados na aba de Contatos.${errors > 0 ? ` ${errors} erros.` : ""}`,
    });
  };

  const recognizedCount = DISPLAY_COLUMNS.filter(c => mappedHeaders.includes(c.key)).length;

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Contatos via CSV
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
              <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium">Selecione um arquivo CSV</p>
              <p className="text-xs text-muted-foreground">
                Use o modelo padrão para garantir a importação correta dos dados.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
                  <Download className="w-3.5 h-3.5" /> Baixar modelo
                </Button>
                <input type="file" accept=".csv" ref={fileRef} onChange={handleFileChange} className="hidden" />
                <Button size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Selecionar arquivo
                </Button>
              </div>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold">Formato esperado</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b">
                        {CSV_TEMPLATE_HEADERS.split(",").map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {CSV_TEMPLATE_EXAMPLE.replace(/"/g, "").split(",").map((v, i) => (
                          <td key={i} className="px-2 py-1.5">{v.trim()}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Colunas aceitas em PT ou EN: nome/name, email, telefone/phone, empresa/company, cargo/position, origem/source, tags, notas/notes
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <FileSpreadsheet className="w-3 h-3" /> {parsedRows.length} contatos encontrados
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {recognizedCount}/{DISPLAY_COLUMNS.length} colunas reconhecidas
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-2 py-1.5 text-left text-muted-foreground w-8">#</th>
                    {DISPLAY_COLUMNS.map(col => (
                      <th key={col.key} className={`px-2 py-1.5 text-left font-semibold ${mappedHeaders.includes(col.key) ? "text-primary" : "text-muted-foreground/40"}`}>
                        {col.label}
                        {mappedHeaders.includes(col.key) && <CheckCircle className="w-2.5 h-2.5 inline ml-1 text-emerald-500" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      {DISPLAY_COLUMNS.map(col => (
                        <td key={col.key} className="px-2 py-1.5 truncate max-w-[120px]">
                          {row[col.key as keyof ParsedRow] || <span className="text-muted-foreground/30">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 5 && (
              <p className="text-[10px] text-muted-foreground text-center">
                Mostrando 5 de {parsedRows.length} contatos
              </p>
            )}
            {importing && (
              <div className="space-y-1.5 pt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Importando {progress}%... ({importedCount}/{parsedRows.length} contatos)
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && result && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sua planilha foi aceita e os contatos foram gerados na aba de <strong>Contatos</strong>.
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> {result.success} contatos criados
                </span>
                {result.errors > 0 && (
                  <span className="flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4" /> {result.errors} erros
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => { setStep(1); setParsedRows([]); }} className="gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </Button>
              <Button onClick={handleImport} disabled={importing} className="gap-1">
                {importing ? "Importando..." : `Importar ${parsedRows.length} contatos`}
                {!importing && <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
