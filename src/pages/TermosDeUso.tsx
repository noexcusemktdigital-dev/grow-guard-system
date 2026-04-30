// @ts-nocheck
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermosDeUso = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-muted-foreground text-sm mb-8">Última atualização: 9 de março de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
          <p>Ao acessar e usar a plataforma NoExcuse ("Plataforma"), você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar a Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
          <p>A NoExcuse é uma plataforma SaaS de gestão comercial e marketing que oferece ferramentas de CRM, automação de vendas, geração de conteúdo com a nossa IA, disparos de mensagens e gestão de equipes comerciais.</p>
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
          <h2 className="text-xl font-semibold text-foreground">8. Proteção de Dados Pessoais (LGPD)</h2>
          <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), as partes reconhecem que:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Controlador dos dados:</strong> O usuário (pessoa física ou jurídica que contrata a Plataforma) é o controlador dos dados pessoais de seus clientes, leads e contatos inseridos na Plataforma. Cabe ao controlador garantir que possui base legal adequada para o tratamento dos dados (consentimento, legítimo interesse, execução contratual etc.).</li>
            <li><strong>Operador dos dados:</strong> A NoExcuse atua como operadora dos dados, processando-os exclusivamente conforme as instruções do controlador e para a finalidade de prestação dos serviços contratados.</li>
            <li><strong>Responsabilidade do controlador:</strong> O usuário é integralmente responsável por obter o consentimento prévio e inequívoco dos titulares dos dados antes de inserir suas informações na Plataforma, bem como por atender a eventuais solicitações de acesso, correção, exclusão ou portabilidade formuladas pelos titulares.</li>
            <li><strong>Medidas de segurança:</strong> A NoExcuse emprega medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou destruição.</li>
            <li><strong>Compartilhamento:</strong> Os dados pessoais não serão compartilhados com terceiros, exceto quando necessário para a prestação do serviço (ex: processadores de pagamento) ou por exigência legal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Disparos de Mensagens e WhatsApp</h2>
          <p>A Plataforma oferece funcionalidades de envio de mensagens em massa e integração com WhatsApp. Ao utilizar esses recursos, o usuário reconhece e aceita que:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Risco de bloqueio:</strong> O envio de mensagens em massa via WhatsApp pode resultar no bloqueio temporário ou permanente do número utilizado pelo Meta/WhatsApp, conforme as políticas vigentes da plataforma. A NoExcuse <strong>não se responsabiliza por bloqueios, suspensões ou restrições</strong> aplicadas pelo WhatsApp, Meta ou qualquer outra plataforma de comunicação.</li>
            <li><strong>Consentimento prévio (opt-in):</strong> É obrigação exclusiva do usuário garantir que todos os destinatários consentiram previamente em receber mensagens. O envio de mensagens não solicitadas (spam) é expressamente proibido e pode configurar violação da LGPD e do Marco Civil da Internet.</li>
            <li><strong>Conteúdo das mensagens:</strong> O usuário é o único responsável pelo conteúdo, veracidade e legalidade das mensagens enviadas através da Plataforma.</li>
            <li><strong>Boas práticas:</strong> Recomendamos o envio de mensagens com intervalos adequados, respeito aos horários comerciais e personalização do conteúdo para reduzir o risco de bloqueios.</li>
            <li><strong>Isenção de responsabilidade:</strong> A NoExcuse não garante taxas de entrega, leitura ou resposta das mensagens enviadas, e não se responsabiliza por eventuais prejuízos decorrentes do uso impróprio dos recursos de disparo.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9.1. WhatsApp Business Platform (Meta)</h2>
          <p>Ao utilizar a integração oficial da WhatsApp Business Platform / WhatsApp Cloud API (Meta) na Plataforma, o usuário declara e se compromete a:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Opt-in obrigatório:</strong> obter e manter registro do consentimento prévio e inequívoco (opt-in) de todos os contatos antes de enviar qualquer mensagem por WhatsApp via Plataforma.</li>
            <li><strong>Respeito ao opt-out:</strong> respeitar imediatamente qualquer solicitação de descadastro/opt-out, deixando de enviar mensagens ao contato em qualquer canal vinculado ao mesmo número.</li>
            <li><strong>Templates aprovados:</strong> utilizar exclusivamente templates de mensagem previamente aprovados pela Meta para envios fora da janela de 24 horas, respeitando as categorias e regras da WhatsApp Business Platform.</li>
            <li><strong>Responsabilidade pelo conteúdo e pela base:</strong> o usuário é o único responsável pelo conteúdo enviado, pela veracidade das informações, pela base de contatos utilizada e pelo cumprimento das políticas da Meta (WhatsApp Business Messaging Policy e WhatsApp Business Solution Terms), da LGPD e demais legislações aplicáveis.</li>
            <li><strong>Suspensões pela Meta:</strong> a NoExcuse não se responsabiliza por bloqueios, limitações de qualidade (quality rating), suspensões ou descredenciamento da WABA aplicados pela Meta em decorrência do uso indevido pelo usuário.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Conteúdo Gerado por Inteligência Artificial</h2>
          <p>A Plataforma utiliza modelos de inteligência artificial para gerar sugestões de conteúdo, scripts de vendas, estratégias de marketing e outros materiais. O usuário reconhece que:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Os conteúdos gerados pela nossa IA são <strong>sugestões</strong> e devem ser revisados, editados e aprovados pelo usuário antes de qualquer publicação ou uso externo.</li>
            <li>A NoExcuse não garante a precisão, adequação, originalidade ou legalidade dos conteúdos gerados automaticamente.</li>
            <li>O usuário é o único responsável pelo conteúdo final publicado ou distribuído, incluindo a verificação de direitos autorais, veracidade das informações e conformidade com legislações aplicáveis.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Limitação de Responsabilidade</h2>
          <p>A NoExcuse não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da Plataforma. O serviço é fornecido "como está", sem garantias de qualquer tipo. Em especial, a NoExcuse não se responsabiliza por:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Perda de receita, oportunidades de negócio ou dados decorrentes do uso ou indisponibilidade da Plataforma.</li>
            <li>Ações de terceiros (incluindo provedores de comunicação, redes sociais ou processadores de pagamento) que afetem o funcionamento dos serviços integrados.</li>
            <li>Decisões comerciais tomadas com base em conteúdos, relatórios ou sugestões gerados pela Plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">12. Alterações nos Termos</h2>
          <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por email ou notificação na Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">13. Contato</h2>
          <p>Para dúvidas sobre estes Termos, entre em contato pelo email: suporte@noexcuse.com.br</p>
        </section>
      </div>
    </div>
  </div>
);

export default TermosDeUso;
