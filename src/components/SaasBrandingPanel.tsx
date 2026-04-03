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
      <div className="flex flex-col h-screen px-8 py-8 w-full">
          {/* Title */}
          <div className="pt-4 pb-6 text-center flex flex-col items-center shrink-0">
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight text-black leading-tight max-w-lg">
              Plataforma <span className="text-[hsl(355,78%,50%)]">completa de marketing e vendas</span> para acelerar seus resultados
            </h2>
          </div>

          {/* Testimonials columns — fills remaining space */}
          <div className="flex-1 overflow-hidden relative min-h-0">
            <div className="flex gap-3 h-full" style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}>
              <TestimonialsColumn testimonials={col1} duration={15} className="flex-1" />
              <TestimonialsColumn testimonials={col2} duration={19} className="flex-1 hidden xl:block" />
              <TestimonialsColumn testimonials={col3} duration={17} className="flex-1 hidden 2xl:block" />
            </div>
          </div>

          {/* Logo bottom — larger */}
          <div className="flex justify-center pt-4 shrink-0">
            <img src={logoLight} alt="NoExcuse" className="h-16 object-contain opacity-70" />
          </div>
      </div>
    </div>
  );
};

export default SaasBrandingPanel;
