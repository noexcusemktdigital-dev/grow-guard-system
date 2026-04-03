import { useState } from "react";
import { Award, Download, Eye, GraduationCap, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAcademyCertificates, useAcademyModules, type DbCertificate } from "@/hooks/useAcademy";

export function AcademyCertificates() {
  const { data: certs = [] } = useAcademyCertificates();
  const { data: modules = [] } = useAcademyModules();
  const [viewCert, setViewCert] = useState<DbCertificate | null>(null);

  const getModuleTitle = (moduleId: string) => modules.find(m => m.id === moduleId)?.title ?? "";

  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Award className="w-10 h-10 text-yellow-600" />
        </div>
        <h3 className="font-semibold text-lg">Nenhum certificado ainda</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Complete módulos e seja aprovado nas provas para obter seus certificados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        {certs.map((cert) => (
          <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all">
            <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-6 border-b border-yellow-500/10 text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 mx-auto">
                <GraduationCap className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Certificado de Conclusão</p>
              <p className="font-bold text-sm">{getModuleTitle(cert.module_id)}</p>
              <div className="flex justify-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Emitido em {new Date(cert.issued_at).toLocaleDateString("pt-BR")}</p>
                <Badge variant="secondary" className="text-[9px]">ID: {cert.id.slice(0, 8).toUpperCase()}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setViewCert(cert)}>
                  <Eye className="w-3.5 h-3.5" /> Visualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => {
                  setViewCert(cert);
                  setTimeout(() => {
                    const el = document.getElementById("cert-print-area");
                    if (!el) return;
                    Promise.all([import("jspdf"), import("html2canvas")]).then(([{ default: jsPDF }, { default: html2canvas }]) => {
                      html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then((canvas) => {
                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                        const pageW = pdf.internal.pageSize.getWidth();
                        const imgW = pageW;
                        const imgH = (canvas.height * imgW) / canvas.width;
                        pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
                        pdf.save(`certificado-${cert.id.slice(0, 8)}.pdf`);
                        toast({ title: "PDF gerado com sucesso!" });
                      });
                    });
                  }, 500);
                }}>
                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!viewCert} onOpenChange={() => setViewCert(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Certificado</DialogTitle>
          </DialogHeader>
          {viewCert && (
            <div id="cert-print-area" className="relative bg-gradient-to-b from-yellow-500/5 via-amber-500/3 to-white dark:to-card">
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
              <div className="relative p-8 md:p-10">
                <div className="border-2 border-yellow-500/30 rounded-xl p-6 md:p-8">
                  <div className="border border-yellow-500/15 rounded-lg p-6 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-500/20 flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-semibold">NOE Academy · Noexcuse</p>
                    <div className="space-y-1">
                      <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                        Certificado de Conclusão
                      </h2>
                      <div className="flex justify-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <div className="py-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Certificamos que</p>
                      <p className="text-xl font-bold">Usuário Franqueado</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">concluiu com sucesso o módulo</p>
                      <p className="text-lg font-bold text-primary">{getModuleTitle(viewCert.module_id)}</p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <div className="w-16 h-16 rounded-full border-2 border-yellow-500/30 flex items-center justify-center rotate-[-15deg]">
                        <div className="text-center">
                          <Award className="w-5 h-5 text-yellow-600 mx-auto" />
                          <p className="text-[7px] font-bold text-yellow-600 uppercase">Aprovado</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 text-xs text-muted-foreground space-y-1 border-t border-border">
                      <p>Data: {new Date(viewCert.issued_at).toLocaleDateString("pt-BR")}</p>
                      <p className="font-mono text-[10px]">ID: {viewCert.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] italic text-muted-foreground">Assinatura digital — NOE Academy</p>
                      <div className="w-32 h-px bg-border mx-auto mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
