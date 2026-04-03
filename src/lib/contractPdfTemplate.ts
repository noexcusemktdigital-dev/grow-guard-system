import logoNoExcuse from "@/assets/logo-noexcuse.png";

export async function getLogoBase64(): Promise<string> {
  try {
    const resp = await fetch(logoNoExcuse);
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export function formatContractHtml(content: string, logoBase64: string, title?: string): string {
  const pdfTitle = title || "CONTRATO DE PRESTAÇÃO DE SERVIÇO";
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR");

  const paragraphs = content.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    // Clause headers
    if (/^CLÁUSULA\s/i.test(trimmed) || /^CONTRATO\s/i.test(trimmed) || /^[IVXL]+\s*[-–—]\s/i.test(trimmed)) {
      return `<h2 style="font-size:12.5px;font-weight:700;text-transform:uppercase;margin:26px 0 8px;letter-spacing:0.6px;color:#1a1a1a;border-bottom:1px solid #e5e5e5;padding-bottom:6px;">${trimmed}</h2>`;
    }
    // Signature lines
    if (trimmed.startsWith("____")) {
      return `<p style="font-size:11px;margin:4px 0;color:#333;">${trimmed}</p>`;
    }
    // Sub-items
    if (/^[a-z]\)/.test(trimmed) || /^\d+\./.test(trimmed)) {
      return `<p style="font-size:11px;margin:3px 0 3px 18px;text-align:justify;line-height:1.75;color:#222;">${trimmed}</p>`;
    }
    return `<p style="font-size:11px;margin:5px 0;text-align:justify;line-height:1.75;color:#222;">${trimmed}</p>`;
  }).join("\n");

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:700px;margin:0 auto;color:#1a1a1a;position:relative;">
      <!-- Header Band -->
      <div style="background:#111;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;">
        <div style="flex-shrink:0;">
          ${logoBase64 ? `<img src="${logoBase64}" style="height:44px;display:block;" />` : `<span style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:2px;">NOEXCUSE</span>`}
        </div>
        <div style="text-align:right;color:#999;font-size:9px;line-height:1.6;font-family:Arial,sans-serif;">
          <div>NOEXCUSE MARKETING DIGITAL LTDA</div>
          <div>CNPJ: 00.000.000/0001-00</div>
          <div>contato@noexcuse.com.br</div>
        </div>
      </div>

      <!-- Accent Line -->
      <div style="height:3px;background:linear-gradient(90deg,#d97706,#f59e0b,#d97706);"></div>

      <!-- Contract Title -->
      <div style="text-align:center;padding:28px 40px 20px;">
        <h1 style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:0 0 6px;color:#111;">${pdfTitle}</h1>
        <div style="width:50px;height:2px;background:#d97706;margin:0 auto;"></div>
      </div>

      <!-- Body -->
      <div style="padding:0 40px 30px;">
        ${paragraphs}
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #ddd;margin:0 40px;padding:12px 0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:8px;color:#aaa;font-family:Arial,sans-serif;">NOEXCUSE Marketing Digital — Documento Confidencial</span>
        <span style="font-size:8px;color:#aaa;font-family:Arial,sans-serif;">Gerado em ${dateStr} às ${timeStr}</span>
      </div>
    </div>
  `;
}

interface ContractForPdf { content?: string; contract_type?: string; title?: string; }
export async function downloadContractPdf(contract: ContractForPdf) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const logoBase64 = await getLogoBase64();
  const content = contract.content || "Conteúdo do contrato não disponível.";
  const pdfTitle = contract.contract_type === "franquia"
    ? "CONTRATO DE FRANQUIA EMPRESARIAL"
    : "CONTRATO DE PRESTAÇÃO DE SERVIÇO";
  const html = formatContractHtml(content, logoBase64, pdfTitle);

  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);

  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  document.body.removeChild(el);

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW - 20;
  const imgH = (canvas.height * imgW) / canvas.width;
  let y = 0;
  while (y < imgH) {
    if (y > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 10, 10 - y, imgW, imgH);
    y += pageH - 20;
  }
  pdf.save(`${contract.title || "Contrato"}.pdf`);
}

export function getPreviewHtml(content: string, contractType?: string): string {
  const pdfTitle = contractType === "franquia"
    ? "CONTRATO DE FRANQUIA EMPRESARIAL"
    : "CONTRATO DE PRESTAÇÃO DE SERVIÇO";
  // For preview we use inline logo path (not base64)
  return formatContractHtml(content, "", pdfTitle);
}
