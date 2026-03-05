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
   SOFIA — Estratégia de Marketing (10 perguntas)
   ══════════════════════════════════════════════ */

export const SOFIA_STEPS: BriefingStep[] = [
  // ── Intro
  {
    id: "_intro_sofia",
    agentMessage: "Oi! 👋 Sou a Sofia, sua consultora de marketing. Vou te fazer 10 perguntas rápidas para criar uma estratégia completa e personalizada para o seu negócio. Vamos lá?",
    inputType: "info",
  },

  // 1. Referência
  {
    id: "referencia",
    section: "Sua Empresa",
    agentMessage: "Pra começar, cole o link do seu site ou Instagram. Isso me ajuda a entender melhor o seu negócio! 😊",
    inputType: "text",
    placeholder: "https://instagram.com/suaempresa ou https://seusite.com.br",
    helpText: "Permite que a IA entenda o contexto visual e de comunicação da sua empresa.",
    optional: true,
  },

  // 2. Descrição do negócio
  {
    id: "empresa",
    section: "Sua Empresa",
    agentMessage: "Em poucas palavras, o que sua empresa faz?",
    inputType: "textarea",
    placeholder: "Ex: Consultoria financeira para empresas, clínica odontológica especializada em implantes...",
    helpText: "Uma descrição clara ajuda a IA a direcionar toda a estratégia.",
  },

  // 3. Produto/serviço principal
  {
    id: "produto",
    section: "Seu Produto",
    agentMessage: "Qual é o principal produto ou serviço que você deseja priorizar na estratégia?",
    inputType: "textarea",
    placeholder: "Ex: Consultoria empresarial premium, implante dentário, curso online...",
    helpText: "Focamos a estratégia no produto/serviço com maior potencial de retorno.",
  },

  // 4. Público-alvo
  {
    id: "publico",
    section: "Seu Público",
    agentMessage: "Quem é o cliente ideal da sua empresa?",
    inputType: "textarea",
    placeholder: "Ex: Empresários de 30-50 anos, médicos, pequenas empresas, consumidores finais...",
    helpText: "Quanto mais detalhado, melhor será a segmentação e a personalização da estratégia.",
  },

  // 5. Problema que resolve
  {
    id: "problema",
    section: "Seu Público",
    agentMessage: "Qual problema do cliente seu produto ou serviço resolve?",
    inputType: "textarea",
    placeholder: "Ex: Falta de organização financeira, dor de dente crônica, baixa visibilidade online...",
    helpText: "Entender a dor do cliente é essencial para criar mensagens que convertem.",
  },

  // 6. Diferencial competitivo
  {
    id: "diferencial",
    section: "Diferencial",
    agentMessage: "Por que um cliente escolheria sua empresa em vez de um concorrente?",
    inputType: "textarea",
    placeholder: "Ex: Metodologia própria, tecnologia exclusiva, atendimento personalizado...",
    helpText: "Seu diferencial será a base do posicionamento estratégico.",
  },

  // 7. Objetivo de marketing
  {
    id: "objetivo",
    section: "Objetivos",
    agentMessage: "Qual resultado você deseja alcançar com marketing?",
    inputType: "select",
    options: [
      { value: "gerar_leads", label: "Gerar leads" },
      { value: "vender_mais", label: "Vender mais" },
      { value: "captar_clientes", label: "Captar clientes" },
      { value: "aumentar_autoridade", label: "Aumentar autoridade" },
    ],
    helpText: "O objetivo define toda a direção da estratégia.",
  },

  // 8. Meta desejada
  {
    id: "meta",
    section: "Objetivos",
    agentMessage: "Qual resultado você gostaria de alcançar nos próximos meses?",
    inputType: "textarea",
    placeholder: "Ex: 50 novos clientes, R$ 100 mil de faturamento mensal, 200 leads/mês...",
    helpText: "Metas concretas permitem criar projeções realistas.",
  },

  // 9. Canais disponíveis
  {
    id: "canais",
    section: "Canais",
    agentMessage: "Quais canais você pretende utilizar para marketing? Pode marcar vários!",
    inputType: "multi-select",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "google", label: "Google" },
      { value: "youtube", label: "YouTube" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "tiktok", label: "TikTok" },
      { value: "facebook", label: "Facebook" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "trafego_pago", label: "Tráfego pago" },
    ],
    helpText: "Selecione os canais onde deseja marcar presença.",
  },

  // 10. Orçamento
  {
    id: "orcamento",
    section: "Canais",
    agentMessage: "Existe algum orçamento mensal disponível para marketing?",
    inputType: "select",
    options: [
      { value: "nenhum", label: "Sem orçamento definido" },
      { value: "0-500", label: "Até R$ 500" },
      { value: "500-2k", label: "R$ 500 a R$ 2.000" },
      { value: "2k-5k", label: "R$ 2.000 a R$ 5.000" },
      { value: "5k-15k", label: "R$ 5.000 a R$ 15.000" },
      { value: "15k+", label: "Mais de R$ 15.000" },
    ],
    helpText: "O orçamento ajuda a dimensionar campanhas e projeções de resultado.",
  },
];

/* ══════════════════════════════════════════════
   RAFAEL — Plano de Vendas (~25 questions, 8 sections)
   Com intro conversacional + perguntas abertas estratégicas
   ══════════════════════════════════════════════ */

export const RAFAEL_STEPS: BriefingStep[] = [
  // ── Intro conversacional (info steps — user just clicks "Continuar")
  { id: "_intro_rafael_1", agentMessage: "Oi! 👋 Eu sou o Rafael, seu consultor comercial aqui na NoExcuse. Prazer em te conhecer!", inputType: "info" },
  { id: "_intro_rafael_2", agentMessage: "Meu trabalho é entender a fundo a sua operação de vendas e criar um plano comercial 100% personalizado para o seu negócio. Nada genérico — tudo baseado na SUA realidade.", inputType: "info" },
  { id: "_intro_rafael_3", agentMessage: "Em poucos minutos, você vai ter um diagnóstico completo com score por área, insights acionáveis e um plano de ação pronto para executar. Tudo isso vai alimentar as ferramentas da plataforma: CRM, Scripts, Marketing e mais. 🚀", inputType: "info" },
  { id: "_intro_rafael_4", agentMessage: "Bora começar? Vou te fazer algumas perguntas rápidas sobre seu negócio. Relaxa que é tranquilo! 😎", inputType: "info" },

  // ── 1. Sobre o Negócio
  { id: "segmento", section: "Sobre o Negócio", agentMessage: "Qual é o segmento da sua empresa?", inputType: "select", helpText: "Identifique o setor principal de atuação para personalizar as recomendações.",
    options: SEGMENTO_OPTIONS,
  },
  { id: "modelo_negocio", section: "Sobre o Negócio", agentMessage: "Modelo de negócio: B2B, B2C ou ambos?", inputType: "select", helpText: "Saber se vende para empresas ou consumidor final muda toda a estratégia de abordagem.",
    options: [
      { value: "b2b", label: "B2B (empresas)" }, { value: "b2c", label: "B2C (consumidor final)" },
      { value: "ambos", label: "Ambos" },
    ],
  },
  // Open-ended: produtos/serviços (replaces tempo_mercado closed question)
  { id: "produtos_servicos", section: "Sobre o Negócio", agentMessage: "Me conta quais são seus principais produtos ou serviços? Pode listar à vontade! 📝", inputType: "textarea", helpText: "Quanto mais detalhes, melhor personalizamos seu plano comercial e scripts de vendas.",
    placeholder: "Ex: Consultoria em gestão, treinamentos corporativos, mentoria individual...",
  },
  // Open-ended: diferenciais (replaces num_funcionarios closed question)
  { id: "diferenciais", section: "Sobre o Negócio", agentMessage: "E o que te diferencia da concorrência? O que faz o cliente escolher VOCÊ? 💪", inputType: "textarea", helpText: "Seu diferencial será usado nos scripts de vendas, conteúdos e abordagem comercial.",
    placeholder: "Ex: Atendimento 24h, entrega em 2h, garantia vitalícia, 15 anos de experiência...",
  },

  // ── 2. Financeiro Comercial
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
  { id: "receita_novos", section: "Financeiro Comercial", agentMessage: "Quanto da receita vem de novos clientes vs recorrência?", inputType: "select", helpText: "Ajuda a identificar se depende de novos clientes ou tem base recorrente saudável.",
    options: [
      { value: "90_novos", label: "90%+ novos" }, { value: "70_30", label: "70% novos / 30% recorrente" },
      { value: "50_50", label: "50/50" }, { value: "30_70", label: "30% novos / 70% recorrente" },
    ],
  },

  // ── 3. Equipe e Estrutura
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
  { id: "processo_documentado", section: "Equipe e Estrutura", agentMessage: "O processo comercial está documentado?", inputType: "select", helpText: "Processos documentados permitem treinar novos vendedores e escalar.",
    options: [
      { value: "nao", label: "Não existe" }, { value: "parcial", label: "Parcial / informal" },
      { value: "sim", label: "Sim, documentado" }, { value: "completo", label: "Sim, com playbook completo" },
    ],
  },
  { id: "tempo_fechamento", section: "Equipe e Estrutura", agentMessage: "Tempo médio pra fechar uma venda?", inputType: "select", helpText: "Ciclos mais longos exigem automação e cadências de follow-up robustas.",
    options: [
      { value: "mesmo_dia", label: "No mesmo dia" }, { value: "1-7", label: "1 a 7 dias" },
      { value: "1-4sem", label: "1 a 4 semanas" }, { value: "1-3m", label: "1 a 3 meses" },
      { value: "3m+", label: "Mais de 3 meses" },
    ],
  },

  // ── 4. Gestão de Leads
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
  // Open-ended: dor do cliente (replaces cadencia_followup)
  { id: "dor_principal", section: "Gestão de Leads", agentMessage: "Qual a maior dor ou necessidade do seu cliente ideal? O que faz ele procurar uma solução como a sua? 🎯", inputType: "textarea", helpText: "Entender a dor do cliente é essencial para criar scripts e conteúdos que convertem.",
    placeholder: "Ex: Perdem muito tempo com processos manuais, não conseguem escalar vendas, gastam muito com equipe sem resultado...",
  },
  { id: "qtd_leads_mes", section: "Gestão de Leads", agentMessage: "Quantos leads recebe por mês?", inputType: "select", helpText: "Volume de leads determina a necessidade de automação.",
    options: [
      { value: "0-10", label: "0-10" }, { value: "11-30", label: "11-30" },
      { value: "31-100", label: "31-100" }, { value: "100-500", label: "100-500" },
      { value: "500+", label: "500+" },
    ],
  },

  // ── 5. Canais e Prospecção
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
  { id: "mede_roi", section: "Canais e Prospecção", agentMessage: "Mede o ROI por canal?", inputType: "select", helpText: "Medir ROI evita desperdício em canais sem retorno.",
    options: [
      { value: "nao", label: "Não meço" }, { value: "parcial", label: "Parcialmente" },
      { value: "sim", label: "Sim, de todos" },
    ],
  },

  // ── 6. Processo de Vendas
  { id: "usa_scripts", section: "Processo de Vendas", agentMessage: "Usa scripts ou roteiros padronizados?", inputType: "select", helpText: "Scripts garantem consistência e aceleram o ramp-up de novos vendedores.",
    options: [
      { value: "nao", label: "Não uso" }, { value: "tem_nao_segue", label: "Tenho mas não sigo" },
      { value: "parcial", label: "Sim, parcialmente" }, { value: "sim", label: "Sim, toda equipe usa" },
    ],
  },
  { id: "etapas_funil", section: "Processo de Vendas", agentMessage: "Quais etapas do funil utiliza?", inputType: "multi-select", helpText: "Um funil bem definido permite identificar gargalos.",
    options: [
      { value: "prospeccao", label: "Prospecção" }, { value: "qualificacao", label: "Qualificação" },
      { value: "apresentacao", label: "Apresentação" }, { value: "proposta", label: "Proposta" },
      { value: "negociacao", label: "Negociação" }, { value: "fechamento", label: "Fechamento" },
      { value: "nenhum", label: "Não tenho funil definido" },
    ],
  },
  { id: "reuniao_recorrente", section: "Processo de Vendas", agentMessage: "Tem reunião comercial recorrente?", inputType: "select", helpText: "Reuniões de alinhamento garantem foco nas prioridades e metas.",
    options: [
      { value: "nao", label: "Não" }, { value: "mensal", label: "Mensal" },
      { value: "semanal", label: "Semanal" }, { value: "diaria", label: "Diária" },
    ],
  },

  // ── 7. Ferramentas e Automação
  { id: "ferramentas_usadas", section: "Ferramentas e Automação", agentMessage: "Quais ferramentas utiliza no comercial?", inputType: "multi-select", helpText: "Mapear ferramentas atuais ajuda a identificar lacunas.",
    options: [
      { value: "crm", label: "CRM" }, { value: "whatsapp", label: "WhatsApp Business" },
      { value: "email", label: "Email Marketing" }, { value: "telefone", label: "Telefone" },
      { value: "automacao", label: "Automação (RD, HubSpot)" }, { value: "planilhas", label: "Planilhas" },
      { value: "nenhuma", label: "Nenhuma" },
    ],
  },
  { id: "tem_automacoes", section: "Ferramentas e Automação", agentMessage: "Tem automações ativas no processo comercial?", inputType: "select", helpText: "Automações liberam tempo para tarefas de maior valor.",
    options: [
      { value: "nao", label: "Nenhuma" }, { value: "poucas", label: "Poucas (email, lembretes)" },
      { value: "sim", label: "Sim, várias integradas" },
    ],
  },
  { id: "usa_agente_ia", section: "Ferramentas e Automação", agentMessage: "Usa agente de IA para atendimento?", inputType: "select", helpText: "IA responde leads 24h, reduz tempo de espera e qualifica automaticamente.",
    options: [
      { value: "nao", label: "Não" }, { value: "pensou", label: "Já pensei nisso" },
      { value: "basico", label: "Sim, básico" }, { value: "integrado", label: "Sim, integrado ao CRM" },
    ],
  },

  // ── 8. Metas e Performance
  { id: "metas_historicas", section: "Metas e Performance", agentMessage: "Suas metas são baseadas em dados históricos?", inputType: "select", helpText: "Metas baseadas em dados evitam frustração e permitem projeções realistas.",
    options: [
      { value: "nao", label: "Não tenho metas" }, { value: "achismo", label: "Metas por achismo" },
      { value: "historico", label: "Baseadas em histórico" }, { value: "projecoes", label: "Com projeções e cenários" },
    ],
  },
  { id: "conversao_etapa", section: "Metas e Performance", agentMessage: "Acompanha taxa de conversão por etapa do funil?", inputType: "select", helpText: "Conversão por etapa revela onde os leads estão sendo perdidos.",
    options: [
      { value: "nao", label: "Não acompanho" }, { value: "geral", label: "Apenas conversão geral" },
      { value: "por_etapa", label: "Sim, por etapa" },
    ],
  },
  { id: "relatorios", section: "Metas e Performance", agentMessage: "Pra finalizar: gera relatórios comerciais periodicamente?", inputType: "select", helpText: "Relatórios frequentes permitem ajustar a estratégia rapidamente.",
    options: [
      { value: "nunca", label: "Nunca" }, { value: "mensal", label: "Mensal" },
      { value: "semanal", label: "Semanal" }, { value: "diario", label: "Diário" },
    ],
  },

  // Segment-specific conditional questions
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

const SITE_TYPES_OPT = [
  { value: "lp", label: "Landing Page", desc: "1 página — hero, features, CTA", icon: "📄" },
  { value: "institucional", label: "Site Institucional", desc: "3-5 páginas completas", icon: "🏢" },
  { value: "portfolio", label: "Portfólio / Showcase", desc: "Galeria de trabalhos", icon: "🎨" },
  { value: "ecommerce", label: "E-commerce / Loja", desc: "Catálogo e vendas online", icon: "🛒" },
  { value: "blog", label: "Blog / Conteúdo", desc: "Publicações e artigos", icon: "📝" },
];

const SITE_OBJETIVO_OPT = [
  { value: "gerar_leads", label: "Gerar Leads", icon: "🎯" }, { value: "vender_online", label: "Vender Online", icon: "💰" },
  { value: "apresentar_empresa", label: "Apresentar Empresa", icon: "🏢" }, { value: "portfolio", label: "Mostrar Portfólio", icon: "🎨" },
];

const SITE_ESTILO_OPT = [
  { value: "minimalista", label: "Minimalista" }, { value: "moderno", label: "Moderno" },
  { value: "corporativo", label: "Corporativo" }, { value: "bold", label: "Bold / Impactante" },
  { value: "elegante", label: "Elegante" },
];

const CTA_OPTIONS = [
  { value: "solicitar_orcamento", label: "Solicitar Orçamento" }, { value: "agendar_demo", label: "Agendar Demonstração" },
  { value: "comprar_agora", label: "Comprar Agora" }, { value: "falar_whatsapp", label: "Falar no WhatsApp" },
  { value: "baixar_material", label: "Baixar Material" }, { value: "conhecer_planos", label: "Conhecer Planos" },
  { value: "outro", label: "Outro (personalizar)" },
];

const COR_OPTIONS = [
  { value: "azul", label: "Azul", icon: "🔵" }, { value: "verde", label: "Verde", icon: "🟢" },
  { value: "vermelho", label: "Vermelho", icon: "🔴" }, { value: "roxo", label: "Roxo", icon: "🟣" },
  { value: "laranja", label: "Laranja", icon: "🟠" }, { value: "preto_dourado", label: "Preto / Dourado", icon: "⚫" },
  { value: "rosa", label: "Rosa", icon: "🩷" }, { value: "usar_marca", label: "Usar da minha marca" },
  { value: "ia_escolher", label: "Deixar a IA escolher" },
];

const FONTE_OPTIONS = [
  { value: "moderna", label: "Moderna (Inter, Poppins)" }, { value: "classica", label: "Clássica (Playfair, Merriweather)" },
  { value: "clean", label: "Clean (Helvetica, Arial)" }, { value: "ousada", label: "Ousada (Montserrat Bold)" },
  { value: "ia_escolher", label: "Deixar a IA escolher" },
];

const TOM_OPTIONS = [
  { value: "profissional", label: "Profissional" }, { value: "descontraido", label: "Descontraído" },
  { value: "tecnico", label: "Técnico" }, { value: "inspirador", label: "Inspirador" },
  { value: "sofisticado", label: "Sofisticado" },
];

const PUBLICO_ALVO_OPTIONS = [
  { value: "b2b", label: "Empresas (B2B)" }, { value: "consumidor_final", label: "Consumidor final" },
  { value: "profissionais_liberais", label: "Profissionais liberais" }, { value: "jovens_18_30", label: "Jovens 18-30" },
  { value: "adultos_30_50", label: "Adultos 30-50" }, { value: "premium", label: "Premium / Alto padrão" },
];

const DORES_SITE_OPTIONS = [
  { value: "falta_tempo", label: "Falta de tempo" }, { value: "dificuldade_encontrar", label: "Dificuldade de encontrar" },
  { value: "preco_alto", label: "Preço alto do mercado" }, { value: "falta_confianca", label: "Falta de confiança" },
  { value: "necessidade_urgente", label: "Necessidade urgente" }, { value: "baixa_visibilidade", label: "Baixa visibilidade online" },
];

const FAIXA_PRECO_SITE = [
  { value: "nao_exibir", label: "Não exibir" }, { value: "ate_100", label: "Até R$ 100" },
  { value: "100_500", label: "R$ 100-500" }, { value: "500_2k", label: "R$ 500-2 mil" },
  { value: "2k_10k", label: "R$ 2-10 mil" }, { value: "10k_mais", label: "R$ 10 mil+" },
  { value: "sob_consulta", label: "Sob consulta" },
];

// Seções condicionais por tipo de site
const SECOES_LP = [
  { value: "hero_cta", label: "Hero com CTA" }, { value: "features", label: "Features / Benefícios" },
  { value: "depoimentos", label: "Depoimentos" }, { value: "faq", label: "FAQ" },
  { value: "numeros", label: "Números de Impacto" }, { value: "formulario", label: "Formulário" },
  { value: "footer", label: "Footer" },
];

const SECOES_INSTITUCIONAL = [
  { value: "hero", label: "Hero" }, { value: "sobre", label: "Sobre Nós" },
  { value: "servicos", label: "Serviços" }, { value: "equipe", label: "Equipe" },
  { value: "depoimentos", label: "Depoimentos" }, { value: "blog", label: "Blog" },
  { value: "contato", label: "Contato" }, { value: "faq", label: "FAQ" },
  { value: "footer", label: "Footer" },
];

const SECOES_PORTFOLIO = [
  { value: "hero", label: "Hero" }, { value: "galeria", label: "Galeria de Projetos" },
  { value: "sobre", label: "Sobre" }, { value: "servicos", label: "Serviços" },
  { value: "contato", label: "Contato" }, { value: "footer", label: "Footer" },
];

const SECOES_ECOMMERCE = [
  { value: "hero", label: "Hero" }, { value: "catalogo", label: "Catálogo" },
  { value: "produto_destaque", label: "Produto Destaque" }, { value: "depoimentos", label: "Depoimentos" },
  { value: "faq", label: "FAQ" }, { value: "contato", label: "Contato" },
  { value: "footer", label: "Footer" },
];

function getSecoesForType(tipo: string) {
  switch (tipo) {
    case "lp": return SECOES_LP;
    case "institucional": return SECOES_INSTITUCIONAL;
    case "portfolio": return SECOES_PORTFOLIO;
    case "ecommerce": return SECOES_ECOMMERCE;
    default: return SECOES_LP;
  }
}

export const ALEX_STEPS: BriefingStep[] = [
  { id: "_intro_alex", agentMessage: "Olá! 👋 Sou o Alex, seu arquiteto web. Vou criar um site profissional pra você. {planLimitMessage}", inputType: "info" },

  // Tipo e objetivo
  { id: "siteType", section: "Tipo de Site", agentMessage: "Que tipo de site você precisa?", inputType: "select", options: SITE_TYPES_OPT },
  { id: "objetivo", section: "Objetivo", agentMessage: "Qual o objetivo principal do site?", inputType: "select", options: SITE_OBJETIVO_OPT },
  { id: "estilo", section: "Estilo", agentMessage: "Qual estilo visual combina mais com sua marca?", inputType: "select", options: SITE_ESTILO_OPT },

  // Seções desejadas (condicional ao tipo)
  { id: "secoes", section: "Seções", agentMessage: "Quais seções você quer no site? Pode marcar várias!", inputType: "multi-select", helpText: "Selecione as seções que farão parte do site.",
    dynamicOptions: (ctx, ans) => getSecoesForType(ans.siteType || "lp"),
  },

  // CTA (fechado)
  { id: "cta", section: "CTA", agentMessage: "Qual deve ser o CTA principal?", inputType: "select", options: CTA_OPTIONS },
  { id: "cta_custom", section: "CTA", agentMessage: "Qual o texto do CTA personalizado?", inputType: "text", placeholder: "Ex: Agende uma demonstração", optional: true,
    skipIf: (ans) => ans.cta !== "outro",
  },

  // Empresa (texto livre — dados únicos)
  { id: "nomeEmpresa", section: "Sobre a Empresa", agentMessage: "Qual o nome da empresa?", inputType: "text", placeholder: "Nome da empresa" },
  { id: "slogan", section: "Sobre a Empresa", agentMessage: "Tem um slogan? Se não tiver, pode pular!", inputType: "text", placeholder: "Ex: Transformando negócios desde 2010", optional: true },
  { id: "descricaoNegocio", section: "Sobre a Empresa", agentMessage: "Me descreve o negócio em poucas palavras.", inputType: "textarea", placeholder: "O que a empresa faz, pra quem, como..." },
  { id: "segmento", section: "Sobre a Empresa", agentMessage: "Qual o segmento de atuação?", inputType: "select", options: SEGMENTO_OPTIONS },
  { id: "servicos", section: "Sobre a Empresa", agentMessage: "Quais os principais serviços/produtos oferecidos?", inputType: "textarea", placeholder: "Liste os principais serviços ou produtos..." },
  { id: "diferencial", section: "Sobre a Empresa", agentMessage: "Qual o principal diferencial?", inputType: "text", placeholder: "Ex: Atendimento 24h, garantia vitalícia..." },
  { id: "faixaPreco", section: "Sobre a Empresa", agentMessage: "Faixa de preço pra exibir no site?", inputType: "select", optional: true,
    options: FAIXA_PRECO_SITE,
  },

  // Público (fechado)
  { id: "publicoAlvo", section: "Público-Alvo", agentMessage: "Quem é o público-alvo? Marque os que se aplicam!", inputType: "multi-select",
    options: PUBLICO_ALVO_OPTIONS,
  },
  { id: "faixaEtaria", section: "Público-Alvo", agentMessage: "Qual a faixa etária do público?", inputType: "select", optional: true,
    options: FAIXA_ETARIA_OPTIONS,
  },
  { id: "dores", section: "Público-Alvo", agentMessage: "Quais as principais dores que o site deve resolver?", inputType: "multi-select", optional: true,
    options: DORES_SITE_OPTIONS,
  },

  // Prova social (condicional ao tipo de site)
  { id: "depoimentos_tem", section: "Prova Social", agentMessage: "Tem depoimentos de clientes pra incluir?", inputType: "select", optional: true,
    options: [{ value: "sim", label: "Sim, tenho" }, { value: "nao", label: "Não tenho" }],
    skipIf: (ans) => ans.siteType === "blog",
  },
  { id: "depoimentos", section: "Prova Social", agentMessage: "Ótimo! Cole os depoimentos aqui:", inputType: "textarea", placeholder: "Nome do cliente — depoimento...", optional: true,
    skipIf: (ans) => ans.depoimentos_tem !== "sim",
  },
  { id: "numerosImpacto_tem", section: "Prova Social", agentMessage: "Tem números de impacto? (Ex: 500+ clientes, 10 anos...)", inputType: "select", optional: true,
    options: [{ value: "sim", label: "Sim, tenho" }, { value: "nao", label: "Não tenho" }],
    skipIf: (ans) => ans.siteType === "portfolio" || ans.siteType === "blog",
  },
  { id: "numerosImpacto", section: "Prova Social", agentMessage: "Quais são esses números?", inputType: "text", placeholder: "Ex: 500+ clientes, 98% satisfação", optional: true,
    skipIf: (ans) => ans.numerosImpacto_tem !== "sim",
  },

  // Perguntas condicionais por tipo
  { id: "qtd_paginas", section: "Estrutura", agentMessage: "Quantas páginas você precisa?", inputType: "select",
    options: [{ value: "3", label: "3 páginas" }, { value: "5", label: "5 páginas" }, { value: "8", label: "8 páginas" }, { value: "10+", label: "10+ páginas" }],
    skipIf: (ans) => ans.siteType === "lp",
  },
  { id: "catalogo_produtos", section: "E-commerce", agentMessage: "Quantos produtos no catálogo?", inputType: "select",
    options: [{ value: "1-10", label: "1-10" }, { value: "11-50", label: "11-50" }, { value: "51-200", label: "51-200" }, { value: "200+", label: "200+" }],
    skipIf: (ans) => ans.siteType !== "ecommerce",
  },
  { id: "gateway_pagamento", section: "E-commerce", agentMessage: "Precisa de gateway de pagamento?", inputType: "select",
    options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não, só catálogo" }],
    skipIf: (ans) => ans.objetivo !== "vender_online",
  },
  { id: "cases_trabalhos", section: "Portfólio", agentMessage: "Quantos cases/trabalhos quer exibir?", inputType: "select",
    options: [{ value: "3-5", label: "3-5" }, { value: "6-10", label: "6-10" }, { value: "10+", label: "10+" }],
    skipIf: (ans) => ans.siteType !== "portfolio",
  },
  { id: "formulario_lead", section: "Lead", agentMessage: "Quer um formulário de captura de leads (lead magnet)?", inputType: "select",
    options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não preciso" }],
    skipIf: (ans) => ans.objetivo !== "gerar_leads",
  },
  { id: "secao_equipe", section: "Equipe", agentMessage: "Quer uma seção de equipe com fotos/bios?", inputType: "select",
    options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }],
    skipIf: (ans) => ans.objetivo !== "apresentar_empresa",
  },
  { id: "blog_integrado", section: "Blog", agentMessage: "Quer um blog integrado ao site?", inputType: "select",
    options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }],
    skipIf: (ans) => ans.siteType !== "institucional",
  },

  // Visual (fechado)
  { id: "coresPrincipais", section: "Identidade Visual", agentMessage: "Cores principais da marca?", inputType: "select", optional: true,
    options: COR_OPTIONS,
  },
  { id: "fontesPreferidas", section: "Identidade Visual", agentMessage: "Estilo de fonte preferido?", inputType: "select", optional: true,
    options: FONTE_OPTIONS,
  },
  { id: "tomComunicacao", section: "Identidade Visual", agentMessage: "Qual o tom de comunicação do site?", inputType: "select", optional: true,
    options: TOM_OPTIONS,
  },

  // Referências visuais (novo — multi-step)
  { id: "tem_referencia", section: "Referências", agentMessage: "Tem algum site de referência visual?", inputType: "select",
    options: [{ value: "sim", label: "Sim, tenho links" }, { value: "nao", label: "Não tenho" }],
  },
  { id: "referencia_url1", section: "Referências", agentMessage: "Cole o link da primeira referência:", inputType: "text", placeholder: "https://site-referencia.com", optional: true,
    skipIf: (ans) => ans.tem_referencia !== "sim",
  },
  { id: "referencia_url2", section: "Referências", agentMessage: "Tem mais algum link? (pode pular)", inputType: "text", placeholder: "https://outro-site.com", optional: true,
    skipIf: (ans) => ans.tem_referencia !== "sim" || !ans.referencia_url1,
  },
  { id: "referencia_url3", section: "Referências", agentMessage: "Último link de referência? (pode pular)", inputType: "text", placeholder: "https://mais-um-site.com", optional: true,
    skipIf: (ans) => ans.tem_referencia !== "sim" || !ans.referencia_url2,
  },
  { id: "referencia_gosta", section: "Referências", agentMessage: "O que você gosta nessas referências?", inputType: "multi-select", optional: true,
    options: [
      { value: "layout", label: "Layout" }, { value: "cores", label: "Cores" },
      { value: "tipografia", label: "Tipografia" }, { value: "animacoes", label: "Animações" },
      { value: "fotos", label: "Fotos" }, { value: "estilo_geral", label: "Estilo geral" },
    ],
    skipIf: (ans) => ans.tem_referencia !== "sim",
  },

  // Contato (texto livre — dados únicos)
  { id: "telefone", section: "Dados de Contato", agentMessage: "Telefone pra contato no site?", inputType: "text", placeholder: "(11) 99999-9999", optional: true },
  { id: "email", section: "Dados de Contato", agentMessage: "Email de contato?", inputType: "text", placeholder: "contato@empresa.com", optional: true },
  { id: "endereco", section: "Dados de Contato", agentMessage: "Endereço físico? (se quiser exibir no site)", inputType: "text", placeholder: "Rua, número, cidade...", optional: true },
  { id: "redesSociais", section: "Dados de Contato", agentMessage: "Links das redes sociais?", inputType: "textarea", placeholder: "Instagram, Facebook, LinkedIn...", optional: true },
  { id: "linkWhatsapp", section: "Dados de Contato", agentMessage: "Link do WhatsApp? (pra botão flutuante)", inputType: "text", placeholder: "https://wa.me/5511999999999", optional: true },

  // Extra
  { id: "instrucoes", section: "Instruções Extras", agentMessage: "Pra finalizar: alguma instrução adicional?", inputType: "textarea", placeholder: "Algo mais que queira incluir ou destacar...", optional: true },
];

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
