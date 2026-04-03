import React from "react";
import {
  DollarSign, Sparkles, Target, Users, Globe, BarChart3, Zap,
  Eye, MousePointer, TrendingUp, PlayCircle, ExternalLink,
  ChevronDown, ChevronUp, Loader2, History, CheckCircle2,
  ArrowLeft, ArrowRight, Briefcase, MapPin, Package, Link2,
  Image, Video, Layout, Monitor, MessageSquare, BookOpen,
  PieChart, Lightbulb, Trophy, ChevronRight,
} from "lucide-react";

export const OBJECTIVES = [
  { value: "gerar_leads", label: "Gerar Leads", icon: Users },
  { value: "vender_produtos", label: "Vender Produtos", icon: DollarSign },
  { value: "agendar_reunioes", label: "Agendar Reuniões", icon: Briefcase },
  { value: "captar_franqueados", label: "Captar Franqueados", icon: Trophy },
  { value: "trafego_site", label: "Tráfego no Site", icon: Globe },
];

export const AUDIENCES = ["Empresários", "Médicos", "Pequenas Empresas", "Consumidores Finais", "Profissionais Liberais", "Startups"];

export const DESTINATIONS = [
  { value: "site", label: "Site Institucional", icon: Monitor },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "formulario", label: "Formulário", icon: BookOpen },
];

export const PLATFORMS = [
  { value: "Meta", label: "Meta Ads", icon: Users, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "Google", label: "Google Ads", icon: Globe, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "TikTok", label: "TikTok Ads", icon: PlayCircle, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "LinkedIn", label: "LinkedIn Ads", icon: BarChart3, color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
];

export const ASSETS = [
  { value: "site", label: "Site", icon: Monitor },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "artes", label: "Artes", icon: Image },
  { value: "videos", label: "Vídeos", icon: Video },
];

export const STEPS = [
  { id: "objetivo", label: "Objetivo", icon: Target },
  { id: "produto", label: "Produto", icon: Package },
  { id: "publico", label: "Público", icon: Users },
  { id: "destino", label: "Destino", icon: Link2 },
  { id: "orcamento", label: "Orçamento", icon: DollarSign },
  { id: "plataformas", label: "Plataformas", icon: Globe },
  { id: "regiao", label: "Região", icon: MapPin },
  { id: "ativos", label: "Ativos", icon: Image },
] as const;

export const platformColors: Record<string, string> = {
  Google: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Meta: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TikTok: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LinkedIn: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

export const platformIcons: Record<string, React.ReactNode> = {
  Google: <Globe className="w-5 h-5" />,
  Meta: <Users className="w-5 h-5" />,
  TikTok: <PlayCircle className="w-5 h-5" />,
  LinkedIn: <BarChart3 className="w-5 h-5" />,
};

export const platformLinks: Record<string, string> = {
  Google: "https://ads.google.com",
  Meta: "https://business.facebook.com/adsmanager",
  TikTok: "https://ads.tiktok.com",
  LinkedIn: "https://www.linkedin.com/campaignmanager",
};

export interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
}

export const PLATFORM_TUTORIALS: Record<string, { name: string; steps: TutorialStep[] }> = {
  Google: {
    name: "Google Ads",
    steps: [
      {
        title: "Criar ou acessar sua conta Google Ads",
        description: "Acesse ads.google.com e faça login com sua conta Google. Se ainda não tiver uma conta de anúncios, clique em 'Começar agora' e siga o processo de criação. Vincule seu método de pagamento.",
        tip: "Use a mesma conta Google que gerencia seu site e Analytics para ter dados integrados.",
      },
      {
        title: "Escolher o objetivo da campanha",
        description: "Clique em '+ Nova campanha'. O Google vai pedir um objetivo: Vendas, Leads, Tráfego do site, Consideração de produto, Alcance ou Sem objetivo. Selecione o que mais se alinha à sua estratégia.",
        tip: "Use o objetivo que a IA sugeriu na sua estratégia para garantir alinhamento.",
      },
      {
        title: "Selecionar o tipo de campanha",
        description: "Escolha entre Pesquisa, Display, Shopping, Vídeo, Discovery ou Performance Max. Para geração de leads, 'Pesquisa' é o mais comum. Para awareness, 'Display' ou 'Vídeo'.",
      },
      {
        title: "Definir segmentação geográfica e idioma",
        description: "Na seção de segmentação, defina as regiões onde seus anúncios serão exibidos. Escolha cidades, estados ou raios específicos. Selecione o idioma do público.",
        tip: "Use a região definida na sua estratégia de tráfego.",
      },
      {
        title: "Configurar orçamento diário e lance",
        description: "Defina quanto deseja gastar por dia. O Google recomenda um valor, mas use o orçamento sugerido pela IA dividido por 30. Escolha a estratégia de lance: CPC manual, Maximizar cliques ou Maximizar conversões.",
        tip: "Comece com 'Maximizar cliques' nos primeiros 14 dias para coletar dados, depois mude para 'Maximizar conversões'.",
      },
      {
        title: "Criar grupos de anúncios e palavras-chave",
        description: "Organize seus anúncios em grupos temáticos. Adicione as palavras-chave sugeridas pela IA. Use correspondência de frase e exata para mais controle. Adicione palavras-chave negativas para evitar cliques irrelevantes.",
      },
      {
        title: "Escrever os anúncios (copies)",
        description: "Crie anúncios responsivos de pesquisa com: até 15 títulos (30 caracteres cada) e 4 descrições (90 caracteres cada). Use os copies sugeridos pela IA como base. Inclua CTAs claros e diferenciais.",
        tip: "Copie os copies sugeridos pela IA e adapte com o nome da sua marca.",
      },
      {
        title: "Configurar extensões de anúncio",
        description: "Adicione extensões: Sitelinks (links adicionais), Frases de destaque (diferenciais), Snippets estruturados (categorias), Extensão de chamada (telefone), Extensão de local (endereço).",
      },
      {
        title: "Instalar tag de conversão",
        description: "Vá em Ferramentas > Conversões > Nova ação de conversão. Escolha 'Site' e instale a tag no seu site ou landing page. Isso permite rastrear leads e vendas vindas dos anúncios.",
        tip: "Se você usa landing page, peça ao desenvolvedor para inserir o código no <head>.",
      },
      {
        title: "Revisar e publicar",
        description: "Revise todas as configurações: orçamento, segmentação, copies e extensões. Clique em 'Publicar campanha'. A revisão do Google leva até 24h. Acompanhe os resultados diariamente na primeira semana.",
      },
    ],
  },
  Meta: {
    name: "Meta Ads (Facebook/Instagram)",
    steps: [
      {
        title: "Acessar o Gerenciador de Anúncios",
        description: "Acesse business.facebook.com/adsmanager. Se não tiver uma conta de anúncios, crie um Business Manager primeiro em business.facebook.com. Vincule sua página do Facebook e conta do Instagram.",
      },
      {
        title: "Criar nova campanha",
        description: "Clique em '+ Criar'. Escolha entre os objetivos: Reconhecimento, Tráfego, Engajamento, Leads, Promoção do app ou Vendas. Para captação de leads, use 'Leads' ou 'Tráfego'.",
        tip: "O objetivo 'Leads' permite usar formulários nativos do Facebook, sem precisar de landing page.",
      },
      {
        title: "Definir orçamento e programação",
        description: "Escolha entre orçamento diário ou vitalício. Defina as datas de início e fim. Ative a otimização de orçamento da campanha (CBO) para que o Meta distribua entre os conjuntos automaticamente.",
        tip: "Use o orçamento sugerido pela IA. Para testes A/B, divida o orçamento igualmente entre 2-3 públicos.",
      },
      {
        title: "Configurar o público-alvo",
        description: "Defina: Localização (cidades/estados), Idade, Gênero, Interesses detalhados (use os sugeridos pela IA), Comportamentos. Para públicos avançados: crie Lookalike a partir de clientes existentes ou Públicos personalizados do seu site.",
      },
      {
        title: "Selecionar posicionamentos",
        description: "Escolha onde seus anúncios aparecerão: Feed do Facebook, Feed do Instagram, Stories, Reels, Marketplace, Audience Network. Use 'Posicionamentos automáticos' (Advantage+) no início para o algoritmo otimizar.",
      },
      {
        title: "Criar os criativos do anúncio",
        description: "Adicione imagens ou vídeos (proporção 1:1 para feed, 9:16 para stories/reels). Escreva o texto principal (até 125 caracteres visíveis), título e descrição. Adicione o link de destino e CTA (Saiba mais, Inscreva-se, Compre agora).",
        tip: "Use os copies e formatos criativos sugeridos pela IA. Vídeos curtos (15-30s) têm melhor performance em Reels.",
      },
      {
        title: "Instalar o Pixel do Meta",
        description: "Vá em Gerenciador de Eventos > Conectar fontes de dados > Web > Pixel do Meta. Copie o código e instale no <head> do seu site. Configure eventos padrão: PageView, Lead, Purchase. Isso permite rastrear conversões e criar públicos de remarketing.",
      },
      {
        title: "Configurar conversões e eventos",
        description: "No Gerenciador de Eventos, verifique se os eventos estão disparando corretamente. Configure a API de Conversões para dados mais precisos. Priorize os eventos no Gerenciador de Eventos > Medição Agregada de Eventos.",
      },
      {
        title: "Revisar e publicar",
        description: "Revise: objetivo, público, criativos, link de destino e orçamento. Clique em 'Publicar'. A revisão do Meta leva até 24h. Na primeira semana, não altere nada — deixe o algoritmo aprender (fase de aprendizado).",
        tip: "Evite editar a campanha nos primeiros 3-5 dias. Cada edição reinicia a fase de aprendizado.",
      },
    ],
  },
  TikTok: {
    name: "TikTok Ads",
    steps: [
      {
        title: "Criar conta no TikTok Ads Manager",
        description: "Acesse ads.tiktok.com e crie sua conta comercial. Preencha informações da empresa, método de pagamento e aceite os termos. O TikTok pode levar 24-48h para aprovar sua conta.",
      },
      {
        title: "Criar nova campanha",
        description: "Clique em 'Campanha' > 'Criar'. Escolha o objetivo: Alcance, Tráfego, Visualizações de vídeo, Geração de leads, Conversões no site ou Vendas de catálogo. Para leads, use 'Geração de leads' ou 'Conversões no site'.",
        tip: "O TikTok funciona melhor para awareness e geração de demanda. Se seu público é 18-35 anos, é a plataforma ideal.",
      },
      {
        title: "Configurar grupo de anúncios",
        description: "Defina: posicionamento (TikTok, Pangle ou automático), tipo de promoção (site, app ou loja), público-alvo (localização, idade, gênero, interesses, comportamentos). Use os interesses sugeridos pela IA.",
      },
      {
        title: "Definir orçamento e programação",
        description: "Escolha orçamento diário (mínimo R$ 50/dia) ou vitalício. Defina datas de veiculação. Selecione a estratégia de lance: menor custo (recomendado para início) ou custo controlado.",
        tip: "Use o orçamento sugerido pela IA. O TikTok precisa de pelo menos 50 conversões por semana para otimizar bem.",
      },
      {
        title: "Criar o criativo em vídeo",
        description: "O TikTok exige vídeos verticais (9:16). Crie vídeos de 15-60 segundos que pareçam nativos da plataforma (não muito polidos). Use o Video Editor do TikTok Ads ou CapCut. Estrutura: gancho nos 3 primeiros segundos + problema + solução + CTA.",
        tip: "Vídeos que parecem conteúdo orgânico performam 2-3x melhor que vídeos 'publicitários'. Use trends e músicas populares.",
      },
      {
        title: "Escrever texto e CTA",
        description: "Adicione o texto do anúncio (até 100 caracteres recomendados). Escolha o CTA: Saiba mais, Inscreva-se, Baixe, Compre agora. Adicione o link de destino (site ou landing page otimizada para mobile).",
      },
      {
        title: "Instalar o TikTok Pixel",
        description: "Vá em Ativos > Eventos > Gerenciar eventos web. Crie um pixel e instale no seu site. Configure eventos: Visualização de página, Formulário enviado, Compra. Isso permite rastrear e otimizar conversões.",
      },
      {
        title: "Revisar e publicar",
        description: "Revise todas as configurações e clique em 'Enviar'. O TikTok revisa os anúncios em até 24h. Acompanhe métricas de CPM, CTR e custo por resultado. Na primeira semana, foque em testar 3-5 criativos diferentes.",
      },
    ],
  },
  LinkedIn: {
    name: "LinkedIn Ads",
    steps: [
      {
        title: "Acessar o Campaign Manager",
        description: "Acesse linkedin.com/campaignmanager. Se necessário, crie uma conta de anúncios vinculada à sua Company Page. Adicione método de pagamento e configure a moeda (BRL).",
      },
      {
        title: "Criar nova campanha",
        description: "Clique em 'Criar campanha'. Escolha o grupo de campanhas (ou crie um novo). Selecione o objetivo: Reconhecimento da marca, Visitas ao site, Engajamento, Visualizações de vídeo, Geração de leads ou Conversões no site.",
        tip: "Para B2B, 'Geração de leads' com formulários nativos do LinkedIn tem taxa de conversão 2-3x maior que enviar para landing page.",
      },
      {
        title: "Definir a segmentação",
        description: "O LinkedIn tem a segmentação B2B mais poderosa. Defina: Localização, Cargo (títulos específicos), Empresa (setor, tamanho, nome), Competências, Grupos, Nível de experiência, Formação. Use AND/OR para combinar critérios.",
        tip: "Mantenha o público entre 30.000 e 300.000 para resultados ótimos. Públicos muito pequenos ficam caros.",
      },
      {
        title: "Escolher formato do anúncio",
        description: "Formatos disponíveis: Imagem única (mais usado), Carrossel, Vídeo, Anúncio de texto, Mensagem (InMail patrocinado), Conversação. Para leads B2B, Imagem única com formulário nativo é o mais eficiente.",
      },
      {
        title: "Criar o anúncio",
        description: "Adicione: imagem (1200x627px recomendado), texto introdutório (até 600 caracteres, mas 150 ficam visíveis), título (até 200 caracteres, 70 recomendados), descrição, CTA e URL de destino. Use os copies sugeridos pela IA.",
        tip: "No LinkedIn, copies mais profissionais e com dados/estatísticas performam melhor. Evite linguagem casual demais.",
      },
      {
        title: "Configurar formulário de leads (opcional)",
        description: "Se escolheu 'Geração de leads', crie um Lead Gen Form: defina os campos (nome, email, empresa, cargo — pré-preenchidos pelo LinkedIn), adicione mensagem de agradecimento e link de redirecionamento.",
      },
      {
        title: "Definir orçamento e lance",
        description: "Defina orçamento diário (mínimo ~R$ 50/dia) ou total. Escolha a estratégia de lance: Entrega máxima (recomendado), Lance manual ou Lance de custo-alvo. O CPC no LinkedIn é mais alto (~R$ 15-50), mas leads B2B têm maior valor.",
        tip: "O custo por lead no LinkedIn é mais alto que Meta/Google, mas a qualidade dos leads B2B costuma compensar.",
      },
      {
        title: "Instalar Insight Tag",
        description: "Vá em Analisar > Insight Tag. Copie o código JavaScript e instale no <head> do seu site. Configure conversões (formulário enviado, página de agradecimento). Isso permite rastrear ROI e criar públicos de remarketing.",
      },
      {
        title: "Revisar e lançar",
        description: "Revise segmentação, criativo, orçamento e lance. Clique em 'Lançar campanha'. O LinkedIn revisa em até 24h. Acompanhe: CTR (bom acima de 0,5%), CPL e taxa de preenchimento do formulário.",
      },
    ],
  },
};

export const campaignStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
};

export const campaignStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-500",
  paused: "bg-amber-500/10 text-amber-500",
  completed: "bg-blue-500/10 text-blue-500",
};

