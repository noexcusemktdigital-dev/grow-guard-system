import { useRef, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Trash2 } from 'lucide-react';
import type { Duration, PaymentOption, SelectedService } from '@/hooks/useCalculator';
import type { Module, Service } from '@/data/services';
import logoSrc from '@/assets/logo-noexcuse.png';

const pdfColors = {
  red: '#e63946',
  dark: '#1a1f2e',
  gray: '#6b7280',
  light: '#f8f9fa',
  border: '#e5e7eb',
  white: '#ffffff',
};

interface ProposalGeneratorProps {
  duration: Duration;
  clientName: string;
  onClientNameChange: (name: string) => void;
  selectedByModule: Record<string, { module: Module; selections: (SelectedService & { service: Service; price: number })[] }>;
  totals: { oneTime: number; monthly: number };
  paymentOption: PaymentOption;
  onClear: () => void;
  onSave?: () => void;
  saving?: boolean;
}

export const ProposalGenerator = ({
  duration,
  clientName,
  onClientNameChange,
  selectedByModule,
  totals,
  paymentOption,
  onClear,
  onSave,
  saving,
}: ProposalGeneratorProps) => {
  const proposalRef = useRef<HTMLDivElement>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(logoSrc);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (error) {
        logger.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);

  const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const getDilutedMonthly = (installments: number) => totals.monthly + (totals.oneTime / installments);

  const getPaymentDetails = () => {
    switch (paymentOption) {
      case 'upfront':
        return { label: 'À Vista', description: `Mês 1: ${formatPrice(totals.oneTime + totals.monthly)} | Mês 2+: ${formatPrice(totals.monthly)}` };
      case 'installment_3':
        return { label: '3x', description: `Mês 1-3: ${formatPrice(getDilutedMonthly(3))} | Mês 4+: ${formatPrice(totals.monthly)}` };
      case 'installment_6':
        return { label: '6x', description: `Mês 1-6: ${formatPrice(getDilutedMonthly(6))} | Mês 7+: ${formatPrice(totals.monthly)}` };
    }
  };

  const paymentDetails = getPaymentDetails();

  const handleDownloadPDF = async () => {
    if (!proposalRef.current) return;
    try {
      setIsExporting(true);
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(proposalRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollY: -window.scrollY });
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
      pdf.save(`proposta-noexcuse-${clientName || 'cliente'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      logger.error('Erro ao gerar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const styles = {
    container: { backgroundColor: pdfColors.white, padding: '32px', fontFamily: 'Inter, Arial, sans-serif', color: pdfColors.dark, borderRadius: '16px', border: `2px solid ${pdfColors.border}` },
    header: { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: '32px', paddingBottom: '24px', borderBottom: `1px solid ${pdfColors.border}` },
    logo: { height: '64px', width: 'auto' },
    title: { fontSize: '24px', fontWeight: 'bold' as const, color: pdfColors.dark, margin: 0 },
    subtitle: { fontSize: '14px', color: pdfColors.gray, margin: '4px 0 0 0' },
    clientBox: { marginBottom: '24px', borderRadius: '8px', backgroundColor: pdfColors.light, padding: '16px' },
    sectionTitle: { fontSize: '18px', fontWeight: '600' as const, color: pdfColors.dark, marginBottom: '8px' },
    text: { color: pdfColors.gray, margin: 0 },
    separator: { border: 'none', borderTop: `1px solid ${pdfColors.border}`, margin: '24px 0' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
    tableHeader: { borderBottom: `1px solid ${pdfColors.border}`, padding: '8px', fontWeight: '500' as const, color: pdfColors.gray },
    tableCell: { padding: '12px 8px', borderBottom: `1px dashed ${pdfColors.border}`, color: pdfColors.dark },
    badge: { display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, width: '24px', height: '24px', borderRadius: '4px', backgroundColor: pdfColors.red, color: pdfColors.white, fontSize: '12px', marginRight: '8px' },
    totalCard: { borderRadius: '8px', border: `1px solid ${pdfColors.border}`, padding: '16px', textAlign: 'center' as const },
    totalCardRed: { borderRadius: '8px', border: `1px solid ${pdfColors.red}`, backgroundColor: `${pdfColors.red}10`, padding: '16px', textAlign: 'center' as const },
    paymentBox: { borderRadius: '8px', background: `linear-gradient(to right, ${pdfColors.red}15, ${pdfColors.red}08)`, padding: '16px' },
    footer: { marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${pdfColors.border}`, textAlign: 'center' as const, fontSize: '14px', color: pdfColors.gray },
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Gerar Proposta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Revise e baixe sua proposta em PDF</p>
      </div>

      <div className="mb-6 max-w-md mx-auto">
        <label className="block text-sm font-medium text-foreground mb-2">Nome do Cliente (opcional)</label>
        <Input value={clientName} onChange={(e) => onClientNameChange(e.target.value)} placeholder="Ex: Empresa XYZ" className="text-center" />
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-4">
        <Button onClick={handleDownloadPDF} className="gap-2" size="lg" disabled={isExporting}>
          <Download className="h-5 w-5" />
          {isExporting ? 'Gerando...' : 'Baixar PDF'}
        </Button>
        {onSave && (
          <Button onClick={onSave} variant="secondary" size="lg" disabled={saving} className="gap-2">
            {saving ? 'Salvando...' : 'Salvar Proposta'}
          </Button>
        )}
        <Button variant="outline" onClick={onClear} className="gap-2 border-destructive text-destructive hover:bg-destructive/5" size="lg">
          <Trash2 className="h-5 w-5" />
          Limpar Seleção
        </Button>
      </div>

      {/* PDF Preview */}
      <div id="proposal-pdf" ref={proposalRef} style={styles.container} className="max-w-4xl mx-auto shadow-xl">
        <div style={styles.header}>
          {logoBase64 ? (
            <img src={logoBase64} alt="NOEXCUSE" style={styles.logo} />
          ) : (
            <div style={{ ...styles.title, color: pdfColors.red }}>NOEXCUSE</div>
          )}
          <div style={{ textAlign: 'right' }}>
            <h1 style={styles.title}>Proposta Comercial</h1>
            <p style={styles.subtitle}>{formatDate()}</p>
          </div>
        </div>

        {clientName && (
          <div style={styles.clientBox}>
            <p style={{ ...styles.subtitle, marginBottom: '4px' }}>Preparado para:</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: pdfColors.dark, margin: 0 }}>{clientName}</p>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h3 style={styles.sectionTitle}>Duração do Projeto</h3>
          <p style={styles.text}>{duration} {duration === 1 ? 'mês (Entrega única)' : `meses (${duration === 6 ? 'Semestral' : 'Anual'})`}</p>
        </div>

        <hr style={styles.separator} />

        <div style={{ marginBottom: '32px' }}>
          <h3 style={styles.sectionTitle}>Serviços Selecionados</h3>
          {Object.values(selectedByModule).map(({ module, selections }) => (
            <div key={module.id} style={{ marginBottom: '24px' }}>
              <h4 style={{ fontWeight: '600', color: pdfColors.dark, marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={styles.badge}>{selections.length}</span>
                {module.name}
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.tableHeader, textAlign: 'left' }}>Serviço</th>
                    <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Tipo</th>
                    <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Qtd</th>
                    <th style={{ ...styles.tableHeader, textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.map((sel) => (
                    <tr key={sel.serviceId}>
                      <td style={{ ...styles.tableCell, textAlign: 'left' }}>{sel.service.name}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: sel.service.type === 'one_time' ? pdfColors.gray : pdfColors.red }}>
                          {sel.service.type === 'one_time' ? '▪ Unitário' : '↻ Mensal'}
                        </span>
                      </td>
                      <td style={{ ...styles.tableCell, textAlign: 'center', color: pdfColors.gray }}>
                        {sel.quantity > 1 && `x${sel.quantity}`}
                        {sel.packageSize && `${sel.packageSize} un`}
                        {sel.youtubeMinutes && `${sel.youtubeMinutes} min`}
                        {(!sel.quantity || sel.quantity === 1) && !sel.packageSize && !sel.youtubeMinutes && '-'}
                      </td>
                      <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>{formatPrice(sel.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <hr style={styles.separator} />

        <div style={{ marginBottom: '32px' }}>
          <h3 style={styles.sectionTitle}>Resumo Financeiro</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.totalCard}>
              <p style={{ fontSize: '14px', color: pdfColors.gray, margin: '0 0 4px 0' }}>Total Unitário</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: pdfColors.dark, margin: '0 0 4px 0' }}>{formatPrice(totals.oneTime)}</p>
              <p style={{ fontSize: '12px', color: pdfColors.gray, margin: 0 }}>Setup / Implementação</p>
            </div>
            <div style={styles.totalCardRed}>
              <p style={{ fontSize: '14px', color: pdfColors.red, margin: '0 0 4px 0' }}>Total Mensal</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: pdfColors.red, margin: '0 0 4px 0' }}>{formatPrice(totals.monthly)}</p>
              <p style={{ fontSize: '12px', color: pdfColors.gray, margin: 0 }}>Recorrência</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={styles.sectionTitle}>Investimento em Marketing para seu Projeto</h3>
          <div style={styles.paymentBox}>
            <p style={{ color: pdfColors.dark, fontWeight: '500', margin: '0 0 4px 0' }}>Forma de Pagamento: {paymentDetails.label}</p>
            <p style={{ fontSize: '14px', color: pdfColors.red, fontWeight: '600', margin: 0 }}>{paymentDetails.description}</p>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={{ margin: '0 0 4px 0' }}>Proposta gerada automaticamente pela Calculadora NOEXCUSE</p>
          <p style={{ margin: 0 }}>Válida por 30 dias a partir de {formatDate()}</p>
        </div>
      </div>
    </div>
  );
};
