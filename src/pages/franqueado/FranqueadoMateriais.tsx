import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FolderOpen, Instagram, Megaphone, Briefcase, Building2, Palette, Monitor } from "lucide-react";
import { getMateriaisCategorias } from "@/data/franqueadoData";

const iconMap: Record<string, React.ElementType> = {
  Instagram, Megaphone, Briefcase, Building2, Palette, Monitor,
};

export default function FranqueadoMateriais() {
  const categorias = getMateriaisCategorias();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Materiais da Marca" subtitle="Acesse e baixe materiais de marketing da rede" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map(cat => {
          const Icon = iconMap[cat.icone] || FolderOpen;
          return (
            <Card key={cat.id} className="glass-card hover-lift cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{cat.arquivos} arquivos</Badge>
                </div>
                <h3 className="text-sm font-bold mb-1">{cat.nome}</h3>
                <p className="text-xs text-muted-foreground mb-4">{cat.descricao}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-3.5 h-3.5 mr-1" /> Acessar Materiais
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
