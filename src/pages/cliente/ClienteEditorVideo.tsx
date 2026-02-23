import { useState, useRef, useCallback } from "react";
import { Film, Upload, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoEditor } from "@/components/video/VideoEditor";
import { PageHeader } from "@/components/PageHeader";

const ACCEPTED = ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm";
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export default function ClienteEditorVideo() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_SIZE) {
      alert("Arquivo muito grande. Máximo 500MB.");
      return;
    }
    setVideoFile(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (videoFile) {
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col p-4">
        <VideoEditor videoFile={videoFile} onClose={() => setVideoFile(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Editor de Vídeo"
        subtitle="Faça upload do vídeo gravado e edite com cortes, legendas, inserts e música."
        icon={<Film className="h-5 w-5 text-primary" />}
      />

      {/* Browser compat warning */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Funciona melhor em Chrome/Edge. Safari tem suporte limitado. Vídeos grandes podem levar alguns minutos para processar.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 py-20 px-6 cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Arraste seu vídeo aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground">MP4, MOV, WebM • Máx. 500MB</p>
          </div>
          <Button variant="outline" size="sm">Selecionar Arquivo</Button>
          <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onInputChange} />
        </div>

        {/* Tip card */}
        <Card className="h-fit">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Dica</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Grave seguindo o roteiro gerado em <strong>Conteúdos</strong> e edite aqui.
              Você pode cortar trechos, adicionar legendas estilizadas, inserir logos/selos e
              colocar uma música de fundo.
            </p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>✂️ <strong>Cortes</strong> — Remova trechos indesejados</p>
              <p>📝 <strong>Legendas</strong> — 3 estilos prontos</p>
              <p>🖼️ <strong>Inserts</strong> — Logos e watermarks</p>
              <p>🎵 <strong>Música</strong> — Fundo musical com mix</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
