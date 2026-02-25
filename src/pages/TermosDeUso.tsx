import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermosDeUso = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-muted-foreground text-sm mb-8">Última atualização: 25 de fevereiro de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
          <p>Ao acessar e usar a plataforma NoExcuse ("Plataforma"), você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar a Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
          <p>A NoExcuse é uma plataforma SaaS de gestão comercial e marketing que oferece ferramentas de CRM, automação de vendas, geração de conteúdo com IA, disparos de mensagens e gestão de equipes comerciais.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Conta de Usuário</h2>
          <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Período de Teste</h2>
          <p>Oferecemos um período de teste gratuito de 7 (sete) dias. Ao final do período de teste, o acesso a funcionalidades de criação e IA será restrito até a contratação de um plano pago.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Pagamento e Cobrança</h2>
          <p>Os planos pagos são cobrados mensalmente via Asaas (boleto, PIX ou cartão de crédito). O cancelamento pode ser feito a qualquer momento, com efeito ao final do período já pago.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Uso Aceitável</h2>
          <p>Você concorda em não utilizar a Plataforma para fins ilegais, envio de spam, violação de propriedade intelectual de terceiros ou qualquer atividade que possa prejudicar o funcionamento do serviço.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Propriedade Intelectual</h2>
          <p>Todo o conteúdo, marca, código e materiais da Plataforma são de propriedade exclusiva da NoExcuse. Os dados inseridos por você permanecem de sua propriedade.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
          <p>A NoExcuse não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da Plataforma. O serviço é fornecido "como está", sem garantias de qualquer tipo.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Alterações nos Termos</h2>
          <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por email ou notificação na Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Contato</h2>
          <p>Para dúvidas sobre estes Termos, entre em contato pelo email: suporte@noexcuse.com.br</p>
        </section>
      </div>
    </div>
  </div>
);

export default TermosDeUso;
