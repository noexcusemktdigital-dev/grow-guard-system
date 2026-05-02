// @ts-nocheck
import { useMemo, useState, useRef } from "react";
import { formatBRL } from "@/lib/formatting";
import { Inbox, FileDown, Building2, Plus, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { useNetworkContracts } from "@/hooks/useContracts";
import { useFinanceClosings } from "@/hooks/useFinance";
import { useUnits } from "@/hooks/useUnits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function FinanceiroFechamentos() {
  const { data: contracts, isLoading: loadingContracts } = useNetworkContracts();
  const { data: closings, isLoading: loadingClosings } = useFinanceClosings();
  const { data: units, isLoading: loadingUnits } = useUnits();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLoading = loadingContracts || loadingClosings || loadingUnits;

  // Build a map of unit_org_id -> system_fee from units table
  const unitFeeMap = useMemo(() => {
    const map: Record<string, number> = {};
    (units ?? []).forEach((u) => {
      if (u.unit_org_id) map[u.unit_org_id] = Number(u.system_fee ?? 250);
    });
    return map;
  }, [units]);

  // Group active contracts by org for consolidation
  const consolidation = useMemo(() => {
    if (!contracts) return [];
    const activeContracts = contracts.filter((c) => c.status === "active" || c.status === "signed");
    const byOrg: Record<string, { orgName: string; orgId: string; contracts: number; mrr: number; royalty: number; systemFee: number }> = {};
    activeContracts.forEach((c) => {
      const key = c.org_name || c.organization_id;
      if (!byOrg[key]) {
        const fee = unitFeeMap[c.organization_id] ?? 250;
        byOrg[key] = { orgName: c.org_name || "—", orgId: c.organization_id, contracts: 0, mrr: 0, royalty: 0, systemFee: fee };
      }
      byOrg[key].contracts++;
      byOrg[key].mrr += Number(c.monthly_value || 0);
    });
    Object.values(byOrg).forEach(o => { o.royalty = o.mrr * 0.1; });
    return Object.values(byOrg).sort((a, b) => b.mrr - a.mrr);
  }, [contracts, unitFeeMap]);

  const totalMRR = consolidation.reduce((s, c) => s + c.mrr, 0);
  const totalRoyalties = consolidation.reduce((s, c) => s + c.royalty, 0);
  const totalSystemFees = consolidation.reduce((s, c) => s + c.systemFee, 0);

  // Auto-fill title when unit/month changes
  const selectedUnitName = useMemo(() => {
    const u = (units ?? []).find((u) => u.id === selectedUnitId);
    return u?.name || "";
  }, [units, selectedUnitId]);

  const openDialog = () => {
    setSelectedUnitId("");
    setMonth(String(new Date().getMonth() + 1));
    setYear(String(new Date().getFullYear()));
    setTitle("");
    setNotes("");
    setFile(null);
    setDialogOpen(true);
  };

  const handleUnitOrMonthChange = (unitId: string, m: string, y: string) => {
    const u = (units ?? []).find((u) => u.id === unitId);
    const name = u?.name || "";
    if (name) {
      setTitle(`DRE ${name} - ${MONTH_NAMES[Number(m) - 1]}/${y}`);
    }
  };

  const handleSave = async () => {
    if (!selectedUnitId || !orgId) {
      reportError(new Error("Selecione uma unidade"), { title: "Selecione uma unidade", category: "financeiro.validation" });
      return;
    }
    setSaving(true);
    try {
      let fileUrl: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${orgId}/${selectedUnitId}/${year}-${month}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("closing-files")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("closing-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("finance_closings").insert({
        organization_id: orgId,
        unit_id: selectedUnitId,
        month: Number(month),
        year: Number(year),
        title: title || `DRE ${selectedUnitName} - ${MONTH_NAMES[Number(month) - 1]}/${year}`,
        file_url: fileUrl,
        notes: notes || null,
        status: "published",
      });
      if (error) throw error;

      toast.success("Fechamento publicado com sucesso!");
      qc.invalidateQueries({ queryKey: ["finance-closings"] });
      qc.invalidateQueries({ queryKey: ["unit-closings"] });
      setDialogOpen(false);
    } catch (e: unknown) {
      reportError(e, { title: "Erro ao publicar fechamento", category: "financeiro.fechamento_save" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Fechamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Consolidação mensal por unidade — royalties e taxas</p>
        </div>
        <Button onClick={openDialog} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Fechamento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} accent />
        <KpiCard label="Royalties (10%)" value={formatBRL(totalRoyalties)} />
        <KpiCard label="Taxas Sistema" value={formatBRL(totalSystemFees)} />
        <KpiCard label="Unidades Ativas" value={String(consolidation.length)} />
      </div>

      {consolidation.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma consolidação disponível</h3>
          <p className="text-sm text-muted-foreground">Contratos ativos gerarão fechamentos automaticamente.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Unidade</th>
                <th className="text-center py-3 px-4 font-medium">Contratos</th>
                <th className="text-right py-3 px-4 font-medium">MRR</th>
                <th className="text-right py-3 px-4 font-medium">Royalty (10%)</th>
                <th className="text-right py-3 px-4 font-medium">Taxa Sistema</th>
                <th className="text-right py-3 px-4 font-medium">Total Devido</th>
              </tr>
            </thead>
            <tbody>
              {consolidation.map((c) => (
                <tr key={c.orgName} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{c.orgName}</td>
                  <td className="py-3 px-4 text-center">{c.contracts}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(c.mrr)}</td>
                  <td className="py-3 px-4 text-right text-amber-600">{formatBRL(c.royalty)}</td>
                  <td className="py-3 px-4 text-right text-blue-600">{formatBRL(c.systemFee)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatBRL(c.royalty + c.systemFee)}</td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-center">{consolidation.reduce((s, c) => s + c.contracts, 0)}</td>
                <td className="py-3 px-4 text-right">{formatBRL(totalMRR)}</td>
                <td className="py-3 px-4 text-right text-amber-600">{formatBRL(totalRoyalties)}</td>
                <td className="py-3 px-4 text-right text-blue-600">{formatBRL(totalSystemFees)}</td>
                <td className="py-3 px-4 text-right">{formatBRL(totalRoyalties + totalSystemFees)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {(closings ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Arquivos de Fechamento</h3>
          {closings?.map((cl) => (
            <Card key={cl.id} className="glass-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cl.title}</p>
                    <p className="text-xs text-muted-foreground">{MONTH_NAMES[(cl.month ?? 1) - 1]}/{cl.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cl.status === "published" ? "default" : "secondary"}>
                    {cl.status === "published" ? "Publicado" : "Pendente"}
                  </Badge>
                  {cl.file_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cl.file_url} target="_blank" rel="noreferrer"><FileDown className="w-4 h-4 mr-1" />Baixar</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Novo Fechamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Fechamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Unidade *</Label>
              <Select
                value={selectedUnitId}
                onValueChange={(v) => {
                  setSelectedUnitId(v);
                  handleUnitOrMonthChange(v, month, year);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>
                  {(units ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mês</Label>
                <Select
                  value={month}
                  onValueChange={(v) => {
                    setMonth(v);
                    handleUnitOrMonthChange(selectedUnitId, v, year);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fechamento-ano">Ano</Label>
                <Input
                  id="fechamento-ano"
                  type="number"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    handleUnitOrMonthChange(selectedUnitId, month, e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fechamento-titulo">Título</Label>
              <Input id="fechamento-titulo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DRE Unidade - Mês/Ano" />
            </div>

            <div className="space-y-1.5">
              <Label>Arquivo (PDF / Excel)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">Clique para selecionar</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !selectedUnitId}>
              {saving ? "Publicando..." : "Publicar Fechamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
