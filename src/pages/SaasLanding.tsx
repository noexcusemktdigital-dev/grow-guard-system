import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SALES_PLANS, MARKETING_PLANS, getComboPrice, getComboSavings, COMBO_DISCOUNT } from "@/constants/plans";
import { Check, Sparkles, Zap, BarChart3, MessageSquare, Bot, Target, ArrowRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoDark from "@/assets/NOE3.png";

const HERO_FEATURES = [
  { icon: Zap, label: "CRM inteligente com IA" },
  { icon: MessageSquare, label: "WhatsApp integrado" },
  { icon: Bot, label: "Agentes de IA 24/7" },
  { icon: BarChart3, label: "Relatórios em tempo real" },
  { icon: Target, label: "Automação de vendas" },
];

const SaasLanding = () => {
  return (
    <div className="min-h-screen bg-[hsl(225,20%,4%)] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-white/5">
        <img src={logoDark} alt="NoExcuse" className="h-8 object-contain" />
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">Entrar</Button>
          </Link>
          <Link to="/app">
            <Button className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white">
              Começar grátis
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 lg:py-32 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(355,78%,50%)]/10 border border-[hsl(355,78%,50%)]/20 mb-8">
          <Sparkles className="h-4 w-4 text-[hsl(355,78%,50%)]" />
          <span className="text-sm font-medium text-[hsl(355,78%,60%)]">7 dias grátis • Sem cartão de crédito</span>
        </div>

        <h1 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-6">
          Venda mais.<br />
          <span className="text-[hsl(355,78%,50%)]">Sem desculpas.</span>
        </h1>

        <p className="text-lg lg:text-xl text-white/50 max-w-2xl mx-auto mb-10">
          CRM, automação de vendas, WhatsApp, agentes de IA e marketing digital — tudo em uma plataforma para acelerar seus resultados comerciais.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {HERO_FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <f.icon className="h-4 w-4 text-[hsl(355,78%,55%)]" />
              <span className="text-sm text-white/70">{f.label}</span>
            </div>
          ))}
        </div>

        <Link to="/app">
          <Button size="lg" className="bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white text-lg px-10 py-6 h-auto">
            Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Pricing */}
      <section className="px-6 lg:px-16 py-20 max-w-6xl mx-auto" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">Planos que cabem no seu bolso</h2>
          <p className="text-white/50">Escolha Vendas, Marketing ou combine os dois com 15% de desconto.</p>
        </div>

        <Tabs defaultValue="vendas" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="vendas" className="data-[state=active]:bg-[hsl(355,78%,50%)] data-[state=active]:text-white text-white/60 gap-1.5">
                <Target className="h-3.5 w-3.5" /> Vendas
              </TabsTrigger>
              <TabsTrigger value="marketing" className="data-[state=active]:bg-[hsl(355,78%,50%)] data-[state=active]:text-white text-white/60 gap-1.5">
                <Megaphone className="h-3.5 w-3.5" /> Marketing
              </TabsTrigger>
              <TabsTrigger value="combo" className="data-[state=active]:bg-[hsl(355,78%,50%)] data-[state=active]:text-white text-white/60 gap-1.5">
                🔥 Combo
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Sales Plans */}
          <TabsContent value="vendas">
            <p className="text-center text-sm text-white/40 mb-6">7 ferramentas: CRM, Chat WhatsApp, Agentes IA, Scripts, Disparos, Plano de Vendas, Checklist</p>
            <div className="grid md:grid-cols-3 gap-6">
              {SALES_PLANS.map((plan) => (
                <PlanCard key={plan.id} name={plan.name} price={plan.price} credits={plan.credits} features={plan.features} popular={plan.popular} />
              ))}
            </div>
          </TabsContent>

          {/* Marketing Plans */}
          <TabsContent value="marketing">
            <p className="text-center text-sm text-white/40 mb-6">5 ferramentas: Conteúdos, Artes Sociais, Sites, Tráfego Pago, Estratégia de Marketing</p>
            <div className="grid md:grid-cols-3 gap-6">
              {MARKETING_PLANS.map((plan) => (
                <PlanCard key={plan.id} name={plan.name} price={plan.price} credits={plan.credits} features={plan.features} popular={plan.popular} />
              ))}
            </div>
          </TabsContent>

          {/* Combo */}
          <TabsContent value="combo">
            <div className="rounded-xl border border-[hsl(355,78%,50%)]/30 bg-[hsl(355,78%,50%)]/5 p-4 mb-6 text-center">
              <p className="text-sm font-semibold text-[hsl(355,78%,55%)]">
                Contrate Vendas + Marketing juntos e ganhe {Math.round(COMBO_DISCOUNT * 100)}% de desconto!
              </p>
              <p className="text-xs text-white/40 mt-1">Todas as 12 ferramentas desbloqueadas. Créditos somados.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {SALES_PLANS.map((sp, i) => {
                const mp = MARKETING_PLANS[i];
                const combo = getComboPrice(sp.price, mp.price);
                const savings = getComboSavings(sp.price, mp.price);
                const totalCredits = sp.credits + mp.credits;
                return (
                  <div
                    key={sp.id}
                    className={`relative rounded-2xl p-6 border ${
                      sp.popular
                        ? "border-[hsl(355,78%,50%)] bg-[hsl(355,78%,50%)]/5 shadow-lg shadow-[hsl(355,78%,50%)]/10"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    {sp.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[hsl(355,78%,50%)] text-xs font-bold uppercase tracking-wider">
                        Mais popular
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-1">{sp.name} + {mp.name}</h3>
                    <p className="text-white/40 text-sm mb-4">{totalCredits.toLocaleString("pt-BR")} créditos/mês</p>

                    <div className="mb-1">
                      <span className="text-3xl font-black">R$ {combo}</span>
                      <span className="text-white/40 text-sm">/mês</span>
                    </div>
                    <p className="text-xs text-white/30 mb-1">
                      <span className="line-through">R$ {sp.price + mp.price}</span>
                    </p>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] mb-4">
                      Economize R$ {savings}/mês
                    </Badge>

                    <ul className="space-y-2 mb-6">
                      {[...sp.features.slice(0, 3), ...mp.features.slice(0, 3)].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                          <Check className="h-4 w-4 text-[hsl(355,78%,55%)] shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link to="/app">
                      <Button
                        className={`w-full ${
                          sp.popular
                            ? "bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white"
                            : "bg-white/10 hover:bg-white/15 text-white"
                        }`}
                      >
                        Começar grátis
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 lg:px-16 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
          <Link to="/termos" className="hover:text-white/60 transition-colors">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-white/60 transition-colors">Política de Privacidade</Link>
          <span>© {new Date().getFullYear()} NoExcuse. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

function PlanCard({ name, price, credits, features, popular }: {
  name: string; price: number; credits: number; features: string[]; popular: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 border ${
        popular
          ? "border-[hsl(355,78%,50%)] bg-[hsl(355,78%,50%)]/5 shadow-lg shadow-[hsl(355,78%,50%)]/10"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[hsl(355,78%,50%)] text-xs font-bold uppercase tracking-wider">
          Mais popular
        </div>
      )}
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className="text-white/40 text-sm mb-4">{credits.toLocaleString("pt-BR")} créditos/mês</p>
      <div className="mb-6">
        <span className="text-3xl font-black">R$ {price}</span>
        <span className="text-white/40 text-sm">/mês</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/60">
            <Check className="h-4 w-4 text-[hsl(355,78%,55%)] shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link to="/app">
        <Button
          className={`w-full ${
            popular
              ? "bg-[hsl(355,78%,50%)] hover:bg-[hsl(355,78%,45%)] text-white"
              : "bg-white/10 hover:bg-white/15 text-white"
          }`}
        >
          Começar grátis
        </Button>
      </Link>
    </div>
  );
}

export default SaasLanding;
