import { useState, useEffect } from "react";
import logoDark from "@/assets/NOE3.png";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";

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

const testimonials = [
  { text: "Triplicamos nossas vendas em 4 meses usando a plataforma.", image: "https://randomuser.me/api/portraits/men/1.jpg", name: "Ricardo M.", role: "CEO — RM Consultoria" },
  { text: "Nunca tive tanto controle sobre meu comercial. Mudou meu negócio.", image: "https://randomuser.me/api/portraits/women/2.jpg", name: "Ana Paula S.", role: "Diretora — Studio AP" },
  { text: "A automação de marketing economizou 20h por semana da minha equipe.", image: "https://randomuser.me/api/portraits/men/3.jpg", name: "Carlos D.", role: "Franqueado — CD Franquias" },
  { text: "O CRM é intuitivo e minha equipe adotou em 1 semana.", image: "https://randomuser.me/api/portraits/women/4.jpg", name: "Fernanda L.", role: "Gestora — FL Digital" },
  { text: "Saí de 50 para 300 leads por mês com as campanhas automatizadas.", image: "https://randomuser.me/api/portraits/men/5.jpg", name: "João Pedro R.", role: "Diretor — JPR Serviços" },
  { text: "Os relatórios me deram clareza total sobre onde investir.", image: "https://randomuser.me/api/portraits/women/6.jpg", name: "Marina C.", role: "Corretora — MC Imóveis" },
  { text: "Melhor investimento que fiz pro meu negócio esse ano.", image: "https://randomuser.me/api/portraits/men/7.jpg", name: "Eduardo B.", role: "CTO — EB Tech" },
  { text: "Agora consigo acompanhar cada vendedor em tempo real.", image: "https://randomuser.me/api/portraits/women/8.jpg", name: "Patrícia V.", role: "Proprietária — PV Estética" },
  { text: "Dobrei meu faturamento em 6 meses. Recomendo demais.", image: "https://randomuser.me/api/portraits/women/9.jpg", name: "Luciana F.", role: "CEO — LF Moda" },
];

const col1 = testimonials.slice(0, 3);
const col2 = testimonials.slice(3, 6);
const col3 = testimonials.slice(6, 9);

const SaasBrandingPanel = () => {
  const [benefitIndex, setBenefitIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

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
        {/* Benefits phrase — title font */}
        <div className="pt-4 pb-8 flex items-center justify-center min-h-[120px]">
          <p
            className={`text-2xl xl:text-3xl font-black uppercase italic tracking-tighter text-white text-center leading-tight max-w-md transition-all duration-400 ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {BENEFITS[benefitIndex]}
          </p>
        </div>

        {/* Testimonials columns */}
        <div className="flex-1 overflow-hidden relative">
          {/* Fade masks */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[hsl(355,78%,40%)]/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[hsl(355,78%,30%)]/80 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 h-full [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
            <TestimonialsColumn testimonials={col1} duration={15} className="flex-1" />
            <TestimonialsColumn testimonials={col2} duration={19} className="flex-1 hidden xl:block" />
            <TestimonialsColumn testimonials={col3} duration={17} className="flex-1 hidden 2xl:block" />
          </div>
        </div>

        {/* Logo bottom */}
        <div className="flex justify-center pt-6">
          <img src={logoDark} alt="NoExcuse" className="h-7 object-contain opacity-70" />
        </div>
      </div>
    </div>
  );
};

export default SaasBrandingPanel;
