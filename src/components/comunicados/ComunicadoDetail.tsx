import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Comunicado,
  ComunicadoVisualizacao,
  getStatusColor,
  getPrioridadeColor,
  getTipoColor,
} from "@/types/comunicados";
import { useAnnouncementViews } from "@/hooks/useAnnouncementViews";
import {
  Edit,
  Copy,
  Archive,
  Trash2,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  ExternalLink,
  Paperclip,
  Image,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ComunicadoDetailProps {
  comunicado: Comunicado;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function ComunicadoDetail({ comunicado, onEdit, onDuplicate, onArchive, onDelete }: ComunicadoDetailProps) {
  const { data: allViews } = useAnnouncementViews();
  const visualizacoes: ComunicadoVisualizacao[] = (allViews ?? [])
    .filter(v => v.announcement_id === comunicado.id)
    .map(v => ({
      id: v.id,
      comunicadoId: v.announcement_id,
      usuarioId: v.user_id,
      usuarioNome: v.user_id.slice(0, 8),
      unidadeNome: "",
      visualizadoEm: v.viewed_at,
      confirmadoEm: v.confirmed_at ?? undefined,
    }));
  const confirmadas = visualizacoes.filter((v) => v.confirmadoEm).length;

  return (
    <div className="space-y-6">
      {/* Content Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl">{comunicado.titulo}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={`${getTipoColor(comunicado.tipo)} border-0 text-xs`}>{comunicado.tipo}</Badge>
                <Badge className={`${getPrioridadeColor(comunicado.prioridade)} border-0 text-xs ${comunicado.prioridade === "Crítica" ? "animate-pulse" : ""}`}>
                  {comunicado.prioridade}
                </Badge>
                <Badge className={`${getStatusColor(comunicado.status)} border-0 text-xs`}>{comunicado.status}</Badge>
                {comunicado.publico.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={onEdit}><Edit className="w-3.5 h-3.5 mr-1" />Editar</Button>
              <Button variant="outline" size="sm" onClick={onDuplicate}><Copy className="w-3.5 h-3.5 mr-1" />Duplicar</Button>
              {comunicado.status !== "Arquivado" && (
                <Button variant="outline" size="sm" onClick={onArchive}><Archive className="w-3.5 h-3.5 mr-1" />Arquivar</Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm"><Trash2 className="w-3.5 h-3.5 mr-1" />Excluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir comunicado?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita. O comunicado e todo o rastreamento de visualizações serão removidos permanentemente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(comunicado.conteudo) }} />

          {comunicado.attachmentUrl && (
            <a
              href={comunicado.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline p-3 rounded-lg border border-border bg-muted/30"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">{comunicado.attachmentUrl.split("/").pop()}</span>
            </a>
          )}

          <Separator />

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>Autor: <strong className="text-foreground">{comunicado.autorNome}</strong></span>
            <span>Criado em: {format(new Date(comunicado.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            {comunicado.dataProgramada && <span>Programado: {format(new Date(comunicado.dataProgramada), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>}
            {comunicado.dataExpiracao && <span>Expira: {format(new Date(comunicado.dataExpiracao), "dd/MM/yyyy", { locale: ptBR })}</span>}
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            {comunicado.mostrarDashboard && (
              <Badge variant="outline" className="gap-1"><LayoutDashboard className="w-3 h-3" />Dashboard</Badge>
            )}
            {comunicado.mostrarPopup && (
              <Badge variant="outline" className="gap-1"><MonitorSmartphone className="w-3 h-3" />Pop-up</Badge>
            )}
            {comunicado.exigirConfirmacao && (
              <Badge variant="outline" className="gap-1"><ShieldCheck className="w-3 h-3" />Confirmação</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Visualizações e Confirmações</CardTitle>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                Total: <strong className="text-foreground">{visualizacoes.length}</strong>
              </span>
              {comunicado.exigirConfirmacao && (
                <span className="text-muted-foreground">
                  Confirmadas: <strong className="text-foreground">{confirmadas}/{visualizacoes.length}</strong>
                  {visualizacoes.length > 0 && (
                    <span className="ml-1">({Math.round((confirmadas / visualizacoes.length) * 100)}%)</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Visualizado em</TableHead>
                <TableHead>Confirmado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visualizacoes.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.usuarioNome}</TableCell>
                  <TableCell>{v.unidadeNome}</TableCell>
                  <TableCell className="text-sm">{format(new Date(v.visualizadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell className="text-sm">
                    {v.confirmadoEm
                      ? format(new Date(v.confirmadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : <Badge variant="outline" className="text-yellow-600 text-[10px]">Pendente</Badge>
                    }
                  </TableCell>
                </TableRow>
              ))}
              {visualizacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma visualização registrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
