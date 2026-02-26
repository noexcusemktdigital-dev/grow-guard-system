/**
 * Motion Graphics Engine — Canvas 2D + MediaRecorder
 *
 * Generates a WebM video blob from a set of AI-generated frames with:
 *  • Ken Burns effect (zoom + pan)
 *  • Animated text overlays (typewriter effect)
 *  • Smooth cross-fade transitions between scenes
 */

/* ── Types ── */

export interface SceneText {
  main: string;
  sub?: string;
}

export interface MotionGraphicsConfig {
  frameDurationMs?: number;       // ms per scene (default 3000)
  transitionDurationMs?: number;  // cross-fade duration (default 500)
  fps?: number;                   // output fps (default 30)
  kenBurnsIntensity?: number;     // zoom factor 0-1 (default 0.15)
  outputWidth?: number;           // default 1080
  outputHeight?: number;          // default 1920
  textFont?: string;              // default "bold 52px Inter, sans-serif"
  textColor?: string;             // default "#FFFFFF"
  onProgress?: (pct: number, msg: string) => void;
}

interface LoadedScene {
  img: HTMLImageElement;
  text: SceneText;
}

/* ── Helpers ── */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Alternate Ken Burns direction per scene */
function getKenBurnsParams(sceneIndex: number) {
  const patterns = [
    { startX: 0, startY: 0, endX: 0.5, endY: 0.5 },   // top-left → center
    { startX: 1, startY: 0, endX: 0.5, endY: 0.5 },   // top-right → center
    { startX: 0.5, startY: 0.5, endX: 0, endY: 1 },   // center → bottom-left
    { startX: 0.5, startY: 0.5, endX: 1, endY: 0 },   // center → top-right
  ];
  return patterns[sceneIndex % patterns.length];
}

/* ── Main export ── */

export async function renderMotionGraphics(
  frameUrls: string[],
  sceneTexts: SceneText[],
  config: MotionGraphicsConfig = {},
): Promise<Blob> {
  const {
    frameDurationMs = 3000,
    transitionDurationMs = 500,
    fps = 30,
    kenBurnsIntensity = 0.15,
    outputWidth = 1080,
    outputHeight = 1920,
    textFont = "bold 52px Inter, sans-serif",
    textColor = "#FFFFFF",
    onProgress,
  } = config;

  if (!frameUrls.length) throw new Error("No frames provided");

  // 1. Load all images
  onProgress?.(0, "Carregando imagens...");
  const scenes: LoadedScene[] = [];
  for (let i = 0; i < frameUrls.length; i++) {
    const img = await loadImage(frameUrls[i]);
    scenes.push({ img, text: sceneTexts[i] || { main: "" } });
    onProgress?.(Math.round(((i + 1) / frameUrls.length) * 20), `Imagem ${i + 1}/${frameUrls.length} carregada`);
  }

  // 2. Setup offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;

  // 3. Setup MediaRecorder
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const totalDurationMs = scenes.length * frameDurationMs + (scenes.length - 1) * transitionDurationMs;
  const frameDeltaMs = 1000 / fps;

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = (e) => reject(e);
    recorder.start();

    let elapsed = 0;
    let frameCount = 0;
    const totalFrames = Math.ceil(totalDurationMs / frameDeltaMs);

    const renderLoop = () => {
      if (elapsed >= totalDurationMs) {
        recorder.stop();
        onProgress?.(100, "Finalizando vídeo...");
        return;
      }

      // Determine which scene we're in
      const sceneWithTransitionDur = frameDurationMs + transitionDurationMs;
      const sceneIndex = Math.min(
        Math.floor(elapsed / sceneWithTransitionDur),
        scenes.length - 1,
      );
      const sceneStartMs = sceneIndex * sceneWithTransitionDur;
      const timeInScene = elapsed - sceneStartMs;

      // Is this a transition period?
      const isTransition = timeInScene > frameDurationMs && sceneIndex < scenes.length - 1;
      const transitionProgress = isTransition
        ? clamp((timeInScene - frameDurationMs) / transitionDurationMs, 0, 1)
        : 0;

      // Clear
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Draw current scene with Ken Burns
      const currentScene = scenes[sceneIndex];
      const sceneProgress = clamp(timeInScene / frameDurationMs, 0, 1);
      drawKenBurns(ctx, currentScene.img, sceneIndex, sceneProgress, kenBurnsIntensity, outputWidth, outputHeight);

      // Draw text overlay for current scene
      if (!isTransition || transitionProgress < 0.5) {
        const textAlpha = isTransition ? 1 - transitionProgress * 2 : getTextAlpha(timeInScene, frameDurationMs);
        drawTextOverlay(ctx, currentScene.text, textAlpha, timeInScene, outputWidth, outputHeight, textFont, textColor);
      }

      // Cross-fade to next scene
      if (isTransition && sceneIndex + 1 < scenes.length) {
        ctx.globalAlpha = transitionProgress;
        const nextScene = scenes[sceneIndex + 1];
        drawKenBurns(ctx, nextScene.img, sceneIndex + 1, 0, kenBurnsIntensity, outputWidth, outputHeight);

        if (transitionProgress > 0.5) {
          const nextTextAlpha = (transitionProgress - 0.5) * 2;
          drawTextOverlay(ctx, nextScene.text, nextTextAlpha * 0.3, 0, outputWidth, outputHeight, textFont, textColor);
        }
        ctx.globalAlpha = 1;
      }

      elapsed += frameDeltaMs;
      frameCount++;

      // Progress callback (20-95%)
      if (frameCount % (fps * 2) === 0) {
        const pct = Math.round(20 + (elapsed / totalDurationMs) * 75);
        onProgress?.(Math.min(pct, 95), `Renderizando: ${Math.round((elapsed / totalDurationMs) * 100)}%`);
      }

      // Use setTimeout for consistent frame timing (rAF is tied to display refresh)
      setTimeout(renderLoop, 0);
    };

    onProgress?.(20, "Iniciando renderização...");
    renderLoop();
  });
}

/* ── Drawing helpers ── */

function drawKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sceneIndex: number,
  progress: number,
  intensity: number,
  w: number,
  h: number,
) {
  const kb = getKenBurnsParams(sceneIndex);

  // Alternate between zoom-in and zoom-out per scene
  const zoomIn = sceneIndex % 2 === 0;
  const scale = zoomIn
    ? lerp(1, 1 + intensity, progress)
    : lerp(1 + intensity, 1, progress);

  const panX = lerp(kb.startX, kb.endX, progress) * intensity * w * 0.5;
  const panY = lerp(kb.startY, kb.endY, progress) * intensity * h * 0.3;

  // Calculate cover-fit dimensions
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = w / h;

  let drawW: number, drawH: number;
  if (imgAspect > canvasAspect) {
    drawH = h * scale;
    drawW = drawH * imgAspect;
  } else {
    drawW = w * scale;
    drawH = drawW / imgAspect;
  }

  const x = (w - drawW) / 2 - panX;
  const y = (h - drawH) / 2 - panY;

  ctx.drawImage(img, x, y, drawW, drawH);
}

function getTextAlpha(timeInScene: number, sceneDuration: number): number {
  const fadeInEnd = 400;     // ms to fully appear
  const fadeOutStart = sceneDuration - 500; // start fading 500ms before end

  if (timeInScene < fadeInEnd) return timeInScene / fadeInEnd;
  if (timeInScene > fadeOutStart) return clamp((sceneDuration - timeInScene) / 500, 0, 1);
  return 1;
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: SceneText,
  alpha: number,
  timeInSceneMs: number,
  w: number,
  h: number,
  font: string,
  color: string,
) {
  if (!text.main && !text.sub) return;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Typewriter effect: reveal chars over time
  const charsPerMs = 0.03; // ~30 chars per second
  const visibleChars = Math.floor(timeInSceneMs * charsPerMs);

  const mainVisible = text.main ? text.main.substring(0, Math.min(visibleChars, text.main.length)) : "";
  const subStart = text.main ? text.main.length : 0;
  const subVisible = text.sub
    ? text.sub.substring(0, Math.max(0, Math.min(visibleChars - subStart - 10, text.sub.length)))
    : "";

  // Background bar at bottom
  const barH = h * 0.18;
  const barY = h - barH;
  const gradient = ctx.createLinearGradient(0, barY, 0, h);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.3, "rgba(0,0,0,0.6)");
  gradient.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, barY, w, barH);

  // Main text
  if (mainVisible) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;

    const maxWidth = w * 0.85;
    const lines = wrapCanvasText(ctx, mainVisible, maxWidth);
    const fontSize = parseInt(font) || 52;
    const lineHeight = fontSize * 1.35;
    const textStartY = barY + barH * 0.35;

    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, textStartY + i * lineHeight);
    });

    // Subtitle
    if (subVisible) {
      const subFontSize = Math.round(fontSize * 0.6);
      ctx.font = `${subFontSize}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 4;
      const subY = textStartY + lines.length * lineHeight + subFontSize * 0.8;
      ctx.fillText(subVisible, w / 2, subY);
    }
  }

  ctx.restore();
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
