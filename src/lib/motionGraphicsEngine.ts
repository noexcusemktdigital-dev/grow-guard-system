// @ts-nocheck
/**
 * Motion Graphics Engine v2 — Professional Agency-Quality
 *
 * 5-layer compositing system per scene:
 *   Layer 1: Background image with Ken Burns (8 patterns)
 *   Layer 2: Brand color overlay gradient
 *   Layer 3: Animated graphic elements (shapes, lines, particles)
 *   Layer 4: Animated text (slideUp, scaleIn, fadeIn, typewriter, kinetic)
 *   Layer 5: Animated logo (intro/outro/watermark)
 *
 * 4 transition types: dissolve, slideLeft, zoomIn, wipe
 * Optional: numeric counters, floating particles
 */

/* ── Types ── */

export type TextAnimation = "slideUp" | "scaleIn" | "fadeIn" | "typewriter" | "kinetic";
export type TransitionStyle = "dissolve" | "slideLeft" | "zoomIn" | "wipe";
export type GraphicStyle = "geometric" | "organic" | "minimal";

export interface SceneText {
  main: string;
  sub?: string;
}

export interface SceneConfig {
  textAnimation?: TextAnimation;
  transition?: TransitionStyle;
  showLogo?: boolean;
  graphicStyle?: GraphicStyle;
  brandOverlayOpacity?: number;
  counterValue?: number | null;
  counterSuffix?: string;
}

export interface MotionGraphicsConfig {
  frameDurationMs?: number;
  transitionDurationMs?: number;
  fps?: number;
  kenBurnsIntensity?: number;
  outputWidth?: number;
  outputHeight?: number;
  textFont?: string;
  textColor?: string;
  logoUrl?: string;
  brandColors?: string[];
  showParticles?: boolean;
  defaultTextAnimation?: TextAnimation;
  defaultTransition?: TransitionStyle;
  onProgress?: (pct: number, msg: string) => void;
}

interface LoadedScene {
  img: HTMLImageElement;
  text: SceneText;
  config: SceneConfig;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

interface GraphicElement {
  type: "circle" | "line" | "rect";
  x: number;
  y: number;
  size: number;
  color: string;
  phase: number;
  speed: number;
}

/* ── Helpers ── */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 8 Ken Burns patterns for variety */
const KB_PATTERNS = [
  { startX: 0, startY: 0, endX: 0.5, endY: 0.5 },
  { startX: 1, startY: 0, endX: 0.5, endY: 0.5 },
  { startX: 0.5, startY: 0.5, endX: 0, endY: 1 },
  { startX: 0.5, startY: 0.5, endX: 1, endY: 0 },
  { startX: 0, startY: 1, endX: 0.5, endY: 0.3 },
  { startX: 1, startY: 1, endX: 0.3, endY: 0 },
  { startX: 0.3, startY: 0, endX: 0.7, endY: 1 },
  { startX: 0.7, startY: 0.5, endX: 0.2, endY: 0.5 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateParticles(w: number, h: number, colors: string[], count: number, seed: number): Particle[] {
  const rng = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rng() * w,
    y: rng() * h,
    size: 2 + rng() * 4,
    speed: 0.3 + rng() * 0.5,
    opacity: 0.1 + rng() * 0.2,
    color: colors[Math.floor(rng() * colors.length)] || "#ffffff",
  }));
}

function generateGraphicElements(sceneIndex: number, w: number, h: number, colors: string[], style: GraphicStyle): GraphicElement[] {
  const rng = seededRandom(sceneIndex * 1000 + 42);
  const count = style === "minimal" ? 3 : style === "geometric" ? 5 : 4;
  const types: GraphicElement["type"][] = style === "organic"
    ? ["circle", "circle", "line"]
    : style === "geometric"
      ? ["rect", "line", "circle", "rect", "line"]
      : ["line", "circle", "line"];

  return Array.from({ length: count }, (_, i) => ({
    type: types[i % types.length],
    x: rng() * w,
    y: rng() * h,
    size: style === "minimal" ? 20 + rng() * 40 : 30 + rng() * 80,
    color: colors[Math.floor(rng() * colors.length)] || "#ffffff",
    phase: rng() * Math.PI * 2,
    speed: 0.5 + rng() * 1.5,
  }));
}

/* ── Main export ── */

export async function renderMotionGraphics(
  frameUrls: string[],
  sceneTexts: SceneText[],
  config: MotionGraphicsConfig = {},
  sceneConfigs?: SceneConfig[],
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
    logoUrl,
    brandColors = [],
    showParticles = true,
    defaultTextAnimation = "slideUp",
    defaultTransition = "dissolve",
    onProgress,
  } = config;

  if (!frameUrls.length) throw new Error("No frames provided");

  // 1. Load all images + logo
  onProgress?.(0, "Carregando imagens...");
  const scenes: LoadedScene[] = [];
  let logoImg: HTMLImageElement | null = null;

  const loadPromises: Promise<void>[] = frameUrls.map(async (url, i) => {
    const img = await loadImage(url);
    scenes[i] = {
      img,
      text: sceneTexts[i] || { main: "" },
      config: sceneConfigs?.[i] || {},
    };
  });

  if (logoUrl) {
    loadPromises.push(
      loadImage(logoUrl).then((img) => { logoImg = img; }).catch(() => { logoImg = null; })
    );
  }

  await Promise.all(loadPromises);
  onProgress?.(15, "Imagens carregadas");

  // Sort scenes (Promise.all doesn't guarantee order with index assignment)
  // Already handled by using index assignment above

  const effectiveColors = brandColors.length > 0 ? brandColors : ["#ffffff", "#cccccc"];

  // 2. Setup canvas
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;

  // 3. Generate particles per scene
  const sceneParticles = scenes.map((_, i) =>
    showParticles ? generateParticles(outputWidth, outputHeight, effectiveColors, 25, i * 777) : []
  );

  // 4. Generate graphic elements per scene
  const sceneGraphics = scenes.map((s, i) => {
    const style = s.config.graphicStyle || "geometric";
    return generateGraphicElements(i, outputWidth, outputHeight, effectiveColors, style);
  });

  // 5. Setup MediaRecorder
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
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = (e) => reject(e);
    recorder.start();

    let elapsed = 0;
    let frameCount = 0;

    const renderLoop = () => {
      if (elapsed >= totalDurationMs) {
        recorder.stop();
        onProgress?.(100, "Finalizando vídeo...");
        return;
      }

      const sceneWithTransitionDur = frameDurationMs + transitionDurationMs;
      const sceneIndex = Math.min(Math.floor(elapsed / sceneWithTransitionDur), scenes.length - 1);
      const sceneStartMs = sceneIndex * sceneWithTransitionDur;
      const timeInScene = elapsed - sceneStartMs;

      const isTransition = timeInScene > frameDurationMs && sceneIndex < scenes.length - 1;
      const transitionProgress = isTransition
        ? clamp((timeInScene - frameDurationMs) / transitionDurationMs, 0, 1)
        : 0;

      const currentScene = scenes[sceneIndex];
      const sceneProgress = clamp(timeInScene / frameDurationMs, 0, 1);
      const sceneTransition = currentScene.config.transition || defaultTransition;
      const textAnim = currentScene.config.textAnimation || defaultTextAnimation;

      // Clear
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // === LAYER 1: Background Ken Burns ===
      drawKenBurns(ctx, currentScene.img, sceneIndex, sceneProgress, kenBurnsIntensity, outputWidth, outputHeight);

      // === LAYER 2: Brand Overlay ===
      const overlayOpacity = currentScene.config.brandOverlayOpacity ?? 0.15;
      if (overlayOpacity > 0 && effectiveColors.length > 0) {
        const fadeIn = clamp(timeInScene / 500, 0, 1);
        drawBrandOverlay(ctx, effectiveColors, overlayOpacity * fadeIn, outputWidth, outputHeight);
      }

      // === LAYER 3: Graphic Elements ===
      drawGraphicElements(ctx, sceneGraphics[sceneIndex], timeInScene, outputWidth, outputHeight);

      // === LAYER 3b: Particles ===
      if (showParticles) {
        drawParticles(ctx, sceneParticles[sceneIndex], elapsed);
      }

      // === LAYER 4: Text ===
      if (!isTransition || transitionProgress < 0.5) {
        const textAlpha = isTransition ? 1 - transitionProgress * 2 : getTextAlpha(timeInScene, frameDurationMs);
        drawAnimatedText(ctx, currentScene.text, textAnim, textAlpha, timeInScene, outputWidth, outputHeight, textFont, textColor);
      }

      // === LAYER 4b: Counter ===
      if (currentScene.config.counterValue != null) {
        drawCounter(ctx, currentScene.config.counterValue, currentScene.config.counterSuffix || "", timeInScene, outputWidth, outputHeight, effectiveColors[0], textFont);
      }

      // === LAYER 5: Logo ===
      if (logoImg) {
        const isFirst = sceneIndex === 0;
        const isLast = sceneIndex === scenes.length - 1;
        const showLogo = currentScene.config.showLogo !== false;
        if (showLogo) {
          drawLogo(ctx, logoImg, isFirst, isLast, timeInScene, frameDurationMs, outputWidth, outputHeight);
        }
      }

      // === TRANSITIONS to next scene ===
      if (isTransition && sceneIndex + 1 < scenes.length) {
        const nextScene = scenes[sceneIndex + 1];
        const tp = easeInOutQuad(transitionProgress);

        ctx.save();
        switch (sceneTransition) {
          case "slideLeft":
            drawSlideLeftTransition(ctx, currentScene, nextScene, sceneIndex, tp, kenBurnsIntensity, outputWidth, outputHeight, effectiveColors);
            break;
          case "zoomIn":
            drawZoomInTransition(ctx, currentScene, nextScene, sceneIndex, tp, kenBurnsIntensity, outputWidth, outputHeight, effectiveColors);
            break;
          case "wipe":
            drawWipeTransition(ctx, nextScene, sceneIndex, tp, kenBurnsIntensity, outputWidth, outputHeight, effectiveColors);
            break;
          default: // dissolve
            ctx.globalAlpha = tp;
            drawKenBurns(ctx, nextScene.img, sceneIndex + 1, 0, kenBurnsIntensity, outputWidth, outputHeight);
            if (nextScene.config.brandOverlayOpacity) {
              drawBrandOverlay(ctx, effectiveColors, nextScene.config.brandOverlayOpacity * tp, outputWidth, outputHeight);
            }
            break;
        }
        ctx.restore();

        // Fade in next scene text
        if (transitionProgress > 0.5) {
          const nextTextAlpha = (transitionProgress - 0.5) * 2 * 0.3;
          const nextTextAnim = nextScene.config.textAnimation || defaultTextAnimation;
          drawAnimatedText(ctx, nextScene.text, nextTextAnim, nextTextAlpha, 0, outputWidth, outputHeight, textFont, textColor);
        }
      }

      elapsed += frameDeltaMs;
      frameCount++;

      if (frameCount % (fps * 2) === 0) {
        const pct = Math.round(15 + (elapsed / totalDurationMs) * 80);
        onProgress?.(Math.min(pct, 95), `Animando cena ${sceneIndex + 1}/${scenes.length}...`);
      }

      setTimeout(renderLoop, 0);
    };

    onProgress?.(15, "Iniciando renderização...");
    renderLoop();
  });
}

/* ── Layer 1: Ken Burns ── */

function drawKenBurns(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  sceneIndex: number, progress: number, intensity: number, w: number, h: number,
) {
  const kb = KB_PATTERNS[sceneIndex % KB_PATTERNS.length];
  const zoomIn = sceneIndex % 2 === 0;
  const scale = zoomIn ? lerp(1, 1 + intensity, progress) : lerp(1 + intensity, 1, progress);
  const panX = lerp(kb.startX, kb.endX, progress) * intensity * w * 0.5;
  const panY = lerp(kb.startY, kb.endY, progress) * intensity * h * 0.3;

  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = w / h;
  let drawW: number, drawH: number;
  if (imgAspect > canvasAspect) { drawH = h * scale; drawW = drawH * imgAspect; }
  else { drawW = w * scale; drawH = drawW / imgAspect; }

  ctx.drawImage(img, (w - drawW) / 2 - panX, (h - drawH) / 2 - panY, drawW, drawH);
}

/* ── Layer 2: Brand Overlay ── */

function drawBrandOverlay(ctx: CanvasRenderingContext2D, colors: string[], opacity: number, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  const gradient = ctx.createLinearGradient(0, 0, w * 0.3, h);
  gradient.addColorStop(0, colors[0] || "#000000");
  gradient.addColorStop(1, (colors[1] || colors[0] || "#000000") + "33");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* ── Layer 3: Graphic Elements ── */

function drawGraphicElements(ctx: CanvasRenderingContext2D, elements: GraphicElement[], timeMs: number, w: number, h: number) {
  const t = timeMs / 1000;
  ctx.save();
  for (const el of elements) {
    const pulse = 0.8 + 0.2 * Math.sin(t * el.speed + el.phase);
    const fadeIn = clamp(timeMs / 800, 0, 1);
    ctx.globalAlpha = 0.15 * pulse * fadeIn;

    switch (el.type) {
      case "circle":
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = el.color;
        ctx.fill();
        break;
      case "line": {
        const offset = Math.sin(t * el.speed + el.phase) * 30;
        ctx.beginPath();
        ctx.moveTo(el.x - el.size + offset, el.y);
        ctx.lineTo(el.x + el.size + offset, el.y + el.size * 0.6);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }
      case "rect": {
        const s = el.size * pulse;
        ctx.beginPath();
        ctx.roundRect(el.x - s / 2, el.y - s / 2, s, s * 0.6, 8);
        ctx.fillStyle = el.color;
        ctx.fill();
        break;
      }
    }
  }
  ctx.restore();
}

/* ── Layer 3b: Particles ── */

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], elapsedMs: number) {
  ctx.save();
  const h = ctx.canvas.height;
  for (const p of particles) {
    const y = (p.y - (elapsedMs / 16.67) * p.speed) % h;
    const adjustedY = y < 0 ? y + h : y;
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, adjustedY, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.restore();
}

/* ── Layer 4: Animated Text ── */

function getTextAlpha(timeInScene: number, sceneDuration: number): number {
  const fadeInEnd = 400;
  const fadeOutStart = sceneDuration - 500;
  if (timeInScene < fadeInEnd) return timeInScene / fadeInEnd;
  if (timeInScene > fadeOutStart) return clamp((sceneDuration - timeInScene) / 500, 0, 1);
  return 1;
}

function drawAnimatedText(
  ctx: CanvasRenderingContext2D, text: SceneText, animation: TextAnimation,
  alpha: number, timeMs: number, w: number, h: number, font: string, color: string,
) {
  if ((!text.main && !text.sub) || alpha <= 0) return;

  ctx.save();

  // Background bar at bottom
  const barH = h * 0.18;
  const barY = h - barH;
  ctx.globalAlpha = alpha;
  const gradient = ctx.createLinearGradient(0, barY, 0, h);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.3, "rgba(0,0,0,0.6)");
  gradient.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, barY, w, barH);

  const fontSize = parseInt(font) || 52;
  const lineHeight = fontSize * 1.35;
  const maxWidth = w * 0.85;
  const textStartY = barY + barH * 0.35;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;

  switch (animation) {
    case "slideUp":
      drawTextSlideUp(ctx, text, alpha, timeMs, w, textStartY, maxWidth, fontSize, lineHeight, color);
      break;
    case "scaleIn":
      drawTextScaleIn(ctx, text, alpha, timeMs, w, h, textStartY, maxWidth, fontSize, lineHeight);
      break;
    case "kinetic":
      drawTextKinetic(ctx, text, alpha, timeMs, w, textStartY, maxWidth, fontSize, lineHeight);
      break;
    case "typewriter":
      drawTextTypewriter(ctx, text, alpha, timeMs, w, textStartY, maxWidth, fontSize, lineHeight, color);
      break;
    default: // fadeIn
      drawTextFadeIn(ctx, text, alpha, w, textStartY, maxWidth, fontSize, lineHeight, color);
      break;
  }

  ctx.restore();
}

function drawTextSlideUp(
  ctx: CanvasRenderingContext2D, text: SceneText, alpha: number, timeMs: number,
  w: number, baseY: number, maxWidth: number, fontSize: number, lineHeight: number, color: string,
) {
  const slideProgress = easeOutCubic(clamp(timeMs / 600, 0, 1));
  const offsetY = (1 - slideProgress) * 80;
  ctx.globalAlpha = alpha * slideProgress;

  if (text.main) {
    const lines = wrapText(ctx, text.main, maxWidth);
    lines.forEach((line, i) => ctx.fillText(line, w / 2, baseY + i * lineHeight + offsetY));

    if (text.sub) {
      const subProgress = easeOutCubic(clamp((timeMs - 200) / 600, 0, 1));
      const subFontSize = Math.round(fontSize * 0.6);
      ctx.font = `${subFontSize}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.globalAlpha = alpha * subProgress;
      const subY = baseY + lines.length * lineHeight + subFontSize * 0.8 + (1 - subProgress) * 40;
      ctx.fillText(text.sub, w / 2, subY);
    }
  }
}

function drawTextScaleIn(
  ctx: CanvasRenderingContext2D, text: SceneText, alpha: number, timeMs: number,
  w: number, h: number, baseY: number, maxWidth: number, fontSize: number, lineHeight: number,
) {
  const scaleProgress = easeOutCubic(clamp(timeMs / 500, 0, 1));
  const scale = lerp(0.3, 1, scaleProgress);

  ctx.save();
  ctx.globalAlpha = alpha * scaleProgress;
  const centerX = w / 2;
  const centerY = baseY + lineHeight;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);

  if (text.main) {
    const lines = wrapText(ctx, text.main, maxWidth / scale);
    lines.forEach((line, i) => ctx.fillText(line, w / 2, baseY + i * lineHeight));
  }
  ctx.restore();
}

function drawTextKinetic(
  ctx: CanvasRenderingContext2D, text: SceneText, alpha: number, timeMs: number,
  w: number, baseY: number, maxWidth: number, fontSize: number, lineHeight: number,
) {
  if (!text.main) return;
  const words = text.main.split(" ");
  const delayPerWord = 100;

  // First wrap full text to get line positions
  const lines = wrapText(ctx, text.main, maxWidth);
  let wordIndex = 0;

  lines.forEach((line, lineIdx) => {
    const lineWords = line.split(" ");
    let xOffset = 0;
    const lineWidth = ctx.measureText(line).width;
    const startX = (w - lineWidth) / 2;

    lineWords.forEach((word) => {
      const wordDelay = wordIndex * delayPerWord;
      const wordProgress = easeOutCubic(clamp((timeMs - wordDelay) / 300, 0, 1));
      const bounce = wordProgress > 0.8 ? 1 + Math.sin((wordProgress - 0.8) * Math.PI * 5) * 0.05 : wordProgress;

      ctx.globalAlpha = alpha * clamp(wordProgress, 0, 1);
      const ww = ctx.measureText(word + " ").width;
      ctx.save();
      const wx = startX + xOffset + ww / 2;
      const wy = baseY + lineIdx * lineHeight;
      ctx.translate(wx, wy);
      ctx.scale(bounce, bounce);
      ctx.textAlign = "center";
      ctx.fillText(word, 0, 0);
      ctx.restore();

      xOffset += ww;
      wordIndex++;
    });
  });
}

function drawTextTypewriter(
  ctx: CanvasRenderingContext2D, text: SceneText, alpha: number, timeMs: number,
  w: number, baseY: number, maxWidth: number, fontSize: number, lineHeight: number, color: string,
) {
  const charsPerMs = 0.03;
  const visibleChars = Math.floor(timeMs * charsPerMs);
  ctx.globalAlpha = alpha;

  if (text.main) {
    const visible = text.main.substring(0, Math.min(visibleChars, text.main.length));
    const lines = wrapText(ctx, visible, maxWidth);
    lines.forEach((line, i) => ctx.fillText(line, w / 2, baseY + i * lineHeight));

    if (text.sub) {
      const subStart = text.main.length;
      const subVisible = text.sub.substring(0, Math.max(0, visibleChars - subStart - 10));
      if (subVisible) {
        const subFontSize = Math.round(fontSize * 0.6);
        ctx.font = `${subFontSize}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(subVisible, w / 2, baseY + lines.length * lineHeight + subFontSize * 0.8);
      }
    }
  }
}

function drawTextFadeIn(
  ctx: CanvasRenderingContext2D, text: SceneText, alpha: number,
  w: number, baseY: number, maxWidth: number, fontSize: number, lineHeight: number, color: string,
) {
  ctx.globalAlpha = alpha;
  if (text.main) {
    const lines = wrapText(ctx, text.main, maxWidth);
    lines.forEach((line, i) => ctx.fillText(line, w / 2, baseY + i * lineHeight));

    if (text.sub) {
      const subFontSize = Math.round(fontSize * 0.6);
      ctx.font = `${subFontSize}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(text.sub, w / 2, baseY + lines.length * lineHeight + subFontSize * 0.8);
    }
  }
}

/* ── Layer 4b: Counter ── */

function drawCounter(
  ctx: CanvasRenderingContext2D, targetValue: number, suffix: string,
  timeMs: number, w: number, h: number, primaryColor: string, font: string,
) {
  const counterDuration = 2000;
  const progress = easeOutCubic(clamp(timeMs / counterDuration, 0, 1));
  const currentValue = Math.round(targetValue * progress);
  const suffixAlpha = clamp((timeMs - counterDuration) / 300, 0, 1);

  const fontSize = parseInt(font) || 52;
  const counterFontSize = Math.round(fontSize * 1.8);

  ctx.save();
  ctx.globalAlpha = clamp(timeMs / 400, 0, 1);
  ctx.font = `bold ${counterFontSize}px Inter, sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 12;

  const y = h * 0.4;
  ctx.fillText(String(currentValue), w / 2, y);

  if (suffix && suffixAlpha > 0) {
    ctx.globalAlpha = suffixAlpha;
    ctx.font = `bold ${Math.round(counterFontSize * 0.5)}px Inter, sans-serif`;
    ctx.fillText(suffix, w / 2, y + counterFontSize * 0.6);
  }

  ctx.restore();
}

/* ── Layer 5: Logo ── */

function drawLogo(
  ctx: CanvasRenderingContext2D, logo: HTMLImageElement,
  isFirst: boolean, isLast: boolean, timeMs: number, sceneDuration: number,
  w: number, h: number,
) {
  ctx.save();

  if (isFirst) {
    // Intro: scale from 0.3 to 1.0 + fade (1.5s), top center
    const introProgress = easeOutCubic(clamp(timeMs / 1500, 0, 1));
    const scale = lerp(0.3, 1, introProgress);
    const logoSize = 120 * scale;
    const aspect = logo.naturalWidth / logo.naturalHeight;

    ctx.globalAlpha = introProgress;
    const lw = logoSize * aspect;
    const lh = logoSize;
    ctx.drawImage(logo, (w - lw) / 2, h * 0.08, lw, lh);
  } else if (isLast) {
    // Outro: centered with animated glow
    const fadeIn = easeOutCubic(clamp(timeMs / 800, 0, 1));
    const glow = 10 + Math.sin(timeMs / 300) * 8;
    const logoSize = 160;
    const aspect = logo.naturalWidth / logo.naturalHeight;

    ctx.globalAlpha = fadeIn;
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = glow;
    const lw = logoSize * aspect;
    const lh = logoSize;
    ctx.drawImage(logo, (w - lw) / 2, h * 0.06, lw, lh);
    ctx.shadowBlur = 0;
  } else {
    // Watermark: small in top-right corner
    const logoSize = 50;
    const aspect = logo.naturalWidth / logo.naturalHeight;
    ctx.globalAlpha = 0.4;
    const lw = logoSize * aspect;
    const lh = logoSize;
    ctx.drawImage(logo, w - lw - 30, 30, lw, lh);
  }

  ctx.restore();
}

/* ── Transition Renderers ── */

function drawSlideLeftTransition(
  ctx: CanvasRenderingContext2D, current: LoadedScene, next: LoadedScene,
  sceneIndex: number, progress: number, intensity: number, w: number, h: number, colors: string[],
) {
  // Re-draw current scene shifted left
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(-w * progress, 0);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  drawKenBurns(ctx, current.img, sceneIndex, 1, intensity, w, h);
  ctx.restore();

  // Draw next scene entering from right
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(w * (1 - progress), 0);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  drawKenBurns(ctx, next.img, sceneIndex + 1, 0, intensity, w, h);
  if (next.config.brandOverlayOpacity) {
    drawBrandOverlay(ctx, colors, next.config.brandOverlayOpacity * progress, w, h);
  }
  ctx.restore();
}

function drawZoomInTransition(
  ctx: CanvasRenderingContext2D, current: LoadedScene, next: LoadedScene,
  sceneIndex: number, progress: number, intensity: number, w: number, h: number, colors: string[],
) {
  // Zoom into current scene
  ctx.save();
  const zoomScale = 1 + progress * 0.5;
  ctx.globalAlpha = 1 - progress;
  ctx.translate(w / 2, h / 2);
  ctx.scale(zoomScale, zoomScale);
  ctx.translate(-w / 2, -h / 2);
  drawKenBurns(ctx, current.img, sceneIndex, 1, intensity, w, h);
  ctx.restore();

  // Fade in next scene
  ctx.save();
  ctx.globalAlpha = progress;
  drawKenBurns(ctx, next.img, sceneIndex + 1, 0, intensity, w, h);
  if (next.config.brandOverlayOpacity) {
    drawBrandOverlay(ctx, colors, next.config.brandOverlayOpacity * progress, w, h);
  }
  ctx.restore();
}

function drawWipeTransition(
  ctx: CanvasRenderingContext2D, next: LoadedScene,
  sceneIndex: number, progress: number, intensity: number, w: number, h: number, colors: string[],
) {
  // Draw next scene clipped by wipe progress
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w * progress, h);
  ctx.clip();
  drawKenBurns(ctx, next.img, sceneIndex + 1, 0, intensity, w, h);
  if (next.config.brandOverlayOpacity) {
    drawBrandOverlay(ctx, colors, next.config.brandOverlayOpacity, w, h);
  }
  ctx.restore();
}

/* ── Text Wrapping ── */

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
