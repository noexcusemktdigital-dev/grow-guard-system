// @ts-nocheck
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { ApprovalCountBar } from "@/components/cliente/ApprovalCountBar";
import { PostCard } from "./PostCard";
import { PostItem } from "@/hooks/useClientePosts";
import {
  Share2, Plus, CheckSquare, Trash2, Loader2,
  Search, Filter, FolderOpen, Image, Video, Calendar, Check
} from "lucide-react";
import { format, startOfMonth, startOfWeek, isThisMonth, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostGalleryProps {
  posts: PostItem[] | undefined;
  isLoading: boolean;
  onCreateNew: () => void;
  onViewPost: (post: PostItem) => void;
  onDeleteSingle: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkApprove?: (ids: string[]) => void;
  isDeleting: boolean;
  isBulkDeleting: boolean;
  isBulkApproving?: boolean;
}

type FilterStatus = "all" | "pending" | "approved";
type FilterType = "all" | "art" | "video";
type GroupBy = "month" | "week";

export function PostGallery({
  posts, isLoading, onCreateNew, onViewPost,
  onDeleteSingle, onBulkDelete, onBulkApprove,
  isDeleting, isBulkDeleting, isBulkApproving,
}: PostGalleryProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("month");

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Approval counters
  const approvalCounts = useMemo(() => {
    if (!posts) return { pending: 0, approved: 0 };
    return {
      pending: posts.filter(p => p.status !== "approved").length,
      approved: posts.filter(p => p.status === "approved").length,
    };
  }, [posts]);

  // Filter + group (pendentes primeiro)
  const grouped = useMemo(() => {
    if (!posts) return [];

    let filtered = posts;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => p.input_text?.toLowerCase().includes(q));
    }

    if (filterStatus === "pending") filtered = filtered.filter(p => p.status !== "approved");
    if (filterStatus === "approved") filtered = filtered.filter(p => p.status === "approved");

    if (filterType === "art") filtered = filtered.filter(p => p.type === "art");
    if (filterType === "video") filtered = filtered.filter(p => p.type === "video");

    // Sort: pending first, then by date desc
    filtered = [...filtered].sort((a, b) => {
      const aPending = a.status !== "approved" ? 0 : 1;
      const bPending = b.status !== "approved" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const groups = new Map<string, { label: string; posts: PostItem[] }>();

    for (const post of filtered) {
      const date = new Date(post.created_at);
      let key: string;
      let label: string;

      if (groupBy === "month") {
        const monthStart = startOfMonth(date);
        key = monthStart.toISOString();
        if (isThisMonth(date)) {
          label = "Este mês";
        } else {
          label = format(date, "MMMM yyyy", { locale: ptBR });
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }
      } else {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        key = weekStart.toISOString();
        if (isThisWeek(date, { weekStartsOn: 1 })) {
          label = "Esta semana";
        } else {
          label = `Semana de ${format(weekStart, "dd/MM", { locale: ptBR })}`;
        }
      }

      if (!groups.has(key)) {
        groups.set(key, { label, posts: [] });
      }
      groups.get(key)?.posts.push(post);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([key, val]) => ({ key, ...val }));
  }, [posts, search, filterStatus, filterType, groupBy]);

  const totalFiltered = grouped.reduce((sum, g) => sum + g.posts.length, 0);

  // Check if selected items have any pending
  const selectedPendingCount = useMemo(() => {
    if (!posts) return 0;
    return posts.filter(p => selectedIds.has(p.id) && p.status !== "approved").length;
  }, [posts, selectedIds]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Postagens"
        subtitle="Gere artes e vídeos para redes sociais"
        icon={<Share2 className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <FeatureTutorialButton slug="redes_sociais" />
            {posts && posts.length > 0 && (
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                {selectionMode ? "Cancelar" : "Selecionar"}
              </Button>
            )}
            <Button onClick={onCreateNew}><Plus className="w-4 h-4 mr-1" /> Nova Postagem</Button>
          </div>
        }
      />

      <StrategyBanner toolName="suas postagens" dataUsed="Tom de voz, persona e estilo visual" />

      {/* Approval counters */}
      {posts && posts.length > 0 && (approvalCounts.pending > 0 || approvalCounts.approved > 0) && (
        <ApprovalCountBar
          pending={approvalCounts.pending}
          approved={approvalCounts.approved}
          label="Postagens"
        />
      )}

      {/* Filters bar */}
      {posts && posts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar postagens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)} aria-label="Buscar postagens"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tudo</SelectItem>
                <SelectItem value="art">
                  <span className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> Artes</span>
                </SelectItem>
                <SelectItem value="video">
                  <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Vídeos</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Por mês</SelectItem>
                <SelectItem value="week">Por semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !posts?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Share2 className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhuma postagem gerada ainda</p>
            <Button onClick={onCreateNew} size="sm"><Plus className="w-4 h-4 mr-1" /> Criar primeira postagem</Button>
          </CardContent>
        </Card>
      ) : totalFiltered === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <Search className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhuma postagem encontrada com esses filtros</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterType("all"); }}>
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{group.label}</h3>
                <Badge variant="secondary" className="text-[10px]">{group.posts.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(post.id)}
                    onToggleSelect={toggleSelect}
                    onClick={onViewPost}
                    onDelete={(id) => setDeleteTargetId(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>

          {/* Approve selected */}
          {onBulkApprove && selectedPendingCount > 0 && (
            <Button
              variant="default"
              size="sm"
              disabled={isBulkApproving}
              onClick={() => {
                const pendingIds = Array.from(selectedIds).filter(id =>
                  posts?.find(p => p.id === id && p.status !== "approved")
                );
                if (pendingIds.length > 0) {
                  onBulkApprove(pendingIds);
                  setSelectedIds(new Set());
                  setSelectionMode(false);
                }
              }}
            >
              {isBulkApproving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              Aprovar ({selectedPendingCount})
            </Button>
          )}

          {/* Delete selected */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isBulkDeleting}>
                {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Apagar selecionados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar {selectedIds.size} postagem(ns)?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  onBulkDelete(Array.from(selectedIds));
                  setSelectedIds(new Set());
                  setSelectionMode(false);
                }}>Apagar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Single delete */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar postagem?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTargetId) {
                onDeleteSingle(deleteTargetId);
                setDeleteTargetId(null);
              }
            }}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
