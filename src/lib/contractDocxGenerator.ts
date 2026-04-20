// @ts-nocheck
// docx is loaded dynamically to keep it out of the initial bundle (PERF-001)
import { saveAs } from "file-saver";

const PRIMARY_COLOR = "DC2626"; // red-600
const DARK_COLOR = "111111";
const GRAY_COLOR = "6B7280";

interface ContractData {
  title: string;
  content?: string | null;
  signer_name?: string | null;
  client_document?: string | null;
  contract_type?: string | null;
}

function parseContractContent(content: string, docxLib: typeof import("docx")): unknown[] {
  const { Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType } = docxLib;
  const lines = content.split("\n");
  const paragraphs: unknown[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    // Main title
    if (/^CONTRATO\s/i.test(trimmed)) {
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 300 },
        children: [new TextRun({
          text: trimmed,
          bold: true,
          size: 28,
          font: "Arial",
          color: DARK_COLOR,
        })],
      }));
      continue;
    }

    // Clause headers (CLÁUSULA, roman numerals)
    if (/^CLÁUSULA\s/i.test(trimmed) || /^[IVXL]+\s*[-–—]\s/i.test(trimmed)) {
      paragraphs.push(new Paragraph({
        spacing: { before: 300, after: 150 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB", space: 4 } },
        children: [new TextRun({
          text: trimmed,
          bold: true,
          size: 22,
          font: "Arial",
          color: PRIMARY_COLOR,
        })],
      }));
      continue;
    }

    // Signature lines
    if (trimmed.startsWith("____")) {
      paragraphs.push(new Paragraph({
        spacing: { before: 50, after: 50 },
        children: [new TextRun({
          text: trimmed,
          size: 20,
          font: "Arial",
          color: GRAY_COLOR,
        })],
      }));
      continue;
    }

    // Sub-items (a), b), 1., 2.)
    if (/^[a-z]\)/.test(trimmed) || /^\d+\.\d*\s/.test(trimmed) || /^\d+\)/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 400 },
        children: [new TextRun({
          text: trimmed,
          size: 20,
          font: "Arial",
          color: "333333",
        })],
      }));
      continue;
    }

    // Observação
    if (/^Observação:/i.test(trimmed)) {
      paragraphs.push(new Paragraph({
        spacing: { before: 100, after: 100 },
        shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
        indent: { left: 200, right: 200 },
        children: [new TextRun({
          text: trimmed,
          size: 20,
          font: "Arial",
          italics: true,
          color: "92400E",
        })],
      }));
      continue;
    }

    // Regular paragraph
    paragraphs.push(new Paragraph({
      spacing: { after: 80 },
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({
        text: trimmed,
        size: 20,
        font: "Arial",
        color: "222222",
      })],
    }));
  }

  return paragraphs;
}

export async function downloadContractDocx(contract: ContractData) {
  if (!contract.content || contract.content.trim().length < 50) {
    const { toast } = await import("sonner");
    toast.error("Este contrato não possui conteúdo gerado.", {
      description: "Edite o contrato e gere o conteúdo antes de baixar o DOCX.",
    });
    return;
  }
  // Dynamic import keeps docx (~1MB) out of the initial bundle
  const docxLib = await import("docx");
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
    Header, Footer, PageNumber,
  } = docxLib;

  const content = contract.content;
  const contractTitle = contract.contract_type === "franquia"
    ? "CONTRATO DE FRANQUIA EMPRESARIAL"
    : "CONTRATO DE PRESTAÇÃO DE SERVIÇO";

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");

  const contentParagraphs = parseContractContent(content, docxLib);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1800, right: 1200, bottom: 1440, left: 1200 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: "NOEXCUSE MARKETING DIGITAL",
                  bold: true,
                  size: 22,
                  font: "Arial",
                  color: DARK_COLOR,
                }),
                new TextRun({
                  text: "    CNPJ: 34.638.745/0001-00  |  contato@noexcuse.com.br",
                  size: 14,
                  font: "Arial",
                  color: GRAY_COLOR,
                }),
              ],
            }),
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_COLOR, space: 4 } },
              spacing: { after: 200 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB", space: 4 } },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `NOEXCUSE Marketing Digital — Documento Confidencial — Gerado em ${dateStr} — Página `,
                  size: 14,
                  font: "Arial",
                  color: GRAY_COLOR,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 14,
                  font: "Arial",
                  color: GRAY_COLOR,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          children: [new TextRun({
            text: contractTitle,
            bold: true,
            size: 32,
            font: "Arial",
            color: DARK_COLOR,
          })],
        }),
        // Red accent line
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_COLOR, space: 1 } },
        }),
        // Content
        ...contentParagraphs,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  saveAs(blob, `${contract.title || "Contrato"}.docx`);
}
