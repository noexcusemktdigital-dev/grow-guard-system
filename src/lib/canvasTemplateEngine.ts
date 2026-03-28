/**
 * Canvas Template Engine — Hybrid rendering system
 * AI generates background image, this engine composes text, shapes, and logo on top
 */

// ── Types ──

export interface TemplateConfig {
  width: number;
  height: number;
  background: BackgroundConfig;
  elements: TemplateElement[];
  brandColors: string[];
  logoUrl?: string;
}

export interface BackgroundConfig {
  type: 'image' | 'solid' | 'gradient';
  imageUrl?: string;
  color?: string;
  gradientColors?: string[];
  gradientAngle?: number;
  imageFit: 'cover' | 'contain' | 'fill';
  imageMask?: 'full' | 'left-half' | 'right-half' | 'center-circle' | 'frame-inset';
  overlay?: { color: string; opacity: number };
}

export type TemplateElement = TextElement | ShapeElement | ImageElement;

export interface TextElement {
  type: 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'black';
  color: string;
  align: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'uppercase' | 'none';
  shadow?: { blur: number; color: string; offsetX: number; offsetY: number };
}

export interface ShapeElement {
  type: 'shape';
  shape: 'rect' | 'circle' | 'line' | 'diagonal-stripe' | 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  rotation?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface ImageElement {
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  borderRadius?: number;
}

// ── Font Loading ──

const FONT_MAP: Record<string, string> = {
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
  'Bebas Neue': 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
  'Oswald': 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap',
  'Raleway': 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;700;900&display=swap',
};

const loadedFonts = new Set<string>();

async function loadFont(family: string): Promise<void> {
  if (loadedFonts.has(family)) return;
  const url = FONT_MAP[family];
  if (!url) { loadedFonts.add(family); return; }

  try {
    // Fetch the CSS to get the actual font file URLs
    const css = await fetch(url).then(r => r.text());
    const fontUrlMatch = css.match(/url\(([^)]+)\)/);
    if (fontUrlMatch) {
      const fontFileUrl = fontUrlMatch[1].replace(/['"]/g, '');
      const font = new FontFace(family, `url(${fontFileUrl})`);
      await font.load();
      document.fonts.add(font);
    }
    loadedFonts.add(family);
  } catch (err) {
    // Failed to load font, using fallback
    loadedFonts.add(family);
  }
}

async function loadAllFonts(config: TemplateConfig): Promise<void> {
  const families = new Set<string>();
  for (const el of config.elements) {
    if (el.type === 'text') families.add(el.fontFamily);
  }
  await Promise.all([...families].map(f => loadFont(f)));
}

// ── Image Loading ──

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ── Background Rendering ──

function drawBackground(ctx: CanvasRenderingContext2D, bg: BackgroundConfig, w: number, h: number, bgImage?: HTMLImageElement) {
  if (bg.type === 'solid' && bg.color) {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.type === 'gradient' && bg.gradientColors?.length) {
    const angle = (bg.gradientAngle ?? 135) * Math.PI / 180;
    const cx = w / 2, cy = h / 2;
    const len = Math.max(w, h);
    const x0 = cx - Math.cos(angle) * len / 2;
    const y0 = cy - Math.sin(angle) * len / 2;
    const x1 = cx + Math.cos(angle) * len / 2;
    const y1 = cy + Math.sin(angle) * len / 2;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    bg.gradientColors.forEach((c, i) => grad.addColorStop(i / ((bg.gradientColors?.length ?? 1) - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  if (bg.type === 'image' && bgImage) {
    ctx.save();
    applyImageMask(ctx, bg.imageMask || 'full', w, h);
    drawImageCover(ctx, bgImage, w, h, bg.imageFit);
    ctx.restore();
  }

  if (bg.overlay) {
    ctx.save();
    ctx.globalAlpha = bg.overlay.opacity;
    ctx.fillStyle = bg.overlay.color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function applyImageMask(ctx: CanvasRenderingContext2D, mask: string, w: number, h: number) {
  switch (mask) {
    case 'left-half':
      ctx.beginPath();
      ctx.rect(0, 0, w / 2, h);
      ctx.clip();
      break;
    case 'right-half':
      ctx.beginPath();
      ctx.rect(w / 2, 0, w / 2, h);
      ctx.clip();
      break;
    case 'center-circle': {
      const r = Math.min(w, h) * 0.35;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.clip();
      break;
    }
    case 'frame-inset': {
      const inset = Math.min(w, h) * 0.08;
      ctx.beginPath();
      ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, inset * 0.5);
      ctx.clip();
      break;
    }
    // 'full' — no clipping
  }
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, fit: string) {
  if (fit === 'fill') {
    ctx.drawImage(img, 0, 0, w, h);
    return;
  }
  const isCover = fit === 'cover';
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sw: number, sh: number, sx: number, sy: number;

  if ((isCover && imgRatio > canvasRatio) || (!isCover && imgRatio < canvasRatio)) {
    sh = img.naturalHeight;
    sw = sh * canvasRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

// ── Element Rendering ──

function drawShape(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  ctx.save();
  ctx.globalAlpha = el.opacity;

  if (el.rotation) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(el.rotation * Math.PI / 180);
    ctx.translate(-cx, -cy);
  }

  switch (el.shape) {
    case 'rect':
      if (el.borderRadius) {
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
        ctx.fillStyle = el.color;
        ctx.fill();
        if (el.borderWidth && el.borderColor) {
          ctx.strokeStyle = el.borderColor;
          ctx.lineWidth = el.borderWidth;
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.borderWidth && el.borderColor) {
          ctx.strokeStyle = el.borderColor;
          ctx.lineWidth = el.borderWidth;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }
      break;

    case 'circle': {
      const r = Math.min(el.width, el.height) / 2;
      ctx.beginPath();
      ctx.arc(el.x + el.width / 2, el.y + el.height / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = el.color;
      ctx.fill();
      if (el.borderWidth && el.borderColor) {
        ctx.strokeStyle = el.borderColor;
        ctx.lineWidth = el.borderWidth;
        ctx.stroke();
      }
      break;
    }

    case 'line':
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x + el.width, el.y + el.height);
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.borderWidth || 4;
      ctx.stroke();
      break;

    case 'diagonal-stripe':
      ctx.beginPath();
      ctx.moveTo(el.x, el.y + el.height);
      ctx.lineTo(el.x + el.width * 0.3, el.y);
      ctx.lineTo(el.x + el.width * 0.7, el.y);
      ctx.lineTo(el.x + el.width, el.y + el.height);
      ctx.closePath();
      ctx.fillStyle = el.color;
      ctx.fill();
      break;

    case 'frame':
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.borderWidth || 6;
      if (el.borderRadius) {
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      }
      break;
  }
  ctx.restore();
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
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

function drawText(ctx: CanvasRenderingContext2D, el: TextElement) {
  ctx.save();

  const text = el.textTransform === 'uppercase' ? el.content.toUpperCase() : el.content;
  const weight = el.fontWeight === 'black' ? '900' : el.fontWeight === 'bold' ? '700' : '400';
  ctx.font = `${weight} ${el.fontSize}px "${el.fontFamily}", sans-serif`;
  ctx.fillStyle = el.color;
  ctx.textAlign = el.align;

  if (el.shadow) {
    ctx.shadowColor = el.shadow.color;
    ctx.shadowBlur = el.shadow.blur;
    ctx.shadowOffsetX = el.shadow.offsetX;
    ctx.shadowOffsetY = el.shadow.offsetY;
  }

  const lineH = el.fontSize * (el.lineHeight ?? 1.25);
  const lines = wrapTextLines(ctx, text, el.width);

  let xBase: number;
  if (el.align === 'center') xBase = el.x + el.width / 2;
  else if (el.align === 'right') xBase = el.x + el.width;
  else xBase = el.x;

  if (el.letterSpacing && el.letterSpacing > 0) {
    (ctx as any).letterSpacing = `${el.letterSpacing}px`;
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, xBase, el.y + i * lineH + el.fontSize);
  });

  ctx.restore();
}

async function drawImageElement(ctx: CanvasRenderingContext2D, el: ImageElement) {
  try {
    const img = await loadImage(el.src);
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    if (el.borderRadius) {
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
      ctx.clip();
    }

    ctx.drawImage(img, el.x, el.y, el.width, el.height);
    ctx.restore();
  } catch (err) {
    // Failed to draw image element
  }
}

// ── Main Render Function ──

export async function renderTemplate(config: TemplateConfig): Promise<Blob> {
  // Load fonts first
  await loadAllFonts(config);

  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d')!;

  // Load background image if needed
  let bgImage: HTMLImageElement | undefined;
  if (config.background.type === 'image' && config.background.imageUrl) {
    try {
      bgImage = await loadImage(config.background.imageUrl);
    } catch (err) {
      // Background image failed, using fallback
    }
  }

  // Draw background
  drawBackground(ctx, config.background, config.width, config.height, bgImage);

  // Draw elements in order
  for (const el of config.elements) {
    switch (el.type) {
      case 'shape':
        drawShape(ctx, el);
        break;
      case 'text':
        drawText(ctx, el);
        break;
      case 'image':
        await drawImageElement(ctx, el);
        break;
    }
  }

  // Export as PNG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png', 1.0);
  });
}

// ── Preset Templates (Fallback) ──

export type TemplateStyle = 'bold-diagonal' | 'minimal-frame' | 'corporate-split' | 'elegant-dark' | 'creative-organic' |
  'bold-block' | 'minimal-center' | 'corporate-grid' | 'elegant-gold' | 'creative-wave' |
  'quote-large' | 'promo-banner' | 'product-spotlight';

interface PresetPlaceholders {
  titulo: string;
  subtitulo: string;
  cta: string;
}

export function getPresetTemplate(
  style: TemplateStyle,
  format: 'feed' | 'story',
  placeholders: PresetPlaceholders,
  brandColors: string[],
  backgroundImageUrl: string,
  logoUrl?: string,
): TemplateConfig {
  const w = 1080;
  const h = format === 'feed' ? 1080 : 1920;
  const primary = brandColors[0] || '#E63946';
  const secondary = brandColors[1] || '#1D3557';
  const accent = brandColors[2] || '#F1FAEE';

  const base: TemplateConfig = {
    width: w,
    height: h,
    background: {
      type: 'image',
      imageUrl: backgroundImageUrl,
      imageFit: 'cover',
      imageMask: 'full',
    },
    elements: [],
    brandColors,
    logoUrl,
  };

  switch (style) {
    case 'bold-diagonal':
      base.background.overlay = { color: '#000000', opacity: 0.3 };
      base.elements = [
        { type: 'shape', shape: 'diagonal-stripe', x: 0, y: h * 0.55, width: w, height: h * 0.45, color: primary, opacity: 0.9 },
        { type: 'text', content: placeholders.titulo, x: 60, y: h * 0.62, width: w - 120, fontSize: 72, fontFamily: 'Montserrat', fontWeight: 'black', color: '#FFFFFF', align: 'left', textTransform: 'uppercase', letterSpacing: 2 },
        { type: 'text', content: placeholders.subtitulo, x: 60, y: h * 0.78, width: w - 120, fontSize: 36, fontFamily: 'Montserrat', fontWeight: 'normal', color: accent, align: 'left' },
        { type: 'text', content: placeholders.cta, x: 60, y: h * 0.90, width: 300, fontSize: 24, fontFamily: 'Montserrat', fontWeight: 'bold', color: secondary, align: 'center', shadow: { blur: 0, color: 'transparent', offsetX: 0, offsetY: 0 } },
        { type: 'shape', shape: 'rect', x: 50, y: h * 0.885, width: 320, height: 50, color: '#FFFFFF', opacity: 1, borderRadius: 25 },
      ];
      // Push CTA text above rect
      base.elements = [
        base.elements[0], // diagonal stripe
        base.elements[1], // titulo
        base.elements[2], // subtitulo
        base.elements[4], // rect (CTA bg)
        { ...base.elements[3], y: h * 0.895 } as TextElement, // cta text
      ];
      break;

    case 'minimal-frame':
      base.background.imageMask = 'frame-inset';
      base.background.overlay = { color: '#FFFFFF', opacity: 0.05 };
      base.elements = [
        { type: 'shape', shape: 'frame', x: w * 0.05, y: h * 0.05, width: w * 0.9, height: h * 0.9, color: primary, opacity: 0.8, borderWidth: 4 },
        { type: 'shape', shape: 'rect', x: 0, y: h * 0.75, width: w, height: h * 0.25, color: '#FFFFFF', opacity: 0.92 },
        { type: 'text', content: placeholders.titulo, x: 80, y: h * 0.78, width: w - 160, fontSize: 48, fontFamily: 'Playfair Display', fontWeight: 'bold', color: secondary, align: 'center' },
        { type: 'text', content: placeholders.subtitulo, x: 80, y: h * 0.87, width: w - 160, fontSize: 24, fontFamily: 'Inter', fontWeight: 'normal', color: '#666666', align: 'center' },
      ];
      break;

    case 'corporate-split':
      base.background.imageMask = 'right-half';
      base.elements = [
        { type: 'shape', shape: 'rect', x: 0, y: 0, width: w * 0.5, height: h, color: secondary, opacity: 1 },
        { type: 'text', content: placeholders.titulo, x: 60, y: h * 0.3, width: w * 0.5 - 120, fontSize: 52, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', align: 'left', lineHeight: 1.15 },
        { type: 'text', content: placeholders.subtitulo, x: 60, y: h * 0.55, width: w * 0.5 - 120, fontSize: 22, fontFamily: 'Inter', fontWeight: 'normal', color: accent, align: 'left', lineHeight: 1.4 },
        { type: 'shape', shape: 'rect', x: 60, y: h * 0.72, width: 220, height: 48, color: primary, opacity: 1, borderRadius: 6 },
        { type: 'text', content: placeholders.cta, x: 60, y: h * 0.73, width: 220, fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', align: 'center' },
        { type: 'shape', shape: 'line', x: 60, y: h * 0.25, width: w * 0.25, height: 0, color: primary, opacity: 1, borderWidth: 4 },
      ];
      break;

    case 'elegant-dark':
      base.background.overlay = { color: '#000000', opacity: 0.65 };
      base.elements = [
        { type: 'shape', shape: 'frame', x: w * 0.08, y: h * 0.08, width: w * 0.84, height: h * 0.84, color: '#C9A961', opacity: 0.6, borderWidth: 2 },
        { type: 'shape', shape: 'line', x: w * 0.3, y: h * 0.42, width: w * 0.4, height: 0, color: '#C9A961', opacity: 0.8, borderWidth: 2 },
        { type: 'text', content: placeholders.titulo, x: w * 0.1, y: h * 0.45, width: w * 0.8, fontSize: 56, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#FFFFFF', align: 'center', letterSpacing: 4, textTransform: 'uppercase' },
        { type: 'text', content: placeholders.subtitulo, x: w * 0.15, y: h * 0.62, width: w * 0.7, fontSize: 24, fontFamily: 'Inter', fontWeight: 'normal', color: '#C9A961', align: 'center', letterSpacing: 6, textTransform: 'uppercase' },
        { type: 'shape', shape: 'line', x: w * 0.3, y: h * 0.69, width: w * 0.4, height: 0, color: '#C9A961', opacity: 0.8, borderWidth: 2 },
      ];
      break;

    case 'creative-organic':
      base.background.overlay = { color: primary, opacity: 0.15 };
      base.elements = [
        { type: 'shape', shape: 'circle', x: -w * 0.15, y: -h * 0.1, width: w * 0.5, height: w * 0.5, color: primary, opacity: 0.25 },
        { type: 'shape', shape: 'circle', x: w * 0.7, y: h * 0.7, width: w * 0.45, height: w * 0.45, color: secondary, opacity: 0.2 },
        { type: 'shape', shape: 'rect', x: w * 0.08, y: h * 0.35, width: w * 0.84, height: h * 0.35, color: '#FFFFFF', opacity: 0.92, borderRadius: 24 },
        { type: 'text', content: placeholders.titulo, x: w * 0.12, y: h * 0.4, width: w * 0.76, fontSize: 54, fontFamily: 'Space Grotesk', fontWeight: 'bold', color: secondary, align: 'center' },
        { type: 'text', content: placeholders.subtitulo, x: w * 0.12, y: h * 0.55, width: w * 0.76, fontSize: 22, fontFamily: 'Inter', fontWeight: 'normal', color: '#555555', align: 'center' },
        { type: 'shape', shape: 'rect', x: w * 0.3, y: h * 0.63, width: w * 0.4, height: 44, color: primary, opacity: 1, borderRadius: 22 },
        { type: 'text', content: placeholders.cta, x: w * 0.3, y: h * 0.635, width: w * 0.4, fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', align: 'center' },
      ];
      break;

    case 'bold-block':
      base.background.overlay = { color: '#000000', opacity: 0.4 };
      base.elements = [
        { type: 'shape', shape: 'rect', x: 0, y: h * 0.4, width: w, height: h * 0.3, color: primary, opacity: 0.95 },
        { type: 'text', content: placeholders.titulo, x: 60, y: h * 0.43, width: w - 120, fontSize: 68, fontFamily: 'Bebas Neue', fontWeight: 'normal', color: '#FFFFFF', align: 'center', letterSpacing: 4, textTransform: 'uppercase' },
        { type: 'text', content: placeholders.subtitulo, x: 80, y: h * 0.58, width: w - 160, fontSize: 28, fontFamily: 'Inter', fontWeight: 'normal', color: '#FFFFFF', align: 'center' },
        { type: 'text', content: placeholders.cta, x: w * 0.3, y: h * 0.78, width: w * 0.4, fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', align: 'center', textTransform: 'uppercase', letterSpacing: 3 },
      ];
      break;

    case 'minimal-center':
      base.background.overlay = { color: '#FFFFFF', opacity: 0.85 };
      base.elements = [
        { type: 'shape', shape: 'line', x: w * 0.4, y: h * 0.38, width: w * 0.2, height: 0, color: primary, opacity: 1, borderWidth: 3 },
        { type: 'text', content: placeholders.titulo, x: w * 0.1, y: h * 0.42, width: w * 0.8, fontSize: 44, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#1A1A1A', align: 'center' },
        { type: 'text', content: placeholders.subtitulo, x: w * 0.15, y: h * 0.55, width: w * 0.7, fontSize: 20, fontFamily: 'Inter', fontWeight: 'normal', color: '#666666', align: 'center', lineHeight: 1.5 },
        { type: 'shape', shape: 'line', x: w * 0.4, y: h * 0.64, width: w * 0.2, height: 0, color: primary, opacity: 1, borderWidth: 3 },
      ];
      break;

    case 'corporate-grid':
      base.elements = [
        { type: 'shape', shape: 'rect', x: 0, y: 0, width: w, height: h * 0.12, color: secondary, opacity: 1 },
        { type: 'shape', shape: 'rect', x: 0, y: h * 0.88, width: w, height: h * 0.12, color: secondary, opacity: 1 },
        { type: 'shape', shape: 'rect', x: 0, y: h * 0.12, width: w * 0.06, height: h * 0.76, color: primary, opacity: 1 },
        { type: 'text', content: placeholders.titulo, x: 80, y: h * 0.03, width: w - 160, fontSize: 28, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', align: 'left', textTransform: 'uppercase', letterSpacing: 3 },
        { type: 'shape', shape: 'rect', x: w * 0.06, y: h * 0.6, width: w * 0.94, height: h * 0.28, color: 'rgba(255,255,255,0.92)', opacity: 1 },
        { type: 'text', content: placeholders.subtitulo, x: w * 0.1, y: h * 0.64, width: w * 0.8, fontSize: 22, fontFamily: 'Inter', fontWeight: 'normal', color: '#333333', align: 'left', lineHeight: 1.5 },
        { type: 'text', content: placeholders.cta, x: w * 0.1, y: h * 0.8, width: 200, fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', color: primary, align: 'left', textTransform: 'uppercase', letterSpacing: 2 },
      ];
      break;

    case 'elegant-gold':
      base.background.overlay = { color: '#0D0D0D', opacity: 0.75 };
      base.elements = [
        { type: 'shape', shape: 'rect', x: w * 0.06, y: h * 0.06, width: w * 0.88, height: h * 0.88, color: 'transparent', opacity: 1, borderWidth: 1, borderColor: '#C9A961' },
        { type: 'shape', shape: 'rect', x: w * 0.08, y: h * 0.08, width: w * 0.84, height: h * 0.84, color: 'transparent', opacity: 1, borderWidth: 1, borderColor: '#C9A961' },
        { type: 'text', content: placeholders.titulo, x: w * 0.12, y: h * 0.38, width: w * 0.76, fontSize: 60, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#C9A961', align: 'center', letterSpacing: 3 },
        { type: 'text', content: placeholders.subtitulo, x: w * 0.15, y: h * 0.56, width: w * 0.7, fontSize: 22, fontFamily: 'Raleway', fontWeight: 'normal', color: '#FFFFFF', align: 'center', letterSpacing: 5, textTransform: 'uppercase' },
      ];
      break;

    case 'creative-wave':
      base.background.overlay = { color: primary, opacity: 0.1 };
      base.elements = [
        { type: 'shape', shape: 'diagonal-stripe', x: -w * 0.1, y: h * 0.6, width: w * 1.2, height: h * 0.5, color: primary, opacity: 0.85 },
        { type: 'shape', shape: 'circle', x: w * 0.75, y: h * 0.05, width: w * 0.3, height: w * 0.3, color: secondary, opacity: 0.3 },
        { type: 'text', content: placeholders.titulo, x: 60, y: h * 0.68, width: w - 120, fontSize: 58, fontFamily: 'Poppins', fontWeight: 'bold', color: '#FFFFFF', align: 'left' },
        { type: 'text', content: placeholders.subtitulo, x: 60, y: h * 0.82, width: w * 0.6, fontSize: 22, fontFamily: 'Inter', fontWeight: 'normal', color: accent, align: 'left' },
      ];
      break;

    case 'quote-large':
      base.background.overlay = { color: secondary, opacity: 0.85 };
      base.elements = [
        { type: 'text', content: '"', x: w * 0.08, y: h * 0.2, width: 200, fontSize: 200, fontFamily: 'Playfair Display', fontWeight: 'bold', color: primary, align: 'left' },
        { type: 'text', content: placeholders.titulo, x: w * 0.12, y: h * 0.35, width: w * 0.76, fontSize: 42, fontFamily: 'Playfair Display', fontWeight: 'bold', color: '#FFFFFF', align: 'left', lineHeight: 1.4 },
        { type: 'shape', shape: 'line', x: w * 0.12, y: h * 0.7, width: w * 0.15, height: 0, color: primary, opacity: 1, borderWidth: 4 },
        { type: 'text', content: placeholders.subtitulo, x: w * 0.12, y: h * 0.74, width: w * 0.7, fontSize: 20, fontFamily: 'Inter', fontWeight: 'normal', color: accent, align: 'left' },
      ];
      break;

    case 'promo-banner':
      base.background.overlay = { color: '#000000', opacity: 0.45 };
      base.elements = [
        { type: 'shape', shape: 'rect', x: 0, y: h * 0.25, width: w, height: h * 0.5, color: primary, opacity: 0.92 },
        { type: 'shape', shape: 'rect', x: w * 0.04, y: h * 0.27, width: w * 0.92, height: h * 0.46, color: 'transparent', opacity: 1, borderWidth: 2, borderColor: '#FFFFFF' },
        { type: 'text', content: placeholders.titulo, x: 80, y: h * 0.33, width: w - 160, fontSize: 64, fontFamily: 'Montserrat', fontWeight: 'black', color: '#FFFFFF', align: 'center', textTransform: 'uppercase' },
        { type: 'text', content: placeholders.subtitulo, x: 80, y: h * 0.52, width: w - 160, fontSize: 30, fontFamily: 'Inter', fontWeight: 'normal', color: '#FFFFFF', align: 'center' },
        { type: 'shape', shape: 'rect', x: w * 0.3, y: h * 0.62, width: w * 0.4, height: 48, color: '#FFFFFF', opacity: 1, borderRadius: 24 },
        { type: 'text', content: placeholders.cta, x: w * 0.3, y: h * 0.625, width: w * 0.4, fontSize: 18, fontFamily: 'Montserrat', fontWeight: 'bold', color: primary, align: 'center' },
      ];
      break;

    case 'product-spotlight':
      base.background.imageMask = 'center-circle';
      base.elements = [
        { type: 'shape', shape: 'rect', x: 0, y: 0, width: w, height: h, color: secondary, opacity: 0.95 },
        { type: 'shape', shape: 'circle', x: w * 0.15, y: h * 0.15, width: w * 0.7, height: w * 0.7, color: '#FFFFFF', opacity: 0.08 },
        { type: 'text', content: placeholders.titulo, x: 60, y: h * 0.05, width: w - 120, fontSize: 36, fontFamily: 'Montserrat', fontWeight: 'bold', color: '#FFFFFF', align: 'center', textTransform: 'uppercase', letterSpacing: 5 },
        { type: 'text', content: placeholders.subtitulo, x: 80, y: h * 0.82, width: w - 160, fontSize: 22, fontFamily: 'Inter', fontWeight: 'normal', color: accent, align: 'center' },
        { type: 'shape', shape: 'rect', x: w * 0.3, y: h * 0.88, width: w * 0.4, height: 44, color: primary, opacity: 1, borderRadius: 22 },
        { type: 'text', content: placeholders.cta, x: w * 0.3, y: h * 0.885, width: w * 0.4, fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', color: '#FFFFFF', align: 'center' },
      ];
      // Reorder: bg rect first, then circle overlay (for mask), then bg image drawn on top via mask
      break;
  }

  // Add logo if available
  if (logoUrl) {
    base.elements.push({
      type: 'image',
      src: logoUrl,
      x: w - 120,
      y: format === 'feed' ? 30 : 40,
      width: 80,
      height: 80,
      opacity: 0.85,
    });
  }

  return base;
}

// ── Style mapping helpers ──

export const TEMPLATE_STYLE_MAP: Record<string, TemplateStyle[]> = {
  minimalista: ['minimal-frame', 'minimal-center'],
  bold: ['bold-diagonal', 'bold-block', 'promo-banner'],
  corporativo: ['corporate-split', 'corporate-grid'],
  elegante: ['elegant-dark', 'elegant-gold'],
  criativo: ['creative-organic', 'creative-wave'],
};

export function getRandomPresetForStyle(estilo: string): TemplateStyle {
  const styles = TEMPLATE_STYLE_MAP[estilo.toLowerCase()] || Object.values(TEMPLATE_STYLE_MAP).flat();
  return styles[Math.floor(Math.random() * styles.length)];
}
