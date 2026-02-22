import logoLight from "@/assets/noe2.png";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { Highlight } from "@/components/ui/hero-highlight";

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
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
      <div className="flex flex-col h-full px-8 py-8 w-full">
          {/* Tagline with highlight — centered, smaller */}
          <div className="pt-4 pb-6 text-center">
            <p className="text-base xl:text-lg font-semibold text-black/80 leading-relaxed max-w-sm mx-auto">
              Plataforma{" "}
              <Highlight className="text-white">
                completa de marketing e vendas
              </Highlight>{" "}
              para acelerar seus resultados
            </p>
          </div>

          {/* Testimonials columns — smooth fade edges */}
          <div className="flex-1 overflow-hidden relative min-h-0">
            <div className="flex gap-3 h-full" style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
            }}>
              <TestimonialsColumn testimonials={col1} duration={15} className="flex-1" />
              <TestimonialsColumn testimonials={col2} duration={19} className="flex-1 hidden xl:block" />
              <TestimonialsColumn testimonials={col3} duration={17} className="flex-1 hidden 2xl:block" />
            </div>
          </div>

          {/* Logo bottom */}
          <div className="flex justify-center pt-4">
            <img src={logoLight} alt="NoExcuse" className="h-7 object-contain opacity-60" />
          </div>
      </div>
    </div>
  );
};

export default SaasBrandingPanel;
