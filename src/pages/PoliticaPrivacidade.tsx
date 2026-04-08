import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PoliticaPrivacidade = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-muted-foreground text-sm mb-8">Última atualização: 25 de fevereiro de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
          <p>Esta Política de Privacidade descreve como a NoExcuse ("nós") coleta, usa, armazena e protege suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Dados Coletados</h2>
          <p>Coletamos os seguintes dados:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dados de cadastro: nome, email, telefone, nome da empresa</li>
            <li>Dados de uso: páginas acessadas, funcionalidades utilizadas, logs de acesso</li>
            <li>Dados de pagamento: processados diretamente pelo Asaas (não armazenamos dados de cartão)</li>
            <li>Dados inseridos por você: leads, contatos, conteúdos, mensagens</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Finalidade do Tratamento</h2>
          <p>Utilizamos seus dados para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Prover e manter o funcionamento da Plataforma</li>
            <li>Processar pagamentos e gerenciar sua assinatura</li>
            <li>Enviar comunicações relacionadas ao serviço</li>
            <li>Melhorar a experiência do usuário e desenvolver novos recursos</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Base Legal</h2>
          <p>O tratamento de dados é realizado com base no consentimento do titular, na execução de contrato e no legítimo interesse, conforme previsto na LGPD.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento de Dados</h2>
          <p>Seus dados podem ser compartilhados com:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Processadores de pagamento (Asaas) para cobrança</li>
            <li>Serviços de infraestrutura (hospedagem e banco de dados)</li>
            <li>Autoridades competentes quando exigido por lei</li>
          </ul>
          <p>Nunca vendemos seus dados pessoais a terceiros.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Segurança dos Dados</h2>
          <p>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda ou destruição, incluindo criptografia, controle de acesso e monitoramento.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Seus Direitos (LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Confirmar a existência de tratamento de dados</li>
            <li>Acessar, corrigir ou eliminar seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Solicitar portabilidade dos dados</li>
            <li>Obter informações sobre compartilhamento com terceiros</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo email: privacidade@noexcuse.com.br</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Retenção de Dados</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa ou conforme necessário para cumprir obrigações legais. Após o cancelamento, os dados são excluídos em até 90 dias, exceto quando houver obrigação legal de retenção.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Integração com Google Agenda (Google Calendar)</h2>
          <p>Quando você opta por conectar sua conta Google à Plataforma, solicitamos acesso ao escopo <strong>https://www.googleapis.com/auth/calendar</strong>. Com esse acesso:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>O que acessamos:</strong> eventos da sua agenda Google (título, descrição, data/hora, local) para exibição e sincronização dentro da Plataforma.</li>
            <li><strong>O que não fazemos:</strong> não lemos, armazenamos nem compartilhamos dados de outros serviços Google (Gmail, Drive, Contatos, etc.).</li>
            <li><strong>Como armazenamos:</strong> os tokens de acesso OAuth são armazenados de forma criptografada no banco de dados e usados exclusivamente para sincronizar sua agenda.</li>
            <li><strong>Compartilhamento:</strong> os dados do Google Agenda não são compartilhados com terceiros.</li>
            <li><strong>Revogação:</strong> você pode desconectar a integração a qualquer momento na página de Agenda da Plataforma. Para revogar o acesso diretamente no Google, acesse <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline">myaccount.google.com/permissions</a>.</li>
          </ul>
          <p className="mt-2">O uso da API do Google Calendar está sujeito à <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Dados de Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Cookies</h2>
          <p>Utilizamos cookies essenciais para o funcionamento da Plataforma (autenticação e sessão). Não utilizamos cookies de rastreamento de terceiros.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Contato do Encarregado (DPO)</h2>
          <p>Para questões relacionadas à proteção de dados, entre em contato: privacidade@noexcuse.com.br</p>
        </section>
      </div>
    </div>
  </div>
);

export default PoliticaPrivacidade;
