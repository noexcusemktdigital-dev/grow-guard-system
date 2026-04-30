// @ts-nocheck
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function PoliticaPrivacidade() {
  const [searchParams] = useSearchParams();
  const deletionConfirmation = searchParams.get("deletion_confirmed");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground text-sm mb-8">Última atualização: 29 de abril de 2026</p>

        {deletionConfirmation && (
          <div className="mb-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-sm text-foreground/90">
              <p className="font-semibold mb-1">Solicitação de exclusão de dados Meta recebida e processada.</p>
              <p>Código de confirmação: <strong>{deletionConfirmation}</strong></p>
            </div>
          </div>
        )}

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>Esta Política de Privacidade descreve como a NoExcuse ("nós") coleta, usa, armazena e protege suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Informações Coletadas</h2>
            <p>Coletamos os seguintes dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dados de cadastro: nome, email, telefone, nome da empresa</li>
              <li>Dados de uso: páginas acessadas, funcionalidades utilizadas, logs de acesso</li>
              <li>Dados de pagamento: processados diretamente pelo Asaas (não armazenamos dados de cartão)</li>
              <li>Dados inseridos por você: leads, contatos, conteúdos, mensagens</li>
              <li>Dados de integrações autorizadas pelo usuário: identificadores de Páginas do Facebook, contas profissionais do Instagram, tokens OAuth, publicações aprovadas e métricas de desempenho das publicações conectadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Uso das Informações</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prover e manter o funcionamento da Plataforma</li>
              <li>Processar pagamentos e gerenciar sua assinatura</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Melhorar a experiência do usuário e desenvolver novos recursos</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Conectar contas sociais, publicar conteúdos aprovados pelo usuário e exibir métricas das publicações conectadas</li>
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
            <h2 className="text-xl font-semibold text-foreground">10. Integração com Meta (Facebook, Instagram, Ads e Lead Ads)</h2>
            <p>Quando você autoriza a conexão com Meta na Plataforma — para Redes Sociais (Facebook/Instagram), Meta Ads ou Meta Lead Ads — acessamos e processamos os seguintes dados:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Dados acessados:</strong> Páginas do Facebook administradas pelo usuário, conta profissional do Instagram vinculada à Página, nome de perfil e identificadores das contas, tokens OAuth de usuário e de página, publicações criadas pela Plataforma, formulários de Lead Ads vinculados à Página, leads gerados por esses formulários e métricas de desempenho de publicações, anúncios e campanhas (alcance, impressões, cliques, gasto, conversões, engajamento).</li>
              <li><strong>Permissões utilizadas:</strong> <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>instagram_manage_insights</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_posts</code>, <code>leads_retrieval</code>, <code>pages_manage_ads</code>, <code>pages_manage_metadata</code> e <code>ads_read</code>.</li>
              <li><strong>Uso:</strong> conectar a conta escolhida pelo usuário; publicar conteúdo previamente aprovado pelo usuário no Facebook e Instagram; receber e exibir leads enviados via formulários Meta Lead Ads vinculados às Páginas autorizadas; assinar/desassinar Páginas ao webhook leadgen do app; e apresentar relatórios de desempenho de publicações orgânicas, anúncios e campanhas.</li>
              <li><strong>O que não fazemos:</strong> não vendemos dados recebidos da Meta, não usamos esses dados para publicidade de terceiros, não publicamos sem ação ou aprovação explícita do usuário e não criamos/editamos/pausamos campanhas pagas sem ação direta do usuário (não solicitamos <code>ads_management</code>).</li>
              <li><strong>Armazenamento:</strong> tokens OAuth, page access tokens e identificadores ficam armazenados exclusivamente no backend da Plataforma com controles de acesso restritos (Service Role).</li>
              <li><strong>Revogação:</strong> a qualquer momento dentro da Plataforma em <strong>Redes Sociais &gt; Contas</strong> (publicações Facebook/Instagram) ou em <strong>CRM &gt; Integrações &gt; Meta Lead Ads</strong> (assinatura de leadgen). Também é possível revogar diretamente nas configurações da Meta em <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary underline">Ferramentas de Negócios Meta</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Integração com WhatsApp Business Platform (Meta)</h2>
            <p>Quando você conecta seu número comercial à Plataforma utilizando a WhatsApp Business Platform / WhatsApp Cloud API (Meta), processamos os seguintes dados:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Dados acessados:</strong> WABA ID (WhatsApp Business Account ID), Phone Number ID, número comercial, nome verificado da conta, lista e status de templates aprovados pela Meta, mensagens enviadas e recebidas, contatos com os quais houve troca de mensagens e eventos de status/webhook (entregue, lido, falha, opt-in/opt-out).</li>
              <li><strong>Permissões/escopos utilizados:</strong> <code>whatsapp_business_messaging</code>, <code>whatsapp_business_management</code> e, quando necessário para a integração, <code>business_management</code>.</li>
              <li><strong>Finalidade:</strong> receber mensagens de usuários finais, responder em nome do cliente, enviar templates previamente aprovados pela Meta, registrar histórico de conversas e status da integração para auditoria, métricas e suporte.</li>
              <li><strong>Opt-in / consentimento:</strong> o cliente da Plataforma é o responsável por obter consentimento prévio (opt-in) dos contatos antes de qualquer envio. A Plataforma não envia mensagens a contatos sem que o cliente declare possuir o opt-in.</li>
              <li><strong>Revogação / descadastro:</strong> contatos podem solicitar opt-out a qualquer momento; o cliente é responsável por respeitar e registrar o opt-out. A conexão WhatsApp pode ser desconectada na Plataforma em <strong>Integrações &gt; WhatsApp</strong>, o que remove tokens, WABA ID e Phone Number ID armazenados.</li>
              <li><strong>Não venda de dados:</strong> não vendemos dados recebidos via WhatsApp Business Platform e não os utilizamos para publicidade de terceiros.</li>
              <li><strong>Armazenamento:</strong> tokens de acesso da Meta são armazenados de forma criptografada no backend, com acesso restrito a Service Role.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Exclusão de Dados de Integrações</h2>
            <p>Você pode solicitar a exclusão de dados de integrações a qualquer momento enviando um e-mail para <strong>privacidade@noexcuse.com.br</strong>.</p>
            <p className="mt-2">Adicionalmente, a Plataforma implementa o callback oficial de exclusão de dados da Meta: quando a Meta envia uma solicitação assinada de exclusão, o callback é verificado criptograficamente, as contas sociais Meta correspondentes têm seus tokens revogados e as métricas associadas são removidas. A resposta inclui uma URL pública desta política com um <strong>código de confirmação</strong> único, permitindo ao usuário acompanhar a confirmação da exclusão.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Cookies</h2>
            <p>Utilizamos cookies essenciais para o funcionamento da Plataforma (autenticação e sessão). Não utilizamos cookies de rastreamento de terceiros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Contato do Encarregado (DPO)</h2>
            <p>Para questões relacionadas à proteção de dados, entre em contato: privacidade@noexcuse.com.br</p>
          </section>
        </div>
      </div>
    </div>
  );
}
