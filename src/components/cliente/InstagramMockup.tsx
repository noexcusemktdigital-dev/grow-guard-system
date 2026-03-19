import { useState, useMemo } from "react";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Download, Copy, Sparkles, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InstagramMockupProps {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  profileName?: string;
  profileImage?: string;
  carouselImages?: string[];
  onCaptionChange?: (caption: string) => void;
  onRefine?: () => void;
  onDownload?: () => void;
  onSchedule?: () => void;
  onNewPost?: () => void;
  isRefining?: boolean;
}

export function InstagramMockup({
  imageUrl,
  caption,
  hashtags,
  profileName = "sua_marca",
  profileImage,
  carouselImages,
  onCaptionChange,
  onRefine,
  onDownload,
  onSchedule,
  onNewPost,
  isRefining,
}: InstagramMockupProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = carouselImages?.length ? carouselImages : [imageUrl];
  const isCarousel = images.length > 1;
  const likeCount = Math.floor(Math.random() * 200) + 50;
  const fullCaption = `${caption}${hashtags.length ? "\n\n" + hashtags.map(h => `#${h}`).join(" ") : ""}`;
  const charCount = fullCaption.length;

  const copyCaption = () => {
    navigator.clipboard.writeText(fullCaption);
    toast({ title: "Legenda copiada!" });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* ─── Phone mockup ─── */}
      <div className="flex-shrink-0 mx-auto lg:mx-0">
        <div className="w-[340px] bg-card border rounded-3xl shadow-2xl overflow-hidden">
          {/* Instagram header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {profileName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{profileName}</p>
              <p className="text-[10px] text-muted-foreground">Patrocinado</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Image area */}
          <div className="relative bg-muted aspect-square">
            <img
              src={images[currentSlide]}
              alt="Arte"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
            {isCarousel && (
              <>
                {currentSlide > 0 && (
                  <button onClick={() => setCurrentSlide(p => p - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center shadow">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                {currentSlide < images.length - 1 && (
                  <button onClick={() => setCurrentSlide(p => p + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center shadow">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === currentSlide ? "bg-primary" : "bg-white/50")} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <button onClick={() => setLiked(!liked)}>
                  <Heart className={cn("w-5 h-5 transition-colors", liked ? "fill-red-500 text-red-500" : "text-foreground")} />
                </button>
                <MessageCircle className="w-5 h-5 text-foreground" />
                <Send className="w-5 h-5 text-foreground" />
              </div>
              {isCarousel && (
                <span className="text-[10px] text-muted-foreground font-medium">{currentSlide + 1}/{images.length}</span>
              )}
              <button onClick={() => setSaved(!saved)}>
                <Bookmark className={cn("w-5 h-5 transition-colors", saved ? "fill-foreground text-foreground" : "text-foreground")} />
              </button>
            </div>
            <p className="text-xs font-semibold mt-2">{likeCount + (liked ? 1 : 0)} curtidas</p>
          </div>

          {/* Caption */}
          <div className="px-3 pb-3 max-h-24 overflow-y-auto">
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">{profileName}</span>{" "}
              {caption.slice(0, 100)}{caption.length > 100 && "..."}
            </p>
            {hashtags.length > 0 && (
              <p className="text-xs text-primary/70 mt-1">
                {hashtags.slice(0, 5).map(h => `#${h}`).join(" ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Side panel ─── */}
      <div className="flex-1 space-y-4 min-w-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Legenda</label>
            <span className={cn("text-[11px]", charCount > 2200 ? "text-destructive" : "text-muted-foreground")}>
              {charCount}/2200
            </span>
          </div>
          <Textarea
            value={caption}
            onChange={(e) => onCaptionChange?.(e.target.value)}
            rows={4}
            placeholder="Escreva a legenda do post..."
            className="text-sm resize-none"
          />
        </div>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((h, i) => (
              <Badge key={i} variant="secondary" className="text-[11px]">#{h}</Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onRefine} disabled={isRefining}>
            <Sparkles className="w-3.5 h-3.5" /> {isRefining ? "Refinando..." : "Refinar com IA"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyCaption}>
            <Copy className="w-3.5 h-3.5" /> Copiar Legenda
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onDownload}>
            <Download className="w-3.5 h-3.5" /> Baixar Arte
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onSchedule}>
            <CalendarIcon className="w-3.5 h-3.5" /> Agendar
          </Button>
        </div>

        <Button
          variant="default"
          size="sm"
          className="w-full gap-1.5 text-xs opacity-60 cursor-not-allowed"
          disabled
        >
          <ExternalLink className="w-3.5 h-3.5" /> Publicar no Instagram
          <Badge variant="secondary" className="text-[9px] ml-1">Em breve</Badge>
        </Button>

        {onNewPost && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={onNewPost}>
            + Criar Novo Post
          </Button>
        )}
      </div>
    </div>
  );
}
