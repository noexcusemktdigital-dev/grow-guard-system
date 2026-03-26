

## Corrigir build error em FranqueadoPropostas.tsx

Mesmo problema dos anteriores: `html2pdf.js` não está instalado.

### Mudança

**`src/pages/franqueado/FranqueadoPropostas.tsx` (linhas 50-62):**
Substituir o bloco `handleDownloadPdf` para usar `jspdf` + `html2canvas`:

```tsx
const handleDownloadPdf = async () => {
  const el = previewRef.current;
  if (!el) return;
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  let y = 0;
  while (y < imgH) {
    if (y > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
    y += pageH;
  }
  pdf.save(`${proposal.title || "Proposta"}.pdf`);
  toast.success("PDF gerado!");
};
```

### Arquivo afetado
- `src/pages/franqueado/FranqueadoPropostas.tsx` — substituir linhas 50-62

