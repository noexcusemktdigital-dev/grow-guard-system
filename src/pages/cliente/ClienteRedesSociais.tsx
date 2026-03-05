import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { usePostHistory, useGeneratePost, useApprovePost, PostItem } from "@/hooks/useClientePosts";
import { useContentHistory, ContentItem } from "@/hooks/useClienteContentV2";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import {
  Share2, Plus, ArrowLeft, Image, Video, Check, RefreshCw, Download,
  FileText, Sparkles, Loader2, Upload, X, Clock, Eye
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Step = "history" | "content" | "type" | "config" | "generate";
type PostType = "art" | "video";

const ART_FORMATS = [
  { value: "feed", label: "Feed 1:1", desc: "1080×1080" },
  { value: "portrait", label: "Portrait 4:5", desc: "1080×1350" },
  { value: "story", label: "Story 9:16", desc: "1080×1920" },
];

const ART_STYLES = [
  { value: "grafica_moderna", label: "Design Moderno" },
  { value: "elegante_premium", label: "Elegante Premium" },
  { value: "colorido_vibrante", label: "Colorido Vibrante" },
  { value: "corporativo", label: "Corporativo Pro" },
  { value: "impacto_bold", label: "Impacto Bold" },
  { value: "foto_destaque", label: "Foto Destaque" },
];

const VIDEO_STYLES = [
  { value: "educativo", label: "Educativo" },
  { value: "institucional", label: "Institucional" },
  { value: "promocional", label: "Promocional" },
  { value: "storytelling", label: "Storytelling" },
];

const VIDEO_DURATIONS = [
  { value: "15s", label: "15 segundos" },
  { value: "30s", label: "30 segundos" },
  { value: "60s", label: "60 segundos" },
];

const LOADING_PHRASES = [
  "Criando sua arte com IA…",
  "Analisando referências visuais…",
  "Aplicando identidade visual…",
  "Finalizando composição…",
  "Quase pronto…",
];

export default function ClienteRedesSociais() {
  const [step, setStep] = useState<Step>("history");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [postType, setPostType] = useState<PostType>("art");
  const [manualText, setManualText] = useState("");
  const [artFormat, setArtFormat] = useState("feed");
  const [artStyle, setArtStyle] = useState("grafica_moderna");
  const [videoStyle, setVideoStyle] = useState("educativo");
  const [videoDuration, setVideoDuration] = useState("15s");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ post: PostItem; result_url: string | null; result_data: any } | null>(null);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: orgId } = useUserOrgId();
  const { data: posts, isLoading: postsLoading } = usePostHistory();
  const { data: contents, isLoading: contentsLoading } = useContentHistory();
  const { data: visualIdentity } = useVisualIdentity();
  const generatePost = useGeneratePost();
  const approvePost = useApprovePost();

  const inputText = selectedContent?.result
    ? (typeof selectedContent.result === "object" && (selectedContent.result as any)?.legenda)
      ? (selectedContent.result as any).legenda
      : (selectedContent.result as any)?.texto || selectedContent.title
    : manualText;

  const resetWizard = () => {
    setStep("history");
    setSelectedContent(null);
    setManualText("");
    setArtFormat("feed");
    setArtStyle("grafica_moderna");
    setVideoStyle("educativo");
    setVideoDuration("15s");
    setReferenceUrls([]);
    setGeneratedResult(null);
    setLoadingPhraseIdx(0);
  };

  const handleUploadRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !orgId) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `references/${orgId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("social-arts").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setReferenceUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({ title: "Insira um texto para gerar", variant: "destructive" });
      return;
    }
    setStep("generate");
    setLoadingPhraseIdx(0);
    const interval = setInterval(() => {
      setLoadingPhraseIdx((i) => Math.min(i + 1, LOADING_PHRASES.length - 1));
    }, 4000);
    try {
      const result = await generatePost.mutateAsync({
        type: postType,
        format: postType === "art" ? artFormat : undefined,
        style: postType === "art" ? artStyle : videoStyle,
        duration: postType === "video" ? videoDuration : undefined,
        input_text: inputText,
        content_id: selectedContent?.id,
        reference_image_urls: referenceUrls,
        identidade_visual: visualIdentity
          ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone, logo_url: visualIdentity.logo_url }
          : undefined,
      });
      setGeneratedResult(result);
    } catch (err: any) {
      toast({ title: "Erro na geração", description: err.message, variant: "destructive" });
      setStep("config");
    } finally {
      clearInterval(interval);
    }
  };

  const handleApprove = async () => {
    if (!generatedResult) return;
    try {
      await approvePost.mutateAsync({ postId: generatedResult.post.id, type: postType });
      resetWizard();
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    }
  };

  // ── HISTORY ──
  if (step === "history") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Postagens"
          subtitle="Gere artes e vídeos para redes sociais"
          icon={<Share2 className="w-5 h-5 text-primary" />}
          actions={<Button onClick={() => setStep("content")}><Plus className="w-4 h-4 mr-1" /> Nova Postagem</Button>}
        />
        {postsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : !posts?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Share2 className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">Nenhuma postagem gerada ainda</p>
              <Button onClick={() => setStep("content")} size="sm"><Plus className="w-4 h-4 mr-1" /> Criar primeira postagem</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                {p.result_url ? (
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img src={p.result_url} alt="" className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2 text-[10px]" variant={p.status === "approved" ? "default" : "secondary"}>
                      {p.status === "approved" ? "Aprovado" : "Pendente"}
                    </Badge>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {p.type === "video" ? <Video className="w-8 h-8 text-muted-foreground/40" /> : <Image className="w-8 h-8 text-muted-foreground/40" />}
                  </div>
                )}
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{p.type === "video" ? "Vídeo" : "Arte"}</Badge>
                    {p.format && <span>{p.format}</span>}
                    <span className="ml-auto">{format(new Date(p.created_at), "dd/MM/yy")}</span>
                  </div>
                  <p className="text-sm line-clamp-2">{p.input_text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── STEP 1: CONTENT ──
  if (step === "content") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Conteúdo Base"
          subtitle="Selecione um conteúdo aprovado ou escreva manualmente"
          icon={<FileText className="w-5 h-5 text-primary" />}
          backButton={<Button variant="ghost" size="icon" onClick={resetWizard}><ArrowLeft className="w-4 h-4" /></Button>}
        />
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Texto manual</p>
            <Textarea
              placeholder="Descreva o que deseja na postagem…"
              value={manualText}
              onChange={(e) => { setManualText(e.target.value); setSelectedContent(null); }}
              rows={3}
            />
            <Button disabled={!manualText.trim()} onClick={() => setStep("type")} className="w-full">
              Continuar com texto manual
            </Button>
          </CardContent>
        </Card>

        {contentsLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : contents?.length ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Ou selecione um conteúdo:</p>
            {contents.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${selectedContent?.id === c.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setSelectedContent(c); setManualText(""); }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.format} · {c.objective}</p>
                  </div>
                  {selectedContent?.id === c.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                </CardContent>
              </Card>
            ))}
            <Button disabled={!selectedContent} onClick={() => setStep("type")} className="w-full mt-2">
              Continuar com conteúdo selecionado
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  // ── STEP 2: TYPE ──
  if (step === "type") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tipo de Material"
          subtitle="Escolha o formato do criativo"
          icon={<Sparkles className="w-5 h-5 text-primary" />}
          backButton={<Button variant="ghost" size="icon" onClick={() => setStep("content")}><ArrowLeft className="w-4 h-4" /></Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { type: "art" as PostType, icon: Image, title: "Arte", desc: "Imagem estática para feed, stories ou posts" },
            { type: "video" as PostType, icon: Video, title: "Vídeo", desc: "Vídeo curto para reels, stories ou anúncios" },
          ]).map((opt) => (
            <Card
              key={opt.type}
              className={`cursor-pointer transition-all hover:shadow-md ${postType === opt.type ? "ring-2 ring-primary bg-primary/5" : ""}`}
              onClick={() => { setPostType(opt.type); setStep("config"); }}
            >
              <CardContent className="p-8 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <opt.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{opt.title}</h3>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP 3: CONFIG ──
  if (step === "config") {
    return (
      <div className="space-y-6">
        <PageHeader
          title={postType === "art" ? "Configurar Arte" : "Configurar Vídeo"}
          subtitle="Defina os detalhes do criativo"
          icon={postType === "art" ? <Image className="w-5 h-5 text-primary" /> : <Video className="w-5 h-5 text-primary" />}
          backButton={<Button variant="ghost" size="icon" onClick={() => setStep("type")}><ArrowLeft className="w-4 h-4" /></Button>}
        />

        {/* Text preview */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Texto base</p>
            <p className="text-sm bg-muted/50 rounded-lg p-3 line-clamp-4">{inputText || "—"}</p>
          </CardContent>
        </Card>

        {postType === "art" ? (
          <>
            {/* Format */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Formato</p>
              <div className="grid grid-cols-3 gap-3">
                {ART_FORMATS.map((f) => (
                  <Card
                    key={f.value}
                    className={`cursor-pointer text-center transition-all ${artFormat === f.value ? "ring-2 ring-primary bg-primary/5" : ""}`}
                    onClick={() => setArtFormat(f.value)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Estilo visual</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ART_STYLES.map((s) => (
                  <Card
                    key={s.value}
                    className={`cursor-pointer text-center transition-all ${artStyle === s.value ? "ring-2 ring-primary bg-primary/5" : ""}`}
                    onClick={() => setArtStyle(s.value)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* References */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Referências visuais</p>
              <div className="flex flex-wrap gap-2">
                {referenceUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl-lg p-0.5"
                      onClick={() => setReferenceUrls((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadRef} />
              <p className="text-xs text-muted-foreground">Mínimo 3 imagens recomendadas para melhores resultados</p>
            </div>

            {visualIdentity && (
              <Card className="bg-muted/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Identidade visual detectada</p>
                    <p className="text-xs text-muted-foreground">Cores e estilo serão aplicados automaticamente</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Duration */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Duração</p>
              <div className="grid grid-cols-3 gap-3">
                {VIDEO_DURATIONS.map((d) => (
                  <Card
                    key={d.value}
                    className={`cursor-pointer text-center transition-all ${videoDuration === d.value ? "ring-2 ring-primary bg-primary/5" : ""}`}
                    onClick={() => setVideoDuration(d.value)}
                  >
                    <CardContent className="p-3 flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{d.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Video style */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Estilo do vídeo</p>
              <div className="grid grid-cols-2 gap-3">
                {VIDEO_STYLES.map((s) => (
                  <Card
                    key={s.value}
                    className={`cursor-pointer text-center transition-all ${videoStyle === s.value ? "ring-2 ring-primary bg-primary/5" : ""}`}
                    onClick={() => setVideoStyle(s.value)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        <Button onClick={handleGenerate} className="w-full" size="lg">
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar {postType === "art" ? "Arte" : "Vídeo"}
        </Button>
      </div>
    );
  }

  // ── STEP 4: GENERATE / RESULT ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resultado"
        subtitle={generatedResult ? "Revise e aprove seu criativo" : "Gerando…"}
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        backButton={!generatePost.isPending ? <Button variant="ghost" size="icon" onClick={() => setStep("config")}><ArrowLeft className="w-4 h-4" /></Button> : undefined}
      />

      {generatePost.isPending ? (
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
      ) : generatedResult ? (
        <div className="space-y-4">
          {generatedResult.result_url && (
            <Card className="overflow-hidden">
              <img src={generatedResult.result_url} alt="Resultado" className="w-full max-h-[500px] object-contain bg-muted" />
            </Card>
          )}

          {!generatedResult.result_url && generatedResult.result_data && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Resultado gerado:</p>
                <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(generatedResult.result_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleApprove} disabled={approvePost.isPending} className="flex-1" size="lg">
              {approvePost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Aprovar ({postType === "video" ? "200" : "100"} créditos)
            </Button>
            <Button variant="outline" onClick={() => { setGeneratedResult(null); handleGenerate(); }} className="flex-1" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerar
            </Button>
            {generatedResult.result_url && (
              <Button variant="secondary" asChild size="lg">
                <a href={generatedResult.result_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" /> Baixar
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nenhum resultado disponível.</p>
            <Button variant="outline" onClick={() => setStep("config")} className="mt-4">Voltar</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
