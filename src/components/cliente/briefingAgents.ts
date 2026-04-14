// @ts-nocheck
import type { BriefingStep, BriefingAgent } from "./ChatBriefing";

/* ══════════════════════════════════════════════
   AGENTS
   ══════════════════════════════════════════════ */

export const AGENTS: Record<string, BriefingAgent> = {
  sofia: { name: "Sofia", role: "Consultora de Marketing", avatar: "S", color: "#8b5cf6" },
  rafael: { name: "Rafael", role: "Consultor Comercial", avatar: "R", color: "#0ea5e9" },
  // GPS do Negócio agents (same agents, new context)
  gps_rafael: { name: "Rafael", role: "Especialista Comercial · GPS do Negócio", avatar: "R", color: "#0ea5e9" },
  gps_sofia: { name: "Sofia", role: "Especialista em Marketing · GPS do Negócio", avatar: "S", color: "#8b5cf6" },
  luna: { name: "Luna", role: "Estrategista de Conteúdo", avatar: "L", color: "#f59e0b" },
  theo: { name: "Theo", role: "Diretor de Arte", avatar: "T", color: "#ec4899" },
  alex: { name: "Alex", role: "Arquiteto Web", avatar: "A", color: "#10b981" },
  dani: { name: "Dani", role: "Estrategista de Tráfego", avatar: "D", color: "#f97316" },
};

/* ══════════════════════════════════════════════
   SHARED OPTIONS (reusable across agents)
   ══════════════════════════════════════════════ */

export const SEGMENTO_OPTIONS = [
  { value: "servicos", label: "Serviços" }, { value: "varejo", label: "Varejo / Loja" },
  { value: "alimentacao", label: "Alimentação / Restaurante" }, { value: "saude", label: "Saúde / Clínica" },
  { value: "estetica", label: "Estética / Beleza" }, { value: "educacao", label: "Educação / Cursos" },
  { value: "tecnologia", label: "Tecnologia / SaaS" }, { value: "industria", label: "Indústria" },
  { value: "construcao", label: "Construção / Engenharia" }, { value: "financeiro", label: "Financeiro / Contábil" },
  { value: "advocacia", label: "Advocacia / Jurídico" }, { value: "imobiliario", label: "Imobiliário" },
  { value: "automotivo", label: "Automotivo" }, { value: "agronegocio", label: "Agronegócio" },
  { value: "moda", label: "Moda / Vestuário" }, { value: "fitness", label: "Fitness / Academia" },
  { value: "turismo", label: "Turismo / Hotelaria" }, { value: "logistica", label: "Logística / Transporte" },
  { value: "marketing", label: "Marketing / Publicidade" }, { value: "consultoria", label: "Consultoria" },
  { value: "pet", label: "Pet / Veterinário" }, { value: "eventos", label: "Eventos / Entretenimento" },
  { value: "energia", label: "Energia / Solar" }, { value: "franquias", label: "Franquias" },
  { value: "ecommerce", label: "E-commerce" }, { value: "seguros", label: "Seguros" },
  { value: "odontologia", label: "Odontologia" }, { value: "psicologia", label: "Psicologia / Coaching" },
  { value: "arquitetura", label: "Arquitetura / Design" }, { value: "fotografia", label: "Fotografia / Audiovisual" },
  { value: "outro", label: "Outro (digitar)" },
];

const FAIXA_ETARIA_OPTIONS = [
  { value: "18-24", label: "18-24 anos" }, { value: "25-34", label: "25-34 anos" },
  { value: "35-44", label: "35-44 anos" }, { value: "45-54", label: "45-54 anos" },
  { value: "55+", label: "55+ anos" }, { value: "todas", label: "Todas as idades" },
];

const PERSONA_NOME_OPTIONS = [
  { value: "empreendedor", label: "Empreendedor(a)" }, { value: "gestor", label: "Gestor(a)" },
  { value: "profissional_liberal", label: "Profissional Liberal" }, { value: "dono_loja", label: "Dono(a) de Loja" },
  { value: "estudante", label: "Estudante" }, { value: "executivo", label: "Executivo(a)" },
  { value: "personalizar", label: "Personalizar..." },
];

const PERSONA_DESCRICAO_OPTIONS = [
  { value: "25-34", label: "25-34 anos" }, { value: "35-44", label: "35-44 anos" },
  { value: "45-54", label: "45-54 anos" }, { value: "classe_ab", label: "Classe A/B" },
  { value: "classe_bc", label: "Classe B/C" }, { value: "busca_praticidade", label: "Busca praticidade" },
  { value: "busca_economia", label: "Busca economia" }, { value: "usa_redes", label: "Usa redes sociais" },
  { value: "decide_indicacao", label: "Decide por indicação" }, { value: "pesquisa_muito", label: "Pesquisa muito antes de comprar" },
];

/* ══════════════════════════════════════════════
   SOFIA — Estratégia de Marketing (14 perguntas em 8 blocos)
   ══════════════════════════════════════════════ */

export const SOFIA_STEPS: BriefingStep[] = [
  // ── Intro
  {
    id: "_intro_sofia",
    agentMessage: "Oi! 👋 Sou a **Sofia**, sua consultora de marketing.\n\n🎯 **O que é o Plano de Marketing?**\nÉ o documento estratégico mais importante do seu negócio digital. Ele define quem é seu cliente ideal (ICP), como você se comunica, quais canais priorizar, que tipo de conteúdo criar e como investir para crescer.\n\n🔗 **Para que serve?**\nTudo que você responder aqui vai alimentar TODAS as ferramentas da plataforma — conteúdos, artes, scripts, sites, tráfego pago e muito mais. É a base de inteligência que conecta tudo.\n\n⏱️ Leva cerca de 7 minutos. Vamos lá?",
    inputType: "info",
  },

  // ═══ BLOCO 1 — Negócio ═══

  {
    id: "empresa",
    section: "Negócio",
    agentMessage: "Qual é o nome da sua empresa e o que ela faz?",
    inputType: "textarea",
    placeholder: "Ex: Somos uma clínica odontológica especializada em implantes.",
    helpText: "Uma descrição clara ajuda a IA a direcionar toda a estratégia.",
  },
  {
    id: "produto",
    section: "Negócio",
    agentMessage: "Qual é o principal produto ou serviço que você quer vender agora?",
    inputType: "textarea",
    placeholder: "Ex: Implantes dentários, consultoria empresarial, curso online...",
    helpText: "Focamos a estratégia no produto/serviço com maior potencial de retorno.",
  },
  {
    id: "ticket_medio",
    section: "Negócio",
    agentMessage: "Qual é o ticket médio desse produto ou serviço?",
    inputType: "select",
    options: [
      { value: "0-500", label: "Até R$ 500" },
      { value: "500-2k", label: "R$ 500 a R$ 2.000" },
      { value: "2k-5k", label: "R$ 2.000 a R$ 5.000" },
      { value: "5k-15k", label: "R$ 5.000 a R$ 15.000" },
      { value: "15k+", label: "Mais de R$ 15.000" },
      { value: "personalizar", label: "Outro valor" },
    ],
    helpText: "O ticket médio impacta diretamente nas projeções de receita.",
  },
  {
    id: "segmento",
    section: "Negócio",
    agentMessage: "Qual é o segmento da sua empresa?",
    inputType: "select",
    options: SEGMENTO_OPTIONS,
    helpText: "O segmento influencia benchmarks, concorrência e estratégia.",
  },

  // ═══ BLOCO 2 — Público ═══

  {
    id: "publico",
    section: "Público",
    agentMessage: "Quem é o cliente ideal para esse produto?",
    inputType: "multi-select",
    options: [
      { value: "empresarios", label: "Empresários" },
      { value: "medicos", label: "Médicos / Profissionais de Saúde" },
      { value: "pequenas_empresas", label: "Pequenas empresas" },
      { value: "consumidor_final", label: "Consumidor final" },
      { value: "executivos", label: "Executivos / Gestores" },
      { value: "profissionais_liberais", label: "Profissionais liberais" },
      { value: "maes", label: "Mães / Pais" },
      { value: "jovens", label: "Jovens (18-25)" },
      { value: "investidores", label: "Investidores" },
      { value: "atletas", label: "Atletas / Fitness" },
      { value: "estudantes", label: "Estudantes" },
      { value: "aposentados", label: "Aposentados / 55+" },
      { value: "personalizar", label: "Outro perfil" },
    ],
    helpText: "Quanto mais detalhado, melhor será a segmentação da estratégia.",
  },
  {
    id: "faixa_etaria",
    section: "Público",
    agentMessage: "Qual a faixa etária predominante do seu público?",
    inputType: "multi-select",
    options: FAIXA_ETARIA_OPTIONS,
    helpText: "A faixa etária influencia linguagem, canais e tipo de conteúdo.",
  },
  {
    id: "problema",
    section: "Público",
    agentMessage: "Qual problema esse cliente enfrenta que seu produto resolve?",
    inputType: "textarea",
    placeholder: "Ex: Empresários que não conseguem gerar vendas de forma previsível.",
    helpText: "Entender a dor do cliente é essencial para criar mensagens que convertem.",
  },

  // ═══ BLOCO 3 — Posicionamento ═══

  {
    id: "razao_escolha",
    section: "Posicionamento",
    agentMessage: "Por que um cliente deveria escolher sua empresa e não a concorrência?",
    inputType: "textarea",
    placeholder: "Ex: Preço competitivo, qualidade superior, método próprio, experiência de 10 anos...",
    helpText: "Seu posicionamento será a base de toda a comunicação estratégica.",
  },
  {
    id: "diferencial",
    section: "Posicionamento",
    agentMessage: "Você tem algum diferencial claro no mercado?",
    inputType: "select",
    options: [
      { value: "metodo", label: "Método exclusivo" },
      { value: "atendimento", label: "Atendimento personalizado" },
      { value: "nicho", label: "Especialização em nicho" },
      { value: "tecnologia", label: "Tecnologia / Inovação" },
      { value: "preco", label: "Melhor custo-benefício" },
      { value: "equipe", label: "Equipe qualificada" },
      { value: "resultados", label: "Resultados comprovados" },
      { value: "marca", label: "Marca reconhecida" },
      { value: "personalizar", label: "Outro diferencial" },
    ],
    helpText: "Seu diferencial será usado para posicionar a marca e criar a proposta de valor.",
  },
  {
    id: "resultados_clientes",
    section: "Posicionamento",
    agentMessage: "Quais resultados seus clientes geralmente alcançam com seu produto/serviço?",
    inputType: "textarea",
    placeholder: "Ex: Aumento de 40% nas vendas, emagrecimento de 10kg em 3 meses, economia de 5h por semana...",
    helpText: "Resultados reais são a melhor prova social — serão usados em conteúdos e scripts.",
    optional: true,
  },

  // ═══ BLOCO 4 — Concorrência ═══

  {
    id: "concorrentes_urls",
    section: "Concorrência",
    agentMessage: "Cole os links (site ou Instagram) dos seus 2-3 principais concorrentes. Isso permite uma análise muito mais precisa! 🔍",
    inputType: "textarea",
    placeholder: "Ex:\nhttps://www.concorrente1.com.br\nhttps://instagram.com/concorrente2\nhttps://www.concorrente3.com.br",
    helpText: "Com URLs reais, a IA consegue inferir posicionamento, conteúdo e estratégia dos concorrentes.",
    optional: true,
  },
  {
    id: "concorrente_faz_melhor",
    section: "Concorrência",
    agentMessage: "O que seus concorrentes fazem melhor que você hoje?",
    inputType: "textarea",
    placeholder: "Ex: Têm mais presença digital, investem mais em tráfego, marca mais conhecida...",
    helpText: "Identificar pontos fracos relativos ajuda a criar estratégias de diferenciação.",
    optional: true,
  },

  // ═══ BLOCO 5 — Estrutura atual ═══

  {
    id: "canais_atuais",
    section: "Estrutura Atual",
    agentMessage: "Quais canais você já usa hoje para atrair clientes? Pode marcar vários!",
    inputType: "multi-select",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "site", label: "Site" },
      { value: "trafego_pago", label: "Tráfego pago" },
      { value: "indicacao", label: "Indicação" },
      { value: "youtube", label: "YouTube" },
      { value: "tiktok", label: "TikTok" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "whatsapp", label: "WhatsApp" },
    ],
    helpText: "Saber os canais atuais ajuda a identificar oportunidades.",
  },
  {
    id: "investe_anuncios",
    section: "Estrutura Atual",
    agentMessage: "Você já investe em anúncios pagos? Se sim, quanto por mês?",
    inputType: "select",
    options: [
      { value: "nao", label: "Não invisto" },
      { value: "0-500", label: "Sim, até R$ 500/mês" },
      { value: "500-2k", label: "Sim, R$ 500 a R$ 2.000/mês" },
      { value: "2k-5k", label: "Sim, R$ 2.000 a R$ 5.000/mês" },
      { value: "5k+", label: "Sim, mais de R$ 5.000/mês" },
    ],
    helpText: "Entender seu investimento atual em anúncios ajuda a dimensionar a estratégia.",
  },
  {
    id: "frequencia_conteudo",
    section: "Estrutura Atual",
    agentMessage: "Com que frequência você publica conteúdo nas redes sociais?",
    inputType: "select",
    options: [
      { value: "nunca", label: "Não publico" },
      { value: "esporadico", label: "Esporadicamente" },
      { value: "1-2_semana", label: "1-2x por semana" },
      { value: "3-5_semana", label: "3-5x por semana" },
      { value: "diario", label: "Diariamente" },
    ],
    helpText: "Frequência atual ajuda a calibrar o calendário editorial.",
  },

  // ═══ BLOCO 6 — Objetivo ═══

  {
    id: "objetivo",
    section: "Objetivo",
    agentMessage: "Qual é seu principal objetivo de marketing neste momento?",
    inputType: "select",
    options: [
      { value: "gerar_leads", label: "Gerar leads" },
      { value: "aumentar_vendas", label: "Aumentar vendas" },
      { value: "captar_premium", label: "Captar clientes premium" },
      { value: "captar_franqueados", label: "Captar franqueados" },
      { value: "aumentar_autoridade", label: "Aumentar autoridade" },
      { value: "lancar_produto", label: "Lançar produto/serviço" },
      { value: "fidelizar", label: "Fidelizar clientes" },
      { value: "expandir_territorio", label: "Expandir território" },
      { value: "aumentar_ticket", label: "Aumentar ticket médio" },
      { value: "novo_mercado", label: "Entrar em novo mercado" },
    ],
    helpText: "O objetivo define toda a direção da estratégia.",
  },
  {
    id: "meta",
    section: "Objetivo",
    agentMessage: "Qual meta de faturamento ou crescimento você gostaria de atingir?",
    inputType: "textarea",
    placeholder: "Ex: Quero dobrar o faturamento em 12 meses, conseguir 50 novos clientes por mês...",
    helpText: "Metas concretas permitem criar projeções realistas.",
  },

  // ═══ BLOCO 7 — Comunicação ═══

  {
    id: "tom_comunicacao",
    section: "Comunicação",
    agentMessage: "Qual tom de comunicação combina mais com sua marca?",
    inputType: "multi-select",
    options: [
      { value: "profissional", label: "Profissional / Formal" },
      { value: "acessivel", label: "Acessível / Amigável" },
      { value: "provocativo", label: "Provocativo / Direto" },
      { value: "educativo", label: "Educativo / Didático" },
      { value: "inspirador", label: "Inspirador / Motivacional" },
      { value: "humoristico", label: "Humorístico / Descontraído" },
      { value: "tecnico", label: "Técnico / Especialista" },
      { value: "premium", label: "Premium / Sofisticado" },
      { value: "urgente", label: "Urgente / Escassez" },
      { value: "empatico", label: "Empático / Acolhedor" },
    ],
    helpText: "O tom de voz será aplicado em todos os conteúdos, scripts e comunicações.",
  },
  {
    id: "nao_quero_comunicacao",
    section: "Comunicação",
    agentMessage: "O que você NÃO quer na sua comunicação? Tem algo que você considera inadequado ou que não combina com sua marca?",
    inputType: "textarea",
    placeholder: "Ex: Não quero parecer arrogante, não usar gírias, evitar promessas exageradas, nada de memes...",
    helpText: "Definir limites ajuda a IA a respeitar a identidade da sua marca.",
    optional: true,
  },
  {
    id: "marcas_referencia",
    section: "Comunicação",
    agentMessage: "Existe alguma marca que você admira e gostaria de se parecer? Pode ser do seu segmento ou não.",
    inputType: "textarea",
    placeholder: "Ex: Apple pela simplicidade, Nubank pela comunicação, Nike pela energia...",
    helpText: "Referências ajudam a IA a entender a estética e posicionamento desejados.",
    optional: true,
  },

  // ═══ BLOCO 8 — Presença digital ═══

  {
    id: "links_digitais",
    section: "Presença Digital",
    agentMessage: "Se tiver, compartilhe os links do seu site, Instagram ou landing page. Isso ajuda a IA a analisar sua presença digital! 😊",
    inputType: "textarea",
    placeholder: "Site: https://...\nInstagram: @...\nLanding page: https://...",
    helpText: "Links permitem que a IA entenda o contexto visual e de comunicação.",
    optional: true,
  },

  // ═══ BLOCO 9 — Sazonalidade (NOVO) ═══

  {
    id: "sazonalidade",
    section: "Sazonalidade",
    agentMessage: "Seu negócio tem sazonalidade? Alguns meses vendem mais que outros?",
    inputType: "select",
    options: [
      { value: "nao", label: "Não, é estável o ano todo" },
      { value: "inicio_ano", label: "Sim, vende mais no início do ano" },
      { value: "meio_ano", label: "Sim, vende mais no meio do ano" },
      { value: "fim_ano", label: "Sim, vende mais no fim do ano" },
      { value: "verao", label: "Sim, no verão" },
      { value: "inverno", label: "Sim, no inverno" },
      { value: "personalizar", label: "Outro padrão" },
    ],
    helpText: "Sazonalidade influencia o calendário editorial e investimento em tráfego.",
  },

  // ═══ BLOCO 10 — Região e Orçamento ═══

  {
    id: "regiao",
    section: "Região e Orçamento",
    agentMessage: "Onde sua empresa atua? Informe cidade, estado ou país.",
    inputType: "text",
    placeholder: "Ex: São Paulo - SP, Brasil inteiro, América Latina...",
    helpText: "A região de atuação influencia a segmentação de campanhas.",
  },
  {
    id: "orcamento",
    section: "Região e Orçamento",
    agentMessage: "Quanto você pretende investir em marketing por mês?",
    inputType: "select",
    options: [
      { value: "0-1k", label: "Até R$ 1.000" },
      { value: "1k-3k", label: "R$ 1.000 a R$ 3.000" },
      { value: "3k-5k", label: "R$ 3.000 a R$ 5.000" },
      { value: "5k-10k", label: "R$ 5.000 a R$ 10.000" },
      { value: "10k-20k", label: "R$ 10.000 a R$ 20.000" },
      { value: "20k+", label: "Mais de R$ 20.000" },
    ],
    helpText: "O orçamento ajuda a dimensionar campanhas e projeções de resultado.",
  },
];

/* ══════════════════════════════════════════════
   RAFAEL — Plano de Vendas (~25 questions, 8 sections)
   Com intro conversacional + perguntas abertas estratégicas
   ══════════════════════════════════════════════ */

export const RAFAEL_STEPS: BriefingStep[] = [
  // ── Intro
  { id: "_intro_rafael", agentMessage: "Oi! 👋 Eu sou o **Rafael**, seu consultor comercial.\n\n🎯 **O que é o Plano de Vendas?**\nÉ um diagnóstico completo da maturidade do seu comercial — analisa processos, equipe, ferramentas, canais e performance.\n\n🔗 **Para que serve?**\nCom base nas suas respostas, vou gerar um diagnóstico com score, insights personalizados, plano de ação em 3 fases e projeções de crescimento. Além disso, vou criar automaticamente seu funil de CRM e scripts de vendas.\n\n📊 Seu plano fica salvo no histórico e você pode refazer quantas vezes quiser para acompanhar sua evolução.\n\n⏱️ Leva cerca de 5 minutos. Bora lá? 😎🚀", inputType: "info" },

  // ── 1. Sobre o Negócio (4 perguntas)
  { id: "segmento", section: "Sobre o Negócio", agentMessage: "Qual é o segmento da sua empresa?", inputType: "select", helpText: "Identifique o setor principal de atuação para personalizar as recomendações.",
    options: SEGMENTO_OPTIONS,
  },
  { id: "modelo_negocio", section: "Sobre o Negócio", agentMessage: "Modelo de negócio: B2B, B2C ou ambos?", inputType: "select", helpText: "Saber se vende para empresas ou consumidor final muda toda a estratégia de abordagem.",
    options: [
      { value: "b2b", label: "B2B (empresas)" }, { value: "b2c", label: "B2C (consumidor final)" },
      { value: "ambos", label: "Ambos" },
    ],
  },
  { id: "produtos_servicos", section: "Sobre o Negócio", agentMessage: "Me conta quais são seus principais produtos ou serviços? Pode listar à vontade! 📝", inputType: "textarea", helpText: "Quanto mais detalhes, melhor personalizamos seu plano comercial e scripts de vendas.",
    placeholder: "Ex: Consultoria em gestão, treinamentos corporativos, mentoria individual...",
  },
  { id: "diferenciais", section: "Sobre o Negócio", agentMessage: "E o que te diferencia da concorrência? O que faz o cliente escolher VOCÊ? 💪", inputType: "textarea", helpText: "Seu diferencial será usado nos scripts de vendas, conteúdos e abordagem comercial.",
    placeholder: "Ex: Atendimento 24h, entrega em 2h, garantia vitalícia, 15 anos de experiência...",
  },

  // ── 2. Financeiro Comercial (4 perguntas, ciclo_recompra condicional)
  { id: "faturamento", section: "Financeiro Comercial", agentMessage: "Qual o faturamento mensal aproximado?", inputType: "select", helpText: "Usado para calcular projeções de crescimento.",
    options: [
      { value: "0-10k", label: "Até R$ 10 mil" }, { value: "10-30k", label: "R$ 10-30 mil" },
      { value: "30-100k", label: "R$ 30-100 mil" }, { value: "100-300k", label: "R$ 100-300 mil" },
      { value: "300k+", label: "R$ 300 mil+" },
    ],
  },
  { id: "ticket_medio", section: "Financeiro Comercial", agentMessage: "E o ticket médio?", inputType: "select", helpText: "O ticket médio impacta na quantidade de vendas necessárias.",
    options: [
      { value: "0-200", label: "Até R$ 200" }, { value: "200-1k", label: "R$ 200-1 mil" },
      { value: "1-5k", label: "R$ 1-5 mil" }, { value: "5-15k", label: "R$ 5-15 mil" },
      { value: "15k+", label: "R$ 15 mil+" },
    ],
  },
  { id: "meta_faturamento", section: "Financeiro Comercial", agentMessage: "Qual a meta de faturamento mensal?", inputType: "select", helpText: "Sua meta ideal de receita. Usamos para projetar o funil reverso.",
    options: [
      { value: "0-20k", label: "Até R$ 20 mil" }, { value: "20-50k", label: "R$ 20-50 mil" },
      { value: "50-150k", label: "R$ 50-150 mil" }, { value: "150-500k", label: "R$ 150-500 mil" },
      { value: "500k+", label: "R$ 500 mil+" },
    ],
  },
  { id: "tem_recorrencia", section: "Financeiro Comercial", agentMessage: "Você tem clientes que compram mais de uma vez? 🔄", inputType: "select", helpText: "Recorrência é a base de um negócio previsível e escalável.",
    options: [
      { value: "sim", label: "Sim, boa parte volta" }, { value: "parcialmente", label: "Parcialmente" },
      { value: "nao", label: "Não, sempre clientes novos" },
    ],
  },
  { id: "ciclo_recompra", section: "Financeiro Comercial", agentMessage: "Qual o ciclo médio de recompra dos seus clientes? 🔁", inputType: "textarea", helpText: "Entender seu ciclo de recompra ajuda a projetar receita recorrente e estratégias de retenção.",
    placeholder: "Ex: Clientes voltam a cada 3 meses para manutenção...",
    skipIf: (ans) => ans.tem_recorrencia === "nao",
  },

  // ── 3. Equipe e Estrutura (3 perguntas — removido processo_documentado)
  { id: "tamanho_equipe", section: "Equipe e Estrutura", agentMessage: "Qual o tamanho da equipe comercial?", inputType: "select", helpText: "Quantas pessoas estão envolvidas em vendas e prospecção.",
    options: [
      { value: "1", label: "Só eu" }, { value: "2-3", label: "2-3 pessoas" },
      { value: "4-7", label: "4-7 pessoas" }, { value: "8-15", label: "8-15 pessoas" },
      { value: "16+", label: "16+" },
    ],
  },
  { id: "funcoes_equipe", section: "Equipe e Estrutura", agentMessage: "Quais funções existem na equipe?", inputType: "multi-select", helpText: "Equipes com funções definidas têm maior previsibilidade.",
    options: [
      { value: "sdr", label: "SDR / Pré-vendas" }, { value: "closer", label: "Closer / Vendedor" },
      { value: "cs", label: "CS / Pós-venda" }, { value: "gestor", label: "Gestor Comercial" },
      { value: "nenhuma", label: "Nenhuma definida" },
    ],
  },
  { id: "tempo_fechamento", section: "Equipe e Estrutura", agentMessage: "Tempo médio pra fechar uma venda?", inputType: "select", helpText: "Ciclos mais longos exigem automação e cadências de follow-up robustas.",
    options: [
      { value: "mesmo_dia", label: "No mesmo dia" }, { value: "1-7", label: "1 a 7 dias" },
      { value: "1-4sem", label: "1 a 4 semanas" }, { value: "1-3m", label: "1 a 3 meses" },
      { value: "3m+", label: "Mais de 3 meses" },
    ],
  },

  // ── 4. Gestão de Leads (3 perguntas — removido qtd_leads_mes)
  { id: "usa_crm", section: "Gestão de Leads", agentMessage: "Usa algum CRM atualmente?", inputType: "select", helpText: "CRM centraliza informações e evita perda de oportunidades.",
    options: [
      { value: "nao", label: "Não uso nada" }, { value: "planilha", label: "Planilha / anotações" },
      { value: "crm_basico", label: "CRM básico" }, { value: "crm_pro", label: "CRM profissional" },
    ],
  },
  { id: "followup", section: "Gestão de Leads", agentMessage: "Tem follow-up estruturado?", inputType: "select", helpText: "80% das vendas precisam de 5+ follow-ups para fechar.",
    options: [
      { value: "nao", label: "Não faço follow-up" }, { value: "eventual", label: "Faço quando lembro" },
      { value: "cadencia", label: "Sim, com cadência definida" }, { value: "auto", label: "Sim, automatizado" },
    ],
  },
  { id: "dor_principal", section: "Gestão de Leads", agentMessage: "Qual a maior dor ou necessidade do seu cliente ideal? O que faz ele procurar uma solução como a sua? 🎯", inputType: "textarea", helpText: "Entender a dor do cliente é essencial para criar scripts e conteúdos que convertem.",
    placeholder: "Ex: Perdem muito tempo com processos manuais, não conseguem escalar vendas...",
  },

  // ── 4b. Concorrência (para análise real)
  { id: "concorrentes_vendas_urls", section: "Concorrência Comercial", agentMessage: "Conhece seus principais concorrentes? Cole os links (site ou redes sociais) de 2-3 concorrentes para eu analisar o posicionamento deles! 🔍", inputType: "textarea", helpText: "Com URLs reais, consigo inferir o posicionamento comercial, preços e diferenciais dos concorrentes.",
    placeholder: "Ex:\nhttps://www.concorrente1.com.br\nhttps://instagram.com/concorrente2\nhttps://www.concorrente3.com.br",
    optional: true,
  },
  { id: "concorrente_vantagem", section: "Concorrência Comercial", agentMessage: "O que seus concorrentes fazem melhor que você na parte comercial?", inputType: "textarea", helpText: "Identificar pontos fortes dos concorrentes ajuda a definir estratégias de diferenciação.",
    placeholder: "Ex: Respondem leads mais rápido, têm equipe maior, investem mais em tráfego...",
    optional: true,
  },

  // ── 5. Canais e Prospecção (2 perguntas — removido mede_roi)
  { id: "canais_aquisicao", section: "Canais e Prospecção", agentMessage: "Quais canais de aquisição você usa?", inputType: "multi-select", helpText: "Diversificar canais reduz o risco.",
    options: [
      { value: "google", label: "Google Ads" }, { value: "instagram", label: "Instagram" },
      { value: "facebook", label: "Facebook" }, { value: "linkedin", label: "LinkedIn" },
      { value: "indicacao", label: "Indicação" }, { value: "whatsapp", label: "WhatsApp" },
      { value: "cold_call", label: "Cold Call" }, { value: "cold_email", label: "Cold Email" },
      { value: "eventos", label: "Eventos" }, { value: "parcerias", label: "Parcerias" },
    ],
  },
  { id: "canal_principal", section: "Canais e Prospecção", agentMessage: "Qual canal mais gera resultados?", inputType: "select", helpText: "Saber o canal mais eficiente ajuda a alocar orçamento de forma inteligente.",
    options: [
      { value: "indicacao", label: "Indicação" }, { value: "trafego", label: "Tráfego pago" },
      { value: "prospeccao", label: "Prospecção ativa" }, { value: "organico", label: "Redes sociais orgânico" },
      { value: "nao_sei", label: "Não sei" },
    ],
  },

  // ── 6. Processo de Vendas (1 pergunta — scripts e reunião são da plataforma)
  { id: "etapas_funil", section: "Processo de Vendas", agentMessage: "Descreva as etapas do seu processo de vendas, da prospecção ao fechamento. Pode ser como quiser! 🎯", inputType: "textarea", helpText: "Um funil bem definido permite identificar gargalos. Vamos criar seu funil automaticamente a partir dessas etapas!",
    placeholder: "Ex: Prospecção → Qualificação → Reunião → Proposta → Negociação → Fechamento",
  },

  // ── 7. Metas e Performance (2 perguntas + 2 condicionais por segmento)
  { id: "metas_historicas", section: "Metas e Performance", agentMessage: "Suas metas são baseadas em dados históricos?", inputType: "select", helpText: "Metas baseadas em dados evitam frustração e permitem projeções realistas.",
    options: [
      { value: "nao", label: "Não tenho metas" }, { value: "achismo", label: "Metas por achismo" },
      { value: "historico", label: "Baseadas em histórico" }, { value: "projecoes", label: "Com projeções e cenários" },
    ],
  },
  { id: "conversao_etapa", section: "Metas e Performance", agentMessage: "Pra finalizar: acompanha taxa de conversão por etapa do funil?", inputType: "select", helpText: "Conversão por etapa revela onde os leads estão sendo perdidos.",
    options: [
      { value: "nao", label: "Não acompanho" }, { value: "geral", label: "Apenas conversão geral" },
      { value: "por_etapa", label: "Sim, por etapa" },
    ],
  },

  // Condicionais por segmento
  { id: "saude_convenios", section: "Metas e Performance", agentMessage: "Trabalha com convênios ou planos de saúde?", inputType: "select", helpText: "Convênios impactam o ticket médio e o ciclo de pagamento.",
    options: [
      { value: "nao", label: "Não" }, { value: "alguns", label: "Alguns convênios" },
      { value: "principal", label: "Sim, é a principal receita" },
    ],
    skipIf: (ans) => ans.segmento !== "saude",
  },
  { id: "varejo_ecommerce", section: "Metas e Performance", agentMessage: "Vende online (e-commerce) além da loja física?", inputType: "select", helpText: "O canal online abre novas oportunidades de escala.",
    options: [
      { value: "nao", label: "Apenas físico" }, { value: "marketplace", label: "Sim, marketplace" },
      { value: "loja_propria", label: "Sim, loja própria online" }, { value: "ambos", label: "Marketplace + loja própria" },
    ],
    skipIf: (ans) => ans.segmento !== "varejo",
  },
];

/* LUNA_STEPS removido — Geração de conteúdo agora usa stepper visual em ClienteConteudos.tsx */

const MESES_OPT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
].map(m => ({ value: `${m} 2026`, label: `${m} 2026` }));

/* ══════════════════════════════════════════════
   THEO — Artes / Redes Sociais (perguntas fechadas + limites)
   ══════════════════════════════════════════════ */

const TIPOS_POST_OPT = [
  { value: "produto", label: "Produto" }, { value: "servico", label: "Serviço" },
  { value: "promocao", label: "Promoção" }, { value: "institucional", label: "Institucional" },
  { value: "educativo", label: "Educativo" }, { value: "depoimento", label: "Depoimento" },
];

const NIVEIS_OPT = [
  { value: "simples", label: "Simples", desc: "Clean e profissional" },
  { value: "elaborado", label: "Elaborado", desc: "Composição forte e vibrante" },
  { value: "alto_padrao", label: "Alto Padrão", desc: "Ultra-premium, qualidade de revista" },
];

const OBJETIVOS_ART = ["Promoção", "Engajamento", "Institucional", "Lançamento", "Depoimento"].map(o => ({ value: o, label: o }));
const ESTILOS_ART = ["Minimalista", "Bold", "Corporativo", "Criativo", "Elegante"].map(e => ({ value: e, label: e }));

const TEMAS_VISUAIS = [
  { value: "tecnologia", label: "Tecnologia" }, { value: "crescimento", label: "Crescimento" },
  { value: "natureza", label: "Natureza" }, { value: "luxo", label: "Luxo" },
  { value: "urbano", label: "Urbano" }, { value: "abstrato", label: "Abstrato" },
  { value: "pessoas", label: "Pessoas" }, { value: "minimalismo", label: "Minimalismo" },
];

const OBS_INSTRUCOES = [
  { value: "incluir_logo", label: "Incluir logo" }, { value: "cores_marca", label: "Usar cores da marca" },
  { value: "texto_grande", label: "Texto grande" }, { value: "sem_texto", label: "Sem texto na imagem" },
  { value: "qr_code", label: "Incluir QR Code" },
];

const DESCRICAO_PRODUTO_OPTIONS = [
  { value: "premium", label: "Premium / Luxo" }, { value: "acessivel", label: "Acessível / Popular" },
  { value: "tecnologico", label: "Tecnológico" }, { value: "artesanal", label: "Artesanal" },
  { value: "natural", label: "Natural / Orgânico" }, { value: "minimalista", label: "Minimalista" },
];

// THEO_STEPS removed — Postagens tool now uses step-based UI instead of chat briefing
export const THEO_STEPS: BriefingStep[] = [];

/* ══════════════════════════════════════════════
   ALEX — Sites (perguntas condicionais + fechadas)
   ══════════════════════════════════════════════ */

/* ALEX_STEPS removed — site generation now uses visual wizard in ClienteSites.tsx */

/* ══════════════════════════════════════════════
   DANI — Tráfego Pago (mini-chat, ~3 steps)
   ══════════════════════════════════════════════ */

export const DANI_STEPS: BriefingStep[] = [
  { id: "_intro_dani", agentMessage: "Oi! 👋 Sou a Dani, sua estrategista de tráfego pago. Vou criar uma estratégia completa de campanhas baseada no seu marketing e vendas!", inputType: "info" },
  { id: "confirmacao", agentMessage: "Vi que você já tem uma Estratégia de Marketing ativa. Vou usar esses dados para criar sua estratégia de tráfego. Posso prosseguir?", inputType: "select",
    options: [
      { value: "sim", label: "Sim, vamos lá!" }, { value: "ajustar", label: "Quero ajustar algo antes" },
    ],
  },
];

/* ══════════════════════════════════════════════
   HELPERS — Dynamic options for plan limits
   ══════════════════════════════════════════════ */

function makeQtyOptions(maxQty: number): { value: string; label: string }[] {
  const safeMax = Math.max(0, Math.min(maxQty, 20));
  return Array.from({ length: safeMax + 1 }, (_, i) => ({ value: String(i), label: String(i) }));
}

function computeContentSaldo(ctx: Record<string, any>, ans: Record<string, any>, otherKeys: string[]): number {
  const max = ctx.maxContents ?? 999;
  const used = ctx.usedContents ?? 0;
  const otherTotal = otherKeys.reduce((sum, k) => sum + (parseInt(ans[k]) || 0), 0);
  return Math.max(0, max - used - otherTotal);
}

function computeArtSaldo(ctx: Record<string, any>, ans: Record<string, any>, otherKeys: string[]): number {
  const max = ctx.maxArts ?? 999;
  const used = ctx.usedArts ?? 0;
  const otherTotal = otherKeys.reduce((sum, k) => sum + (parseInt(ans[k]) || 0), 0);
  return Math.max(0, max - used - otherTotal);
}

/* ══════════════════════════════════════════════
   GPS DO NEGÓCIO — RAFAEL (Fase Comercial, ~15 perguntas)
   ══════════════════════════════════════════════ */

export const GPS_RAFAEL_STEPS: BriefingStep[] = [

  {
    id: "_intro_gps_rafael",
    agentMessage: "Oi! 👋 Eu sou o **Rafael**, especialista comercial do GPS do Negócio.\n\nVou te fazer algumas perguntas sobre seu negócio. Não precisa ter todos os números na ponta da língua — **estimativas já nos ajudam muito**.\n\nSuas respostas vão alimentar toda a inteligência da plataforma: CRM, scripts, agentes de IA, relatórios e muito mais. Quanto mais honesto você for, mais preciso será o seu diagnóstico.\n\nVamos lá? 🚀",
    inputType: "info",
  },

  { id: "tempo_mercado", section: "Sobre o Negócio", agentMessage: "Primeiro: há quanto tempo sua empresa está no mercado?", inputType: "select", helpText: "Isso nos ajuda a calibrar as recomendações para o momento real do seu negócio.", options: [ { value: "menos_1ano", label: "Menos de 1 ano" }, { value: "1_3anos", label: "1 a 3 anos" }, { value: "3_7anos", label: "3 a 7 anos" }, { value: "mais_7anos", label: "Mais de 7 anos" } ] },

  { id: "controle_leads", section: "Sobre o Negócio", agentMessage: "Como você controla seus clientes e oportunidades hoje?\n\n💡 _Sem julgamentos — queremos entender o ponto de partida para te ajudar da forma certa._", inputType: "select", helpText: "Isso classifica o nível de maturidade do seu negócio para personalizar todo o diagnóstico.", options: [ { value: "nada", label: "Não controlo, está na minha cabeça" }, { value: "whatsapp", label: "Pelo WhatsApp / conversas" }, { value: "planilha", label: "Planilha ou caderno" }, { value: "crm_basico", label: "CRM básico" }, { value: "crm_pro", label: "CRM profissional com processos definidos" } ] },

  { id: "empresa", section: "Negócio", agentMessage: "Me conta: qual o nome da sua empresa e o que ela faz?\n\n💡 _Pode ser simples — tipo: 'Sou advogada especializada em direito de família' ou 'Tenho uma clínica odontológica'._", inputType: "textarea", placeholder: "Ex: Studio Fit — academia de musculação com foco em resultados para mulheres acima de 35 anos.", helpText: "Uma descrição clara ajuda a IA a personalizar toda a estratégia para o SEU negócio." },

  { id: "produto", section: "Negócio", agentMessage: "Qual é o principal produto ou serviço que você quer vender agora?\n\n💡 _Se tiver vários, escolha o que tem maior potencial ou que você quer priorizar._", inputType: "textarea", placeholder: "Ex: Plano mensal de treino personalizado. Ex: Consultoria jurídica para divórcio.", helpText: "Vamos construir toda a estratégia em torno desse produto/serviço principal." },

  { id: "segmento", section: "Negócio", agentMessage: "Qual é o segmento da sua empresa?", inputType: "select", options: SEGMENTO_OPTIONS, helpText: "O segmento nos dá benchmarks do mercado e ajuda a comparar com a concorrência." },

  { id: "modelo_negocio", section: "Negócio", agentMessage: "Você vende para empresas, para pessoas físicas ou para os dois?\n\n💡 _B2B = vende para empresas. B2C = vende para consumidor final._", inputType: "select", helpText: "Isso muda completamente a estratégia de abordagem, linguagem e canais.", options: [ { value: "b2b", label: "B2B — vendo para empresas" }, { value: "b2c", label: "B2C — vendo para pessoas físicas" }, { value: "ambos", label: "Os dois" } ] },

  { id: "diferenciais", section: "Negócio", agentMessage: "O que faz um cliente escolher VOCÊ e não a concorrência? 💪\n\n💡 _Pode ser atendimento, resultado, preço, método, localização, especialização — qualquer coisa que te destaque._", inputType: "textarea", placeholder: "Ex: Atendimento 24h pelo WhatsApp. 15 anos de experiência. Única clínica da cidade com equipamento X.", helpText: "Seu diferencial vai aparecer nos scripts, conteúdos e em toda a comunicação gerada pela IA." },

  { id: "ticket_medio", section: "Financeiro", agentMessage: "Qual o valor médio que um cliente paga por compra?\n\n💡 _Não sabe exatamente? Tudo bem — é só uma estimativa. Se vender um plano de R$500/mês, o ticket é R$500._", inputType: "select", helpText: "Ticket médio = valor médio por venda. Isso impacta nas projeções de receita e na estratégia de aquisição.", options: [ { value: "0-500", label: "Até R$ 500" }, { value: "500-2k", label: "R$ 500 a R$ 2.000" }, { value: "2k-5k", label: "R$ 2.000 a R$ 5.000" }, { value: "5k-15k", label: "R$ 5.000 a R$ 15.000" }, { value: "15k+", label: "Mais de R$ 15.000" } ] },

  { id: "faturamento", section: "Financeiro", agentMessage: "Quanto sua empresa fatura por mês, em média?\n\n💡 _Se estiver começando e ainda não tiver histórico, selecione a faixa mais próxima do que espera faturar neste mês._", inputType: "select", helpText: "Faturamento atual é nosso ponto de partida para calcular metas realistas de crescimento.", options: [ { value: "0-10k", label: "Até R$ 10 mil" }, { value: "10-30k", label: "R$ 10 a R$ 30 mil" }, { value: "30-100k", label: "R$ 30 a R$ 100 mil" }, { value: "100-300k", label: "R$ 100 a R$ 300 mil" }, { value: "300k+", label: "Mais de R$ 300 mil" } ] },

  { id: "meta_faturamento", section: "Financeiro", agentMessage: "Qual seria o faturamento ideal para você nos próximos 6 meses?\n\n💡 _Pense num número que te animaria, mas que seja possível. Vamos usar isso para montar seu funil reverso._", inputType: "select", helpText: "Funil reverso = calculamos quantos leads você precisa gerar para chegar nessa meta.", options: [ { value: "0-20k", label: "Até R$ 20 mil" }, { value: "20-50k", label: "R$ 20 a R$ 50 mil" }, { value: "50-150k", label: "R$ 50 a R$ 150 mil" }, { value: "150-500k", label: "R$ 150 a R$ 500 mil" }, { value: "500k+", label: "Mais de R$ 500 mil" } ] },

  { id: "tem_recorrencia", section: "Financeiro", agentMessage: "Seus clientes costumam comprar mais de uma vez? 🔄", inputType: "select", helpText: "Recorrência é o que torna um negócio previsível. Se você ainda não tem, vamos trabalhar isso.", options: [ { value: "sim", label: "Sim, a maioria volta" }, { value: "parcialmente", label: "Alguns voltam, outros não" }, { value: "nao", label: "Não, sempre são clientes novos" } ] },

  { id: "tamanho_equipe", section: "Equipe Comercial", agentMessage: "Quantas pessoas estão envolvidas em vendas na sua empresa?\n\n💡 _Inclui você mesmo se for o único vendedor._", inputType: "select", helpText: "O tamanho da equipe define quais ferramentas e automações fazem mais sentido para você.", options: [ { value: "1", label: "Só eu" }, { value: "2-3", label: "2 a 3 pessoas" }, { value: "4-7", label: "4 a 7 pessoas" }, { value: "8-15", label: "8 a 15 pessoas" }, { value: "16+", label: "Mais de 15 pessoas" } ] },

  { id: "funcoes_equipe", section: "Equipe Comercial", agentMessage: "Quais funções existem na equipe de vendas? Pode marcar mais de uma.\n\n💡 _SDR = quem prospecta e qualifica. Closer = quem fecha a venda. CS = quem cuida do cliente depois._", inputType: "multi-select", helpText: "Funções bem definidas aumentam a previsibilidade e os resultados do time.", options: [ { value: "nenhuma", label: "Nenhuma definida — faço tudo" }, { value: "sdr", label: "SDR / Pré-vendas (prospecção)" }, { value: "closer", label: "Closer / Vendedor (fechamento)" }, { value: "cs", label: "CS / Pós-venda (retenção)" }, { value: "gestor", label: "Gestor Comercial" } ] },

  { id: "tempo_fechamento", section: "Equipe Comercial", agentMessage: "Desde o primeiro contato até fechar a venda, quanto tempo leva em média?", inputType: "select", helpText: "Ciclos mais longos precisam de automações de follow-up. Ciclos curtos pedem abordagem mais direta.", options: [ { value: "mesmo_dia", label: "No mesmo dia" }, { value: "1-7", label: "1 a 7 dias" }, { value: "1-4sem", label: "1 a 4 semanas" }, { value: "1-3m", label: "1 a 3 meses" }, { value: "3m+", label: "Mais de 3 meses" } ] },

  { id: "volume_leads", section: "Gestão de Leads", agentMessage: "Quantas pessoas demonstram interesse no seu produto por mês?\n\n💡 _Não precisa ser exato — pode estimar. Se não tiver ideia, pense: quantas mensagens, ligações ou pedidos de orçamento chegam por semana?_", inputType: "select", helpText: "Volume de leads + ticket médio = calculamos sua taxa de conversão atual e o que precisa melhorar.", options: [ { value: "0-10", label: "Menos de 10 por mês" }, { value: "10-30", label: "10 a 30 por mês" }, { value: "30-100", label: "30 a 100 por mês" }, { value: "100-300", label: "100 a 300 por mês" }, { value: "300+", label: "Mais de 300 por mês" } ] },

  { id: "followup", section: "Gestão de Leads", agentMessage: "Quando um cliente demonstra interesse mas não fecha na hora, o que você faz?\n\n💡 _Follow-up = entrar em contato novamente para continuar a conversa._", inputType: "select", helpText: "80% das vendas acontecem após o 5º contato. A maioria das empresas desiste no 1º.", options: [ { value: "nao", label: "Não faço nada, espero ele me chamar" }, { value: "eventual", label: "Entro em contato quando lembro" }, { value: "cadencia", label: "Tenho uma sequência definida de contatos" }, { value: "auto", label: "Está automatizado" } ] },

  { id: "maior_perda", section: "Gestão de Leads", agentMessage: "Onde você sente que perde mais clientes no processo de vendas?\n\n💡 _Pense no caminho desde o primeiro contato até fechar. Em qual momento mais pessoas 'somem' ou dizem não?_", inputType: "select", helpText: "Identificar onde está o gargalo é o primeiro passo para aumentar a conversão.", options: [ { value: "primeiro_contato", label: "No primeiro contato — não respondem" }, { value: "apresentacao", label: "Na apresentação / reunião" }, { value: "proposta", label: "Depois de enviar a proposta" }, { value: "negociacao", label: "Na negociação de preço" }, { value: "nao_sei", label: "Não sei identificar" } ] },

  { id: "dor_principal", section: "Gestão de Leads", agentMessage: "Qual é o maior problema que seu cliente resolve ao contratar você?\n\n💡 _Pense no que o seu cliente fala ANTES de te contratar. Qual é a dor, o medo ou o desejo que o fez te procurar?_", inputType: "textarea", placeholder: "Ex: Meus clientes chegam perdendo dinheiro porque não controlam o estoque.", helpText: "A dor do cliente é o coração dos seus scripts, conteúdos e abordagem comercial." },

  { id: "objecoes", section: "Gestão de Leads", agentMessage: "Quais são as principais objeções que você ouve antes de fechar uma venda?\n\n💡 _Objeção = o motivo que o cliente dá para não comprar. 'Está caro', 'vou pensar', 'não tenho tempo'..._", inputType: "textarea", placeholder: "Ex: 'Está caro', 'preciso falar com meu sócio', 'vou esperar o mês que vem'...", helpText: "Conhecer as objeções permite criar scripts que as antecipam e respondem antes do cliente falar." },

  { id: "canais_aquisicao", section: "Canais", agentMessage: "Quais canais você usa hoje para atrair clientes? Pode marcar vários.", inputType: "multi-select", helpText: "Canais de aquisição = de onde vêm seus clientes. Isso define onde devemos investir energia.", options: [ { value: "indicacao", label: "Indicação de clientes" }, { value: "instagram", label: "Instagram" }, { value: "whatsapp", label: "WhatsApp" }, { value: "google", label: "Google Ads" }, { value: "facebook", label: "Facebook" }, { value: "linkedin", label: "LinkedIn" }, { value: "tiktok", label: "TikTok" }, { value: "cold_call", label: "Ligação fria / Prospecção ativa" }, { value: "eventos", label: "Eventos / Feiras" }, { value: "parcerias", label: "Parcerias" }, { value: "nenhum", label: "Ainda não tenho canal definido" } ] },

  { id: "canal_principal", section: "Canais", agentMessage: "Qual desses canais traz os melhores resultados para você hoje?", inputType: "select", helpText: "Vamos potencializar o que já funciona antes de abrir novos canais.", options: [ { value: "indicacao", label: "Indicação" }, { value: "trafego", label: "Tráfego pago (anúncios)" }, { value: "prospeccao", label: "Prospecção ativa" }, { value: "organico", label: "Redes sociais orgânico" }, { value: "nao_sei", label: "Não sei / Ainda não tenho" } ] },

  { id: "etapas_funil", section: "Processo de Vendas", agentMessage: "Como é o caminho de uma venda na sua empresa? Do primeiro contato até fechar.\n\n💡 _Se não tiver um processo definido, descreva como acontece na prática. Ex: 'O cliente me manda mensagem, a gente conversa, eu mando o valor e ele decide'._", inputType: "textarea", placeholder: "Ex: Lead entra pelo Instagram → Respondo no DM → Marco reunião → Envio proposta → Negocio → Fecho.", helpText: "Vamos criar seu funil de CRM automaticamente com base nessas etapas!" },

  { id: "pos_venda", section: "Processo de Vendas", agentMessage: "O que acontece depois que o cliente fecha? Você tem algum processo de acompanhamento?\n\n💡 _Pós-venda = o que você faz para garantir que o cliente ficou satisfeito, use o produto e volte a comprar._", inputType: "select", helpText: "Clientes bem atendidos após a compra geram indicações e recompras — o canal mais barato que existe.", options: [ { value: "nao", label: "Não tenho nada estruturado" }, { value: "informal", label: "Acompanho de forma informal" }, { value: "processo", label: "Tenho um processo definido" }, { value: "automatizado", label: "Está automatizado" } ] },

  { id: "metas_historicas", section: "Performance", agentMessage: "Suas metas de venda são baseadas em quê?\n\n💡 _Não tem meta ainda? Tudo bem — selecione 'Não tenho metas' e vamos criar juntos._", inputType: "select", helpText: "Metas sem base histórica viram frustração. Com dados, elas viram plano.", options: [ { value: "nao", label: "Não tenho metas definidas" }, { value: "achismo", label: "Defino por intuição" }, { value: "historico", label: "Baseadas no histórico de vendas" }, { value: "projecoes", label: "Com projeções e cenários" } ] },

  { id: "conversao_etapa", section: "Performance", agentMessage: "Você sabe quantos clientes fecham de cada 10 que demonstram interesse?\n\n💡 _Ex: de cada 10 pessoas que pedem orçamento, 2 fecham = 20% de conversão. Se não souber, tudo bem._", inputType: "select", helpText: "Taxa de conversão é o indicador mais importante do comercial. Vamos te ajudar a medir isso.", options: [ { value: "nao", label: "Não sei / Nunca medi" }, { value: "menos_10", label: "Menos de 10% fecham" }, { value: "10-30", label: "Entre 10% e 30%" }, { value: "30-60", label: "Entre 30% e 60%" }, { value: "mais_60", label: "Mais de 60%" } ] },

  { id: "momento_negocio", section: "Performance", agentMessage: "Como você descreveria o momento do seu negócio agora?", inputType: "select", helpText: "O momento atual define quais prioridades e ferramentas fazem mais sentido para você agora.", options: [ { value: "iniciando", label: "Estou começando — ainda estruturando tudo" }, { value: "crescendo", label: "Estou crescendo, mas de forma desorganizada" }, { value: "estavel", label: "Estável, mas quero crescer mais" }, { value: "plateau", label: "Travei — cresci até aqui e não consigo avançar" }, { value: "caindo", label: "Estou perdendo clientes / faturamento" } ] },

  { id: "saude_convenios", section: "Performance", agentMessage: "Você trabalha com convênios ou planos de saúde?", inputType: "select", helpText: "Convênios impactam o ticket médio e o ciclo de pagamento.", options: [ { value: "nao", label: "Não" }, { value: "alguns", label: "Alguns convênios" }, { value: "principal", label: "Sim, é a principal fonte de receita" } ], skipIf: (ans) => ans.segmento !== "saude" && ans.segmento !== "odontologia" },

  { id: "varejo_ecommerce", section: "Performance", agentMessage: "Você vende online além da loja física?", inputType: "select", helpText: "O canal online abre oportunidades de escala sem limite geográfico.", options: [ { value: "nao", label: "Apenas loja física" }, { value: "marketplace", label: "Sim, marketplace (Mercado Livre, Shopee...)" }, { value: "loja_propria", label: "Sim, loja online própria" }, { value: "ambos", label: "Marketplace + loja própria" } ], skipIf: (ans) => ans.segmento !== "varejo" && ans.segmento !== "ecommerce" },

];
/* ══════════════════════════════════════════════
   GPS DO NEGÓCIO — SOFIA (Fase Marketing, ~13 perguntas)
   Perguntas duplicadas (empresa, produto, segmento, ticket_medio, dor_principal) 
   já foram cobertas pelo Rafael — aqui só o que é exclusivo de marketing.
   ══════════════════════════════════════════════ */

export const GPS_SOFIA_STEPS: BriefingStep[] = [
  {
    id: "_intro_gps_sofia",
    agentMessage: "Olá! 👋 Eu sou a **Sofia**, especialista em marketing do GPS do Negócio.\n\nO Rafael já coletou tudo sobre o seu comercial. Agora vou focar em **marketing, posicionamento e comunicação** — como atrair mais clientes certos para o seu negócio.\n\nAlgumas perguntas são sobre números. Se não souber, **estimativas são bem-vindas** — o que importa é entender o cenário. 🎯✨",
    inputType: "info",
  },
  { id: "publico", section: "Público", agentMessage: "Quem é o cliente ideal para o seu produto? Pode marcar vários.\n\n💡 _Cliente ideal = aquele que mais compra, mais paga e mais indica. Se tiver dúvida, pense no seu melhor cliente atual._", inputType: "multi-select", helpText: "Definir o público certo evita desperdiçar dinheiro e energia com quem nunca vai comprar.", options: [ { value: "empresarios", label: "Empresários / Donos de negócio" }, { value: "pequenas_empresas", label: "Pequenas e médias empresas" }, { value: "executivos", label: "Executivos / Gestores" }, { value: "profissionais_liberais", label: "Profissionais liberais (advogados, médicos...)" }, { value: "consumidor_final", label: "Consumidor final (pessoa física)" }, { value: "maes", label: "Mães / Pais" }, { value: "jovens", label: "Jovens (18-25 anos)" }, { value: "mulheres", label: "Mulheres" }, { value: "investidores", label: "Investidores" }, { value: "atletas", label: "Atletas / Praticantes de esporte" }, { value: "aposentados", label: "55+ / Aposentados" }, { value: "personalizar", label: "Outro perfil" } ] },
  { id: "faixa_etaria", section: "Público", agentMessage: "Qual a faixa etária predominante do seu cliente?", inputType: "multi-select", helpText: "Faixa etária define linguagem, canais e formato de conteúdo — Instagram, TikTok ou LinkedIn, por exemplo.", options: FAIXA_ETARIA_OPTIONS },
  { id: "razao_escolha", section: "Posicionamento", agentMessage: "Por que um cliente deveria escolher você e não o concorrente?\n\n💡 _Pode ser preço, resultado, atendimento, especialização, localização — qualquer coisa que te destaque._", inputType: "textarea", placeholder: "Ex: Sou a única nutricionista da cidade especializada em atletas de alta performance.", helpText: "Seu posicionamento vai aparecer em todos os conteúdos, anúncios e scripts gerados pela IA." },
  { id: "diferencial", section: "Posicionamento", agentMessage: "Qual é o seu principal diferencial de mercado?", inputType: "select", helpText: "Esse diferencial vai ser o fio condutor de toda a sua comunicação.", options: [ { value: "metodo", label: "Método ou processo exclusivo" }, { value: "atendimento", label: "Atendimento personalizado" }, { value: "nicho", label: "Especialização em nicho específico" }, { value: "tecnologia", label: "Tecnologia / Inovação" }, { value: "preco", label: "Melhor custo-benefício" }, { value: "equipe", label: "Equipe altamente qualificada" }, { value: "resultados", label: "Resultados comprovados" }, { value: "marca", label: "Marca reconhecida" }, { value: "personalizar", label: "Outro diferencial" } ] },
  { id: "resultados_clientes", section: "Posicionamento", agentMessage: "Quais resultados seus clientes alcançam com você?\n\n💡 _Pense no antes e depois. Ex: 'Clientes perdem em média 8kg em 2 meses'. Pode ser qualitativo também: 'Saem mais confiantes'._", inputType: "textarea", placeholder: "Ex: Meus clientes aumentam as vendas em 30% nos primeiros 90 dias.", helpText: "Resultados reais são a prova social mais poderosa — vão aparecer em conteúdos e anúncios.", optional: true },
  { id: "concorrentes_urls", section: "Concorrência", agentMessage: "Cole os links do site ou Instagram dos seus 2-3 principais concorrentes. 🔍\n\n💡 _Com URLs reais, consigo analisar o posicionamento, comunicação e estratégia deles — isso torna seu diagnóstico muito mais preciso!_", inputType: "textarea", placeholder: "https://www.concorrente1.com.br\nhttps://instagram.com/concorrente2", helpText: "Opcional mas muito valioso — a análise de concorrência fica 3x mais precisa com URLs reais.", optional: true },
  { id: "concorrente_faz_melhor", section: "Concorrência", agentMessage: "O que seus concorrentes fazem melhor que você hoje?\n\n💡 _Seja honesto — isso nos ajuda a criar estratégias para superar essas diferenças._", inputType: "textarea", placeholder: "Ex: Têm mais seguidores, investem mais em anúncios, a marca é mais conhecida...", helpText: "Reconhecer os pontos fortes da concorrência é o primeiro passo para superá-los.", optional: true },
  { id: "canais_atuais", section: "Marketing Atual", agentMessage: "Quais canais você já usa hoje para atrair clientes? Pode marcar vários.", inputType: "multi-select", helpText: "Vamos potencializar o que já existe antes de criar algo do zero.", options: [ { value: "instagram", label: "Instagram" }, { value: "whatsapp", label: "WhatsApp" }, { value: "site", label: "Site / Blog" }, { value: "trafego_pago", label: "Tráfego pago (anúncios)" }, { value: "indicacao", label: "Indicação" }, { value: "youtube", label: "YouTube" }, { value: "tiktok", label: "TikTok" }, { value: "linkedin", label: "LinkedIn" }, { value: "email", label: "Email marketing" }, { value: "nenhum", label: "Ainda não uso nenhum canal" } ] },
  { id: "frequencia_conteudo", section: "Marketing Atual", agentMessage: "Com que frequência você publica conteúdo nas redes sociais?", inputType: "select", helpText: "Frequência atual nos ajuda a criar um calendário editorial realista para você.", options: [ { value: "nunca", label: "Nunca publico" }, { value: "esporadico", label: "Esporadicamente, quando lembro" }, { value: "1-2_semana", label: "1 a 2 vezes por semana" }, { value: "3-5_semana", label: "3 a 5 vezes por semana" }, { value: "diario", label: "Todo dia" } ] },
  { id: "investe_anuncios", section: "Marketing Atual", agentMessage: "Você já investe em anúncios pagos?\n\n💡 _Anúncios pagos = Google Ads, Meta Ads (Instagram/Facebook), TikTok Ads, etc._", inputType: "select", helpText: "Saber o investimento atual ajuda a dimensionar a estratégia de tráfego pago.", options: [ { value: "nao", label: "Não invisto nada ainda" }, { value: "0-500", label: "Sim, até R$ 500/mês" }, { value: "500-2k", label: "Sim, R$ 500 a R$ 2.000/mês" }, { value: "2k-5k", label: "Sim, R$ 2.000 a R$ 5.000/mês" }, { value: "5k+", label: "Sim, mais de R$ 5.000/mês" } ] },
  { id: "orcamento", section: "Marketing Atual", agentMessage: "Quanto você pretende investir em marketing por mês?\n\n💡 _Inclui anúncios, ferramentas, profissionais — tudo relacionado a marketing. Se não tiver certeza, escolha uma estimativa._", inputType: "select", helpText: "Orçamento real de marketing é essencial para criar um plano executável.", options: [ { value: "0-500", label: "Até R$ 500" }, { value: "500-2k", label: "R$ 500 a R$ 2.000" }, { value: "2k-5k", label: "R$ 2.000 a R$ 5.000" }, { value: "5k-10k", label: "R$ 5.000 a R$ 10.000" }, { value: "10k+", label: "Mais de R$ 10.000" } ] },
  { id: "objetivo", section: "Objetivo", agentMessage: "Qual é o seu principal objetivo de marketing agora?\n\n💡 _Escolha o que faz mais sentido para onde você está hoje._", inputType: "select", helpText: "O objetivo define toda a direção da estratégia — canais, conteúdo, anúncios e mensagem.", options: [ { value: "gerar_leads", label: "Gerar mais leads / interessados" }, { value: "aumentar_vendas", label: "Converter mais leads em clientes" }, { value: "aumentar_autoridade", label: "Ser referência no meu segmento" }, { value: "lancar_produto", label: "Lançar um produto ou serviço novo" }, { value: "fidelizar", label: "Fidelizar clientes e gerar recompra" }, { value: "aumentar_ticket", label: "Aumentar o valor médio por cliente" }, { value: "novo_mercado", label: "Entrar em um novo mercado ou cidade" } ] },
  { id: "tom_comunicacao", section: "Comunicação", agentMessage: "Qual tom de comunicação combina mais com sua marca? Pode marcar vários.\n\n💡 _Como você quer que as pessoas se sintam ao ver sua comunicação?_", inputType: "multi-select", helpText: "Tom de voz = a personalidade da sua marca. Vai guiar todos os textos e conteúdos gerados pela IA.", options: [ { value: "profissional", label: "Profissional / Sério" }, { value: "acessivel", label: "Acessível / Próximo" }, { value: "provocativo", label: "Direto / Sem rodeios" }, { value: "educativo", label: "Educativo / Didático" }, { value: "inspirador", label: "Inspirador / Motivacional" }, { value: "humoristico", label: "Descontraído / Bem-humorado" }, { value: "tecnico", label: "Técnico / Especialista" }, { value: "premium", label: "Premium / Sofisticado" }, { value: "empatico", label: "Empático / Acolhedor" } ] },
  { id: "marcas_referencia", section: "Comunicação", agentMessage: "Existe alguma marca que você admira e gostaria de se parecer?\n\n💡 _Pode ser do seu segmento ou não. Ex: 'Gosto da objetividade do Nubank, do posicionamento premium da Apple'._", inputType: "textarea", placeholder: "Ex: Nubank pela linguagem simples e direta. Nike pela energia e inspiração.", helpText: "Referências ajudam a IA a entender a estética e o posicionamento que você quer construir.", optional: true },
  { id: "sazonalidade", section: "Contexto", agentMessage: "Seu negócio tem sazonalidade? Alguns meses vendem mais que outros?\n\n💡 _Ex: academia lota em janeiro, loja de roupa vende mais no Natal._", inputType: "select", helpText: "Sazonalidade influencia o calendário de conteúdo e quando investir mais em anúncios.", options: [ { value: "nao", label: "Não — é estável o ano todo" }, { value: "inicio_ano", label: "Sim — vende mais no início do ano" }, { value: "meio_ano", label: "Sim — vende mais no meio do ano" }, { value: "fim_ano", label: "Sim — vende mais no fim do ano (nov/dez)" }, { value: "datas", label: "Sim — depende de datas comemorativas" }, { value: "personalizar", label: "Outro padrão" } ] },
  { id: "regiao", section: "Contexto", agentMessage: "Onde sua empresa atua?", inputType: "text", placeholder: "Ex: Maringá - PR / Brasil inteiro / América Latina", helpText: "Região de atuação define segmentação de campanhas e benchmarks locais." },
  { id: "links_digitais", section: "Contexto", agentMessage: "Por último: tem site, Instagram ou qualquer link digital? Se tiver, compartilha aqui. 😊\n\n💡 _Isso permite que a IA analise sua presença digital atual e dê recomendações mais precisas._", inputType: "textarea", placeholder: "Site: https://...\nInstagram: @...\nLinkedIn: ...", helpText: "Com links reais a análise de presença digital fica muito mais precisa.", optional: true },
];
