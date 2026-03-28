import { useState, useMemo, useRef } from "react";
import { formatBRL, MONTH_NAMES } from "@/lib/formatting";
import { Plus, FileDown, Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast as sonnerToast } from "sonner";
import { type NetworkContract, type ClosingRow, type UnitRow } from "./FinanceiroDashboardTypes";

export interface FechamentosTabProps {
  contracts: NetworkContract[] | undefined;
  closings: ClosingRow[] | undefined;
  units: UnitRow[] | undefined;
  orgId: string | null | undefined;
}

export function FechamentosTab({ contracts, closings, units, orgId }: FechamentosTabProps) {
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
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterClosingStatus, setFilterClosingStatus] = useState("all");

  const unitFeeMap = useMemo(() => {
    const map: Record<string, number> = {};
    (units ?? []).forEach((u: UnitRow) => { if (u.unit_org_id) map[u.unit_org_id] = Number(u.system_fee ?? 250); });
    return map;
  }, [units]);

  const consolidation = useMemo(() => {
    if (!contracts) return [];
    const active = contracts.filter((c: Record<string, unknown>) => c.status === "active" || c.status === "signed");
    const byOrg: Record<string, { orgName: string; orgId: string; contracts: number; mrr: number; royalty: number; systemFee: number }> = {};
    active.forEach((c: NetworkContract) => {
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

  const selectedUnitName = useMemo(() => {
    const u = (units ?? []).find((u: UnitRow) => u.id === selectedUnitId);
    return (u as UnitRow | undefined)?.name || "";
  }, [units, selectedUnitId]);

  const handleUnitOrMonthChange = (unitId: string, m: string, y: string) => {
    const u = (units ?? []).find((u: UnitRow) => u.id === unitId);
    const name = (u as UnitRow | undefined)?.name || "";
    if (name) setTitle(`DRE ${name} - ${MONTH_NAMES[Number(m) - 1]}/${y}`);
  };

  const handleSave = async () => {
    if (!selectedUnitId || !orgId) { sonnerToast.error("Selecione uma unidade"); return; }
    setSaving(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${orgId}/${selectedUnitId}/${year}-${month}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("closing-files").upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("closing-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("finance_closings").insert({
        organization_id: orgId, unit_id: selectedUnitId, month: Number(month), year: Number(year),
        title: title || `DRE ${selectedUnitName} - ${MONTH_NAMES[Number(month) - 1]}/${year}`,
        file_url: fileUrl, notes: notes || null, status: "published",
      });
      if (error) throw error;
      sonnerToast.success("Fechamento publicado com sucesso!");
      qc.invalidateQueries({ queryKey: ["finance-closings"] });
      setDialogOpen(false);
    } catch (e: unknown) {
      sonnerToast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const closingYears = useMemo(() => {
    const ys = new Set<string>();
    (closings ?? []).forEach((cl: ClosingRow) => { if (cl.year) ys.add(String(cl.year)); });
    return [...ys].sort().reverse();
  }, [closings]);

  const filteredClosings = useMemo(() => {
    let list = closings ?? [];
    if (filterUnit !== "all") list = list.filter((cl: ClosingRow) => cl.unit_id === filterUnit);
    if (filterYear !== "all") list = list.filter((cl: ClosingRow) => String(cl.year) === filterYear);
    if (filterClosingStatus !== "all") list = list.filter((cl: ClosingRow) => cl.status === filterClosingStatus);
    return list;
  }, [closings, filterUnit, filterYear, filterClosingStatus]);

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {(units ?? []).map((u: UnitRow) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Anos</SelectItem>
              {closingYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterClosingStatus} onValueChange={setFilterClosingStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setSelectedUnitId(""); setMonth(String(new Date().getMonth() + 1)); setYear(String(new Date().getFullYear())); setTitle(""); setNotes(""); setFile(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Fechamento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} accent />
        <KpiCard label="Royalties (10%)" value={formatBRL(totalRoyalties)} />
        <KpiCard label="Taxas Sistema" value={formatBRL(totalSystemFees)} />
        <KpiCard label="Unidades Ativas" value={String(consolidation.length)} />
      </div>

      {consolidation.length > 0 && (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">Unidade</th>
              <th className="text-center py-3 px-4 font-medium">Contratos</th>
              <th className="text-right py-3 px-4 font-medium">MRR</th>
              <th className="text-right py-3 px-4 font-medium">Royalty (10%)</th>
              <th className="text-right py-3 px-4 font-medium">Taxa Sistema</th>
              <th className="text-right py-3 px-4 font-medium">Total Devido</th>
            </tr></thead>
            <tbody>
              {consolidation.map((c) => (
                <tr key={c.orgId} className="border-b hover:bg-muted/30">
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

      {filteredClosings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Arquivos de Fechamento</h3>
          {filteredClosings.map((cl: ClosingRow) => (
            <Card key={cl.id} className="glass-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileDown className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-medium text-sm">{cl.title}</p><p className="text-xs text-muted-foreground">{MONTH_NAMES[(cl.month ?? 1) - 1]}/{cl.year}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cl.status === "published" ? "default" : "secondary"}>{cl.status === "published" ? "Publicado" : "Pendente"}</Badge>
                  {cl.file_url && <Button size="sm" variant="outline" asChild><a href={cl.file_url} target="_blank" rel="noreferrer"><FileDown className="w-4 h-4 mr-1" />Baixar</a></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Novo Fechamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Fechamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Unidade *</Label>
              <Select value={selectedUnitId} onValueChange={(v) => { setSelectedUnitId(v); handleUnitOrMonthChange(v, month, year); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>{(units ?? []).map((u: UnitRow) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Mês</Label>
                <Select value={month} onValueChange={(v) => { setMonth(v); handleUnitOrMonthChange(selectedUnitId, v, year); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Ano</Label><Input type="number" value={year} onChange={(e) => { setYear(e.target.value); handleUnitOrMonthChange(selectedUnitId, month, e.target.value); }} /></div>
            </div>
            <div className="space-y-1.5"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DRE Unidade - Mês/Ano" /></div>
            <div className="space-y-1.5">
              <Label>Arquivo (PDF / Excel)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <p className="text-sm font-medium">{file.name}</p> : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground"><Upload className="w-5 h-5" /><span className="text-xs">Clique para selecionar</span></div>
                )}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionais..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !selectedUnitId}>{saving ? "Publicando..." : "Publicar Fechamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
