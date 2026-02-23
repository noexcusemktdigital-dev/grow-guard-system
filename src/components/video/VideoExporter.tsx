import { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface Props {
  videoFile: File | null;
  disabled?: boolean;
}

export function VideoExporter({ videoFile, disabled }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = useCallback(async () => {
    if (!videoFile) return;
    setExporting(true);
    setProgress(0);

    try {
      // Simulate export progress — real FFmpeg.wasm integration can be added later
      // For now we provide a download of the original file to demonstrate the flow
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 200));
        setProgress(i);
      }

      const url = URL.createObjectURL(videoFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-editado-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Vídeo exportado!", description: "O download foi iniciado." });
    } catch (err) {
      toast({ title: "Erro na exportação", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }, [videoFile]);

  return (
    <div className="space-y-2">
      {exporting && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Exportando... {progress}%
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      <Button
        onClick={handleExport}
        disabled={disabled || exporting || !videoFile}
        className="w-full gap-2"
      >
        {exporting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
        ) : (
          <><Download className="h-4 w-4" /> Exportar Vídeo</>
        )}
      </Button>
    </div>
  );
}
