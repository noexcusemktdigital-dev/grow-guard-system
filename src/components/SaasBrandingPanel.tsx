import { useState, useEffect, useMemo } from "react";
import logoDark from "@/assets/NOE3.png";

const BENEFITS = [
  "CRM completo para nunca perder uma venda",
  "Automação de marketing que trabalha por você",
  "Funil de vendas visual e inteligente",
  "Relatórios que mostram onde está o dinheiro",
  "Gestão de equipe comercial em tempo real",
  "Campanhas de e-mail e WhatsApp integradas",
  "Scripts de vendas prontos para sua equipe",
  "Dashboard com métricas que importam",
  "Controle total dos seus leads e clientes",
  "Integração com redes sociais e tráfego pago",
];

const TESTIMONIALS = [
  { name: "Ricardo M.", company: "RM Consultoria", text: "Triplicamos nossas vendas em 4 meses usando a plataforma." },
  { name: "Ana Paula S.", company: "Studio AP", text: "Nunca tive tanto controle sobre meu comercial. Mudou meu negócio." },
  { name: "Carlos D.", company: "CD Franquias", text: "A automação de marketing economizou 20h por semana da minha equipe." },
  { name: "Fernanda L.", company: "FL Digital", text: "O CRM é intuitivo e minha equipe adotou em 1 semana." },
  { name: "João Pedro R.", company: "JPR Serviços", text: "Saí de 50 para 300 leads por mês com as campanhas automatizadas." },
  { name: "Marina C.", company: "MC Imóveis", text: "Os relatórios me deram clareza total sobre onde investir." },
  { name: "Eduardo B.", company: "EB Tech", text: "Melhor investimento que fiz pro meu negócio esse ano." },
  { name: "Patrícia V.", company: "PV Estética", text: "Agora consigo acompanhar cada vendedor em tempo real." },
  { name: "Thiago N.", company: "TN Educação", text: "A plataforma é completa e o suporte é excepcional." },
  { name: "Luciana F.", company: "LF Moda", text: "Dobrei meu faturamento em 6 meses. Recomendo demais." },
];

const SaasBrandingPanel = () => {
  const [benefitIndex, setBenefitIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Shuffle testimonials once
  const shuffled = useMemo(
    () => [...TESTIMONIALS].sort(() => Math.random() - 0.5),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setBenefitIndex((i) => (i + 1) % BENEFITS.length);
        setFadeIn(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(355,78%,50%)] via-[hsl(355,78%,40%)] to-[hsl(355,78%,25%)]" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10">
        {/* Benefits phrase — centered, big */}
        <div className="flex-1 flex items-center justify-center">
          <p
            className={`text-3xl md:text-4xl font-bold text-white text-center leading-tight max-w-md transition-all duration-400 ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {BENEFITS[benefitIndex]}
          </p>
        </div>

        {/* Testimonials — dynamic, mixed sizes */}
        <div className="mb-8 overflow-hidden h-44 relative">
          <style>{`
            @keyframes scrollTestimonials {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div
            className="flex gap-4 absolute whitespace-nowrap"
            style={{ animation: "scrollTestimonials 35s linear infinite" }}
          >
            {[...shuffled, ...shuffled].map((t, i) => {
              const isLarge = i % 3 === 0;
              return (
                <div
                  key={i}
                  className={`inline-block whitespace-normal rounded-xl bg-white/15 backdrop-blur-sm border border-white/10 shrink-0 ${
                    isLarge ? "w-72 p-5" : "w-56 p-4"
                  }`}
                >
                  <p className={`text-white/90 italic leading-snug ${isLarge ? "text-sm" : "text-xs"}`}>
                    "{t.text}"
                  </p>
                  <p className={`mt-2 font-semibold text-white ${isLarge ? "text-sm" : "text-xs"}`}>
                    {t.name}
                  </p>
                  <p className={`text-white/50 ${isLarge ? "text-xs" : "text-[10px]"}`}>
                    {t.company}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logo bottom */}
        <div className="flex justify-center">
          <img src={logoDark} alt="NoExcuse" className="h-8 object-contain opacity-80" />
        </div>
      </div>
    </div>
  );
};

export default SaasBrandingPanel;
