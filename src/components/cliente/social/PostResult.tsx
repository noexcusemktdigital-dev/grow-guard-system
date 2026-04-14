// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostItem, CREDIT_COST_ART, getVideoCost } from "@/hooks/useClientePosts";
import { PageHeader } from "@/components/PageHeader";
import {
  Check, RefreshCw, Download, Sparkles, Loader2, ArrowLeft, Trash2, Eye, Video, Image, Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LOADING_PHRASES } from "./constants";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostResultProps {
  isGenerating: boolean;
  loadingPhraseIdx: number;
  generatedResult: { post: PostItem; result_url: string | null; result_data: Record<string, unknown> | null } | null;
  batchResults?: { post: PostItem; result_url: string | null; result_data: Record<string, unknown> | null }[];
  postType: "art" | "video";
  videoDuration: string;
  onApprove: () => void;
  isApproving: boolean;
  onRegenerate: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function PostResult({
  isGenerating, loadingPhraseIdx, generatedResult, batchResults,
  postType, videoDuration, onApprove, isApproving, onRegenerate, onDelete, onBack,
}: PostResultProps) {
  const allResults = batchResults && batchResults.length > 0 ? batchResults : (generatedResult ? [generatedResult] : []);
  const creditCost = postType === "video" ? getVideoCost(videoDuration) : CREDIT_COST_ART;
  const totalCost = allResults.length * creditCost;
  const allApproved = allResults.every(r => r.post.status === "approved");

  const caption = allResults[0]?.post?.caption;

  const handleCopyCaption = () => {
    if (caption) {
      navigator.clipboard.writeText(caption);
      toast({ title: "Legenda copiada!" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resultado"
        subtitle={isGenerating ? "Gerando…" : `${allResults.length} peça(s) gerada(s)`}
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        backButton={!isGenerating ? <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar"><ArrowLeft className="w-4 h-4" /></Button> : undefined}
      />

      {isGenerating ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingPhraseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm text-muted-foreground font-medium"
              >
                {LOADING_PHRASES[loadingPhraseIdx]}
              </motion.p>
            </AnimatePresence>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className={`grid gap-4 ${allResults.length === 1 ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {allResults.map((result, idx) => (
              <Card key={result.post.id} className="overflow-hidden">
                {result.result_url ? (
                  <img src={result.result_url} alt={`Resultado ${idx + 1}`} className="w-full max-h-[500px] object-contain bg-muted" />
                ) : result.result_data?.frameUrls ? (
                  <div className="grid grid-cols-3 gap-1 p-2 bg-muted">
                    {(result.result_data.frameUrls as string[]).map((url: string, i: number) => (
                      <img key={i} src={url} alt={`Frame ${i + 1}`} className="w-full aspect-[9/16] object-cover rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {postType === "video" ? <Video className="w-8 h-8 text-muted-foreground/40" /> : <Image className="w-8 h-8 text-muted-foreground/40" />}
                  </div>
                )}
                {allResults.length > 1 && (
                  <CardContent className="p-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {idx + 1}/{allResults.length}
                    </Badge>
                    {result.result_url && (
                      <Button variant="ghost" size="sm" asChild aria-label="Baixar">
                        <a href={result.result_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {caption && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    📝 Legenda
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleCopyCaption}>
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-line leading-relaxed">{caption}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {!allApproved ? (
              <Button onClick={onApprove} disabled={isApproving} className="flex-1" size="lg">
                {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Aprovar
              </Button>
            ) : (
              <Button disabled className="flex-1" size="lg" variant="secondary">
                <Check className="w-4 h-4 mr-2" /> Aprovado
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerar {allResults.length > 1 ? "artes" : "arte"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cada regeneração consome {creditCost} créditos por peça ({totalCost} créditos no total). Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onRegenerate}>Regenerar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {allResults.length === 1 && allResults[0].result_url && (
              <Button variant="secondary" asChild size="lg">
                <a href={allResults[0].result_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" /> Baixar
                </a>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="lg" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Apagar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar {allResults.length > 1 ? "postagens" : "postagem"}?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    allResults.forEach(r => onDelete(r.post.id));
                  }}>Apagar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}