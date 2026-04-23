// @ts-nocheck
/**
 * Reactive SVG preview that updates in real time as the user changes
 * layout customization options (logo position, title position, background type, color tone).
 *
 * Pure presentational — receives all options as props.
 */
type LogoPosition = "top_left" | "top_right" | "bottom_left" | "bottom_right" | "none";
type TitlePosition = "top" | "center" | "bottom";
type BackgroundType = "ai_photo" | "solid_color" | "gradient" | "clean";
type ColorTone = "brand" | "neutral" | "vibrant" | "dark" | "pastel";

interface Props {
  layoutType: string;
  logoPosition: LogoPosition;
  titlePosition: TitlePosition;
  backgroundType: BackgroundType;
  colorTone: ColorTone;
  primaryColor: string;
  secondaryColor: string;
  aspect: "1:1" | "9:16";
}

interface Palette {
  bg: string;
  bgAccent: string;
  text: string;
  accent: string;
  cta: string;
  ctaText: string;
  muted: string;
  isDark: boolean;
}

function getPalette(tone: ColorTone, primary: string, secondary: string): Palette {
  switch (tone) {
    case "brand":
      return {
        bg: secondary || "#ffffff",
        bgAccent: primary || "#3b82f6",
        text: "#0f172a",
        accent: primary || "#3b82f6",
        cta: primary || "#3b82f6",
        ctaText: "#ffffff",
        muted: "#94a3b8",
        isDark: false,
      };
    case "neutral":
      return {
        bg: "#f5f5f4", bgAccent: "#78716c",
        text: "#1c1917", accent: "#44403c",
        cta: "#1c1917", ctaText: "#fafaf9",
        muted: "#a8a29e", isDark: false,
      };
    case "vibrant":
      return {
        bg: "#fb923c", bgAccent: "#ec4899",
        text: "#0f172a", accent: "#7c3aed",
        cta: "#7c3aed", ctaText: "#ffffff",
        muted: "#fef3c7", isDark: false,
      };
    case "dark":
      return {
        bg: "#0a0a0f", bgAccent: "#1e293b",
        text: "#f8fafc", accent: "#f5d57a",
        cta: "#f5d57a", ctaText: "#0a0a0f",
        muted: "#71717a", isDark: true,
      };
    case "pastel":
      return {
        bg: "#fdf4ff", bgAccent: "#fbcfe8",
        text: "#581c87", accent: "#a855f7",
        cta: "#a855f7", ctaText: "#ffffff",
        muted: "#c4b5fd", isDark: false,
      };
    default:
      return {
        bg: "#ffffff", bgAccent: "#e2e8f0",
        text: "#0f172a", accent: "#3b82f6",
        cta: "#3b82f6", ctaText: "#ffffff",
        muted: "#94a3b8", isDark: false,
      };
  }
}

export function LayoutPreviewSvg(props: Props) {
  const { logoPosition, titlePosition, backgroundType, colorTone, primaryColor, secondaryColor, aspect } = props;
  const w = aspect === "9:16" ? 270 : 480;
  const h = aspect === "9:16" ? 480 : 480;

  const palette = getPalette(colorTone, primaryColor, secondaryColor);

  // Logo coordinates (24×14 box)
  const logoBox = (() => {
    const m = 16;
    const bw = 50;
    const bh = 22;
    switch (logoPosition) {
      case "top_left":     return { x: m, y: m, w: bw, h: bh };
      case "top_right":    return { x: w - m - bw, y: m, w: bw, h: bh };
      case "bottom_left":  return { x: m, y: h - m - bh, w: bw, h: bh };
      case "bottom_right": return { x: w - m - bw, y: h - m - bh, w: bw, h: bh };
      default: return null;
    }
  })();

  // Title block coordinates
  const titleBlock = (() => {
    const padding = 28;
    const blockW = w - padding * 2;
    let cy: number;
    switch (titlePosition) {
      case "top":    cy = h * 0.22; break;
      case "bottom": cy = h * 0.72; break;
      case "center":
      default:       cy = h * 0.45; break;
    }
    return { x: padding, y: cy, w: blockW, h: 40 };
  })();

  // CTA position — below or above title block depending on title position
  const ctaY = titlePosition === "bottom" ? h * 0.55 : h - 70;

  // Background rendering
  const renderBg = () => {
    const id = `bg-${aspect}-${backgroundType}-${colorTone}`;
    if (backgroundType === "gradient") {
      return (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={primaryColor || "#000000"} />
              <stop offset="100%" stopColor={secondaryColor || "#ffffff"} />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${id})`} rx="10" />
        </>
      );
    }
    if (backgroundType === "solid_color") {
      return <rect width={w} height={h} fill={primaryColor || palette.bgAccent} rx="10" />;
    }
    if (backgroundType === "clean") {
      return <rect width={w} height={h} fill="#ffffff" rx="10" />;
    }
    // ai_photo: simulate a photo with gradient + circle silhouette + dark overlay
    return (
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.bgAccent} />
            <stop offset="100%" stopColor={palette.bg} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${id})`} rx="10" />
        <circle cx={w * 0.65} cy={h * 0.35} r={Math.min(w, h) * 0.18} fill={palette.text} opacity="0.12" />
        <rect width={w} height={h} fill="rgba(0,0,0,0.18)" rx="10" />
      </>
    );
  };

  // Decide text color for title label depending on background brightness
  const titleBg = backgroundType === "clean" ? "#0f172a" : palette.text;
  const titleFg = backgroundType === "clean" ? "#ffffff" : palette.bg;

  const labelStyle = { fontSize: "10px", fontFamily: "sans-serif", fontWeight: 700 as const, letterSpacing: "1px" };
  const smallLabel = { fontSize: "8px", fontFamily: "sans-serif", fontWeight: 600 as const, letterSpacing: "0.5px" };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {renderBg()}

      {/* Logo zone */}
      {logoBox && (
        <>
          <rect
            x={logoBox.x} y={logoBox.y} width={logoBox.w} height={logoBox.h}
            rx="3"
            fill={palette.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
            stroke={palette.accent}
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <text
            x={logoBox.x + logoBox.w / 2} y={logoBox.y + logoBox.h / 2 + 3}
            textAnchor="middle" fill={palette.text} style={smallLabel}
          >
            LOGO
          </text>
        </>
      )}

      {/* Title block */}
      <rect
        x={titleBlock.x} y={titleBlock.y} width={titleBlock.w} height={titleBlock.h}
        rx="3" fill={titleBg} opacity="0.92"
      />
      <text
        x={titleBlock.x + titleBlock.w / 2} y={titleBlock.y + titleBlock.h / 2 + 4}
        textAnchor="middle" fill={titleFg} style={labelStyle}
      >
        TÍTULO
      </text>

      {/* Subheadline */}
      <rect
        x={titleBlock.x + titleBlock.w * 0.15}
        y={titleBlock.y + titleBlock.h + 8}
        width={titleBlock.w * 0.7} height="10"
        rx="2" fill={palette.muted} opacity="0.6"
      />
      <text
        x={titleBlock.x + titleBlock.w / 2}
        y={titleBlock.y + titleBlock.h + 16}
        textAnchor="middle" fill={palette.text} style={{ ...smallLabel, fontSize: "6px" }}
      >
        SUBTÍTULO
      </text>

      {/* CTA */}
      <rect
        x={w / 2 - 50} y={ctaY} width="100" height="28" rx="6"
        fill={palette.cta}
      />
      <text
        x={w / 2} y={ctaY + 18}
        textAnchor="middle" fill={palette.ctaText} style={labelStyle}
      >
        CTA
      </text>

      {/* Aspect ratio badge */}
      <text
        x={w - 10} y={h - 6}
        textAnchor="end" fill={palette.text} opacity="0.4"
        style={{ ...smallLabel, fontSize: "7px" }}
      >
        {aspect}
      </text>
    </svg>
  );
}
