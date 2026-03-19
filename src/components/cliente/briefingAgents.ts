import type { BriefingStep, BriefingAgent } from "./ChatBriefing";

/* ══════════════════════════════════════════════
   AGENTS
   ══════════════════════════════════════════════ */

export const AGENTS: Record<string, BriefingAgent> = {
  sofia: { name: "Sofia", role: "Consultora de Marketing", avatar: "S", color: "#8b5cf6" },
  rafael: { name: "Rafael", role: "Consultor Comercial", avatar: "R", color: "#0ea5e9" },
  luna: { name: "Luna", role: "Estrategista de Conteúdo", avatar: "L", color: "#f59e0b" },
  theo: { name: "Theo", role: "Diretor de Arte", avatar: "T", color: "#ec4899" },
  alex: { name: "Alex", role: "Arquiteto Web", avatar: "A", color: "#10b981" },
  dani: { name: "Dani", role: "Estrategista de Tráfego", avatar: "D", color: "#f97316" },
};

/* ══════════════════════════════════════════════
   SHARED OPTIONS (reusable across agents)
   ══════════════════════════════════════════════ */

const SEGMENTO_OPTIONS = [
  { value: "servicos", label: "Serviços" }, { value: "varejo", label: "Varejo / Loja" },
  { value: "alimentacao", label: "Alimentação" }, { value: "saude", label: "Saúde / Estética" },
  { value: "educacao", label: "Educação" }, { value: "tecnologia", label: "Tecnologia" },
  { value: "industria", label: "Indústria" }, { value: "construcao", label: "Construção" },
  { value: "financeiro", label: "Financeiro" }, { value: "outro", label: "Outro" },
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
