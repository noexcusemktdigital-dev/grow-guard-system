// @ts-nocheck
import { Crosshair, ShieldQuestion, Handshake, Target, Ban } from "lucide-react";

export const funnelStages = [
  { key: "prospeccao", label: "Prospecção", icon: Crosshair, color: "text-blue-400" },
  { key: "diagnostico", label: "Diagnóstico", icon: ShieldQuestion, color: "text-cyan-400" },
  { key: "negociacao", label: "Negociação", icon: Handshake, color: "text-purple-400" },
  { key: "fechamento", label: "Fechamento", icon: Target, color: "text-emerald-400" },
  { key: "objecoes", label: "Quebra de Objeções", icon: Ban, color: "text-amber-400" },
];

export const stageTutorials: Record<string, { title: string; objetivo: string; dicas: string[]; exemplos: string[] }> = {
  prospeccao: {
    title: "📞 Prospecção — Primeiro Contato",
    objetivo: "Abrir a conversa, gerar interesse e qualificar rapidamente se o lead tem potencial.",
    dicas: [
      "Comece com uma saudação personalizada (nome + contexto)",
      "Use um gancho de valor nos primeiros 10 segundos",
      "Faça 1-2 perguntas de qualificação rápida (BANT)",
      "Tenha uma CTA clara (agendar reunião, enviar material)",
      "Prepare variações: prospect receptivo, ocupado e resistente",
    ],
    exemplos: [
      "Oi [Nome], vi que a [Empresa] atua em [segmento]. Nós ajudamos empresas como a sua a [resultado]. Faz sentido conversar 15 min?",
      "[Nome], bom dia! Uma empresa parecida com a sua conseguiu [resultado] em [prazo]. Quero te mostrar como — posso te mandar um resumo?",
    ],
  },
  diagnostico: {
    title: "🔍 Diagnóstico — Entendendo o Cliente",
    objetivo: "Mapear a situação atual, desafios e necessidades para construir a proposta ideal.",
    dicas: [
      "Organize perguntas em blocos: Situação, Desafios, Impacto, Solução Ideal",
      "Use perguntas abertas para gerar conversa (nunca sim/não)",
      "Anote tudo — cada detalhe vira argumento de venda",
      "Demonstre expertise com dados e benchmarks do mercado",
      "Faça transições suaves entre os blocos",
    ],
    exemplos: [
      "Me conta como funciona o processo de [área] na empresa hoje?",
      "Se pudesse resolver UM problema agora, qual seria?",
      "Quanto isso está custando por mês em retrabalho / oportunidades perdidas?",
    ],
  },
  negociacao: {
    title: "💼 Negociação — Apresentando Valor",
    objetivo: "Conectar a solução com as dores descobertas e apresentar condições que fazem sentido.",
    dicas: [
      "Sempre apresente VALOR antes de PREÇO",
      "Use ancoragem: mostre o custo do problema antes da solução",
      "Prepare concessões estratégicas (nunca ceda grátis)",
      "Demonstre ROI com números concretos",
      "Tenha respostas prontas para objeções de preço",
    ],
    exemplos: [
      "Baseado no que você me contou, o custo de NÃO resolver isso é de R$[X]/mês. Nossa solução é R$[Y] — o payback é em [prazo].",
      "Temos 3 opções que se encaixam no que discutimos. Deixa eu te mostrar a que mais faz sentido pro seu cenário.",
    ],
  },
  fechamento: {
    title: "🎯 Fechamento — Concretizando a Venda",
    objetivo: "Identificar sinais de compra e conduzir naturalmente para o aceite.",
    dicas: [
      "Resuma os benefícios acordados antes de pedir o fechamento",
      "Use a técnica da 'alternativa de escolha' (não se, mas qual)",
      "Crie urgência legítima (vagas, preço, condição especial)",
      "Tenha o contrato/proposta pronto para envio imediato",
      "Defina próximos passos claros após o aceite",
    ],
    exemplos: [
      "Então, das opções que conversamos, qual faz mais sentido pra começar: o plano [A] ou o [B]?",
      "Perfeito! Vou enviar o contrato agora. Assim que assinar, já agendamos o onboarding pra [data].",
    ],
  },
  objecoes: {
    title: "🛡️ Quebra de Objeções — Contornando Resistências",
    objetivo: "Transformar objeções em oportunidades usando o framework Empatia → Pergunta → Reframe → Evidência.",
    dicas: [
      "Nunca discuta com o cliente — use empatia primeiro",
      "Faça uma pergunta para entender a objeção real",
      "Reframe: mude a perspectiva com dados ou exemplos",
      "Use cases de sucesso como evidência social",
      "Retome a negociação com naturalidade após contornar",
    ],
    exemplos: [
      "'Está caro' → 'Entendo! Me conta: comparado com o quê? Porque quando olhamos o ROI de [X]%...'",
      "'Preciso pensar' → 'Claro! O que especificamente você precisa avaliar? Posso te ajudar com algum dado?'",
      "'Já uso outro' → 'Legal! E como tem sido a experiência? O que faria diferença pra você?'",
    ],
  },
};

export const briefingQuestions: Record<string, { key: string; label: string; placeholder: string }[]> = {
  prospeccao: [
    { key: "Canal principal", label: "Qual o canal principal de prospecção?", placeholder: "Ex: WhatsApp, ligação, email, LinkedIn" },
    { key: "Dor do cliente", label: "Qual a principal dor do cliente?", placeholder: "Ex: Perda de clientes, baixa conversão, processo manual" },
    { key: "Tipo de contato", label: "Como é o primeiro contato?", placeholder: "Ex: Cold call, indicação, inbound" },
  ],
  diagnostico: [
    { key: "Perguntas de qualificação", label: "Quais perguntas você faz para qualificar?", placeholder: "Ex: Orçamento, necessidade, prazo, decisor" },
    { key: "Critérios de qualificação", label: "Qual framework de qualificação?", placeholder: "Ex: BANT, SPIN, GPCT, MEDDIC" },
    { key: "Tempo médio", label: "Quanto tempo dura uma reunião de diagnóstico?", placeholder: "Ex: 30min, 1h" },
  ],
  negociacao: [
    { key: "Diferencial competitivo", label: "Qual o diferencial competitivo?", placeholder: "Ex: Atendimento, tecnologia, preço, exclusividade" },
    { key: "Faixa de preço", label: "Qual a faixa de preço?", placeholder: "Ex: R$500-2000/mês, ticket médio de R$5000" },
    { key: "Política de desconto", label: "Existe política de desconto?", placeholder: "Ex: Até 10% para pagamento anual" },
  ],
  fechamento: [
    { key: "Urgência", label: "Qual a urgência típica de fechamento?", placeholder: "Ex: 7 dias, 30 dias, sem prazo definido" },
    { key: "Período de teste", label: "Oferece período de teste?", placeholder: "Ex: 7 dias grátis, demonstração, POC" },
    { key: "Formalização", label: "Como é a formalização?", placeholder: "Ex: Contrato digital, proposta + aceite, pedido de compra" },
  ],
  objecoes: [
    { key: "Objeções comuns", label: "Quais as 3 objeções mais comuns?", placeholder: "Ex: Preço alto, já uso outro, preciso pensar" },
    { key: "Concorrente principal", label: "Quem é o concorrente principal?", placeholder: "Ex: Empresa X, solução Y, fazer internamente" },
    { key: "Argumento matador", label: "Qual seu melhor argumento contra objeções?", placeholder: "Ex: ROI comprovado, cases de sucesso, garantia" },
  ],
};
