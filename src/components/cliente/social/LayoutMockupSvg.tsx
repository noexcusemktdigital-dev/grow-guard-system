/** Realistic SVG mockup thumbnails for each layout type */
export function LayoutMockupSvg({ type }: { type: string }) {
  const w = 200;
  const h = 200;
  const labelStyle = { fontSize: "7px", fontFamily: "sans-serif", fontWeight: 600 as const, letterSpacing: "0.5px" };

  switch (type) {
    case "hero_central":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#1e293b" rx="6" />
          {/* Background texture */}
          <rect width={w} height={h} fill="url(#heroGrad)" rx="6" />
          <defs>
            <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          {/* Logo placeholder */}
          <rect x="12" y="10" width="28" height="14" rx="3" fill="#475569" />
          <text x="26" y="19.5" textAnchor="middle" fill="#94a3b8" style={{ ...labelStyle, fontSize: "5.5px" }}>LOGO</text>
          {/* Main headline */}
          <rect x="30" y="55" width="140" height="14" rx="2" fill="#f8fafc" />
          <rect x="50" y="73" width="100" height="10" rx="2" fill="#94a3b8" opacity="0.6" />
          <text x="100" y="64" textAnchor="middle" fill="#334155" style={labelStyle}>HEADLINE</text>
          {/* Sub text */}
          <rect x="55" y="92" width="90" height="6" rx="1" fill="#64748b" opacity="0.5" />
          <rect x="65" y="102" width="70" height="6" rx="1" fill="#64748b" opacity="0.3" />
          {/* CTA button */}
          <rect x="65" y="130" width="70" height="22" rx="6" fill="#3b82f6" />
          <text x="100" y="144" textAnchor="middle" fill="white" style={labelStyle}>CTA</text>
          {/* Zone labels */}
          <text x="100" y="190" textAnchor="middle" fill="#475569" style={{ ...labelStyle, fontSize: "6px" }}>Headline centralizada + CTA</text>
        </svg>
      );

    case "split_texto_imagem":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          {/* Text side */}
          <rect width="90" height={h} fill="#f1f5f9" rx="6" />
          {/* Image side */}
          <rect x="90" width="110" height={h} fill="#cbd5e1" rx="6" />
          {/* Image placeholder icon */}
          <g transform="translate(130,70)">
            <rect x="-20" y="-20" width="40" height="40" rx="4" fill="#94a3b8" opacity="0.4" />
            <circle cx="0" cy="-5" r="8" fill="#64748b" opacity="0.5" />
            <polygon points="-15,15 0,0 15,15" fill="#64748b" opacity="0.5" />
          </g>
          <text x="145" y="105" textAnchor="middle" fill="#64748b" style={{ ...labelStyle, fontSize: "6px" }}>FOTO</text>
          {/* Logo */}
          <rect x="10" y="12" width="24" height="12" rx="2" fill="#475569" />
          <text x="22" y="20.5" textAnchor="middle" fill="#94a3b8" style={{ ...labelStyle, fontSize: "5px" }}>LOGO</text>
          {/* Headline */}
          <rect x="10" y="45" width="70" height="10" rx="2" fill="#1e293b" />
          <text x="45" y="53" textAnchor="middle" fill="#f1f5f9" style={{ ...labelStyle, fontSize: "5.5px" }}>HEADLINE</text>
          {/* Sub text lines */}
          <rect x="10" y="62" width="60" height="5" rx="1" fill="#94a3b8" />
          <rect x="10" y="71" width="50" height="5" rx="1" fill="#94a3b8" opacity="0.6" />
          <rect x="10" y="80" width="55" height="5" rx="1" fill="#94a3b8" opacity="0.4" />
          <text x="45" y="68" textAnchor="middle" fill="#64748b" style={{ ...labelStyle, fontSize: "5px" }}>TEXTO</text>
          {/* CTA */}
          <rect x="10" y="100" width="50" height="16" rx="5" fill="#3b82f6" />
          <text x="35" y="111" textAnchor="middle" fill="white" style={{ ...labelStyle, fontSize: "5.5px" }}>CTA</text>
          {/* Divider */}
          <line x1="90" y1="0" x2="90" y2={h} stroke="#e2e8f0" strokeWidth="1" />
        </svg>
      );

    case "card_moldura":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          {/* Bold background */}
          <rect width={w} height={h} fill="#3b82f6" rx="6" />
          {/* White card */}
          <rect x="20" y="20" width="160" height="160" rx="16" fill="white" />
          {/* Logo outside card */}
          <rect x="10" y="4" width="22" height="10" rx="2" fill="rgba(255,255,255,0.7)" />
          <text x="21" y="11" textAnchor="middle" fill="#3b82f6" style={{ ...labelStyle, fontSize: "4.5px" }}>LOGO</text>
          {/* Content inside card */}
          <rect x="35" y="40" width="130" height="12" rx="2" fill="#1e293b" />
          <text x="100" y="49" textAnchor="middle" fill="#f8fafc" style={labelStyle}>HEADLINE</text>
          <rect x="45" y="58" width="110" height="7" rx="1" fill="#94a3b8" opacity="0.5" />
          <rect x="50" y="69" width="100" height="7" rx="1" fill="#94a3b8" opacity="0.3" />
          <text x="100" y="65" textAnchor="middle" fill="#64748b" style={{ ...labelStyle, fontSize: "5px" }}>TEXTO DE APOIO</text>
          {/* Bullet points */}
          <circle cx="45" cy="95" r="3" fill="#3b82f6" />
          <rect x="52" y="92" width="80" height="5" rx="1" fill="#475569" />
          <circle cx="45" cy="108" r="3" fill="#3b82f6" />
          <rect x="52" y="105" width="70" height="5" rx="1" fill="#475569" />
          <circle cx="45" cy="121" r="3" fill="#3b82f6" />
          <rect x="52" y="118" width="75" height="5" rx="1" fill="#475569" />
          {/* CTA inside card */}
          <rect x="55" y="140" width="90" height="20" rx="6" fill="#3b82f6" />
          <text x="100" y="153" textAnchor="middle" fill="white" style={labelStyle}>CTA</text>
        </svg>
      );

    case "imagem_overlay":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          {/* Background photo */}
          <rect width={w} height={h} fill="#78716c" rx="6" />
          {/* Photo placeholder elements */}
          <circle cx="130" cy="50" r="25" fill="#a8a29e" opacity="0.4" />
          <rect x="30" y="40" width="60" height="40" rx="4" fill="#a8a29e" opacity="0.3" />
          {/* Dark gradient overlay */}
          <rect width={w} height={h} fill="url(#overlayGrad)" rx="6" />
          <defs>
            <linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="rgba(0,0,0,0.2)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
            </linearGradient>
          </defs>
          <text x="100" y="55" textAnchor="middle" fill="#a8a29e" style={{ ...labelStyle, fontSize: "8px", opacity: 0.5 }}>FOTO</text>
          {/* Logo corner */}
          <rect x="10" y="10" width="24" height="12" rx="2" fill="rgba(255,255,255,0.25)" />
          <text x="22" y="18.5" textAnchor="middle" fill="rgba(255,255,255,0.8)" style={{ ...labelStyle, fontSize: "5px" }}>LOGO</text>
          {/* Text overlay */}
          <rect x="15" y="115" width="140" height="14" rx="2" fill="white" opacity="0.95" />
          <text x="85" y="125" textAnchor="middle" fill="#1e293b" style={labelStyle}>HEADLINE</text>
          <rect x="15" y="135" width="110" height="7" rx="1" fill="rgba(255,255,255,0.7)" />
          <rect x="15" y="146" width="90" height="7" rx="1" fill="rgba(255,255,255,0.5)" />
          {/* CTA */}
          <rect x="15" y="162" width="60" height="18" rx="5" fill="#3b82f6" />
          <text x="45" y="174" textAnchor="middle" fill="white" style={labelStyle}>CTA</text>
        </svg>
      );

    case "grid_carrossel":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f8fafc" rx="6" />
          {/* Header */}
          <rect x="10" y="8" width="180" height="22" rx="4" fill="#1e293b" />
          <text x="100" y="22" textAnchor="middle" fill="#f8fafc" style={labelStyle}>HEADLINE</text>
          {/* Grid 2x2 */}
          <rect x="10" y="38" width="85" height="58" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="105" y="38" width="85" height="58" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="10" y="104" width="85" height="58" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="105" y="104" width="85" height="58" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* Icons inside grid */}
          <circle cx="35" cy="55" r="8" fill="#3b82f6" opacity="0.2" />
          <text x="35" y="58" textAnchor="middle" fill="#3b82f6" style={{ ...labelStyle, fontSize: "8px" }}>1</text>
          <rect x="22" y="70" width="45" height="4" rx="1" fill="#94a3b8" />
          <rect x="22" y="78" width="35" height="4" rx="1" fill="#94a3b8" opacity="0.5" />

          <circle cx="130" cy="55" r="8" fill="#10b981" opacity="0.2" />
          <text x="130" y="58" textAnchor="middle" fill="#10b981" style={{ ...labelStyle, fontSize: "8px" }}>2</text>
          <rect x="117" y="70" width="45" height="4" rx="1" fill="#94a3b8" />
          <rect x="117" y="78" width="35" height="4" rx="1" fill="#94a3b8" opacity="0.5" />

          <circle cx="35" cy="121" r="8" fill="#f59e0b" opacity="0.2" />
          <text x="35" y="124" textAnchor="middle" fill="#f59e0b" style={{ ...labelStyle, fontSize: "8px" }}>3</text>
          <rect x="22" y="136" width="45" height="4" rx="1" fill="#94a3b8" />
          <rect x="22" y="144" width="35" height="4" rx="1" fill="#94a3b8" opacity="0.5" />

          <circle cx="130" cy="121" r="8" fill="#ef4444" opacity="0.2" />
          <text x="130" y="124" textAnchor="middle" fill="#ef4444" style={{ ...labelStyle, fontSize: "8px" }}>4</text>
          <rect x="117" y="136" width="45" height="4" rx="1" fill="#94a3b8" />
          <rect x="117" y="144" width="35" height="4" rx="1" fill="#94a3b8" opacity="0.5" />
          {/* Footer CTA */}
          <rect x="60" y="172" width="80" height="18" rx="5" fill="#3b82f6" />
          <text x="100" y="184" textAnchor="middle" fill="white" style={labelStyle}>CTA</text>
        </svg>
      );

    case "minimalista_clean":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="white" rx="6" />
          {/* Logo tiny */}
          <rect x="10" y="10" width="20" height="10" rx="2" fill="#e2e8f0" />
          <text x="20" y="17" textAnchor="middle" fill="#94a3b8" style={{ ...labelStyle, fontSize: "4.5px" }}>LOGO</text>
          {/* Single headline centered */}
          <rect x="30" y="82" width="140" height="12" rx="2" fill="#0f172a" />
          <text x="100" y="91" textAnchor="middle" fill="#f8fafc" style={labelStyle}>HEADLINE</text>
          {/* Minimal sub */}
          <rect x="60" y="102" width="80" height="6" rx="1" fill="#cbd5e1" />
          {/* Lots of empty space - label */}
          <text x="100" y="145" textAnchor="middle" fill="#e2e8f0" style={{ ...labelStyle, fontSize: "6px" }}>espaço vazio</text>
          {/* Tiny CTA */}
          <rect x="75" y="160" width="50" height="14" rx="4" fill="#0f172a" opacity="0.08" />
          <text x="100" y="170" textAnchor="middle" fill="#64748b" style={{ ...labelStyle, fontSize: "5px" }}>CTA</text>
        </svg>
      );

    case "anuncio_agressivo":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#ef4444" rx="6" />
          {/* Logo */}
          <rect x="10" y="8" width="28" height="14" rx="3" fill="rgba(255,255,255,0.8)" />
          <text x="24" y="17.5" textAnchor="middle" fill="#ef4444" style={{ ...labelStyle, fontSize: "5px" }}>LOGO</text>
          {/* HUGE headline */}
          <rect x="10" y="40" width="180" height="28" rx="4" fill="white" />
          <text x="100" y="58" textAnchor="middle" fill="#ef4444" style={{ ...labelStyle, fontSize: "9px" }}>HEADLINE ENORME</text>
          <rect x="15" y="74" width="150" height="18" rx="3" fill="rgba(255,255,255,0.3)" />
          <text x="90" y="86" textAnchor="middle" fill="white" style={{ ...labelStyle, fontSize: "6px" }}>SUBTEXTO IMPACTO</text>
          {/* Sub text */}
          <rect x="20" y="100" width="130" height="8" rx="2" fill="rgba(255,255,255,0.2)" />
          <rect x="30" y="113" width="110" height="8" rx="2" fill="rgba(255,255,255,0.15" />
          {/* Big CTA */}
          <rect x="35" y="140" width="130" height="30" rx="10" fill="#fbbf24" />
          <text x="100" y="159" textAnchor="middle" fill="#1e293b" style={{ ...labelStyle, fontSize: "8px" }}>CTA DESTAQUE</text>
        </svg>
      );

    case "premium_luxo":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#0f172a" rx="6" />
          {/* Ornamental lines */}
          <line x1="25" y1="42" x2="175" y2="42" stroke="#d4a853" strokeWidth="0.5" />
          <line x1="25" y1="120" x2="175" y2="120" stroke="#d4a853" strokeWidth="0.5" />
          {/* Logo */}
          <rect x="75" y="14" width="50" height="18" rx="3" fill="transparent" stroke="#d4a853" strokeWidth="0.8" />
          <text x="100" y="26" textAnchor="middle" fill="#d4a853" style={labelStyle}>LOGO</text>
          {/* Headline serif */}
          <rect x="30" y="55" width="140" height="14" rx="2" fill="#d4a853" />
          <text x="100" y="65" textAnchor="middle" fill="#0f172a" style={{ ...labelStyle, fontStyle: "italic" }}>HEADLINE PREMIUM</text>
          {/* Sub */}
          <rect x="45" y="78" width="110" height="7" rx="1" fill="#64748b" />
          <rect x="55" y="90" width="90" height="7" rx="1" fill="#64748b" opacity="0.6" />
          <text x="100" y="85" textAnchor="middle" fill="#94a3b8" style={{ ...labelStyle, fontSize: "5px" }}>TEXTO</text>
          {/* CTA elegant */}
          <rect x="55" y="133" width="90" height="24" rx="3" fill="transparent" stroke="#d4a853" strokeWidth="1" />
          <text x="100" y="148" textAnchor="middle" fill="#d4a853" style={labelStyle}>CTA</text>
          {/* Diamond accents */}
          <polygon points="100,168 104,175 100,182 96,175" fill="#d4a853" opacity="0.4" />
        </svg>
      );

    case "texto_dominante":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f8fafc" rx="6" />
          {/* Logo */}
          <rect x="10" y="170" width="24" height="12" rx="2" fill="#475569" />
          <text x="22" y="178.5" textAnchor="middle" fill="#94a3b8" style={{ ...labelStyle, fontSize: "4.5px" }}>LOGO</text>
          {/* Mixed typography headline */}
          <rect x="12" y="18" width="176" height="26" rx="3" fill="#0f172a" />
          <text x="100" y="35" textAnchor="middle" fill="#f8fafc" style={{ ...labelStyle, fontSize: "9px" }}>TÍTULO GRANDE</text>
          <rect x="12" y="50" width="130" height="20" rx="3" fill="#3b82f6" />
          <text x="77" y="63.5" textAnchor="middle" fill="white" style={{ ...labelStyle, fontSize: "7px" }}>DESTAQUE</text>
          <rect x="12" y="76" width="160" height="16" rx="2" fill="#334155" />
          <text x="92" y="87" textAnchor="middle" fill="#e2e8f0" style={{ ...labelStyle, fontSize: "6px" }}>SUBTEXTO</text>
          {/* Body */}
          <rect x="12" y="102" width="140" height="6" rx="1" fill="#94a3b8" opacity="0.5" />
          <rect x="12" y="113" width="120" height="6" rx="1" fill="#94a3b8" opacity="0.4" />
          <rect x="12" y="124" width="130" height="6" rx="1" fill="#94a3b8" opacity="0.3" />
          {/* CTA subtle */}
          <rect x="12" y="145" width="60" height="16" rx="4" fill="#0f172a" />
          <text x="42" y="156" textAnchor="middle" fill="white" style={{ ...labelStyle, fontSize: "5.5px" }}>CTA</text>
        </svg>
      );

    default:
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f1f5f9" rx="6" />
          <rect x="30" y="60" width="140" height="14" rx="2" fill="#334155" />
          <text x="100" y="70" textAnchor="middle" fill="#f8fafc" style={labelStyle}>HEADLINE</text>
          <rect x="50" y="85" width="100" height="8" rx="2" fill="#94a3b8" />
          <rect x="65" y="110" width="70" height="18" rx="5" fill="#3b82f6" />
          <text x="100" y="122" textAnchor="middle" fill="white" style={labelStyle}>CTA</text>
        </svg>
      );
  }
}
