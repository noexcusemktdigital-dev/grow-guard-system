// @ts-nocheck
import {
  Users, TrendingUp, FileText, Bot, Send, Palette,
  Share2, Globe, Target, MessageCircle, CheckSquare,
  Trophy, type LucideIcon,
} from "lucide-react";

export interface FeatureTutorialStep {
  title: string;
  description: string;
}

export interface FeatureTutorial {
  slug: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  whatIs: string;
  steps: FeatureTutorialStep[];
  benefits: string[];
}

export const FEATURE_TUTORIALS: Record<string, FeatureTutorial> = {
  crm: {
    slug: "crm",
    title: "CRM / Pipeline",
    subtitle: "Gerencie seus leads e oportunidades de venda",
    icon: Users,
    whatIs: "O CRM é o coração comercial da sua empresa. Ele organiza todos os seus leads em um pipeline visual (Kanban), permitindo que você acompanhe cada oportunidade desde o primeiro contato até o fechamento da venda.",
    steps: [
      { title: "Crie um funil", description: "Acesse as configurações do CRM e crie seu primeiro funil com as etapas do seu processo de vendas." },
      { title: "Adicione leads", description: "Clique em '+ Novo Lead' para cadastrar manualmente, importar via CSV ou receber automaticamente por integração." },
      { title: "Arraste entre etapas", description: "Use o Kanban para arrastar os leads entre as etapas conforme o progresso da negociação." },
      { title: "Acompanhe métricas", description: "Visualize valor total do pipeline, taxa de conversão e leads por etapa no topo da página." },
    ],
    benefits: [
      "Nunca perca um follow-up com leads organizados por etapa",
      "Visão clara do valor total em negociação",
      "Identifique gargalos no seu processo de vendas",
      "Aumente sua taxa de conversão com gestão ativa",
    ],
  },
  plano_vendas: {
    slug: "plano_vendas",
    title: "Plano de Vendas",
    subtitle: "Estratégia comercial gerada pela nossa IA",
    icon: TrendingUp,
    whatIs: "O Plano de Vendas usa inteligência artificial para criar uma estratégia comercial personalizada para o seu negócio. Com base nas informações da sua empresa, ele gera um plano completo com metas, ações e cronograma.",
    steps: [
      { title: "Preencha o briefing", description: "Responda perguntas sobre seu negócio, público-alvo, ticket médio e metas de faturamento." },
      { title: "Gere o plano", description: "A nossa IA analisará suas respostas e criará um plano de vendas completo e personalizado." },
      { title: "Revise e ajuste", description: "Analise as sugestões, metas semanais e ações recomendadas pela nossa IA." },
      { title: "Execute e acompanhe", description: "Use o checklist diário e o CRM para executar as ações do plano." },
    ],
    benefits: [
      "Estratégia comercial profissional sem precisar de consultoria",
      "Metas realistas baseadas no seu mercado",
      "Plano de ação com passo a passo claro",
      "Economia de tempo na criação da estratégia",
    ],
  },
  scripts: {
    slug: "scripts",
    title: "Scripts de Vendas",
    subtitle: "Roteiros inteligentes para cada situação",
    icon: FileText,
    whatIs: "Os Scripts de Vendas são roteiros prontos gerados pela nossa IA para diferentes situações do dia a dia comercial: prospecção, follow-up, objeções, fechamento e pós-venda. Cada script é personalizado para o seu nicho.",
    steps: [
      { title: "Escolha a categoria", description: "Selecione se quer um script de prospecção, follow-up, objeção, fechamento ou pós-venda." },
      { title: "Gere com a nossa IA", description: "Clique em gerar e a nossa IA criará um roteiro personalizado para o seu negócio." },
      { title: "Personalize", description: "Edite o script conforme sua preferência e estilo de comunicação." },
      { title: "Use no dia a dia", description: "Copie e use nos atendimentos via WhatsApp, telefone ou e-mail." },
    ],
    benefits: [
      "Respostas rápidas e profissionais para qualquer situação",
      "Padronização da comunicação da equipe",
      "Aumento da taxa de resposta dos leads",
      "Redução do tempo de atendimento",
    ],
  },
  agentes_ia: {
    slug: "agentes_ia",
    title: "Agentes de IA",
    subtitle: "Automatize atendimento e prospecção",
    icon: Bot,
    whatIs: "Os Agentes de IA são assistentes virtuais que atendem seus clientes automaticamente via WhatsApp. Eles prospectam, qualificam leads, respondem dúvidas e fazem follow-up — tudo de forma autônoma e personalizada.",
    steps: [
      { title: "Crie um agente", description: "Defina o nome, persona, tom de voz e objetivo do agente (prospecção, atendimento ou pós-venda)." },
      { title: "Configure a base de conhecimento", description: "Adicione informações sobre seus produtos, preços, FAQ e políticas." },
      { title: "Conecte ao WhatsApp", description: "Vincule o agente à sua instância do WhatsApp para começar a responder." },
      { title: "Monitore conversas", description: "Acompanhe as conversas do agente e intervenha quando necessário." },
    ],
    benefits: [
      "Atendimento 24/7 sem precisar de equipe",
      "Qualificação automática de leads",
      "Respostas instantâneas aumentam conversão",
      "Escale seu atendimento sem aumentar custos",
    ],
  },
  disparos: {
    slug: "disparos",
    title: "Disparos em Massa",
    subtitle: "Campanhas de mensagens segmentadas",
    icon: Send,
    whatIs: "Os Disparos em Massa permitem enviar mensagens personalizadas para listas segmentadas de contatos via WhatsApp. Ideal para campanhas promocionais, reativação de clientes e comunicados.",
    steps: [
      { title: "Crie a campanha", description: "Defina o título, mensagem e selecione uma imagem opcional." },
      { title: "Selecione os destinatários", description: "Escolha contatos do CRM, importe uma lista ou selecione por tags." },
      { title: "Configure o envio", description: "Defina horário, intervalo entre mensagens e limite diário." },
      { title: "Acompanhe os resultados", description: "Veja estatísticas de envio, entrega e respostas em tempo real." },
    ],
    benefits: [
      "Alcance centenas de contatos com uma mensagem personalizada",
      "Reative clientes inativos com campanhas direcionadas",
      "Envio inteligente com intervalos para evitar bloqueios",
      "Acompanhe resultados em tempo real",
    ],
  },
  conteudos: {
    slug: "conteudos",
    title: "Roteiros de Vídeo",
    subtitle: "Roteiros estratégicos gerados pela nossa IA",
    icon: Palette,
    whatIs: "A ferramenta de Roteiros usa a nossa IA para criar scripts de vídeo completos para Reels, TikTok, YouTube e Stories. Com base na sua estratégia, ela gera roteiros com hook, desenvolvimento e CTA otimizados para o algoritmo.",
    steps: [
      { title: "Escolha o formato", description: "Selecione entre Reels/TikTok, YouTube, Stories ou vídeo longo." },
      { title: "Defina duração e objetivo", description: "Escolha a duração do vídeo e o resultado que quer gerar (educar, vender, engajar)." },
      { title: "Gere com IA", description: "A IA criará roteiros completos com hook de impacto, desenvolvimento e CTA." },
      { title: "Copie e grave", description: "Copie o roteiro e use como guia para gravar seu vídeo." },
    ],
    benefits: [
      "Roteiros profissionais sem precisar de roteirista",
      "Hooks otimizados para prender atenção nos primeiros 3 segundos",
      "Estrutura de vídeo que o algoritmo prioriza",
      "Economia de horas na criação de roteiros",
    ],
  },
  redes_sociais: {
    slug: "redes_sociais",
    title: "Postagem",
    subtitle: "Crie artes profissionais com IA",
    icon: Share2,
    whatIs: "A ferramenta de Postagem permite criar artes visuais para redes sociais usando inteligência artificial. Gere artes profissionais em segundos com textos, referências visuais e sua identidade de marca.",
    steps: [
      { title: "Descreva o que quer", description: "Informe o tema, objetivo e estilo desejado. A IA gera os textos automaticamente." },
      { title: "Envie a logo", description: "Faça upload da sua logo para aplicação automática na arte." },
      { title: "Adicione referências", description: "Envie exemplos visuais que representem o estilo desejado (mínimo 3)." },
      { title: "Gere e baixe", description: "A IA cria a arte com seus textos e identidade visual. Baixe e publique!" },
    ],
    benefits: [
      "Artes profissionais sem precisar de designer",
      "Textos gerados automaticamente pela IA",
      "Tutorial didático para referências visuais",
      "Identidade visual consistente em todas as peças",
    ],
  },
  sites: {
    slug: "sites",
    title: "Sites IA",
    subtitle: "Landing pages geradas por inteligência artificial",
    icon: Globe,
    whatIs: "Crie landing pages profissionais com IA em minutos. A ferramenta gera o design, textos e estrutura da página com base no seu negócio, otimizada para conversão.",
    steps: [
      { title: "Informe seu negócio", description: "Descreva sua empresa, produto/serviço e público-alvo." },
      { title: "Escolha o estilo", description: "Selecione cores, estilo visual e tipo de página." },
      { title: "Gere o site", description: "A IA criará a landing page completa com textos persuasivos." },
      { title: "Publique", description: "Exporte o código ou publique diretamente pela plataforma." },
    ],
    benefits: [
      "Landing page profissional em minutos",
      "Textos persuasivos otimizados para conversão",
      "Sem necessidade de conhecimento técnico",
      "Reduza custos com agência ou freelancer",
    ],
  },
  trafego: {
    slug: "trafego",
    title: "Tráfego Pago",
    subtitle: "Estratégia de anúncios com IA",
    icon: Target,
    whatIs: "A ferramenta de Tráfego Pago gera estratégias completas de anúncios para Meta Ads e Google Ads usando IA. Receba sugestões de público, orçamento, copies e criativos.",
    steps: [
      { title: "Defina o objetivo", description: "Escolha entre geração de leads, vendas, reconhecimento de marca ou tráfego." },
      { title: "Informe o orçamento", description: "Defina quanto pretende investir mensalmente em anúncios." },
      { title: "Gere a estratégia", description: "A IA criará uma estratégia completa com públicos, copies e sugestões de criativos." },
      { title: "Execute", description: "Use as recomendações para configurar suas campanhas nas plataformas de anúncios." },
    ],
    benefits: [
      "Estratégia profissional sem precisar de gestor de tráfego",
      "Sugestões de público-alvo segmentadas",
      "Copies persuasivas prontas para usar",
      "Otimize seu investimento em anúncios",
    ],
  },
  chat: {
    slug: "chat",
    title: "Chat / WhatsApp",
    subtitle: "Central de mensagens integrada",
    icon: MessageCircle,
    whatIs: "O Chat integra seu WhatsApp à plataforma, centralizando todas as conversas em um só lugar. Gerencie atendimentos, visualize histórico e use respostas rápidas para agilizar a comunicação.",
    steps: [
      { title: "Conecte o WhatsApp", description: "Siga o assistente de configuração para vincular seu número do WhatsApp." },
      { title: "Visualize conversas", description: "Todas as mensagens recebidas aparecerão na lista de contatos à esquerda." },
      { title: "Responda pelo sistema", description: "Envie mensagens diretamente pela plataforma sem precisar abrir o WhatsApp." },
      { title: "Use respostas rápidas", description: "Cadastre templates de mensagens para respostas frequentes." },
    ],
    benefits: [
      "Todas as conversas em um lugar centralizado",
      "Histórico completo de interações com cada contato",
      "Respostas rápidas para agilizar o atendimento",
      "Integração com CRM para vincular contatos a leads",
    ],
  },
  checklist: {
    slug: "checklist",
    title: "Checklist Diário",
    subtitle: "Rotina organizada com tarefas inteligentes",
    icon: CheckSquare,
    whatIs: "O Checklist Diário gera uma lista de tarefas personalizada com base no seu plano de vendas, agendamentos e metas. A IA cria atividades práticas para cada dia, garantindo que nada seja esquecido.",
    steps: [
      { title: "Acesse o checklist", description: "Sua lista de tarefas diárias é gerada automaticamente a cada manhã." },
      { title: "Execute as tarefas", description: "Marque cada tarefa como concluída conforme for realizando." },
      { title: "Acompanhe o progresso", description: "Veja sua porcentagem de conclusão e mantenha a consistência." },
      { title: "Ganhe pontos", description: "Cada tarefa concluída gera pontos no sistema de gamificação." },
    ],
    benefits: [
      "Rotina comercial organizada sem esquecer nenhuma ação",
      "Tarefas priorizadas pela IA com base nos seus objetivos",
      "Aumento da produtividade com foco nas atividades certas",
      "Gamificação motiva a conclusão diária",
    ],
  },
  gamificacao: {
    slug: "gamificacao",
    title: "Gamificação",
    subtitle: "Conquistas e ranking para motivar resultados",
    icon: Trophy,
    whatIs: "O sistema de Gamificação transforma suas atividades comerciais em um jogo com pontos, níveis, badges e ranking. Quanto mais você usa a plataforma e atinge metas, mais pontos acumula.",
    steps: [
      { title: "Use a plataforma", description: "Cada ação (criar lead, fechar venda, concluir checklist) gera pontos automaticamente." },
      { title: "Suba de nível", description: "Acumule XP para desbloquear novos níveis e títulos." },
      { title: "Conquiste badges", description: "Complete desafios específicos para ganhar medalhas exclusivas." },
      { title: "Dispute o ranking", description: "Compare seu desempenho com outros membros da equipe." },
    ],
    benefits: [
      "Motivação contínua para usar a plataforma",
      "Competição saudável entre membros da equipe",
      "Reconhecimento visual do progresso",
      "Aumento do engajamento e resultados",
    ],
  },
};
