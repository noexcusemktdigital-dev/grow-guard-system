// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/* ========== CSV EXPORT ========== */
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(";"), ...rows.map(r => r.map(c => `"${(c ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ========== PDF EXPORT ========== */
export async function downloadReportPdf(containerId: string, title: string, orgName?: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const element = document.getElementById(containerId);
  if (!element) return;

  element.classList.add("pdf-exporting");
  await new Promise(r => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(element, {
      scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false, scrollY: -window.scrollY,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = 22;

    pdf.setFillColor(226, 35, 59);
    pdf.rect(0, 0, pageWidth, headerHeight, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(orgName || "Relatório", margin, 10);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(title, margin, 16);
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    pdf.text(dateStr, pageWidth - margin - pdf.getTextWidth(dateStr), 16);

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const contentStart = headerHeight + 4;
    const usableHeight = pageHeight - margin;

    let heightLeft = imgHeight;
    let position = contentStart;
    let srcY = 0;

    while (heightLeft > 0) {
      const sliceHeight = Math.min(heightLeft, usableHeight - position);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      const srcSliceHeight = (sliceHeight / imgHeight) * canvas.height;
      sliceCanvas.height = srcSliceHeight;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcSliceHeight, 0, 0, canvas.width, srcSliceHeight);

      const sliceData = sliceCanvas.toDataURL("image/png");
      pdf.addImage(sliceData, "PNG", margin, position, imgWidth, sliceHeight);

      heightLeft -= sliceHeight;
      srcY += srcSliceHeight;

      if (heightLeft > 0) {
        pdf.addPage();
        position = margin;
      }
    }

    const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    element.classList.remove("pdf-exporting");
  }
}

/* ========== DATE FILTER HELPER ========== */
export function getDateRange(period: string, customFrom: string, customTo: string): { from: Date | null; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  switch (period) {
    case "7d": { const from = new Date(now); from.setDate(from.getDate() - 7); from.setHours(0, 0, 0, 0); return { from, to }; }
    case "30d": { const from = new Date(now); from.setDate(from.getDate() - 30); from.setHours(0, 0, 0, 0); return { from, to }; }
    case "90d": { const from = new Date(now); from.setDate(from.getDate() - 90); from.setHours(0, 0, 0, 0); return { from, to }; }
    case "custom": { const from = customFrom ? new Date(customFrom + "T00:00:00") : null; const customEnd = customTo ? new Date(customTo + "T23:59:59") : to; return { from, to: customEnd }; }
    default: return { from: null, to };
  }
}

export function filterByDate<T extends { created_at: string }>(items: T[], from: Date | null, to: Date): T[] {
  if (!from) return items;
  return items.filter(item => {
    const d = new Date(item.created_at);
    return d >= from && d <= to;
  });
}

/* ========== GOAL STATUS HELPERS ========== */
export type GoalStatus = "batida" | "no_ritmo" | "em_andamento" | "abaixo" | "critica";

export function getGoalGradient(status: GoalStatus | undefined, fallback: string) {
  if (!status) return fallback;
  if (status === "batida" || status === "no_ritmo") return "from-emerald-500/20 to-emerald-600/5";
  if (status === "em_andamento") return "from-amber-500/20 to-amber-600/5";
  return "from-red-500/20 to-red-600/5";
}

export function getGoalStatusLabel(status: GoalStatus) {
  switch (status) {
    case "batida": return { label: "✓ Meta batida", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
    case "no_ritmo": return { label: "↗ No ritmo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
    case "em_andamento": return { label: "→ Em andamento", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" };
    case "abaixo": return { label: "↓ Abaixo", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
    case "critica": return { label: "↓ Crítica", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
  }
}

export const METRIC_TO_KPI: Record<string, string[]> = {
  revenue: ["Receita Total"], faturamento: ["Receita Total"],
  leads: ["Leads Captados"],
  conversions: ["Taxa de Conversão"],
  avg_ticket: ["Ticket Médio"],
  contracts: ["Pipeline Ativo"], contratos: ["Pipeline Ativo"],
};

/* ========== KPI CARD ========== */
export function DashboardKpiCard({ label, value, icon: Icon, gradient, trend, goalStatus, goalTarget, goalPercent, goalDaysLeft }: {
  label: string; value: string; icon: React.ElementType; gradient: string;
  trend?: { value: string; positive: boolean }; goalStatus?: GoalStatus;
  goalTarget?: string; goalPercent?: number; goalDaysLeft?: number;
}) {
  const statusInfo = goalStatus ? getGoalStatusLabel(goalStatus) : null;
  const barColor =
    goalStatus === "batida" || goalStatus === "no_ritmo" ? "bg-emerald-500" :
    goalStatus === "em_andamento" ? "bg-amber-500" :
    goalStatus ? "bg-red-500" : "";
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGoalGradient(goalStatus, gradient)} opacity-60`} />
      <CardContent className="relative p-4">
        <div className="w-9 h-9 rounded-lg bg-background/50 border flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            {trend && (
              <span className={`text-[10px] font-medium flex items-center gap-0.5 ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
                {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}
              </span>
            )}
          </div>
          {goalStatus && goalPercent !== undefined && (
            <div className="mt-2.5 space-y-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${Math.min(goalPercent, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between gap-1">
                {goalTarget && <span className="text-[9px] text-muted-foreground truncate">Meta: {goalTarget}</span>}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-semibold" style={{ color: barColor === "bg-emerald-500" ? "#059669" : barColor === "bg-amber-500" ? "#d97706" : "#dc2626" }}>
                    {Math.round(goalPercent)}%
                  </span>
                  {goalDaysLeft !== undefined && goalDaysLeft > 0 && <span className="text-[9px] text-muted-foreground">{goalDaysLeft}d</span>}
                </div>
              </div>
            </div>
          )}
          {statusInfo && !goalPercent && (
            <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
