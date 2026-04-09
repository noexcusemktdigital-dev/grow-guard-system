/**
 * Professional A4 PDF generator for Strategy Results.
 * Builds the PDF programmatically with jsPDF — no html2canvas dependency for main content.
 * Uses html2canvas ONLY for chart captures (Radar, Bar, Line).
 */
import type { StrategyResult, EtapaEstrategica } from "@/hooks/useFranqueadoStrategies";
import logoSrc from "@/assets/logo-noexcuse-white.png";

// ─── Constants ───
const A4_W = 210;
const A4_H = 297;
const M_LEFT = 18;
const M_RIGHT = 18;
const M_TOP = 20;
const M_BOTTOM = 20;
const CW = A4_W - M_LEFT - M_RIGHT; // content width
const MAX_Y = A4_H - M_BOTTOM;

const RED = [220, 38, 38] as const;
const DARK = [10, 10, 10] as const;
const DARK2 = [24, 24, 27] as const;
const GRAY = [113, 113, 122] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_BG = [250, 250, 250] as const;

const etapaLabels: Record<string, string> = {
  conteudo: "Conteudo e Linha Editorial",
  trafego: "Trafego e Distribuicao",
  web: "Web e Conversao",
  sales: "Sales e Fechamento",
  validacao: "Validacao e Escala",
};
const etapaNums: Record<string, string> = { conteudo: "01", trafego: "02", web: "03", sales: "04", validacao: "05" };
const etapaColorsRgb: Record<string, [number, number, number]> = {
  conteudo: [239, 68, 68],
  trafego: [249, 115, 22],
  web: [59, 130, 246],
  sales: [34, 197, 94],
  validacao: [139, 92, 246],
};

// ─── Helpers ───
async function loadLogoBase64(): Promise<string> {
  try {
    const resp = await fetch(logoSrc);
    const blob = await resp.blob();
    return new Promise((r) => {
      const fr = new FileReader();
      fr.onloadend = () => r(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

/** Load image and return { base64, width, height } */
async function loadImageWithDimensions(src: string): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    const base64: string = await new Promise((r) => {
      const fr = new FileReader();
      fr.onloadend = () => r(fr.result as string);
      fr.readAsDataURL(blob);
    });
    const dims: { width: number; height: number } = await new Promise((r) => {
      const img = new Image();
      img.onload = () => r({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => r({ width: 200, height: 60 });
      img.src = base64;
    });
    return { base64, ...dims };
  } catch {
    return null;
  }
}

function scoreColor(s: number): [number, number, number] {
  if (s <= 25) return [239, 68, 68];
  if (s <= 50) return [249, 115, 22];
  if (s <= 75) return [234, 179, 8];
  return [34, 197, 94];
}

/** Strip emojis and special unicode from text for safe jsPDF rendering */
function safeText(text: string): string {
  if (!text) return "";
  // Remove emoji and other problematic unicode ranges
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    .replace(/[⚠️✓✔️▸►●○◆◇★☆♦♠♣♥❤️🔥💡📊📈📉📌📍📎📦🏗️🎯💰💸🚀⭐]/g, "")
    .trim();
}

class PdfBuilder {
  pdf: any;
  y = M_TOP;
  pageNum = 0;
  logo: string;
  isDark = false;

  constructor(pdf: any, logo: string) {
    this.pdf = pdf;
    this.logo = logo;
    this.pageNum = 1;
  }

  ensureSpace(needed: number) {
    if (this.y + needed > MAX_Y) this.newPage();
  }

  newPage() {
    this.pdf.addPage();
    this.pageNum++;
    this.y = M_TOP;
    if (this.isDark) this.drawDarkBg();
  }

  drawDarkBg() {
    this.pdf.setFillColor(...DARK);
    this.pdf.rect(0, 0, A4_W, A4_H, "F");
  }

  drawFooter() {
    const pages = this.pdf.getNumberOfPages();
    for (let i = 2; i <= pages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(...GRAY);
      this.pdf.text("NoExcuse Digital \u2014 Diagn\u00f3stico Estrat\u00e9gico", A4_W / 2, A4_H - 8, { align: "center" });
      this.pdf.text(`${i - 1}/${pages - 1}`, A4_W - M_RIGHT, A4_H - 8, { align: "right" });
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.2);
      this.pdf.line(M_LEFT, A4_H - 12, A4_W - M_RIGHT, A4_H - 12);
    }
  }

  // ─── Text utilities ───
  setFont(style: "normal" | "bold" = "normal", size = 10, color: readonly [number, number, number] = [30, 30, 30]) {
    this.pdf.setFont("helvetica", style);
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(...color);
  }

  writeText(text: string, opts?: { maxWidth?: number; align?: "left" | "center" | "right"; x?: number }) {
    const maxW = opts?.maxWidth || CW;
    const x = opts?.x ?? M_LEFT;
    const lines = this.pdf.splitTextToSize(safeText(text), maxW);
    const lineH = this.pdf.getFontSize() * 0.45;
    for (const line of lines) {
      this.ensureSpace(lineH + 1);
      this.pdf.text(line, x, this.y, { align: opts?.align || "left" });
      this.y += lineH;
    }
    return lines.length * lineH;
  }

  heading(text: string, size = 14, color: readonly [number, number, number] = [30, 30, 30]) {
    this.ensureSpace(12);
    this.setFont("bold", size, color);
    this.writeText(safeText(text));
    this.y += 3;
  }

  subheading(text: string, color: readonly [number, number, number] = [100, 100, 100]) {
    this.setFont("bold", 9, color);
    this.writeText(safeText(text));
    this.y += 1;
  }

  paragraph(text: string, color: readonly [number, number, number] = [80, 80, 80]) {
    this.setFont("normal", 9, color);
    this.writeText(safeText(text));
    this.y += 3;
  }

  bullet(text: string, color: readonly [number, number, number] = [80, 80, 80], bulletChar = "-") {
    this.ensureSpace(6);
    this.setFont("normal", 9, color);
    const lines = this.pdf.splitTextToSize(safeText(text), CW - 8);
    const lineH = 4;
    for (let li = 0; li < lines.length; li++) {
      this.ensureSpace(lineH + 1);
      if (li === 0) {
        this.pdf.text(bulletChar, M_LEFT, this.y);
      }
      this.pdf.text(lines[li], M_LEFT + 5, this.y);
      this.y += lineH;
    }
  }

  spacer(h = 5) {
    this.y += h;
  }

  // ─── Card with rounded rect ───
  card(x: number, y: number, w: number, h: number, fill: readonly [number, number, number] = LIGHT_BG, border?: readonly [number, number, number]) {
    this.pdf.setFillColor(...fill);
    this.pdf.roundedRect(x, y, w, h, 2, 2, "F");
    if (border) {
      this.pdf.setDrawColor(...border);
      this.pdf.setLineWidth(0.3);
      this.pdf.roundedRect(x, y, w, h, 2, 2, "S");
    }
  }

  drawScoreCircle(cx: number, cy: number, r: number, score: number) {
    const c = scoreColor(score);
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(1.5);
    this.pdf.circle(cx, cy, r, "S");
    this.pdf.setDrawColor(...c);
    this.pdf.setLineWidth(1.5);
    const startAngle = -90;
    const endAngle = startAngle + (score / 100) * 360;
    for (let a = startAngle; a < endAngle; a += 2) {
      const rad1 = (a * Math.PI) / 180;
      const rad2 = (Math.min(a + 2, endAngle) * Math.PI) / 180;
      this.pdf.line(cx + r * Math.cos(rad1), cy + r * Math.sin(rad1), cx + r * Math.cos(rad2), cy + r * Math.sin(rad2));
    }
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(r > 6 ? 9 : 7);
    this.pdf.setTextColor(...c);
    this.pdf.text(`${score}%`, cx, cy + (r > 6 ? 3 : 2), { align: "center" });
  }

  /** Draw a small colored square icon before text (replaces emojis) */
  drawIconSquare(x: number, y: number, color: [number, number, number]) {
    this.pdf.setFillColor(...color);
    this.pdf.roundedRect(x, y - 2.5, 3, 3, 0.5, 0.5, "F");
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════
export async function exportStrategyPdf(result: StrategyResult, title: string, chartRefs?: { radar?: HTMLElement; bar?: HTMLElement; line?: HTMLElement }) {
  const { default: jsPDF } = await import("jspdf");
  const logoData = await loadImageWithDimensions(logoSrc);
  const logo = logoData?.base64 || "";
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const b = new PdfBuilder(pdf, logo);

  // ═══ PAGE 1: COVER ═══
  drawCoverPage(b, result, title, logoData);

  // ═══ DIAGNOSTIC PAGES (light background) ═══
  b.isDark = false;
  b.newPage();
  await drawDiagnosticSection(b, result, chartRefs);

  // ═══ STRATEGIC PLAN PAGES (dark background) ═══
  if (result.etapas || result.projecoes || result.entregaveis_calculadora?.length) {
    b.isDark = true;
    b.newPage();
    b.drawDarkBg();
    await drawStrategicPlanSection(b, result, chartRefs);
  }

  // Footer on all pages
  b.drawFooter();

  pdf.save(`${title.replace(/[^a-zA-Z0-9À-ú ]/g, "")}.pdf`);
}

// ═══════════════════════════════════════════════════════════════
// COVER PAGE — Simplified: Logo + Title + Company + Date
// ═══════════════════════════════════════════════════════════════
function drawCoverPage(b: PdfBuilder, result: StrategyResult, title: string, logoData: { base64: string; width: number; height: number } | null) {
  const pdf = b.pdf;

  // Full black background
  pdf.setFillColor(...DARK);
  pdf.rect(0, 0, A4_W, A4_H, "F");

  // Red accent line at top
  pdf.setFillColor(...RED);
  pdf.rect(0, 0, A4_W, 4, "F");

  // Logo — centered, respecting aspect ratio
  if (logoData) {
    const maxLogoW = 70; // mm
    const maxLogoH = 30; // mm
    const aspectRatio = logoData.width / logoData.height;
    let logoW = maxLogoW;
    let logoH = logoW / aspectRatio;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspectRatio;
    }
    const logoX = (A4_W - logoW) / 2;
    try {
      pdf.addImage(logoData.base64, "PNG", logoX, 60, logoW, logoH);
    } catch {}
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(...WHITE);
    pdf.text("NOEXCUSE", A4_W / 2, 80, { align: "center" });
  }

  // Divider line
  pdf.setDrawColor(...RED);
  pdf.setLineWidth(1);
  pdf.line(A4_W / 2 - 25, 105, A4_W / 2 + 25, 105);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(...WHITE);
  pdf.text("DIAGN\u00d3STICO", A4_W / 2, 125, { align: "center" });
  pdf.text("ESTRAT\u00c9GICO", A4_W / 2, 137, { align: "center" });

  // Company name
  const companyName = result.resumo_cliente?.nome_empresa || title || "";
  if (companyName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(180, 180, 180);
    pdf.text(safeText(companyName).toUpperCase(), A4_W / 2, 160, { align: "center" });
  }

  // Date
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...GRAY);
  const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  pdf.text(dateStr, A4_W / 2, 175, { align: "center" });

  // Bottom red line
  pdf.setFillColor(...RED);
  pdf.rect(0, A4_H - 4, A4_W, 4, "F");
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC SECTION (light bg)
// ═══════════════════════════════════════════════════════════════
async function drawDiagnosticSection(b: PdfBuilder, result: StrategyResult, chartRefs?: any) {
  const gps = result.diagnostico_gps;

  // ── Resumo Executivo ──
  b.heading("Resumo Executivo", 13);
  b.paragraph(result.resumo_executivo || "");
  b.spacer(4);

  // ── Sobre a Empresa ──
  if (result.resumo_cliente) {
    b.heading("Sobre a Empresa", 12);
    const rc = result.resumo_cliente;
    const fields = [
      ["Empresa", rc.nome_empresa],
      ["Segmento", rc.segmento],
      ["Modelo de Negocio", rc.modelo_negocio],
      ["Diferencial", rc.diferencial],
      ["Proposta de Valor", rc.proposta_valor],
    ];
    for (const [label, val] of fields) {
      if (!val) continue;
      b.ensureSpace(10);
      b.setFont("bold", 8, GRAY as any);
      b.writeText((label as string).toUpperCase());
      b.setFont("normal", 9, [40, 40, 40] as any);
      b.writeText(safeText(val as string));
      b.spacer(2);
    }
    b.spacer(4);
  }

  // ── KPIs Hero ──
  if (result.kpis_hero) {
    b.heading("KPIs Principais", 12);
    b.ensureSpace(28);
    const kpis = [
      { label: "Meta Faturamento", value: result.kpis_hero.meta_faturamento },
      { label: "Ticket Medio", value: result.kpis_hero.ticket_medio },
      { label: "Recorrencia", value: result.kpis_hero.recorrencia },
      { label: "LTV/CAC", value: result.kpis_hero.ltv_cac },
    ];
    const cardW = (CW - 9) / 4;
    const cardPad = 3;

    kpis.forEach((kpi, i) => {
      const x = M_LEFT + i * (cardW + 3);
      const valText = safeText(kpi.value || "—");
      const maxValW = cardW - cardPad * 2;

      // Determine font size — shrink if value is too long
      let fontSize = 11;
      b.pdf.setFontSize(fontSize);
      let valLines = b.pdf.splitTextToSize(valText, maxValW);
      if (valLines.length > 1 && fontSize > 8) {
        fontSize = 8;
        b.pdf.setFontSize(fontSize);
        valLines = b.pdf.splitTextToSize(valText, maxValW);
      }

      const cardH = 12 + valLines.length * (fontSize * 0.45) + 2;
      b.card(x, b.y, cardW, cardH, LIGHT_BG, [220, 220, 220] as any);
      b.pdf.setFont("helvetica", "bold");
      b.pdf.setFontSize(7);
      b.pdf.setTextColor(...GRAY);
      b.pdf.text(kpi.label.toUpperCase(), x + cardW / 2, b.y + 7, { align: "center" });

      b.pdf.setFont("helvetica", "bold");
      b.pdf.setFontSize(fontSize);
      b.pdf.setTextColor(...RED);
      let valY = b.y + 13;
      for (const vl of valLines) {
        b.pdf.text(vl, x + cardW / 2, valY, { align: "center" });
        valY += fontSize * 0.45;
      }
    });
    b.y += 26;
    b.spacer(4);
  }

  // ── Scores Marketing / Comercial ──
  if (result.score_marketing || result.score_comercial) {
    b.ensureSpace(20);
    const halfW = (CW - 6) / 2;
    // Marketing
    b.card(M_LEFT, b.y, halfW, 16, LIGHT_BG, [220, 220, 220] as any);
    b.pdf.setFont("helvetica", "bold");
    b.pdf.setFontSize(7);
    b.pdf.setTextColor(...GRAY);
    b.pdf.text("SCORE MARKETING", M_LEFT + halfW / 2, b.y + 6, { align: "center" });
    const mc = scoreColor(result.score_marketing || 0);
    b.pdf.setFontSize(14);
    b.pdf.setTextColor(...mc);
    b.pdf.text(`${result.score_marketing || 0}%`, M_LEFT + halfW / 2, b.y + 13, { align: "center" });
    // Comercial
    const x2 = M_LEFT + halfW + 6;
    b.card(x2, b.y, halfW, 16, LIGHT_BG, [220, 220, 220] as any);
    b.pdf.setFont("helvetica", "bold");
    b.pdf.setFontSize(7);
    b.pdf.setTextColor(...GRAY);
    b.pdf.text("SCORE COMERCIAL", x2 + halfW / 2, b.y + 6, { align: "center" });
    const cc = scoreColor(result.score_comercial || 0);
    b.pdf.setFontSize(14);
    b.pdf.setTextColor(...cc);
    b.pdf.text(`${result.score_comercial || 0}%`, x2 + halfW / 2, b.y + 13, { align: "center" });
    b.y += 20;
    b.spacer(4);
  }

  // ── GPS Score ──
  if (gps) {
    b.heading("GPS do Negocio — Diagnostico", 12);
    b.ensureSpace(30);

    const sc = gps.score_geral;
    const c = scoreColor(sc);
    b.card(M_LEFT, b.y, CW, 24, LIGHT_BG, c as any);
    b.pdf.setFont("helvetica", "bold");
    b.pdf.setFontSize(24);
    b.pdf.setTextColor(...c);
    b.pdf.text(`${sc}%`, M_LEFT + 18, b.y + 16, { align: "center" });
    b.pdf.setFontSize(8);
    b.pdf.text(safeText(gps.nivel || ""), M_LEFT + 18, b.y + 21, { align: "center" });
    b.pdf.setFont("helvetica", "normal");
    b.pdf.setFontSize(9);
    b.pdf.setTextColor(80, 80, 80);
    const descLines = b.pdf.splitTextToSize(safeText(gps.descricao || ""), CW - 45);
    b.pdf.text(descLines, M_LEFT + 38, b.y + 10);
    b.y += 28;
    b.spacer(4);

    // Radar chart
    if (chartRefs?.radar) {
      b.ensureSpace(80);
      b.subheading("RADAR DAS 5 ETAPAS");
      b.spacer(2);
      try {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(chartRefs.radar, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
        const imgData = canvas.toDataURL("image/png");
        const imgW = CW - 20;
        const imgH = (canvas.height * imgW) / canvas.width;
        const finalH = Math.min(imgH, 70);
        b.pdf.addImage(imgData, "PNG", M_LEFT + 10, b.y, imgW, finalH);
        b.y += finalH + 4;
      } catch {}
    } else if (gps.radar_data?.length) {
      b.subheading("RADAR DAS 5 ETAPAS");
      b.spacer(2);
      for (const item of gps.radar_data) {
        b.ensureSpace(8);
        const barW = CW - 50;
        const fillW = (item.score / (item.max || 100)) * barW;
        b.pdf.setFont("helvetica", "normal");
        b.pdf.setFontSize(8);
        b.pdf.setTextColor(60, 60, 60);
        b.pdf.text(safeText(item.eixo), M_LEFT, b.y + 3);
        b.pdf.setFillColor(235, 235, 235);
        b.pdf.roundedRect(M_LEFT + 45, b.y, barW, 5, 1, 1, "F");
        const bc = scoreColor((item.score / (item.max || 100)) * 100);
        b.pdf.setFillColor(...bc);
        b.pdf.roundedRect(M_LEFT + 45, b.y, fillW, 5, 1, 1, "F");
        b.pdf.setFont("helvetica", "bold");
        b.pdf.setTextColor(60, 60, 60);
        b.pdf.text(`${item.score}`, M_LEFT + 47 + barW, b.y + 4);
        b.y += 8;
      }
      b.spacer(4);
    }

    // Gargalos ECE
    if (gps.gargalos_ece) {
      b.ensureSpace(30);
      b.heading("Gargalos — Metodologia ECE", 11);
      const eces: [string, [number, number, number], string | undefined][] = [
        ["ESTRUTURA", RED as any, gps.gargalos_ece.infraestrutura || (gps.gargalos_ece as any).estrutura],
        ["COLETA DE DADOS", [59, 130, 246], gps.gargalos_ece.coleta],
        ["ESCALA", [34, 197, 94], gps.gargalos_ece.escala],
      ];
      for (const [label, iconColor, val] of eces) {
        if (!val) continue;
        const safeVal = safeText(val);
        const valLines = b.pdf.splitTextToSize(safeVal, CW - 14);
        const cardH = 12 + (valLines.length - 1) * 3.5;
        b.ensureSpace(cardH + 2);
        b.card(M_LEFT, b.y, CW, cardH, [245, 245, 245] as any, [200, 200, 200] as any);
        // Icon square instead of emoji
        b.drawIconSquare(M_LEFT + 4, b.y + 5, iconColor);
        b.pdf.setFont("helvetica", "bold");
        b.pdf.setFontSize(7);
        b.pdf.setTextColor(...iconColor);
        b.pdf.text(label, M_LEFT + 9, b.y + 5);
        b.pdf.setFont("helvetica", "normal");
        b.pdf.setFontSize(8);
        b.pdf.setTextColor(80, 80, 80);
        b.pdf.text(valLines, M_LEFT + 4, b.y + 10);
        b.y += cardH + 2;
      }
      b.spacer(4);
    }

    // Insights
    if (gps.insights?.length) {
      b.heading("Insights Personalizados", 11);
      for (const insight of gps.insights) {
        b.bullet(safeText(insight));
      }
      b.spacer(4);
    }
  }

  // ── Persona ──
  if (result.persona) {
    b.heading("Persona — Cliente Ideal", 12);
    b.paragraph(result.persona.descricao || "");
    const pFields = [
      ["Faixa Etaria", result.persona.faixa_etaria],
      ["Genero", result.persona.genero],
      ["Poder Aquisitivo", result.persona.poder_aquisitivo],
      ["Dor Principal", result.persona.dor_principal],
      ["Decisao de Compra", result.persona.decisao_compra],
    ];
    for (const [l, v] of pFields) {
      if (!v) continue;
      b.ensureSpace(8);
      b.setFont("bold", 7, GRAY as any);
      b.writeText((l as string).toUpperCase());
      b.setFont("normal", 9, [40, 40, 40] as any);
      b.writeText(safeText(v as string));
      b.spacer(1);
    }
    if (result.persona.canais?.length) {
      b.setFont("bold", 7, GRAY as any);
      b.writeText("CANAIS");
      b.setFont("normal", 9, [40, 40, 40] as any);
      b.writeText(result.persona.canais.join(", "));
    }
    b.spacer(4);
  }

  // ── Concorrencia ──
  if (result.analise_concorrencia) {
    b.heading("Analise de Concorrencia", 12);
    for (const c of result.analise_concorrencia.concorrentes || []) {
      b.ensureSpace(16);
      b.subheading(`> ${safeText(c.nome)}`, [40, 40, 40] as any);
      if (c.pontos_fortes?.length) {
        b.setFont("bold", 7, [34, 197, 94] as any);
        b.writeText("PONTOS FORTES");
        for (const p of c.pontos_fortes) b.bullet(safeText(p), [60, 60, 60] as any);
      }
      if (c.pontos_fracos?.length) {
        b.setFont("bold", 7, RED as any);
        b.writeText("PONTOS FRACOS");
        for (const p of c.pontos_fracos) b.bullet(safeText(p), [60, 60, 60] as any);
      }
      if (c.oportunidades?.length) {
        b.setFont("bold", 7, [59, 130, 246] as any);
        b.writeText("OPORTUNIDADES");
        for (const p of c.oportunidades) b.bullet(safeText(p), [60, 60, 60] as any);
      }
      b.spacer(3);
    }
    if (result.analise_concorrencia.diferencial_empresa) {
      b.setFont("bold", 7, GRAY as any);
      b.writeText("DIFERENCIAL DA EMPRESA");
      b.paragraph(result.analise_concorrencia.diferencial_empresa);
    }
    if (result.analise_concorrencia.posicionamento_recomendado) {
      b.setFont("bold", 7, GRAY as any);
      b.writeText("POSICIONAMENTO RECOMENDADO");
      b.paragraph(result.analise_concorrencia.posicionamento_recomendado);
    }
    b.spacer(4);
  }
}

// ═══════════════════════════════════════════════════════════════
// STRATEGIC PLAN SECTION (dark bg)
// ═══════════════════════════════════════════════════════════════
async function drawStrategicPlanSection(b: PdfBuilder, result: StrategyResult, chartRefs?: any) {
  const pdf = b.pdf;

  // Header
  b.ensureSpace(30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...RED);
  pdf.text("NOEXCUSE", A4_W / 2, b.y, { align: "center" });
  b.y += 6;
  pdf.setFontSize(22);
  pdf.setTextColor(...WHITE);
  pdf.text("PLANO ESTRATEGICO", A4_W / 2, b.y, { align: "center" });
  b.y += 6;
  pdf.setFontSize(9);
  pdf.setTextColor(...GRAY);
  pdf.text("Metodologia 5 Etapas — Execucao personalizada", A4_W / 2, b.y, { align: "center" });
  b.y += 4;
  pdf.setDrawColor(50, 50, 50);
  pdf.setLineWidth(0.3);
  pdf.line(M_LEFT, b.y, A4_W - M_RIGHT, b.y);
  b.y += 8;

  // ── 5 Etapas Overview ──
  if (result.etapas) {
    const keys = ["conteudo", "trafego", "web", "sales", "validacao"] as const;
    const overviewCardW = (CW - 12) / 5;

    b.ensureSpace(35);
    keys.forEach((key, i) => {
      const etapa = result.etapas![key];
      const x = M_LEFT + i * (overviewCardW + 3);
      const ec = etapaColorsRgb[key];

      pdf.setFillColor(...DARK2);
      pdf.roundedRect(x, b.y, overviewCardW, 28, 2, 2, "F");
      pdf.setDrawColor(...ec);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, b.y, overviewCardW, 28, 2, 2, "S");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(...ec);
      pdf.text(etapaNums[key], x + overviewCardW / 2, b.y + 10, { align: "center" });

      pdf.setFontSize(6);
      pdf.setTextColor(200, 200, 200);
      const label = etapaLabels[key].split(" ")[0];
      pdf.text(label, x + overviewCardW / 2, b.y + 16, { align: "center" });

      pdf.setFontSize(9);
      pdf.setTextColor(...scoreColor(etapa.score));
      pdf.text(`${etapa.score}%`, x + overviewCardW / 2, b.y + 24, { align: "center" });
    });
    b.y += 34;

    // ── Detailed Etapas ──
    for (const key of keys) {
      const etapa = result.etapas![key];
      const ec = etapaColorsRgb[key];
      drawEtapaCard(b, key, etapa, ec);
    }
  }

  // ── Projecoes ──
  if (result.projecoes) {
    await drawProjecoes(b, result.projecoes, chartRefs);
  }

  // ── Entregaveis ──
  if (result.entregaveis_calculadora?.length) {
    drawEntregaveis(b, result);
  }
}

function drawEtapaCard(b: PdfBuilder, key: string, etapa: EtapaEstrategica, ec: [number, number, number]) {
  const pdf = b.pdf;
  const textMaxW = CW - 16; // safe text width inside cards

  // Estimate height needed
  const probH = (etapa.problemas?.length || 0) * 6;
  const acoesH = (etapa.acoes?.length || 0) * 6;
  const metricasH = Object.keys(etapa.metricas_alvo || {}).length > 0 ? 18 : 0;
  const entregH = (etapa.entregaveis?.length || 0) > 0 ? 8 : 0;
  const neededH = 24 + probH + acoesH + metricasH + entregH;
  b.ensureSpace(Math.min(neededH, 60));

  // Card header
  pdf.setFillColor(...DARK2);
  pdf.roundedRect(M_LEFT, b.y, CW, 16, 2, 2, "F");
  pdf.setDrawColor(...ec);
  pdf.setLineWidth(0.5);
  pdf.line(M_LEFT, b.y, M_LEFT, b.y + 16);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...ec);
  pdf.text(etapaNums[key], M_LEFT + 10, b.y + 11);

  pdf.setFontSize(11);
  pdf.setTextColor(...WHITE);
  pdf.text(safeText(etapaLabels[key]), M_LEFT + 26, b.y + 7);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...GRAY);
  const diagLines = pdf.splitTextToSize(safeText(etapa.diagnostico || ""), CW - 60);
  pdf.text(diagLines.slice(0, 2), M_LEFT + 26, b.y + 12);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...scoreColor(etapa.score));
  pdf.text(`${etapa.score}%`, A4_W - M_RIGHT - 8, b.y + 10, { align: "center" });

  b.y += 20;

  // Problemas
  if (etapa.problemas?.length) {
    b.ensureSpace(10);
    b.drawIconSquare(M_LEFT + 4, b.y, [239, 68, 68]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(239, 68, 68);
    pdf.text("PROBLEMAS IDENTIFICADOS", M_LEFT + 9, b.y);
    b.y += 4;
    for (const p of etapa.problemas) {
      b.ensureSpace(6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(200, 200, 200);
      const lines = pdf.splitTextToSize(`- ${safeText(p)}`, textMaxW);
      for (const line of lines) {
        b.ensureSpace(4);
        pdf.text(line, M_LEFT + 6, b.y);
        b.y += 3.5;
      }
      b.y += 0.5;
    }
    b.y += 2;
  }

  // Acoes
  if (etapa.acoes?.length) {
    b.ensureSpace(10);
    b.drawIconSquare(M_LEFT + 4, b.y, [34, 197, 94]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(34, 197, 94);
    pdf.text("ACOES ESTRATEGICAS", M_LEFT + 9, b.y);
    b.y += 4;
    for (const a of etapa.acoes) {
      b.ensureSpace(6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(220, 220, 220);
      const lines = pdf.splitTextToSize(`> ${safeText(a)}`, textMaxW);
      for (const line of lines) {
        b.ensureSpace(4);
        pdf.text(line, M_LEFT + 6, b.y);
        b.y += 3.5;
      }
      b.y += 0.5;
    }
    b.y += 2;
  }

  // Metricas
  if (etapa.metricas_alvo && Object.keys(etapa.metricas_alvo).length) {
    b.ensureSpace(10);
    b.drawIconSquare(M_LEFT + 4, b.y, [59, 130, 246]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(59, 130, 246);
    pdf.text("METRICAS-ALVO", M_LEFT + 9, b.y);
    b.y += 4;
    const entries = Object.entries(etapa.metricas_alvo);
    const colW = (CW - 15) / Math.min(entries.length, 3);
    entries.forEach(([k, v], i) => {
      const col = i % 3;
      if (i > 0 && col === 0) b.y += 10;
      b.ensureSpace(10);
      const x = M_LEFT + 4 + col * (colW + 3);
      pdf.setFillColor(30, 30, 30);
      pdf.roundedRect(x, b.y, colW, 8, 1, 1, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(...GRAY);
      pdf.text(safeText(k.replace(/_/g, " ").toUpperCase()), x + 2, b.y + 3);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...ec);
      // Wrap metric value
      const metricVal = safeText(String(v));
      const metricLines = pdf.splitTextToSize(metricVal, colW - 4);
      pdf.text(metricLines[0] || "", x + 2, b.y + 7);
    });
    b.y += 12;
  }

  // Entregaveis
  if (etapa.entregaveis?.length) {
    b.ensureSpace(10);
    b.drawIconSquare(M_LEFT + 4, b.y, GRAY as any);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...GRAY);
    pdf.text("ENTREGAVEIS NOEXCUSE", M_LEFT + 9, b.y);
    b.y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    // Wrap entregaveis text properly
    const entText = etapa.entregaveis.map(e => safeText(e)).join("  |  ");
    const entLines = pdf.splitTextToSize(entText, CW - 12);
    for (const el of entLines) {
      b.ensureSpace(4);
      pdf.text(el, M_LEFT + 6, b.y);
      b.y += 3.5;
    }
    b.y += 2;
  }

  b.y += 6;
}

async function drawProjecoes(b: PdfBuilder, proj: NonNullable<StrategyResult["projecoes"]>, chartRefs?: any) {
  const pdf = b.pdf;

  // Unit Economics
  b.ensureSpace(30);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...WHITE);
  pdf.text("Unit Economics", M_LEFT, b.y);
  b.y += 6;

  const ueItems = [
    { l: "CAC", v: proj.unit_economics.cac },
    { l: "LTV", v: proj.unit_economics.ltv },
    { l: "LTV/CAC", v: proj.unit_economics.ltv_cac_ratio },
    { l: "Ticket Medio", v: proj.unit_economics.ticket_medio },
    { l: "Margem", v: proj.unit_economics.margem },
  ];
  const ueW = (CW - 12) / 5;
  b.ensureSpace(22);
  ueItems.forEach((item, i) => {
    const x = M_LEFT + i * (ueW + 3);
    pdf.setFillColor(...DARK2);
    pdf.roundedRect(x, b.y, ueW, 18, 2, 2, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...GRAY);
    pdf.text(item.l.toUpperCase(), x + ueW / 2, b.y + 6, { align: "center" });
    pdf.setFont("helvetica", "bold");
    // Wrap UE value
    const val = safeText(item.v || "—");
    let fs = 10;
    pdf.setFontSize(fs);
    let vLines = pdf.splitTextToSize(val, ueW - 4);
    if (vLines.length > 1) {
      fs = 7;
      pdf.setFontSize(fs);
      vLines = pdf.splitTextToSize(val, ueW - 4);
    }
    pdf.setTextColor(...RED);
    pdf.text(vLines[0] || "", x + ueW / 2, b.y + 13, { align: "center" });
    if (vLines[1]) {
      pdf.text(vLines[1], x + ueW / 2, b.y + 13 + fs * 0.4, { align: "center" });
    }
  });
  b.y += 24;

  // Funil de Conversao
  if (proj.funil_conversao?.length) {
    b.ensureSpace(15 + proj.funil_conversao.length * 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...WHITE);
    pdf.text("Funil de Conversao", M_LEFT, b.y);
    b.y += 6;
    for (const step of proj.funil_conversao) {
      b.ensureSpace(8);
      pdf.setFillColor(...DARK2);
      pdf.roundedRect(M_LEFT, b.y, CW, 7, 1, 1, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(200, 200, 200);
      pdf.text(safeText(step.etapa), M_LEFT + 4, b.y + 5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...WHITE);
      pdf.text(step.volume.toLocaleString("pt-BR"), A4_W - M_RIGHT - 20, b.y + 5, { align: "right" });
      pdf.setFontSize(7);
      pdf.setTextColor(...GRAY);
      pdf.text(safeText(step.taxa), A4_W - M_RIGHT - 2, b.y + 5, { align: "right" });
      b.y += 9;
    }
    b.y += 4;
  }

  // Projecao Mensal
  if (proj.projecao_mensal?.length) {
    b.ensureSpace(30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...WHITE);
    pdf.text("Projecao de 6 Meses", M_LEFT, b.y);
    b.y += 6;

    if (chartRefs?.bar) {
      try {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(chartRefs.bar, { scale: 2, useCORS: true, backgroundColor: "#18181b", logging: false });
        const imgData = canvas.toDataURL("image/png");
        const imgW = CW;
        const imgH = Math.min((canvas.height * imgW) / canvas.width, 60);
        b.ensureSpace(imgH + 4);
        pdf.addImage(imgData, "PNG", M_LEFT, b.y, imgW, imgH);
        b.y += imgH + 4;
      } catch {
        drawProjectionTable(b, proj.projecao_mensal);
      }
    } else {
      drawProjectionTable(b, proj.projecao_mensal);
    }
  }

  // Crescimento Acumulado
  if (proj.crescimento_acumulado?.length) {
    b.ensureSpace(30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...WHITE);
    pdf.text("Crescimento Acumulado", M_LEFT, b.y);
    b.y += 6;

    if (chartRefs?.line) {
      try {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(chartRefs.line, { scale: 2, useCORS: true, backgroundColor: "#18181b", logging: false });
        const imgData = canvas.toDataURL("image/png");
        const imgW = CW;
        const imgH = Math.min((canvas.height * imgW) / canvas.width, 60);
        b.ensureSpace(imgH + 4);
        pdf.addImage(imgData, "PNG", M_LEFT, b.y, imgW, imgH);
        b.y += imgH + 4;
      } catch {
        drawGrowthTable(b, proj.crescimento_acumulado);
      }
    } else {
      drawGrowthTable(b, proj.crescimento_acumulado);
    }
  }
}

function drawProjectionTable(b: PdfBuilder, data: any[]) {
  const pdf = b.pdf;
  const cols = ["Mes", "Leads", "Clientes", "Receita", "Investimento"];
  const colW = CW / cols.length;

  b.ensureSpace(8 + data.length * 7);
  cols.forEach((c, i) => {
    pdf.setFillColor(40, 40, 40);
    pdf.rect(M_LEFT + i * colW, b.y, colW, 6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    pdf.text(c, M_LEFT + i * colW + colW / 2, b.y + 4, { align: "center" });
  });
  b.y += 7;

  for (const row of data) {
    b.ensureSpace(7);
    const vals = [
      `Mes ${row.mes}`,
      row.leads?.toLocaleString("pt-BR") || "0",
      row.clientes?.toLocaleString("pt-BR") || "0",
      `R$ ${(row.receita || 0).toLocaleString("pt-BR")}`,
      `R$ ${(row.investimento || 0).toLocaleString("pt-BR")}`,
    ];
    vals.forEach((v, i) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 200);
      pdf.text(v, M_LEFT + i * colW + colW / 2, b.y + 4, { align: "center" });
    });
    b.y += 6;
  }
  b.y += 4;
}

function drawGrowthTable(b: PdfBuilder, data: any[]) {
  const pdf = b.pdf;
  const cols = ["Mes", "Receita Acumulada", "Clientes Acumulados"];
  const colW = CW / cols.length;

  b.ensureSpace(8 + data.length * 7);
  cols.forEach((c, i) => {
    pdf.setFillColor(40, 40, 40);
    pdf.rect(M_LEFT + i * colW, b.y, colW, 6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    pdf.text(c, M_LEFT + i * colW + colW / 2, b.y + 4, { align: "center" });
  });
  b.y += 7;

  for (const row of data) {
    b.ensureSpace(7);
    const vals = [
      `Mes ${row.mes}`,
      `R$ ${(row.receita_acumulada || 0).toLocaleString("pt-BR")}`,
      (row.clientes_acumulados || 0).toLocaleString("pt-BR"),
    ];
    vals.forEach((v, i) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 200);
      pdf.text(v, M_LEFT + i * colW + colW / 2, b.y + 4, { align: "center" });
    });
    b.y += 6;
  }
  b.y += 4;
}

function drawEntregaveis(b: PdfBuilder, result: StrategyResult) {
  const pdf = b.pdf;
  const entries = result.entregaveis_calculadora!;

  b.ensureSpace(20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...WHITE);
  pdf.text("Execucoes do Plano — O Que Precisa Ser Feito", M_LEFT, b.y);
  b.y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.text("Servicos do catalogo NoExcuse necessarios para execucao do plano:", M_LEFT, b.y);
  b.y += 6;

  // Group by etapa
  const grouped: Record<string, typeof entries> = {};
  entries.forEach((e) => {
    const k = e.etapa || "geral";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(e);
  });
  const order = ["conteudo", "trafego", "web", "sales", "validacao", "geral"];

  for (const key of order) {
    if (!grouped[key]?.length) continue;
    b.ensureSpace(12);
    const ec = etapaColorsRgb[key] || GRAY;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...ec);
    pdf.text(`${etapaNums[key] ? etapaNums[key] + " - " : ""}${etapaLabels[key] || "Geral"}`, M_LEFT, b.y);
    b.y += 5;

    for (const e of grouped[key]!) {
      const justText = safeText(e.justificativa || "");
      const jLines = justText ? b.pdf.splitTextToSize(justText, CW - 28) : [];
      const itemH = 10 + (jLines.length > 0 ? (jLines.length - 1) * 3 : 0);
      b.ensureSpace(itemH + 2);

      pdf.setFillColor(...DARK2);
      pdf.roundedRect(M_LEFT + 4, b.y, CW - 8, itemH, 1, 1, "F");

      // Quantity badge
      pdf.setFillColor(60, 20, 20);
      pdf.roundedRect(M_LEFT + 6, b.y + 1.5, 10, 5, 1, 1, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(239, 130, 130);
      pdf.text(`x${e.quantity}`, M_LEFT + 11, b.y + 5, { align: "center" });

      // Name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...WHITE);
      pdf.text(safeText(e.service_name), M_LEFT + 19, b.y + 5);

      // Justificativa
      if (jLines.length) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...GRAY);
        pdf.text(jLines, M_LEFT + 19, b.y + 9);
      }
      b.y += itemH + 1;
    }
    b.y += 3;
  }

  // Total
  b.ensureSpace(12);
  pdf.setFillColor(...DARK2);
  pdf.roundedRect(M_LEFT, b.y, CW, 10, 2, 2, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.text(`Total de `, M_LEFT + CW / 2 - 15, b.y + 6);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...RED);
  pdf.text(`${entries.length}`, M_LEFT + CW / 2 + 3, b.y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...GRAY);
  pdf.text(` servicos recomendados`, M_LEFT + CW / 2 + 7, b.y + 6);
  b.y += 14;
}
