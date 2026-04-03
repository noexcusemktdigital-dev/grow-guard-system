import { useState, useEffect, useRef, useMemo } from "react";
import logoDark from "@/assets/NOE3.png";

const PHRASES = [
  "Sem desculpas. Só resultados.",
  "Sua franquia no próximo nível.",
  "Gestão inteligente, crescimento real.",
  "Cada dia é uma nova chance de liderar.",
  "Disciplina hoje, liberdade amanhã.",
  "Foco no processo, o resultado vem.",
];

function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.6 + 0.3,
  }));
}

const SpaceLoginScene = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothRef = useRef({ x: 0.5, y: 0.5 });
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(() => generateStars(80), []);

  // Phrase rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length);
        setFadeIn(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking with lerp
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      };
    };

    const animate = () => {
      const s = smoothRef.current;
      const m = mouseRef.current;
      s.x += (m.x - s.x) * 0.06;
      s.y += (m.y - s.y) * 0.06;
      setPos({ x: s.x, y: s.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const rocketRotate = (pos.x - 0.5) * 30; // max ±15deg
  const rocketTranslateX = (pos.x - 0.5) * 40;
  const rocketTranslateY = (pos.y - 0.5) * 20;

  const astroTranslateX = (pos.x - 0.5) * 25;
  const astroTranslateY = (pos.y - 0.5) * 15;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#0a0a1a" }}
    >
      {/* Nebula gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(270,60%,40%) 0%, transparent 70%)",
            top: "-10%",
            right: "-15%",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsl(220,70%,40%) 0%, transparent 70%)",
            bottom: "5%",
            left: "-10%",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, hsl(355,70%,45%) 0%, transparent 70%)",
            top: "40%",
            left: "30%",
          }}
        />
      </div>

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
            backgroundColor: "white",
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      {/* Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-20">
        <img src={logoDark} alt="NoExcuse" className="h-14 object-contain drop-shadow-lg" />
      </div>

      {/* Phrases */}
      <div className="absolute top-28 left-0 right-0 flex justify-center z-20 px-6">
        <p
          className="text-white/90 text-lg font-medium text-center tracking-wide transition-all duration-400"
          style={{
            opacity: fadeIn ? 1 : 0,
            transform: fadeIn ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {PHRASES[phraseIndex]}
        </p>
      </div>

      {/* Astronaut */}
      <div
        className="absolute z-10"
        style={{
          left: "15%",
          bottom: "12%",
          transform: `translate(${astroTranslateX}px, ${astroTranslateY}px)`,
          transition: "transform 0.1s linear",
          animation: "astroFloat 4s ease-in-out infinite",
        }}
      >
        <svg width="120" height="160" viewBox="0 0 120 160" fill="none">
          {/* Backpack */}
          <rect x="25" y="50" width="20" height="40" rx="5" fill="hsl(220,15%,35%)" />
          {/* Body */}
          <rect x="35" y="40" width="50" height="60" rx="12" fill="hsl(0,0%,92%)" stroke="hsl(220,10%,70%)" strokeWidth="1.5" />
          {/* Chest panel */}
          <rect x="45" y="52" width="30" height="20" rx="4" fill="hsl(220,20%,25%)" />
          <rect x="49" y="56" width="8" height="4" rx="1" fill="hsl(145,60%,50%)" opacity="0.8" />
          <rect x="60" y="56" width="4" height="4" rx="1" fill="hsl(355,70%,55%)" opacity="0.8" />
          <rect x="49" y="63" width="22" height="3" rx="1" fill="hsl(210,50%,45%)" opacity="0.5" />
          {/* Helmet */}
          <ellipse cx="60" cy="30" rx="28" ry="26" fill="hsl(0,0%,95%)" stroke="hsl(220,10%,70%)" strokeWidth="1.5" />
          {/* Visor */}
          <ellipse cx="60" cy="30" rx="20" ry="18" fill="hsl(210,60%,25%)">
            <animate attributeName="fill" values="hsl(210,60%,25%);hsl(220,50%,30%);hsl(210,60%,25%)" dur="3s" repeatCount="indefinite" />
          </ellipse>
          {/* Visor reflection */}
          <ellipse cx="52" cy="24" rx="6" ry="4" fill="white" opacity="0.15" transform="rotate(-15 52 24)" />
          {/* Left arm */}
          <rect x="18" y="50" width="18" height="14" rx="7" fill="hsl(0,0%,92%)" stroke="hsl(220,10%,70%)" strokeWidth="1" />
          {/* Right arm */}
          <rect x="84" y="50" width="18" height="14" rx="7" fill="hsl(0,0%,92%)" stroke="hsl(220,10%,70%)" strokeWidth="1" />
          {/* Left leg */}
          <rect x="40" y="96" width="16" height="30" rx="8" fill="hsl(0,0%,92%)" stroke="hsl(220,10%,70%)" strokeWidth="1" />
          <rect x="38" y="120" width="20" height="12" rx="4" fill="hsl(220,15%,40%)" />
          {/* Right leg */}
          <rect x="64" y="96" width="16" height="30" rx="8" fill="hsl(0,0%,92%)" stroke="hsl(220,10%,70%)" strokeWidth="1" />
          <rect x="62" y="120" width="20" height="12" rx="4" fill="hsl(220,15%,40%)" />
          {/* Flag on arm */}
          <line x1="100" y1="48" x2="100" y2="38" stroke="hsl(0,0%,80%)" strokeWidth="1.5" />
          <rect x="100" y="38" width="12" height="8" rx="1" fill="hsl(355,78%,50%)" />
        </svg>
      </div>

      {/* Rocket */}
      <div
        className="absolute z-10"
        style={{
          right: "12%",
          bottom: "8%",
          transform: `translate(${rocketTranslateX}px, ${rocketTranslateY}px) rotate(${rocketRotate}deg)`,
          transition: "transform 0.1s linear",
        }}
      >
        <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
          {/* Nose cone */}
          <path d="M40 0 C40 0 55 30 55 50 L25 50 C25 30 40 0 40 0Z" fill="hsl(355,78%,50%)" />
          {/* Body */}
          <rect x="25" y="50" width="30" height="70" fill="hsl(0,0%,92%)" />
          {/* Window */}
          <circle cx="40" cy="75" r="10" fill="hsl(210,60%,30%)" stroke="hsl(220,10%,70%)" strokeWidth="2" />
          <circle cx="37" cy="72" r="3" fill="white" opacity="0.2" />
          {/* Stripe */}
          <rect x="25" y="95" width="30" height="6" fill="hsl(355,78%,50%)" />
          {/* Fins */}
          <path d="M25 100 L8 135 L25 125Z" fill="hsl(355,78%,45%)" />
          <path d="M55 100 L72 135 L55 125Z" fill="hsl(355,78%,45%)" />
          {/* Base */}
          <rect x="22" y="120" width="36" height="10" rx="2" fill="hsl(220,15%,35%)" />
          {/* Flames */}
          <g style={{ animation: "flame 0.3s ease-in-out infinite alternate" }}>
            <ellipse cx="40" cy="140" rx="10" ry="16" fill="hsl(35,95%,55%)" opacity="0.9" />
            <ellipse cx="40" cy="142" rx="6" ry="20" fill="hsl(45,100%,60%)" opacity="0.8" />
            <ellipse cx="40" cy="145" rx="3" ry="14" fill="hsl(55,100%,80%)" opacity="0.9" />
          </g>
          {/* Outer flames */}
          <g style={{ animation: "flame 0.4s ease-in-out 0.1s infinite alternate" }}>
            <ellipse cx="33" cy="138" rx="5" ry="10" fill="hsl(20,90%,50%)" opacity="0.5" />
            <ellipse cx="47" cy="138" rx="5" ry="10" fill="hsl(20,90%,50%)" opacity="0.5" />
          </g>
        </svg>
      </div>

      {/* Floating particles */}
      <div className="absolute w-2 h-2 rounded-full bg-white/20 top-[60%] left-[50%]" style={{ animation: "astroFloat 6s ease-in-out 1s infinite" }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/15 top-[30%] left-[70%]" style={{ animation: "astroFloat 5s ease-in-out 2s infinite" }} />
      <div className="absolute w-1 h-1 rounded-full bg-white/25 top-[75%] left-[40%]" style={{ animation: "astroFloat 7s ease-in-out 0.5s infinite" }} />

      {/* Subtitle */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-20">
        <p className="text-white/40 text-xs tracking-widest uppercase">
          Plataforma de gestão para franquias
        </p>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes astroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes flame {
          0% { transform: scaleY(0.85) scaleX(0.95); opacity: 0.8; }
          100% { transform: scaleY(1.15) scaleX(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SpaceLoginScene;
