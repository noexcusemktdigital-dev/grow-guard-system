import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNavigate }: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    },
    [currentIndex, images.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10 rounded-full"
        onClick={onClose}
       aria-label="Fechar">
        <X className="w-6 h-6" />
      </Button>

      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 text-white hover:bg-white/20 h-10 w-10 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
         aria-label="Voltar">
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {currentIndex < images.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 text-white hover:bg-white/20 h-10 w-10 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
         aria-label="Avançar">
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      <img
        src={images[currentIndex]}
        alt="Imagem ampliada"
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 text-white/70 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
}
