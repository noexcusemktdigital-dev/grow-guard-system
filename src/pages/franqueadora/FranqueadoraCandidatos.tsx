import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Eye, Users, Loader2 } from "lucide-react";
import { useFranchiseCandidates, type FranchiseCandidate } from "@/hooks/useFranchiseCandidates";
import { getLogoBase64 } from "@/lib/contractPdfTemplate";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  novo: { label: "Novo", variant: "default" },
  em_analise: { label: "Em análise", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "outline" },
  reprovado: { label: "Reprovado", variant: "destructive" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function buildCandidatePdfHtml(c: FranchiseCandidate, logoBase64: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR");
  const statusLabel = STATUS_MAP[c.status]?.label || c.status;

  const section = (title: string, rows: [string, string | null][]) => {
    const filtered = rows.filter(([, v]) => v);
    if (!filtered.length) return "";
    return `
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;margin:22px 0 8px;letter-spacing:0.5px;color:#1a1a1a;border-bottom:1px solid #e5e5e5;padding-bottom:5px;">${title}</h2>
      ${filtered.map(([label, val]) => `<p style="font-size:11px;margin:3px 0;line-height:1.7;color:#222;"><strong>${label}:</strong> ${val}</p>`).join("\n")}
    `;
  };

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:700px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#111;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;">
        <div>${logoBase64 ? `<img src="${logoBase64}" style="height:44px;" />` : `<span style="color:#fff;font-size:18px;font-weight:bold;">NOEXCUSE</span>`}</div>
        <div style="text-align:right;color:#999;font-size:9px;line-height:1.6;font-family:Arial,sans-serif;">
          <div>NOEXCUSE MARKETING DIGITAL LTDA</div>
          <div>contato@noexcuse.com.br</div>
        </div>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#d97706,#f59e0b,#d97706);"></div>
      <div style="text-align:center;padding:24px 40px 16px;">
        <h1 style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0 0 6px;color:#111;">FICHA DO CANDIDATO</h1>
        <div style="width:50px;height:2px;background:#d97706;margin:0 auto;"></div>
      </div>
      <div style="padding:0 40px 30px;">
        ${section("Dados Pessoais", [
          ["Nome", c.name],
          ["E-mail", c.email],
          ["Telefone", c.phone],
          ["Data de Nascimento", c.birth_date],
          ["Estado Civil", c.marital_status],
        ])}
        ${section("Endereço", [
          ["CEP", c.cep],
          ["Cidade", c.city],
          ["Endereço", c.address],
        ])}
        ${section("Documentos", [
          ["CPF", c.cpf],
          ["RG", c.rg],
        ])}
        ${section("Dados da Empresa", [
          ["Empresa", c.company_name],
          ["CNPJ", c.cnpj],
          ["Endereço Comercial", c.company_address],
        ])}
        ${section("LGPD", [
          ["Consentimento", c.lgpd_consent ? "Sim" : "Não"],
          ["Data do Consentimento", c.lgpd_consent_date ? formatDate(c.lgpd_consent_date) : null],
        ])}
        ${section("Status & Observações", [
          ["Status", statusLabel],
          ["Observações", c.notes],
          ["Data de Cadastro", formatDate(c.created_at)],
        ])}
      </div>
      <div style="border-top:1px solid #ddd;margin:0 40px;padding:12px 0;display:flex;justify-content:space-between;">
        <span style="font-size:8px;color:#aaa;font-family:Arial,sans-serif;">NOEXCUSE — Documento Confidencial</span>
        <span style="font-size:8px;color:#aaa;font-family:Arial,sans-serif;">Gerado em ${dateStr} às ${timeStr}</span>
      </div>
    </div>
  `;
}

async function downloadCandidatePdf(candidate: FranchiseCandidate) {
  const { default: html2pdf } = await import("html2pdf.js");
  const logoBase64 = await getLogoBase64();
  const html = buildCandidatePdfHtml(candidate, logoBase64);
  const el = document.createElement("div");
  el.innerHTML = html;
  html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `Ficha_${candidate.name.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(el)
    .save();
}

export default function FranqueadoraCandidatos() {
  const { data: candidates, isLoading, updateStatus, updateNotes } = useFranchiseCandidates();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<FranchiseCandidate | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const filtered = (candidates || []).filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetail = (c: FranchiseCandidate) => {
    setSelected(c);
    setEditNotes(c.notes || "");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidatos"
        description="Candidatos a franqueados recebidos via formulário"
        icon={<Users className="w-6 h-6 text-primary" />}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_analise">Em análise</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="reprovado">Reprovado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum candidato encontrado.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                <TableHead className="hidden lg:table-cell">CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const st = STATUS_MAP[c.status] || { label: c.status, variant: "secondary" as const };
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openDetail(c)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{c.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{c.phone || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{c.city || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{c.cpf || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{formatDate(c.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); openDetail(c); }}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); downloadCandidatePdf(c); }}
                          title="Baixar ficha PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selected.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                  <div><span className="text-muted-foreground">Telefone:</span> {selected.phone || "—"}</div>
                  <div><span className="text-muted-foreground">Nascimento:</span> {selected.birth_date || "—"}</div>
                  <div><span className="text-muted-foreground">Estado Civil:</span> {selected.marital_status || "—"}</div>
                  <div><span className="text-muted-foreground">CPF:</span> {selected.cpf || "—"}</div>
                  <div><span className="text-muted-foreground">RG:</span> {selected.rg || "—"}</div>
                  <div><span className="text-muted-foreground">CEP:</span> {selected.cep || "—"}</div>
                  <div><span className="text-muted-foreground">Cidade:</span> {selected.city || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {selected.address || "—"}</div>
                  <div><span className="text-muted-foreground">Empresa:</span> {selected.company_name || "—"}</div>
                  <div><span className="text-muted-foreground">CNPJ:</span> {selected.cnpj || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">End. Comercial:</span> {selected.company_address || "—"}</div>
                  <div><span className="text-muted-foreground">LGPD:</span> {selected.lgpd_consent ? "Consentiu" : "Não"}</div>
                  <div><span className="text-muted-foreground">Cadastro:</span> {formatDate(selected.created_at)}</div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={selected.status}
                    onValueChange={(val) => {
                      updateStatus.mutate({ id: selected.id, status: val });
                      setSelected({ ...selected, status: val });
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="em_analise">Em análise</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Observações</label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="Anotações internas..."
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      updateNotes.mutate({ id: selected.id, notes: editNotes });
                      setSelected({ ...selected, notes: editNotes });
                    }}
                  >
                    Salvar observações
                  </Button>
                </div>

                {/* PDF */}
                <Button variant="outline" className="w-full" onClick={() => downloadCandidatePdf(selected)}>
                  <Download className="w-4 h-4 mr-2" /> Baixar Ficha em PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
