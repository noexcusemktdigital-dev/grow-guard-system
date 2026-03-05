import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye, Pencil, Trash2, FolderOpen, Paperclip, ChevronDown, ChevronRight, FileText,
} from "lucide-react";
import {
  Contrato,
} from "@/types/contratos";

// Map DB status to display labels
const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  signed: "Assinado",
  draft: "Rascunho",
  sent: "Enviado",
  pending_signature: "Aguardando Assinatura",
  expired: "Vencido",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  pending_signature: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  signed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface RepositorioSection {
  key: string;
  label: string;
  iconColor: string;
  bgColor: string;
  statuses: string[];
}

const SECTIONS: RepositorioSection[] = [
  { key: "ativos", label: "Ativos", iconColor: "text-green-600", bgColor: "bg-green-500/10", statuses: ["active", "signed", "Assinado"] },
  { key: "andamento", label: "Em andamento", iconColor: "text-yellow-600", bgColor: "bg-yellow-500/10", statuses: ["draft", "sent", "pending_signature", "Rascunho", "Gerado", "Enviado", "Aguardando Assinatura"] },
  { key: "inativos", label: "Inativos", iconColor: "text-muted-foreground", bgColor: "bg-muted/30", statuses: ["expired", "cancelled", "Vencido", "Cancelado"] },
];

function getFileIconColor(status: string) {
  if (["active", "signed", "Assinado"].includes(status)) return "text-green-600";
  if (["expired", "cancelled", "Vencido", "Cancelado"].includes(status)) return "text-muted-foreground";
  return "text-yellow-600";
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] || status;
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || "bg-muted text-muted-foreground";
}

interface Props {
  contratos: Contrato[];
  onView: (c: Contrato) => void;
  onEdit: (c: Contrato) => void;
  onDelete: (id: string) => void;
}

export default function ContratosRepositorio({ contratos, onView, onEdit, onDelete }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ativos: true, andamento: true, inativos: true,
  });

  const toggle = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-4">
      {SECTIONS.map(section => {
        const items = contratos.filter(c => section.statuses.includes(c.status));
        const isOpen = openSections[section.key];

        return (
          <div key={section.key} className="border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(section.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 ${section.bgColor} hover:opacity-80 transition-opacity`}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <FolderOpen className={`w-5 h-5 ${section.iconColor}`} />
              <span className="font-semibold text-sm">{section.label}</span>
              <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
            </button>

            {isOpen && (
              <div className="p-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum contrato nesta categoria</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(c => (
                      <div key={c.id} className="bg-card border border-border/50 rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <FileText className={`w-8 h-8 mt-0.5 flex-shrink-0 ${getFileIconColor(c.status)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-primary">{c.numero}</span>
                              {c.arquivoUrl && <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />}
                            </div>
                            <p className="text-sm font-medium truncate">{c.clienteNome}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px] h-5">{c.produto}</Badge>
                          <Badge className={`text-[10px] h-5 ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</Badge>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>R$ {c.valorMensal > 0 ? c.valorMensal.toLocaleString("pt-BR") + "/mês" : c.valorTotal.toLocaleString("pt-BR")}</div>
                          <div>{c.dataInicio}{c.dataFim ? ` — ${c.dataFim}` : ""}</div>
                        </div>

                        <div className="flex gap-1 pt-1 border-t border-border/30">
                          <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => onView(c)}>
                            <Eye className="w-3.5 h-3.5 mr-1" />Ver
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => onEdit(c)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => onDelete(c.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
