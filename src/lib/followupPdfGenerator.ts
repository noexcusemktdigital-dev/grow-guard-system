import jsPDF from "jspdf";
import type {
  FollowupAnalise,
  FollowupPlano,
  AnaliseSubSection,
  TrafegoPlataforma,
  WebSecao,
} from "@/hooks/useClientFollowups";
import { MONTH_NAMES } from "@/lib/formatting";
import logoWhiteSrc from "@/assets/logo-noexcuse-white.png";

const ML = 15;
const MR = 15;
const MT = 20;
const PW = 210;
const PH = 297;
const CW = PW - ML - MR;
const ACCENT = [220, 38, 38] as [number, number, number];
const DARK_BG = [15, 15, 15] as [number, number, number];
const LIGHT_BG = [255, 255, 255] as [number, number, number];

function getMonthLabel(ref: string) {
  const [y, m] = ref.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function safeText(t: string) {
  return t.replace(/[\u{1F000}-\u{1FFFF}]/gu, "").replace(/[^\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF]/g, "");
}

async function loadLogoAsDataUrl(): Promise<string | null> {
  try {
    const resp = await fetch(logoWhiteSrc);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateFollowupPdf(
  clientName: string,
  monthRef: string,
  analise: FollowupAnalise,
  plano: FollowupPlano,
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const logo = await loadLogoAsDataUrl();
  let y = MT;

  const ensureSpace = (needed: number) => {
    if (y + needed > PH - 15) {
      pdf.addPage();
      y = MT;
    }
  };

  const setPageBg = (isDark: boolean) => {
    const bg = isDark ? DARK_BG : LIGHT_BG;
    pdf.setFillColor(...bg);
    pdf.rect(0, 0, PW, PH, "F");
  };

  const drawSectionTitle = (title: string, isDark = false) => {
    ensureSpace(14);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
    pdf.text(safeText(title.toUpperCase()), ML, y);
    y += 2;
    pdf.setDrawColor(...ACCENT);
    pdf.setLineWidth(0.8);
    pdf.line(ML, y, ML + CW, y);
    y += 8;
  };

  const drawLabel = (label: string, isDark = false) => {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(isDark ? 180 : 120, isDark ? 180 : 120, isDark ? 180 : 120);
    pdf.text(safeText(label.toUpperCase()), ML, y);
    y += 4;
  };

  const drawText = (text: string, isDark = false, indent = 0) => {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(isDark ? 220 : 40, isDark ? 220 : 40, isDark ? 220 : 40);
    const lines = pdf.splitTextToSize(safeText(text), CW - indent);
    for (const line of lines) {
      ensureSpace(5);
      pdf.text(line, ML + indent, y);
      y += 4.5;
    }
  };

  const drawBulletList = (items: string[], isDark = false) => {
    items.filter(Boolean).forEach((item) => {
      ensureSpace(6);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(isDark ? 220 : 40, isDark ? 220 : 40, isDark ? 220 : 40);
      const lines = pdf.splitTextToSize("- " + safeText(item), CW - 4);
      lines.forEach((l: string) => {
        ensureSpace(5);
        pdf.text(l, ML + 2, y);
        y += 4.5;
      });
    });
    y += 2;
  };

  // ─── Draw analysis sub-section ───
  const drawAnaliseArea = (title: string, section: AnaliseSubSection | undefined, isDark: boolean) => {
    if (!section) return;

    ensureSpace(20);

    // Area title with accent bar
    pdf.setFillColor(...ACCENT);
    pdf.rect(ML, y - 1, 2, 7, "F");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
    pdf.text(safeText(title), ML + 5, y + 4);
    y += 12;

    // Metrics as cards
    const metricas = section.metricas || {};
    const metricEntries = Object.entries(metricas).filter(([, v]) => v !== undefined && v !== 0);
    if (metricEntries.length > 0) {
      const cols = Math.min(metricEntries.length, 4);
      const cardW = (CW - (cols - 1) * 3) / cols;
      const rows = Math.ceil(metricEntries.length / cols);

      for (let row = 0; row < rows; row++) {
        ensureSpace(22);
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          if (idx >= metricEntries.length) break;
          const [label, val] = metricEntries[idx];
          const x = ML + col * (cardW + 3);

          pdf.setFillColor(isDark ? 25 : 245, isDark ? 25 : 245, isDark ? 25 : 245);
          pdf.roundedRect(x, y, cardW, 18, 2, 2, "F");

          pdf.setFontSize(6.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(isDark ? 160 : 120, isDark ? 160 : 120, isDark ? 160 : 120);
          const truncLabel = safeText(label).substring(0, 18).toUpperCase();
          pdf.text(truncLabel, x + cardW / 2, y + 6, { align: "center" });

          pdf.setFontSize(13);
          pdf.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
          const valStr = typeof val === "number" ? val.toLocaleString("pt-BR") : String(val ?? 0);
          pdf.text(valStr, x + cardW / 2, y + 14, { align: "center" });
        }
        y += 22;
      }
      y += 2;
    }

    // Positivos
    if (section.positivos?.filter(Boolean).length) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(34, 197, 94);
      pdf.text("PONTOS POSITIVOS", ML + 2, y);
      y += 4;
      drawBulletList(section.positivos, isDark);
    }

    // Negativos
    if (section.negativos?.filter(Boolean).length) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(239, 68, 68);
      pdf.text("PONTOS NEGATIVOS", ML + 2, y);
      y += 4;
      drawBulletList(section.negativos, isDark);
    }

    // Observações
    if (section.observacoes) {
      drawLabel("OBSERVACOES", isDark);
      drawText(section.observacoes, isDark, 2);
      y += 2;
    }

    y += 4;
  };

  // ═══ COVER PAGE ═══
  setPageBg(true);
  if (logo) {
    const img = new Image();
    img.src = logo;
    await new Promise((r) => { img.onload = r; img.onerror = r; });
    const ratio = img.naturalWidth / img.naturalHeight;
    const logoW = 50;
    const logoH = logoW / ratio;
    pdf.addImage(logo, "PNG", (PW - logoW) / 2, 60, logoW, logoH);
    y = 60 + logoH + 15;
  } else {
    y = 80;
  }

  pdf.setDrawColor(...ACCENT);
  pdf.setLineWidth(1.5);
  pdf.line(PW / 2 - 30, y, PW / 2 + 30, y);
  y += 15;

  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("ACOMPANHAMENTO MENSAL", PW / 2, y, { align: "center" });
  y += 12;

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.text(safeText(clientName), PW / 2, y, { align: "center" });
  y += 10;

  pdf.setFontSize(12);
  pdf.setTextColor(180, 180, 180);
  pdf.text(getMonthLabel(monthRef), PW / 2, y, { align: "center" });

  // ═══ SECTION 1: ANÁLISE (light page) ═══
  pdf.addPage();
  setPageBg(false);
  y = MT;
  drawSectionTitle("1. Analise do Mes Atual");

  drawAnaliseArea("Conteudo & Criativos", analise.conteudo, false);
  drawAnaliseArea("Trafego Pago", analise.trafego, false);
  drawAnaliseArea("Web / Site", analise.web, false);
  drawAnaliseArea("Vendas / CRM", analise.vendas, false);

  // Resumo Geral
  if (analise.resumo_geral || analise.avancos_mes?.length || analise.pontos_melhorar?.length) {
    ensureSpace(20);
    drawSectionTitle("Resumo Geral");

    if (analise.resumo_geral) {
      drawText(analise.resumo_geral);
      y += 4;
    }

    if (analise.avancos_mes?.filter(Boolean).length) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(34, 197, 94);
      pdf.text("AVANCOS DO MES", ML, y);
      y += 4;
      drawBulletList(analise.avancos_mes);
    }

    if (analise.pontos_melhorar?.filter(Boolean).length) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(245, 158, 11);
      pdf.text("PONTOS A MELHORAR", ML, y);
      y += 4;
      drawBulletList(analise.pontos_melhorar);
    }
  }

  // ═══ SECTION 2: CONTEÚDO (dark) ═══
  pdf.addPage();
  setPageBg(true);
  y = MT;
  drawSectionTitle("2. Plano de Conteudo - Proximo Mes", true);

  const c = plano.conteudo || {};

  if (c.linha_editorial) {
    drawLabel("LINHA EDITORIAL", true);
    drawText(c.linha_editorial, true);
    y += 3;
  }

  if (c.qtd_postagens) {
    drawLabel("QUANTIDADE DE POSTAGENS", true);
    drawText(String(c.qtd_postagens), true);
    y += 3;
  }

  if (c.tipo_conteudo?.length) {
    drawLabel("TIPOS DE CONTEUDO", true);
    drawText(c.tipo_conteudo.join(", "), true);
    y += 3;
  }

  if (c.roteiros?.filter(Boolean).length) {
    drawLabel("ROTEIROS", true);
    drawBulletList(c.roteiros, true);
  }

  if (c.artes?.filter(Boolean).length) {
    drawLabel("ARTES / CRIATIVOS", true);
    drawBulletList(c.artes, true);
  }

  if (c.referencias?.filter(Boolean).length) {
    drawLabel("REFERENCIAS", true);
    drawBulletList(c.referencias, true);
  }

  if (c.necessidades_cliente?.filter(Boolean).length) {
    drawLabel("NECESSIDADES DO CLIENTE", true);
    drawBulletList(c.necessidades_cliente, true);
  }

  // ═══ SECTION 3: TRÁFEGO (dark) ═══
  pdf.addPage();
  setPageBg(true);
  y = MT;
  drawSectionTitle("3. Plano de Trafego Pago - Proximo Mes", true);

  const plats = plano.trafego?.plataformas || [];
  plats.forEach((p: TrafegoPlataforma, idx: number) => {
    ensureSpace(45);
    pdf.setDrawColor(50, 50, 50);
    pdf.setLineWidth(0.3);
    const cardY = y;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...ACCENT);
    pdf.text(safeText(p.nome || `Plataforma ${idx + 1}`), ML + 4, y + 6);
    y += 12;

    const fields = [
      ["Tipo de Campanha", p.tipo_campanha],
      ["O que vai rodar", p.conteudo_campanha],
      ["Publicos", p.publicos],
      ["Objetivo", p.objetivo],
      ["Investimento", p.investimento ? `R$ ${p.investimento.toLocaleString("pt-BR")}` : ""],
      ["Divisao", p.divisao_investimento],
      ["Metricas Meta", p.metricas_meta],
    ];

    fields.forEach(([label, value]) => {
      if (value) {
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(150, 150, 150);
        pdf.text(String(label).toUpperCase(), ML + 4, y);
        y += 3.5;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(220, 220, 220);
        const lines = pdf.splitTextToSize(safeText(String(value)), CW - 12);
        lines.forEach((l: string) => {
          ensureSpace(5);
          pdf.text(l, ML + 4, y);
          y += 4.5;
        });
        y += 1;
      }
    });

    const cardH = y - cardY + 4;
    pdf.roundedRect(ML, cardY - 2, CW, cardH, 3, 3, "S");
    y += 6;
  });

  if (plats.length === 0) {
    drawText("Nenhuma plataforma adicionada.", true);
  }

  // ═══ SECTION 4: WEB (dark) ═══
  pdf.addPage();
  setPageBg(true);
  y = MT;
  drawSectionTitle("4. Plano Web / Landing Pages - Proximo Mes", true);

  const secoes = plano.web?.secoes || [];
  secoes.forEach((s: WebSecao, idx: number) => {
    ensureSpace(20);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...ACCENT);
    pdf.text(`${idx + 1}. ${safeText(s.titulo || "Secao")}`, ML, y);
    y += 6;

    if (s.motivo) {
      drawLabel("MOTIVO / JUSTIFICATIVA", true);
      drawText(s.motivo, true, 2);
    }
    if (s.necessidades_cliente) {
      drawLabel("NECESSIDADES DO CLIENTE", true);
      drawText(s.necessidades_cliente, true, 2);
    }
    y += 4;
  });

  if (secoes.length === 0) {
    drawText("Nenhuma alteracao web planejada.", true);
  }

  // ═══ SECTION 5: VENDAS (dark) ═══
  pdf.addPage();
  setPageBg(true);
  y = MT;
  drawSectionTitle("5. Plano de Vendas / CRM - Proximo Mes", true);

  const v = plano.vendas || {};

  if (v.analise_crm) {
    drawLabel("ANALISE DO CRM", true);
    drawText(v.analise_crm, true);
    y += 3;
  }

  if (v.estrategias?.filter(Boolean).length) {
    drawLabel("ESTRATEGIAS PROPOSTAS", true);
    drawBulletList(v.estrategias, true);
  }

  if (v.melhorias?.filter(Boolean).length) {
    drawLabel("MELHORIAS SUGERIDAS", true);
    drawBulletList(v.melhorias, true);
  }

  pdf.save(`acompanhamento-${clientName.replace(/\s+/g, "_")}-${monthRef}.pdf`);
}
