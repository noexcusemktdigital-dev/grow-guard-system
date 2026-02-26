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
   SOFIA — Estratégia de Marketing (~30 questions, 9 sections)
   ══════════════════════════════════════════════ */

export const SOFIA_STEPS: BriefingStep[] = [
  // ── Intro
  { id: "_intro_sofia", agentMessage: "Oi! 👋 Sou a Sofia, sua consultora de marketing. Vou fazer um diagnóstico completo do seu marketing em poucos minutos. Vamos começar?", inputType: "info" },

  // ── 1. Seu Negócio
  { id: "segmento", section: "Seu Negócio", agentMessage: "Pra começar, me conta: qual o segmento da sua empresa?", inputType: "select", helpText: "O segmento define o tipo de mercado em que você atua. Isso ajuda a personalizar toda a estratégia.",
    options: [
      { value: "servicos", label: "Serviços" }, { value: "varejo", label: "Varejo / Loja" },
      { value: "alimentacao", label: "Alimentação" }, { value: "saude", label: "Saúde / Estética" },
      { value: "educacao", label: "Educação" }, { value: "tecnologia", label: "Tecnologia" },
      { value: "industria", label: "Indústria" }, { value: "outro", label: "Outro" },
    ],
  },
  { id: "tempo_mercado", section: "Seu Negócio", agentMessage: "Há quanto tempo sua empresa está no mercado?", inputType: "select", helpText: "Empresas mais novas precisam de estratégias de awareness, enquanto empresas maduras focam em escala e retenção.",
    options: [
      { value: "0-1", label: "Menos de 1 ano" }, { value: "1-3", label: "1 a 3 anos" },
      { value: "3-5", label: "3 a 5 anos" }, { value: "5+", label: "Mais de 5 anos" },
    ],
  },
  { id: "modelo_negocio", section: "Seu Negócio", agentMessage: "E o modelo de negócio? Vende pra empresas (B2B) ou consumidor final (B2C)?", inputType: "select", helpText: "B2B e B2C demandam canais, tom e funis completamente diferentes.",
    options: [
      { value: "b2b", label: "B2B (empresas)" }, { value: "b2c", label: "B2C (consumidor final)" },
      { value: "ambos", label: "Ambos" },
    ],
  },
  { id: "num_funcionarios", section: "Seu Negócio", agentMessage: "Quantos funcionários tem na empresa?", inputType: "select", helpText: "O tamanho da equipe influencia a capacidade de execução do marketing.",
    options: [
      { value: "1-5", label: "1 a 5" }, { value: "6-20", label: "6 a 20" },
      { value: "21-50", label: "21 a 50" }, { value: "51-200", label: "51 a 200" },
      { value: "200+", label: "200+" },
    ],
  },

  // ── 2. Financeiro
  { id: "faturamento", section: "Financeiro", agentMessage: "Qual o faturamento mensal aproximado da empresa?", inputType: "select", helpText: "O faturamento ajuda a dimensionar o investimento ideal em marketing (recomendado: 5-15% do faturamento).",
    options: [
      { value: "0-10k", label: "Até R$ 10 mil" }, { value: "10-30k", label: "R$ 10-30 mil" },
      { value: "30-50k", label: "R$ 30-50 mil" }, { value: "50-100k", label: "R$ 50-100 mil" },
      { value: "100-300k", label: "R$ 100-300 mil" }, { value: "300k-1m", label: "R$ 300 mil - 1M" },
      { value: "1-5m", label: "R$ 1-5 milhões" }, { value: "5-10m", label: "R$ 5-10 milhões" },
    ],
  },
  { id: "ticket_medio", section: "Financeiro", agentMessage: "E o ticket médio do seu produto ou serviço?", inputType: "select", helpText: "Ticket médio é o valor médio de cada venda. Influencia diretamente no ROI das campanhas.",
    options: [
      { value: "0-100", label: "Até R$ 100" }, { value: "100-500", label: "R$ 100-500" },
      { value: "500-2k", label: "R$ 500-2 mil" }, { value: "2-5k", label: "R$ 2-5 mil" },
      { value: "5-15k", label: "R$ 5-15 mil" }, { value: "15k+", label: "R$ 15 mil+" },
    ],
  },

  // ── 3. Seu Público
  { id: "cliente_ideal", section: "Seu Público", agentMessage: "Me descreve seu cliente ideal. Quanto mais detalhes, melhor o diagnóstico!", inputType: "textarea", helpText: "A persona é uma representação semi-fictícia do seu cliente ideal. Quanto mais detalhada, melhor será a segmentação das campanhas.", placeholder: "Ex: Mulheres de 25-40 anos, classe B, que buscam praticidade..." },
  { id: "faixa_etaria", section: "Seu Público", agentMessage: "Qual a faixa etária principal do público?", inputType: "select", helpText: "A faixa etária define tom, canal e formato de conteúdo mais eficaz.",
    options: [
      { value: "18-24", label: "18-24 anos" }, { value: "25-34", label: "25-34 anos" },
      { value: "35-44", label: "35-44 anos" }, { value: "45+", label: "45+ anos" },
    ],
  },
  { id: "onde_esta", section: "Seu Público", agentMessage: "Onde seu público está mais presente? Pode marcar mais de um!", inputType: "multi-select", helpText: "Saber onde seu público navega ajuda a direcionar investimento e conteúdo nos canais certos.",
    options: [
      { value: "instagram", label: "Instagram" }, { value: "facebook", label: "Facebook" },
      { value: "tiktok", label: "TikTok" }, { value: "google", label: "Google" },
      { value: "whatsapp", label: "WhatsApp" }, { value: "youtube", label: "YouTube" },
      { value: "linkedin", label: "LinkedIn" },
    ],
  },
  { id: "como_decide", section: "Seu Público", agentMessage: "E como o cliente decide a compra? Pode marcar vários!", inputType: "multi-select", helpText: "Entender o processo decisório ajuda a criar conteúdos para cada etapa do funil.",
    options: [
      { value: "indicacao", label: "Indicação" }, { value: "google", label: "Pesquisa no Google" },
      { value: "redes", label: "Redes sociais" }, { value: "preco", label: "Preço" },
      { value: "marca", label: "Confiança na marca" }, { value: "presencial", label: "Visita presencial" },
    ],
  },

  // ── 4. Concorrência
  { id: "qtd_concorrentes", section: "Concorrência", agentMessage: "Quantos concorrentes diretos você tem na região?", inputType: "select", helpText: "Concorrentes diretos são empresas que vendem produtos/serviços similares para o mesmo público.",
    options: [
      { value: "1-3", label: "1 a 3" }, { value: "4-10", label: "4 a 10" },
      { value: "10+", label: "Mais de 10" }, { value: "nao_sei", label: "Não sei" },
    ],
  },
  { id: "concorrentes_digital", section: "Concorrência", agentMessage: "Seus concorrentes investem em marketing digital?", inputType: "select", helpText: "Se seus concorrentes investem pesado, você precisa ser mais estratégico para competir.",
    options: [
      { value: "nao", label: "Não investem" }, { value: "pouco", label: "Pouco" },
      { value: "bastante", label: "Sim, bastante" }, { value: "referencia", label: "São referência" },
    ],
  },
  { id: "diferencial", section: "Concorrência", agentMessage: "Qual seu principal diferencial competitivo? O que te torna único?", inputType: "textarea", helpText: "Seu diferencial é o que te torna único. Ele será a base da comunicação da marca.", placeholder: "Ex: Atendimento personalizado, preço justo, rapidez na entrega..." },

  // ── 5. Presença Digital
  { id: "redes_ativas", section: "Presença Digital", agentMessage: "Quais redes sociais sua empresa usa ativamente? (pelo menos 1x por semana)", inputType: "multi-select", helpText: "Redes ativas são aquelas que você publica pelo menos 1x por semana.",
    options: [
      { value: "instagram", label: "Instagram" }, { value: "facebook", label: "Facebook" },
      { value: "tiktok", label: "TikTok" }, { value: "linkedin", label: "LinkedIn" },
      { value: "youtube", label: "YouTube" }, { value: "twitter", label: "Twitter / X" },
      { value: "nenhuma", label: "Nenhuma" },
    ],
  },
  { id: "url_rede", section: "Presença Digital", agentMessage: "Me passa o link do Instagram ou principal rede social — quero dar uma espiada! 😊", inputType: "text", helpText: "Usamos para analisar sua presença atual e sugerir melhorias.", placeholder: "https://instagram.com/suaempresa", optional: true,
    skipIf: (ans) => { const redes = ans.redes_ativas; return !Array.isArray(redes) || redes.length === 0 || redes.includes("nenhuma"); },
  },
  { id: "freq_publicacao", section: "Presença Digital", agentMessage: "Com que frequência você publica conteúdo?", inputType: "select", helpText: "Consistência é mais importante que volume. Publicar regularmente aumenta o alcance orgânico.",
    options: [
      { value: "nunca", label: "Não publico" }, { value: "esporadico", label: "Esporadicamente" },
      { value: "semanal", label: "Semanalmente" }, { value: "diario", label: "Diariamente" },
    ],
  },
  { id: "tem_site", section: "Presença Digital", agentMessage: "Possui site ou landing page?", inputType: "select", helpText: "Um site otimizado é essencial para captura de leads e credibilidade da marca.",
    options: [
      { value: "nao", label: "Não possui" }, { value: "desatualizado", label: "Sim, desatualizado" },
      { value: "atualizado", label: "Sim, atualizado" }, { value: "otimizado", label: "Sim, otimizado p/ SEO" },
    ],
  },
  { id: "url_site", section: "Presença Digital", agentMessage: "Qual a URL do site?", inputType: "text", helpText: "Analisamos para verificar SEO, velocidade e conversão.", placeholder: "https://suaempresa.com.br", optional: true,
    skipIf: (ans) => ans.tem_site === "nao" || !ans.tem_site,
  },

  // ── 6. Tráfego e Vendas
  { id: "investe_trafego", section: "Tráfego e Vendas", agentMessage: "Investe em tráfego pago atualmente? (Google Ads, Meta Ads...)", inputType: "select", helpText: "Tráfego pago é a forma mais rápida de gerar leads qualificados.",
    options: [
      { value: "nunca", label: "Nunca investi" }, { value: "testou", label: "Já testei sem resultado" },
      { value: "mensal", label: "Invisto mensalmente" }, { value: "otimizado", label: "Tenho campanha otimizada" },
    ],
  },
  { id: "valor_trafego", section: "Tráfego e Vendas", agentMessage: "Quanto investe em tráfego por mês?", inputType: "select", helpText: "O investimento ideal em tráfego depende do CAC desejado e do ticket médio.",
    options: [
      { value: "0", label: "Não invisto" }, { value: "0-500", label: "Até R$ 500" },
      { value: "500-2k", label: "R$ 500-2 mil" }, { value: "2-5k", label: "R$ 2-5 mil" },
      { value: "5-15k", label: "R$ 5-15 mil" }, { value: "15k+", label: "R$ 15 mil+" },
    ],
  },
  { id: "leads_mes", section: "Tráfego e Vendas", agentMessage: "Quantos leads você recebe por mês?", inputType: "select", helpText: "Leads são potenciais clientes que demonstraram interesse no seu produto/serviço.",
    options: [
      { value: "0-10", label: "0 a 10" }, { value: "11-30", label: "11 a 30" },
      { value: "31-100", label: "31 a 100" }, { value: "100-500", label: "100 a 500" },
      { value: "500+", label: "500+" },
    ],
  },
  { id: "taxa_conversao", section: "Tráfego e Vendas", agentMessage: "Qual a taxa de conversão estimada de lead para venda?", inputType: "select", helpText: "A taxa de conversão é o percentual de leads que se tornam clientes. Média do mercado: 5-15%.",
    options: [
      { value: "nao_sei", label: "Não sei" }, { value: "0-5", label: "Menos de 5%" },
      { value: "5-15", label: "5% a 15%" }, { value: "15-30", label: "15% a 30%" },
      { value: "30+", label: "Mais de 30%" },
    ],
  },

  // ── 7. Métricas CAC / LTV
  { id: "sabe_cac", section: "Métricas CAC / LTV", agentMessage: "Você sabe quanto custa adquirir um cliente (CAC)?", inputType: "select", helpText: "CAC (Custo de Aquisição de Cliente) é o total investido em marketing e vendas dividido pelo número de clientes adquiridos.",
    options: [
      { value: "nao_sei", label: "Não sei" }, { value: "0-50", label: "Até R$ 50" },
      { value: "50-200", label: "R$ 50-200" }, { value: "200-500", label: "R$ 200-500" },
      { value: "500+", label: "R$ 500+" },
    ],
  },
  { id: "ltv_medio", section: "Métricas CAC / LTV", agentMessage: "Quanto tempo em média um cliente fica com você?", inputType: "select", helpText: "LTV (Lifetime Value) é a receita total que um cliente gera. Quanto maior o LTV vs CAC, mais saudável o negócio.",
    options: [
      { value: "unica", label: "Compra única" }, { value: "1-3", label: "1 a 3 meses" },
      { value: "3-12", label: "3 a 12 meses" }, { value: "1ano+", label: "Mais de 1 ano" },
    ],
  },
  { id: "processo_recompra", section: "Métricas CAC / LTV", agentMessage: "Tem algum processo de recompra ou fidelização?", inputType: "select", helpText: "Um programa de fidelização pode reduzir o CAC em até 60%.",
    options: [
      { value: "nao", label: "Não tenho" }, { value: "informal", label: "Informal" },
      { value: "estruturado", label: "Sim, estruturado" },
    ],
  },

  // ── 8. Gestão de Dados
  { id: "usa_crm", section: "Gestão de Dados", agentMessage: "Usa algum CRM ou planilha para gerenciar leads e clientes?", inputType: "select", helpText: "CRM centraliza dados de leads e clientes para acompanhar o funil de vendas.",
    options: [
      { value: "nao", label: "Não gerencio" }, { value: "planilha", label: "Planilha" },
      { value: "crm_basico", label: "CRM básico" }, { value: "crm_pro", label: "CRM profissional" },
    ],
  },
  { id: "historico_dados", section: "Gestão de Dados", agentMessage: "Tem histórico de dados dos seus clientes?", inputType: "select", helpText: "Dados históricos permitem segmentar campanhas e personalizar comunicações.",
    options: [
      { value: "nenhum", label: "Nenhum" }, { value: "parcial", label: "Parcial" },
      { value: "completo", label: "Sim, completo" },
    ],
  },
  { id: "estrategias_offline", section: "Gestão de Dados", agentMessage: "Usa estratégias de marketing além do digital?", inputType: "multi-select", helpText: "Integrar estratégias offline com digital amplia o alcance.",
    options: [
      { value: "eventos", label: "Eventos" }, { value: "panfletos", label: "Panfletos" },
      { value: "networking", label: "Networking" }, { value: "parcerias", label: "Parcerias locais" },
      { value: "indicacao", label: "Indicação" }, { value: "nenhuma", label: "Nenhuma" },
    ],
  },

  // ── 9. Objetivos e Dores
  { id: "meta_principal", section: "Objetivos e Dores", agentMessage: "Quase lá! Qual seu objetivo principal com o marketing?", inputType: "select", helpText: "Definir um objetivo claro permite focar os esforços e medir o sucesso.",
    options: [
      { value: "leads", label: "Gerar mais leads" }, { value: "vendas", label: "Aumentar vendas" },
      { value: "autoridade", label: "Construir autoridade" }, { value: "reconhecimento", label: "Reconhecimento de marca" },
    ],
  },
  { id: "prazo", section: "Objetivos e Dores", agentMessage: "Em quanto tempo espera ver resultados?", inputType: "select", helpText: "Marketing digital geralmente leva 3-6 meses para resultados consistentes.",
    options: [
      { value: "1-2", label: "1-2 meses" }, { value: "3-4", label: "3-4 meses" },
      { value: "5-6", label: "5-6 meses" }, { value: "6+", label: "Mais de 6 meses" },
    ],
  },
  { id: "dificuldades", section: "Objetivos e Dores", agentMessage: "Quais são suas maiores dificuldades no marketing? Pode marcar várias!", inputType: "multi-select", helpText: "Conhecer suas dores permite priorizar ações e recomendar soluções específicas.",
    options: [
      { value: "tempo", label: "Falta de tempo" }, { value: "conteudo", label: "Não sei o que postar" },
      { value: "leads", label: "Não gero leads" }, { value: "equipe", label: "Não tenho equipe" },
      { value: "engajamento", label: "Baixo engajamento" }, { value: "trafego", label: "Não sei usar tráfego pago" },
      { value: "cac_ltv", label: "Não sei meu CAC/LTV" }, { value: "dados", label: "Dados desorganizados" },
      { value: "concorrencia", label: "Concorrência forte" },
    ],
  },
  { id: "tentativas", section: "Objetivos e Dores", agentMessage: "Pra finalizar: o que já tentou que não funcionou?", inputType: "textarea", helpText: "Saber o que não funcionou evita repetir erros.", placeholder: "Ex: Contratei um social media, mas não deu resultado...", optional: true },
];

/* ══════════════════════════════════════════════
   RAFAEL — Plano de Vendas (~25 questions, 8 sections)
   ══════════════════════════════════════════════ */

export const RAFAEL_STEPS: BriefingStep[] = [
  { id: "_intro_rafael", agentMessage: "Oi! 👋 Sou o Rafael, seu consultor comercial. Vou analisar sua operação de vendas e criar um plano de ação personalizado. Bora?", inputType: "info" },

  // ── 1. Sobre o Negócio
  { id: "segmento", section: "Sobre o Negócio", agentMessage: "Qual é o segmento da sua empresa?", inputType: "select", helpText: "Identifique o setor principal de atuação para personalizar as recomendações.",
    options: [
      { value: "servicos", label: "Serviços" }, { value: "varejo", label: "Varejo / Loja" },
      { value: "alimentacao", label: "Alimentação" }, { value: "saude", label: "Saúde / Estética" },
      { value: "educacao", label: "Educação" }, { value: "tecnologia", label: "Tecnologia" },
      { value: "industria", label: "Indústria" }, { value: "outro", label: "Outro" },
    ],
  },
  { id: "modelo_negocio", section: "Sobre o Negócio", agentMessage: "Modelo de negócio: B2B, B2C ou ambos?", inputType: "select", helpText: "Saber se vende para empresas ou consumidor final muda toda a estratégia de abordagem.",
    options: [
      { value: "b2b", label: "B2B (empresas)" }, { value: "b2c", label: "B2C (consumidor final)" },
      { value: "ambos", label: "Ambos" },
    ],
  },
  { id: "tempo_mercado", section: "Sobre o Negócio", agentMessage: "Há quanto tempo no mercado?", inputType: "select", helpText: "Empresas mais novas priorizam aquisição, maduras focam em retenção.",
    options: [
      { value: "0-1", label: "Menos de 1 ano" }, { value: "1-3", label: "1 a 3 anos" },
      { value: "3-5", label: "3 a 5 anos" }, { value: "5+", label: "Mais de 5 anos" },
    ],
  },
  { id: "num_funcionarios", section: "Sobre o Negócio", agentMessage: "Quantos funcionários na empresa?", inputType: "select", helpText: "O tamanho determina o nível de complexidade e automação.",
    options: [
      { value: "1", label: "Só eu" }, { value: "2-5", label: "2 a 5" },
      { value: "6-20", label: "6 a 20" }, { value: "21-50", label: "21 a 50" },
      { value: "51+", label: "51+" },
    ],
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
  { id: "cadencia_followup", section: "Gestão de Leads", agentMessage: "Qual a cadência de follow-up?", inputType: "select", helpText: "Quanto mais rápido o follow-up, maior a conversão.",
    options: [
      { value: "nenhuma", label: "Não tenho cadência" }, { value: "7d", label: "A cada 7+ dias" },
      { value: "2-3d", label: "A cada 2-3 dias" }, { value: "diario", label: "Diário" },
    ],
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
];

/* ══════════════════════════════════════════════
   LUNA — Conteúdos (~8 questions)
   ══════════════════════════════════════════════ */

const MESES_OPT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
].map(m => ({ value: `${m} 2026`, label: `${m} 2026` }));

const OBJETIVOS_CONTENT = [
  "Gerar leads", "Aumentar engajamento", "Lançar produto", "Vender mais", "Fortalecer marca",
].map(o => ({ value: o, label: o }));

const TONS_OPT = ["Educativo", "Inspirador", "Direto", "Storytelling", "Misto"].map(t => ({ value: t, label: t }));

export const LUNA_STEPS: BriefingStep[] = [
  { id: "_intro_luna", agentMessage: "Oi! 👋 Sou a Luna, sua estrategista de conteúdo. Vou montar uma campanha completa pra você em poucos minutos!", inputType: "info" },
  { id: "mes", agentMessage: "Pra qual mês você quer essa campanha?", inputType: "select", options: MESES_OPT },
  { id: "objetivos", agentMessage: "Qual o foco principal? Pode marcar mais de um!", inputType: "multi-select", options: OBJETIVOS_CONTENT, helpText: "A IA vai equilibrar os conteúdos entre os objetivos selecionados." },
  { id: "tema", agentMessage: "Me conta o tema central dessa campanha. Pode ser algo como 'Automação', 'Black Friday', 'Lançamento'...", inputType: "text", placeholder: "Ex: Mês da Automação, Crescimento Inteligente..." },
  { id: "tom", agentMessage: "E o tom de voz? Como a marca quer 'falar' nessa campanha?", inputType: "select", options: TONS_OPT, helpText: "Educativo ensina, Inspirador motiva, Direto vende." },
  { id: "promocoes", agentMessage: "Tem alguma promoção ou oferta especial pra incluir? Se não tiver, pode pular!", inputType: "textarea", placeholder: "Ex: 30% off plano anual", optional: true },
  { id: "datas", agentMessage: "Alguma data comemorativa importante nesse mês?", inputType: "textarea", placeholder: "Ex: Dia da Mulher (08/03)", optional: true },
  { id: "destaques", agentMessage: "Tem algum destaque ou novidade pra incluir?", inputType: "textarea", placeholder: "Ex: Novo recurso, case de sucesso...", optional: true },
  { id: "persona_nome", agentMessage: "Qual o nome/perfil da persona dessa campanha?", inputType: "text", placeholder: "Ex: Maria, 38 anos, dona de franquia", optional: true, helpText: "Persona ajuda a personalizar o tom e abordagem." },
  { id: "persona_descricao", agentMessage: "Me descreve essa persona: idade, profissão, dores, desejos...", inputType: "textarea", placeholder: "Idade, profissão, dores, desejos, comportamento...", optional: true,
    skipIf: (ans) => !ans.persona_nome,
  },
];

/* ══════════════════════════════════════════════
   THEO — Artes / Redes Sociais (~8 questions)
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

export const THEO_STEPS: BriefingStep[] = [
  { id: "_intro_theo", agentMessage: "E aí! 👋 Sou o Theo, seu diretor de arte. Vou criar artes incríveis pra suas redes sociais. Me conta o que precisa!", inputType: "info" },
  { id: "tipo_post", agentMessage: "Que tipo de post você quer criar?", inputType: "select", options: TIPOS_POST_OPT, helpText: "Define a composição visual da arte." },
  { id: "nivel", agentMessage: "Qual o nível de qualidade?", inputType: "select", options: NIVEIS_OPT, helpText: "Alto Padrão gera imagens ultra-premium." },
  { id: "mes", agentMessage: "Pra qual mês?", inputType: "select", options: MESES_OPT },
  { id: "objetivo", agentMessage: "Qual o objetivo dessa criação?", inputType: "select", options: OBJETIVOS_ART },
  { id: "estilo", agentMessage: "E o estilo visual?", inputType: "select", options: ESTILOS_ART, helpText: "Minimalista, Bold, Corporativo, etc." },
  { id: "temas", agentMessage: "Tem algum tema visual específico?", inputType: "text", placeholder: "Ex: Tecnologia, crescimento, natureza...", optional: true },
  { id: "promocoes", agentMessage: "Promoções ou ofertas pra incluir?", inputType: "textarea", placeholder: "Ex: 20% OFF no plano anual", optional: true },
  { id: "obs", agentMessage: "Alguma observação ou instrução adicional?", inputType: "textarea", placeholder: "Instruções adicionais...", optional: true },
  { id: "descricao_produto", agentMessage: "Descreve o produto/serviço (materiais, cores, formato...)", inputType: "textarea", placeholder: "Descreva: materiais, cores, formato...", optional: true,
    skipIf: (ans) => ans.tipo_post !== "produto" && ans.tipo_post !== "servico",
  },
  { id: "persona_nome", agentMessage: "Tem uma persona definida? Me diz o nome/perfil!", inputType: "text", placeholder: "Ex: Maria, 38 anos", optional: true },
  { id: "persona_descricao", agentMessage: "Descreve essa persona pra mim!", inputType: "textarea", placeholder: "Idade, profissão, dores, desejos...", optional: true,
    skipIf: (ans) => !ans.persona_nome,
  },
];

/* ══════════════════════════════════════════════
   ALEX — Sites (~22 questions grouped)
   ══════════════════════════════════════════════ */

const SITE_TYPES_OPT = [
  { value: "lp", label: "Landing Page", desc: "Página única para captura" },
  { value: "institucional", label: "Site Institucional", desc: "Multi-páginas" },
  { value: "portfolio", label: "Portfólio", desc: "Showcase de trabalhos" },
  { value: "ecommerce", label: "E-commerce", desc: "Loja virtual" },
];

const SITE_OBJETIVO_OPT = [
  { value: "gerar_leads", label: "Gerar Leads" }, { value: "vender_online", label: "Vender Online" },
  { value: "apresentar_empresa", label: "Apresentar Empresa" }, { value: "portfolio", label: "Mostrar Portfólio" },
];

const SITE_ESTILO_OPT = [
  { value: "minimalista", label: "Minimalista" }, { value: "moderno", label: "Moderno" },
  { value: "corporativo", label: "Corporativo" }, { value: "bold", label: "Bold / Impactante" },
  { value: "elegante", label: "Elegante" },
];

export const ALEX_STEPS: BriefingStep[] = [
  { id: "_intro_alex", agentMessage: "Olá! 👋 Sou o Alex, seu arquiteto web. Vou criar um site profissional pra você. Me conta tudo sobre o projeto!", inputType: "info" },

  // Tipo e objetivo
  { id: "siteType", section: "Tipo de Site", agentMessage: "Que tipo de site você precisa?", inputType: "select", options: SITE_TYPES_OPT },
  { id: "objetivo", section: "Objetivo", agentMessage: "Qual o objetivo principal do site?", inputType: "select", options: SITE_OBJETIVO_OPT },
  { id: "estilo", section: "Estilo", agentMessage: "Qual estilo visual combina mais com sua marca?", inputType: "select", options: SITE_ESTILO_OPT },
  { id: "cta", section: "Estilo", agentMessage: "Qual deve ser o CTA principal? (Ex: 'Solicitar Orçamento', 'Comprar Agora')", inputType: "text", placeholder: "Ex: Agende uma demonstração", optional: true },

  // Empresa
  { id: "nomeEmpresa", section: "Sobre a Empresa", agentMessage: "Qual o nome da empresa?", inputType: "text", placeholder: "Nome da empresa" },
  { id: "slogan", section: "Sobre a Empresa", agentMessage: "Tem um slogan? Se não tiver, pode pular!", inputType: "text", placeholder: "Ex: Transformando negócios desde 2010", optional: true },
  { id: "descricaoNegocio", section: "Sobre a Empresa", agentMessage: "Me descreve o negócio em poucas palavras.", inputType: "textarea", placeholder: "O que a empresa faz, pra quem, como..." },
  { id: "segmento", section: "Sobre a Empresa", agentMessage: "Qual o segmento de atuação?", inputType: "text", placeholder: "Ex: Tecnologia, Alimentação, Saúde..." },
  { id: "servicos", section: "Sobre a Empresa", agentMessage: "Quais os principais serviços/produtos oferecidos?", inputType: "textarea", placeholder: "Liste os principais serviços ou produtos..." },
  { id: "diferencial", section: "Sobre a Empresa", agentMessage: "Qual o principal diferencial?", inputType: "text", placeholder: "Ex: Atendimento 24h, garantia vitalícia..." },
  { id: "faixaPreco", section: "Sobre a Empresa", agentMessage: "Tem faixa de preço pra exibir no site?", inputType: "text", placeholder: "Ex: A partir de R$ 299/mês", optional: true },

  // Público
  { id: "publicoAlvo", section: "Público-Alvo", agentMessage: "Quem é o público-alvo?", inputType: "textarea", placeholder: "Descreva seu público ideal..." },
  { id: "faixaEtaria", section: "Público-Alvo", agentMessage: "Qual a faixa etária do público?", inputType: "text", placeholder: "Ex: 25-45 anos", optional: true },
  { id: "dores", section: "Público-Alvo", agentMessage: "Quais as principais dores que o site deve resolver?", inputType: "textarea", placeholder: "Ex: Falta de tempo, dificuldade em encontrar...", optional: true },

  // Prova social
  { id: "depoimentos", section: "Prova Social", agentMessage: "Tem depoimentos de clientes pra incluir?", inputType: "textarea", placeholder: "Cole depoimentos ou escreva resumos...", optional: true },
  { id: "numerosImpacto", section: "Prova Social", agentMessage: "Tem números de impacto? (Ex: 500+ clientes, 10 anos...)", inputType: "text", placeholder: "Ex: 500+ clientes, 98% satisfação", optional: true },

  // Visual
  { id: "coresPrincipais", section: "Identidade Visual", agentMessage: "Cores principais da marca? (pode colar hex ou descrever)", inputType: "text", placeholder: "Ex: Azul #1e40af, Branco", optional: true },
  { id: "fontesPreferidas", section: "Identidade Visual", agentMessage: "Tem fontes preferidas?", inputType: "text", placeholder: "Ex: Inter, Montserrat", optional: true },
  { id: "tomComunicacao", section: "Identidade Visual", agentMessage: "Qual o tom de comunicação? (formal, descontraído, técnico...)", inputType: "text", placeholder: "Ex: Profissional mas acessível", optional: true },
  { id: "referenciaVisual", section: "Identidade Visual", agentMessage: "Tem algum site de referência visual?", inputType: "text", placeholder: "https://site-referencia.com", optional: true },

  // Contato
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
