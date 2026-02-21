import { useState } from "react";
import { Award, Download, Eye, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getUserCertificates, mockModules, type AcademyCertificate } from "@/data/academyData";

export function AcademyCertificates() {
  const certs = getUserCertificates();
  const [viewCert, setViewCert] = useState<AcademyCertificate | null>(null);

  const getModuleTitle = (moduleId: string) => mockModules.find((m) => m.id === moduleId)?.title ?? "";

  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Award className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="font-semibold text-lg">Nenhum certificado ainda</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Complete módulos e seja aprovado nas provas para obter seus certificados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certs.map((cert) => (
          <Card key={cert.id} className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{getModuleTitle(cert.moduleId)}</h4>
                <p className="text-xs text-muted-foreground">Emitido em {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">ID: {cert.certificateId}</Badge>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setViewCert(cert)}>
                <Eye className="w-3.5 h-3.5" /> Visualizar
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => toast({ title: "Em breve", description: "Download de PDF será implementado com backend." })}>
                <Download className="w-3.5 h-3.5" /> Baixar PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Certificate preview dialog */}
      <Dialog open={!!viewCert} onOpenChange={() => setViewCert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificado</DialogTitle>
          </DialogHeader>
          {viewCert && (
            <div className="border-2 border-yellow-500/30 rounded-xl p-8 text-center space-y-4 bg-gradient-to-b from-yellow-500/5 to-transparent">
              <div className="flex justify-center">
                <GraduationCap className="w-12 h-12 text-yellow-600" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">NOE Academy · Noexcuse</p>
              <h2 className="text-xl font-bold">Certificado de Conclusão</h2>
              <p className="text-sm text-muted-foreground">Certificamos que</p>
              <p className="text-lg font-semibold">Usuário Franqueado</p>
              <p className="text-sm text-muted-foreground">concluiu com sucesso o módulo</p>
              <p className="text-lg font-semibold text-primary">{getModuleTitle(viewCert.moduleId)}</p>
              <div className="pt-4 text-xs text-muted-foreground space-y-1">
                <p>Data: {new Date(viewCert.issuedAt).toLocaleDateString("pt-BR")}</p>
                <p>ID: {viewCert.certificateId}</p>
              </div>
              <div className="pt-6 border-t border-border mt-4">
                <p className="text-xs italic text-muted-foreground">Assinatura digital — NOE Academy</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
