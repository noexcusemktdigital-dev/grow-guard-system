// jsPDF is loaded dynamically to keep it out of the initial bundle (PERF-001)
type jsPDFType = import("jspdf").default;
import type {
  FollowupAnalise,
  FollowupPlano,
  AnaliseSubSection,
  ConteudoPauta,
  TrafegoCampanha,
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
  } catch { return null; }
}

class PdfHelper {
  pdf: jsPDFType;
  y = MT;

  constructor(pdf: jsPDFType) { this.pdf = pdf; }

  ensureSpace(needed: number) {
    if (this.y + needed > PH - 15) { this.pdf.addPage(); this.y = MT; }
  }

  setPageBg(isDark: boolean) {
    const bg = isDark ? DARK_BG : LIGHT_BG;
    this.pdf.setFillColor(...bg);
    this.pdf.rect(0, 0, PW, PH, "F");
  }

  newPage(isDark: boolean) {
    this.pdf.addPage();
    this.setPageBg(isDark);
    this.y = MT;
  }

  sectionTitle(title: string, isDark = false) {
    this.ensureSpace(14);
    this.pdf.setFontSize(13);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
    this.pdf.text(safeText(title.toUpperCase()), ML, this.y);
    this.y += 2;
    this.pdf.setDrawColor(...ACCENT);
    this.pdf.setLineWidth(0.8);
    this.pdf.line(ML, this.y, ML + CW, this.y);
    this.y += 8;
  }

  label(text: string, isDark = false) {
    this.pdf.setFontSize(8);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(isDark ? 180 : 120, isDark ? 180 : 120, isDark ? 180 : 120);
    this.pdf.text(safeText(text.toUpperCase()), ML, this.y);
    this.y += 4;
  }

  text(text: string, isDark = false, indent = 0) {
    this.pdf.setFontSize(9);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(isDark ? 220 : 40, isDark ? 220 : 40, isDark ? 220 : 40);
    const lines = this.pdf.splitTextToSize(safeText(text), CW - indent);
    for (const line of lines) {
      this.ensureSpace(5);
      this.pdf.text(line, ML + indent, this.y);
      this.y += 4.5;
    }
  }

  bulletList(items: string[], isDark = false) {
    items.filter(Boolean).forEach((item) => {
      this.ensureSpace(6);
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(isDark ? 220 : 40, isDark ? 220 : 40, isDark ? 220 : 40);
      const lines = this.pdf.splitTextToSize("- " + safeText(item), CW - 4);
      lines.forEach((l: string) => {
        this.ensureSpace(5);
        this.pdf.text(l, ML + 2, this.y);
        this.y += 4.5;
      });
    });
    this.y += 2;
  }

  fieldRow(label: string, value: string | number | undefined, isDark: boolean, indent = 4) {
    if (!value && value !== 0) return;
    const val = String(value);
    if (!val.trim()) return;
    this.ensureSpace(8);
    this.pdf.setFontSize(7);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(isDark ? 150 : 120, isDark ? 150 : 120, isDark ? 150 : 120);
    this.pdf.text(safeText(label.toUpperCase()), ML + indent, this.y);
    this.y += 3.5;
    this.pdf.setFontSize(9);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(isDark ? 220 : 40, isDark ? 220 : 40, isDark ? 220 : 40);
    const lines = this.pdf.splitTextToSize(safeText(val), CW - indent - 4);
    lines.forEach((l: string) => {
      this.ensureSpace(5);
      this.pdf.text(l, ML + indent, this.y);
      this.y += 4.5;
    });
    this.y += 1;
  }

  metricCards(metricas: Record<string, number>, isDark: boolean) {
    const entries = Object.entries(metricas).filter(([, v]) => v !== undefined && v !== 0);
    if (entries.length === 0) return;
    const cols = Math.min(entries.length, 4);
    const cardW = (CW - (cols - 1) * 3) / cols;
    const rows = Math.ceil(entries.length / cols);

    for (let row = 0; row < rows; row++) {
      this.ensureSpace(22);
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (idx >= entries.length) break;
        const [lbl, val] = entries[idx];
        const x = ML + col * (cardW + 3);
        this.pdf.setFillColor(isDark ? 25 : 245, isDark ? 25 : 245, isDark ? 25 : 245);
        this.pdf.roundedRect(x, this.y, cardW, 18, 2, 2, "F");
        this.pdf.setFontSize(6.5);
        this.pdf.setFont("helvetica", "bold");
        this.pdf.setTextColor(isDark ? 160 : 120, isDark ? 160 : 120, isDark ? 160 : 120);
        this.pdf.text(safeText(lbl).substring(0, 18).toUpperCase(), x + cardW / 2, this.y + 6, { align: "center" });
        this.pdf.setFontSize(13);
        this.pdf.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
        this.pdf.text(val.toLocaleString("pt-BR"), x + cardW / 2, this.y + 14, { align: "center" });
      }
      this.y += 22;
    }
    this.y += 2;
  }

  analiseArea(title: string, section: AnaliseSubSection | undefined, isDark: boolean) {
    if (!section) return;
    this.ensureSpace(20);
    this.pdf.setFillColor(...ACCENT);
    this.pdf.rect(ML, this.y - 1, 2, 7, "F");
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
    this.pdf.text(safeText(title), ML + 5, this.y + 4);
    this.y += 12;

    this.metricCards(section.metricas || {}, isDark);

    if (section.positivos?.filter(Boolean).length) {
      this.pdf.setFontSize(8); this.pdf.setFont("helvetica", "bold"); this.pdf.setTextColor(34, 197, 94);
      this.pdf.text("PONTOS POSITIVOS", ML + 2, this.y); this.y += 4;
      this.bulletList(section.positivos, isDark);
    }
    if (section.negativos?.filter(Boolean).length) {
      this.pdf.setFontSize(8); this.pdf.setFont("helvetica", "bold"); this.pdf.setTextColor(239, 68, 68);
      this.pdf.text("PONTOS NEGATIVOS", ML + 2, this.y); this.y += 4;
      this.bulletList(section.negativos, isDark);
    }
    if (section.observacoes) {
      this.label("OBSERVACOES", isDark);
      this.text(section.observacoes, isDark, 2);
      this.y += 2;
    }
    this.y += 4;
  }
}

export async function generateFollowupPdf(
  clientName: string,
  monthRef: string,
  analise: FollowupAnalise,
  plano: FollowupPlano,
) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const logo = await loadLogoAsDataUrl();
  const h = new PdfHelper(pdf);

  // ═══ COVER ═══
  h.setPageBg(true);
  if (logo) {
    const img = new Image();
    img.src = logo;
    await new Promise((r) => { img.onload = r; img.onerror = r; });
    const ratio = img.naturalWidth / img.naturalHeight;
    const logoW = 50;
    const logoH = logoW / ratio;
    pdf.addImage(logo, "PNG", (PW - logoW) / 2, 60, logoW, logoH);
    h.y = 60 + logoH + 15;
  } else { h.y = 80; }

  pdf.setDrawColor(...ACCENT);
  pdf.setLineWidth(1.5);
  pdf.line(PW / 2 - 30, h.y, PW / 2 + 30, h.y);
  h.y += 15;
  pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
  pdf.text("ACOMPANHAMENTO MENSAL", PW / 2, h.y, { align: "center" });
  h.y += 12;
  pdf.setFontSize(16); pdf.setFont("helvetica", "normal");
  pdf.text(safeText(clientName), PW / 2, h.y, { align: "center" });
  h.y += 10;
  pdf.setFontSize(12); pdf.setTextColor(180, 180, 180);
  pdf.text(getMonthLabel(monthRef), PW / 2, h.y, { align: "center" });

  // ═══ ANÁLISE ═══
  h.newPage(false);
  h.sectionTitle("1. Analise do Mes Atual");
  h.analiseArea("Conteudo & Criativos", analise.conteudo, false);
  h.analiseArea("Trafego Pago", analise.trafego, false);
  h.analiseArea("Web / Site", analise.web, false);
  h.analiseArea("Vendas / CRM", analise.vendas, false);

  if (analise.resumo_geral || analise.avancos_mes?.length || analise.pontos_melhorar?.length) {
    h.ensureSpace(20);
    h.sectionTitle("Resumo Geral");
    if (analise.resumo_geral) { h.text(analise.resumo_geral); h.y += 4; }
    if (analise.avancos_mes?.filter(Boolean).length) {
      pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(34, 197, 94);
      pdf.text("AVANCOS DO MES", ML, h.y); h.y += 4;
      h.bulletList(analise.avancos_mes);
    }
    if (analise.pontos_melhorar?.filter(Boolean).length) {
      pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(245, 158, 11);
      pdf.text("PONTOS A MELHORAR", ML, h.y); h.y += 4;
      h.bulletList(analise.pontos_melhorar);
    }
  }

  // ═══ CONTEÚDO ═══
  h.newPage(true);
  h.sectionTitle("2. Plano de Conteudo - Proximo Mes", true);

  const cont = plano.conteudo || {};
  if (cont.linha_editorial) { h.label("LINHA EDITORIAL", true); h.text(cont.linha_editorial, true); h.y += 3; }
  if (cont.qtd_postagens) { h.label("TOTAL DE POSTAGENS", true); h.text(String(cont.qtd_postagens), true); h.y += 3; }

  const pautas = cont.pautas || [];
  const pautasOrg = pautas.filter((p) => p.tipo === "organico");
  const pautasPago = pautas.filter((p) => p.tipo === "pago");

  const drawPauta = (p: ConteudoPauta, idx: number) => {
    h.ensureSpace(40);
    const cardY = h.y;
    pdf.setFontSize(10); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...ACCENT);
    pdf.text(`${idx + 1}. ${safeText(p.titulo || "Post")}`, ML + 4, h.y + 5);
    h.y += 10;

    // Info row
    const infoParts = [p.formato, p.plataforma, p.tempo_duracao, p.data_postagem].filter(Boolean);
    if (infoParts.length) {
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(160, 160, 160);
      pdf.text(infoParts.join("  |  "), ML + 4, h.y);
      h.y += 5;
    }

    h.fieldRow("Objetivo", p.objetivo, true);
    h.fieldRow("Roteiro", p.roteiro, true);
    h.fieldRow("CTA", p.cta, true);
    h.fieldRow("Referencias", p.referencias, true);
    h.fieldRow("Necessidades do Cliente", p.necessidades_cliente, true);
    if (p.observacoes) h.fieldRow("Observacoes", p.observacoes, true);

    const cardH = h.y - cardY + 2;
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.3);
    pdf.roundedRect(ML, cardY - 2, CW, cardH, 3, 3, "S");
    h.y += 4;
  };

  if (pautasOrg.length > 0) {
    h.label("PAUTA ORGANICA (" + pautasOrg.length + " POSTS)", true);
    pautasOrg.forEach((p, i) => drawPauta(p, i));
  }

  if (pautasPago.length > 0) {
    h.ensureSpace(10);
    h.label("CRIATIVOS PAGOS (" + pautasPago.length + " PECAS)", true);
    pautasPago.forEach((p, i) => drawPauta(p, i));
  }

  if (cont.necessidades_cliente?.filter(Boolean).length) {
    h.ensureSpace(10);
    h.label("NECESSIDADES DO CLIENTE (CONTEUDO)", true);
    h.bulletList(cont.necessidades_cliente, true);
  }

  // ═══ TRÁFEGO ═══
  h.newPage(true);
  h.sectionTitle("3. Campanhas de Trafego Pago - Proximo Mes", true);

  const campanhas = plano.trafego?.campanhas || [];
  campanhas.forEach((c, idx) => {
    h.ensureSpace(50);
    const cardY = h.y;
    pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...ACCENT);
    pdf.text(safeText(c.nome_campanha || `Campanha ${idx + 1}`), ML + 4, h.y + 5);
    h.y += 10;

    // Platform/objective
    const infoParts = [c.plataforma, c.objetivo_campanha, c.formato_anuncio].filter(Boolean);
    if (infoParts.length) {
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(160, 160, 160);
      pdf.text(infoParts.join("  |  "), ML + 4, h.y);
      h.y += 5;
    }

    h.fieldRow("Tipo de Campanha", c.tipo_campanha, true);
    h.fieldRow("Publico-Alvo", c.publico_alvo, true);
    h.fieldRow("Segmentacao", c.segmentacao, true);
    h.fieldRow("Localizacao", c.localizacao, true);
    h.fieldRow("Faixa Etaria", c.faixa_etaria, true);
    h.fieldRow("Copy Principal", c.copy_principal, true);
    h.fieldRow("CTA", c.cta, true);
    h.fieldRow("URL de Destino", c.url_destino, true);

    // Investment
    const invParts = [];
    if (c.investimento_diario) invParts.push(`Diario: R$ ${c.investimento_diario.toLocaleString("pt-BR")}`);
    if (c.investimento_total) invParts.push(`Total: R$ ${c.investimento_total.toLocaleString("pt-BR")}`);
    if (c.data_inicio) invParts.push(`Inicio: ${c.data_inicio}`);
    if (c.data_fim) invParts.push(`Fim: ${c.data_fim}`);
    if (invParts.length) h.fieldRow("Investimento & Periodo", invParts.join("  |  "), true);

    // Metas
    const metaParts = [];
    if (c.meta_cpl) metaParts.push(`CPL: R$ ${c.meta_cpl}`);
    if (c.meta_cpc) metaParts.push(`CPC: R$ ${c.meta_cpc}`);
    if (c.meta_ctr) metaParts.push(`CTR: ${c.meta_ctr}%`);
    if (c.meta_conversoes) metaParts.push(`Conv: ${c.meta_conversoes}`);
    if (c.meta_roas) metaParts.push(`ROAS: ${c.meta_roas}x`);
    if (metaParts.length) h.fieldRow("Metas", metaParts.join("  |  "), true);

    if (c.observacoes) h.fieldRow("Observacoes", c.observacoes, true);

    const cardH = h.y - cardY + 2;
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.3);
    pdf.roundedRect(ML, cardY - 2, CW, cardH, 3, 3, "S");
    h.y += 6;
  });

  if (campanhas.length === 0) h.text("Nenhuma campanha adicionada.", true);

  // ═══ WEB ═══
  h.newPage(true);
  h.sectionTitle("4. Plano Web / Landing Pages - Proximo Mes", true);

  const secoes = plano.web?.secoes || [];
  secoes.forEach((s, idx) => {
    h.ensureSpace(30);
    const cardY = h.y;
    pdf.setFontSize(10); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...ACCENT);
    pdf.text(`${idx + 1}. ${safeText(s.titulo || "Pagina")}`, ML + 4, h.y + 5);
    h.y += 10;

    const infoParts = [s.tipo, s.status, s.prazo_estimado ? `Prazo: ${s.prazo_estimado}` : ""].filter(Boolean);
    if (infoParts.length) {
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(160, 160, 160);
      pdf.text(infoParts.join("  |  "), ML + 4, h.y);
      h.y += 5;
    }

    h.fieldRow("Objetivo", s.objetivo, true);
    h.fieldRow("Descricao / Briefing", s.descricao, true);
    if (s.secoes_pagina?.filter(Boolean).length) {
      h.fieldRow("Secoes da Pagina", s.secoes_pagina.filter(Boolean).join(", "), true);
    }
    h.fieldRow("Expectativa de Resultado", s.expectativa_resultado, true);
    h.fieldRow("Necessidades do Cliente", s.necessidades_cliente, true);
    if (s.observacoes) h.fieldRow("Observacoes", s.observacoes, true);

    const cardH = h.y - cardY + 2;
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.3);
    pdf.roundedRect(ML, cardY - 2, CW, cardH, 3, 3, "S");
    h.y += 6;
  });

  if (secoes.length === 0) h.text("Nenhuma pagina planejada.", true);

  // ═══ VENDAS ═══
  h.newPage(true);
  h.sectionTitle("5. Plano de Vendas / CRM - Proximo Mes", true);

  const v = plano.vendas || {};
  h.fieldRow("Funil Atual", v.funil_atual, true);
  h.fieldRow("Meta de Vendas", v.meta_vendas, true);
  h.fieldRow("Taxa de Conversao", v.taxa_conversao, true);
  h.fieldRow("Ticket Medio", v.ticket_medio, true);

  if (v.analise_crm) { h.label("ANALISE DO CRM", true); h.text(v.analise_crm, true); h.y += 3; }
  if (v.estrategias?.filter(Boolean).length) { h.label("ESTRATEGIAS PROPOSTAS", true); h.bulletList(v.estrategias, true); }
  if (v.melhorias?.filter(Boolean).length) { h.label("MELHORIAS SUGERIDAS", true); h.bulletList(v.melhorias, true); }
  if (v.acoes_equipe?.filter(Boolean).length) { h.label("ACOES DA EQUIPE COMERCIAL", true); h.bulletList(v.acoes_equipe, true); }
  if (v.ferramentas?.filter(Boolean).length) { h.label("FERRAMENTAS & PROCESSOS", true); h.bulletList(v.ferramentas, true); }
  if (v.observacoes) { h.label("OBSERVACOES GERAIS", true); h.text(v.observacoes, true); }

  pdf.save(`acompanhamento-${clientName.replace(/\s+/g, "_")}-${monthRef}.pdf`);
}
