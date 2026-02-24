export interface PlaybookStep {
  titulo: string;
  descricao: string;
  passos?: string[];
  script?: string;
  checklist?: string[];
  dicas?: string[];
}

export interface Playbook {
  id: string;
  titulo: string;
  categoria: "Abordagem" | "Análise" | "Objeções" | "Fechamento";
  descricao: string;
  icone: string;
  secoes: PlaybookStep[];
}

export const PLAYBOOK_CATEGORIAS = ["Abordagem", "Análise", "Objeções", "Fechamento"] as const;

export const playbooks: Playbook[] = [
  {
    id: "primeiro-contato",
    titulo: "Primeiro Contato",
    categoria: "Abordagem",
    descricao: "Como abordar um prospect pela primeira vez — por telefone ou WhatsApp — de forma profissional e estratégica.",
    icone: "Phone",
    secoes: [
      {
        titulo: "Checklist Pré-Contato",
        descricao: "Antes de ligar ou enviar mensagem, prepare-se:",
        checklist: [
          "Pesquisar o prospect no Google e redes sociais",
          "Identificar o segmento e porte da empresa",
          "Verificar se já existe algum histórico no CRM",
          "Definir o objetivo da abordagem (agendar reunião, apresentar serviço)",
          "Preparar uma frase de abertura personalizada",
          "Ter em mãos o catálogo de serviços NOE",
        ],
      },
      {
        titulo: "Script Telefone",
        descricao: "Roteiro para ligação telefônica:",
        script: `Olá, [Nome]! Tudo bem? Meu nome é [Seu Nome], sou da NOEXCUSE Marketing Estratégico.

Estou entrando em contato porque vi que a [Empresa] atua no segmento de [segmento] e acredito que podemos ajudar vocês a [benefício específico — ex: aumentar a captação de clientes online].

Temos cases no setor de vocês com resultados bem expressivos. Seria possível agendarmos 15 minutinhos para eu mostrar como funcionaria para a [Empresa]?

[Se sim] Ótimo! Qual o melhor dia e horário para você?
[Se não agora] Entendo perfeitamente. Posso enviar um material rápido por WhatsApp para você avaliar quando tiver um momento?`,
      },
      {
        titulo: "Script WhatsApp",
        descricao: "Mensagem para primeiro contato via WhatsApp:",
        script: `Olá, [Nome]! 👋

Me chamo [Seu Nome], da NOEXCUSE Marketing Estratégico.

Percebi que a [Empresa] tem um potencial enorme no digital e gostaria de compartilhar algumas ideias que podem ajudar vocês a [benefício].

Posso enviar um diagnóstico gratuito da presença digital de vocês? Leva apenas 5 minutos para analisar. 📊

Fico no aguardo! 😊`,
      },
      {
        titulo: "Erros Comuns",
        descricao: "O que NÃO fazer no primeiro contato:",
        dicas: [
          "❌ Não fale só de você e da empresa — foque no prospect",
          "❌ Não envie áudios longos no WhatsApp (máx. 30 segundos)",
          "❌ Não seja genérico — personalize sempre",
          "❌ Não insista se o prospect disser que não tem interesse agora — registre e agende follow-up",
          "❌ Não mande propostas sem antes qualificar o lead",
        ],
      },
    ],
  },
  {
    id: "follow-up",
    titulo: "Follow-up Estratégico",
    categoria: "Abordagem",
    descricao: "Cadência de follow-up para manter o lead engajado sem ser invasivo.",
    icone: "CalendarClock",
    secoes: [
      {
        titulo: "Cadência Recomendada",
        descricao: "Siga essa sequência para maximizar conversões:",
        passos: [
          "Dia 1: Primeiro contato (telefone + WhatsApp de reforço)",
          "Dia 3: Follow-up leve por WhatsApp — 'Vi que ainda não conseguimos conversar...'",
          "Dia 7: Envio de conteúdo de valor (case, artigo, vídeo relevante)",
          "Dia 14: Último follow-up — 'Quero respeitar seu tempo, mas gostaria de saber se ainda faz sentido conversarmos'",
          "Dia 30: Reativação com abordagem diferente ou novidade",
        ],
      },
      {
        titulo: "Template Dia 3",
        descricao: "WhatsApp de follow-up sutil:",
        script: `Oi, [Nome]! Tudo bem? 😊

Só passando para saber se você teve a oportunidade de ver a mensagem que enviei na [dia]. 

Sei que a rotina é corrida, mas acredito que a conversa pode trazer insights valiosos para a [Empresa].

Posso agendar 15 minutinhos em um horário que funcione melhor para você? 📅`,
      },
      {
        titulo: "Template Dia 7 (Conteúdo de Valor)",
        descricao: "Envie algo útil, sem pedir nada em troca:",
        script: `Oi, [Nome]! 

Separei um case que achei super relevante para o segmento de vocês. A empresa [Case] conseguiu [resultado] em [período] com a estratégia que desenvolvemos.

Achei que poderia ser interessante para a [Empresa] ver como isso funcionaria na prática. Se quiser, posso detalhar em uma conversa rápida! 🎯`,
      },
      {
        titulo: "Quando Parar",
        descricao: "Sinais de que o follow-up deve cessar:",
        dicas: [
          "Após 4 tentativas sem resposta — mova para 'Lead Frio'",
          "Se o prospect pediu explicitamente para não ser contatado",
          "Se identificou que o prospect não tem perfil (sem budget, sem decisão)",
          "Registre TUDO no CRM antes de pausar",
          "Agende reativação automática para 60-90 dias",
        ],
      },
    ],
  },
  {
    id: "qualificacao",
    titulo: "Qualificação de Lead",
    categoria: "Análise",
    descricao: "Framework BANT adaptado para qualificar leads e identificar oportunidades reais.",
    icone: "Target",
    secoes: [
      {
        titulo: "Framework BANT Adaptado",
        descricao: "Use essas 4 dimensões para qualificar:",
        passos: [
          "Budget (Orçamento): Qual o investimento disponível para marketing? Já investiram antes?",
          "Authority (Autoridade): Quem toma a decisão? Estou falando com o decisor?",
          "Need (Necessidade): Qual o principal desafio/dor? Quanto está custando não resolver?",
          "Timeline (Timing): Quando precisa de resultados? Há urgência?",
        ],
      },
      {
        titulo: "Perguntas-Chave",
        descricao: "Perguntas estratégicas para cada dimensão:",
        passos: [
          "💰 'Vocês já investem em marketing digital hoje? Qual valor aproximado?'",
          "💰 'Se encontrássemos a solução ideal, teriam budget para iniciar este mês?'",
          "👤 'Além de você, mais alguém participa da decisão sobre marketing?'",
          "👤 'Como funciona o processo de aprovação de novos fornecedores na empresa?'",
          "🎯 'Qual o principal gargalo de crescimento da empresa hoje?'",
          "🎯 'Se pudesse resolver UM problema com marketing, qual seria?'",
          "⏰ 'Vocês têm alguma meta ou prazo específico que precisa atingir?'",
          "⏰ 'Existe algum evento, lançamento ou sazonalidade se aproximando?'",
        ],
      },
      {
        titulo: "Sinais de Compra",
        descricao: "Indicadores de que o lead está pronto para avançar:",
        dicas: [
          "✅ Pergunta sobre preços, prazos ou formas de pagamento",
          "✅ Menciona concorrentes que já usam serviços similares",
          "✅ Compartilha problemas específicos e números",
          "✅ Pergunta 'como vocês fariam para...'",
          "✅ Pede referências ou cases de clientes",
          "✅ Agenda reunião com outros decisores",
        ],
      },
      {
        titulo: "Classificação do Lead",
        descricao: "Após qualificar, classifique o lead:",
        passos: [
          "🟢 Quente: Tem budget, é decisor, tem necessidade clara e urgência → Avançar para proposta",
          "🟡 Morno: Faltam 1-2 critérios BANT → Trabalhar educação e follow-up",
          "🔴 Frio: Faltam 3+ critérios → Mover para nutrição a longo prazo",
        ],
      },
    ],
  },
  {
    id: "quebra-objecoes",
    titulo: "Quebra de Objeções",
    categoria: "Objeções",
    descricao: "As 15+ objeções mais comuns e como responder a cada uma com técnicas comprovadas.",
    icone: "ShieldQuestion",
    secoes: [
      {
        titulo: "Técnica Feel-Felt-Found",
        descricao: "Framework universal para qualquer objeção:",
        passos: [
          "FEEL: 'Eu entendo como você se sente...' (valide o sentimento)",
          "FELT: 'Muitos clientes nossos sentiram a mesma coisa...' (normalize)",
          "FOUND: 'Mas o que eles descobriram foi que...' (apresente a solução/resultado)",
        ],
      },
      {
        titulo: "Objeção: 'Está caro'",
        descricao: "A mais comum — nunca justifique o preço, justifique o valor:",
        script: `"Entendo sua preocupação com o investimento. Me permite uma pergunta: quando você diz 'caro', está comparando com o quê?"

[Ouvir a resposta]

"Veja, nossos clientes do segmento de vocês costumam ter um retorno de [X]x sobre o investimento nos primeiros [período]. O custo de NÃO investir — continuar perdendo clientes para concorrentes que estão no digital — geralmente é muito maior que o investimento em si."

"Inclusive, temos opções de parcelamento que diluem o setup no mensal. Posso simular para você?"`,
        dicas: [
          "Nunca dê desconto logo de cara — primeiro agregue valor",
          "Compare o investimento com o custo da inação",
          "Use números reais de resultados de outros clientes",
        ],
      },
      {
        titulo: "Objeção: 'Preciso pensar'",
        descricao: "Geralmente significa que falta informação ou confiança:",
        script: `"Claro, é uma decisão importante e faz sentido avaliar com calma. Me ajuda a entender: o que especificamente você gostaria de avaliar melhor?"

[Se for preço] → Direcione para simulação de pagamento
[Se for resultado] → Compartilhe case similar
[Se for timing] → "Enquanto avalia, posso enviar um diagnóstico da presença digital de vocês para embasar a decisão?"`,
      },
      {
        titulo: "Objeção: 'Já tentei e não deu certo'",
        descricao: "Aproveite a experiência negativa como diferencial:",
        script: `"Agradeço por compartilhar isso, [Nome]. Na verdade, isso é mais comum do que imagina. Me conta: o que exatamente não funcionou na experiência anterior?"

[Ouvir e identificar as falhas]

"O que diferencia nosso trabalho é [diferencial específico que resolve a falha mencionada]. Por exemplo, [case de cliente que tinha o mesmo problema]."`,
      },
      {
        titulo: "Mais Objeções Comuns",
        descricao: "Respostas rápidas para objeções frequentes:",
        passos: [
          "'Não tenho tempo' → 'Justamente por isso cuidamos de tudo. Sua participação é mínima — só precisa de 1h/mês para alinhamento.'",
          "'Meu sobrinho faz' → 'Entendo! E como estão os resultados? Marketing estratégico vai além da postagem — envolve análise de dados, tráfego pago, conversão...'",
          "'Vou pesquisar outras agências' → 'Faz total sentido! Inclusive, posso enviar nosso comparativo de serviços e resultados para facilitar sua análise.'",
          "'Não é prioridade agora' → 'Compreendo. Enquanto isso, posso fazer um diagnóstico gratuito para quando for o momento certo vocês já terem um plano pronto?'",
          "'O concorrente é mais barato' → 'Preço é importante, concordo. Mas o mais importante é o retorno. Nosso custo por lead costuma ser [X]% menor que a média do mercado.'",
          "'Preciso falar com meu sócio' → 'Claro! Que tal agendarmos uma apresentação rápida com ele presente? Assim já tiramos todas as dúvidas de uma vez.'",
        ],
      },
      {
        titulo: "Técnica da Pergunta Reversa",
        descricao: "Quando nenhuma técnica funcionar, pergunte diretamente:",
        script: `"[Nome], me permite ser direto? Se eu conseguisse resolver [dor principal] com um investimento que cabe no seu orçamento e com garantia de resultados, faria sentido para você?"

[Se sim] → "Ótimo, então vamos encontrar juntos a melhor configuração."
[Se não] → "Entendo. O que precisaria acontecer para fazer sentido no futuro?"`,
      },
    ],
  },
  {
    id: "agendamento-reuniao",
    titulo: "Agendamento de Reunião",
    categoria: "Abordagem",
    descricao: "Técnicas para transformar uma conversa em uma reunião agendada.",
    icone: "CalendarPlus",
    secoes: [
      {
        titulo: "Frases de Fechamento para Agendamento",
        descricao: "Use perguntas de alternativa (nunca pergunte 'sim ou não'):",
        passos: [
          "'Tenho disponibilidade terça às 10h ou quinta às 14h. Qual funciona melhor para você?'",
          "'Podemos fazer uma call rápida de 15 minutos — prefere de manhã ou à tarde?'",
          "'Vou reservar um horário para nós. Amanhã ou depois funciona?'",
          "'Estou com a agenda abrindo para a próxima semana. Quer que eu já reserve um slot?'",
        ],
      },
      {
        titulo: "Contorno: 'Me manda por e-mail'",
        descricao: "Quando o prospect tenta evitar a reunião:",
        script: `"Claro, posso enviar por e-mail! Mas antes, me permite uma pergunta rápida para eu personalizar o material: qual o principal desafio que vocês enfrentam hoje em [área]?"

[Ouvir]

"Perfeito! Na verdade, esse é exatamente o tipo de situação que resolvo com nossos clientes. Ao invés de um e-mail genérico, que tal 15 minutos para eu mostrar exatamente como resolveríamos isso para a [Empresa]? É muito mais produtivo do que ler um PDF 😄"`,
      },
      {
        titulo: "Pós-Agendamento",
        descricao: "O que fazer depois de confirmar a reunião:",
        checklist: [
          "Enviar convite no Google Calendar com link de videoconferência",
          "Mandar mensagem de confirmação por WhatsApp",
          "Preparar apresentação personalizada para o prospect",
          "Pesquisar a fundo a empresa e o mercado",
          "Lembrete 1 dia antes por WhatsApp",
          "Lembrete 1 hora antes por WhatsApp",
          "Registrar no CRM com data e hora da reunião",
        ],
      },
    ],
  },
  {
    id: "diagnostico-comercial",
    titulo: "Diagnóstico Comercial",
    categoria: "Análise",
    descricao: "Roteiro completo para conduzir a reunião de diagnóstico e apresentar valor.",
    icone: "ClipboardList",
    secoes: [
      {
        titulo: "Estrutura da Reunião (45-60 min)",
        descricao: "Siga esse roteiro para uma reunião produtiva:",
        passos: [
          "0-5 min: Rapport — Cumprimentos, quebra-gelo, agradecer pelo tempo",
          "5-10 min: Contexto — Apresentar brevemente a NOE (máx. 2 minutos), definir o objetivo da reunião",
          "10-25 min: Diagnóstico — Fazer perguntas-chave, ouvir 80% e falar 20%",
          "25-35 min: Apresentação de Valor — Mostrar cases similares, apresentar possibilidades",
          "35-45 min: Solução — Apresentar a proposta de serviços adequada",
          "45-60 min: Próximos Passos — Definir timeline, solicitar decisão",
        ],
      },
      {
        titulo: "Perguntas de Diagnóstico",
        descricao: "Perguntas essenciais para entender o cenário:",
        passos: [
          "'Como funciona o processo de aquisição de clientes hoje?'",
          "'Quantos leads/contatos novos vocês recebem por mês?'",
          "'Qual o ticket médio e ciclo de venda?'",
          "'Quais canais de marketing utilizam atualmente?'",
          "'Quanto investem em marketing por mês?'",
          "'Quem são os 3 principais concorrentes?'",
          "'Qual resultado seria um sucesso para vocês nos próximos 6 meses?'",
          "'O que já tentaram que não funcionou?'",
        ],
      },
      {
        titulo: "Como Apresentar Valor",
        descricao: "Técnicas para demonstrar o valor dos serviços:",
        dicas: [
          "Use números e dados — 'Clientes do segmento X aumentaram vendas em Y%'",
          "Mostre o antes/depois de um case real",
          "Calcule o custo da inação — 'Se nada mudar, em 12 meses vocês terão perdido...'",
          "Apresente a solução como investimento, nunca como custo",
          "Personalize — use o nome da empresa e dados reais do prospect",
          "Mostre o ROI esperado — 'Para cada R$1 investido, nossos clientes retornam R$X'",
        ],
      },
    ],
  },
  {
    id: "negociacao-fechamento",
    titulo: "Negociação e Fechamento",
    categoria: "Fechamento",
    descricao: "Técnicas de negociação, ancoragem de preço e gatilhos de fechamento.",
    icone: "Handshake",
    secoes: [
      {
        titulo: "Ancoragem de Preço",
        descricao: "Sempre apresente o valor total antes das condições facilitadas:",
        passos: [
          "Comece com o pacote mais completo (âncora alta)",
          "Mostre o valor total do projeto (setup + mensal x meses)",
          "Depois apresente a diluição (parcelamento do setup no mensal)",
          "O valor mensal diluído parece muito mais acessível após ver o total",
          "Use a calculadora NOE para simular em tempo real com o prospect",
        ],
      },
      {
        titulo: "Gatilhos de Urgência",
        descricao: "Crie senso de urgência legítimo:",
        passos: [
          "'Nossa equipe tem capacidade limitada — temos vagas para mais [X] clientes este mês'",
          "'Essa condição de parcelamento é válida para contratos fechados até [data]'",
          "'Seus concorrentes [A] e [B] já estão investindo pesado em digital'",
          "'A sazonalidade de [período] está chegando — se começarmos agora, dá tempo de preparar'",
          "'Quanto mais tempo sem presença digital, mais market share vocês perdem'",
        ],
      },
      {
        titulo: "Técnicas de Fechamento",
        descricao: "Escolha a técnica mais adequada ao perfil do prospect:",
        passos: [
          "Fechamento Alternativo: 'Prefere o plano semestral ou anual?' (assume a venda)",
          "Fechamento por Resumo: 'Então recapitulando: vamos fazer [A], [B] e [C], que resolve [dor]. Vamos fechar?'",
          "Fechamento Teste: 'Se resolvermos a questão do [objeção], fechamos hoje?'",
          "Fechamento Silêncio: Após apresentar a proposta, fique em silêncio. Quem fala primeiro, perde.",
          "Fechamento por Escassez: 'Temos apenas [X] vagas para onboarding este mês'",
        ],
      },
      {
        titulo: "Pós-Fechamento",
        descricao: "Imediatamente após o 'sim':",
        checklist: [
          "Parabenizar o prospect pela decisão",
          "Enviar o contrato/proposta para assinatura em até 2h",
          "Confirmar dados de faturamento e pagamento",
          "Apresentar o processo de onboarding",
          "Definir data do kickoff",
          "Registrar no CRM como 'Ganho' com valor e data",
          "Celebrar com a equipe! 🎉",
        ],
      },
    ],
  },
  {
    id: "reativacao-contatos",
    titulo: "Reativação de Contatos",
    categoria: "Abordagem",
    descricao: "Scripts e estratégias para reativar leads frios e reconquistar oportunidades perdidas.",
    icone: "UserPlus",
    secoes: [
      {
        titulo: "Quando Reativar",
        descricao: "Identifique o momento certo:",
        passos: [
          "Lead sem contato há 30-60 dias → Reativação leve",
          "Lead sem contato há 60-90 dias → Reativação com novidade",
          "Lead sem contato há 90+ dias → Reativação completa (nova abordagem)",
          "Lead que disse 'não agora' → Reativar quando o timing mudar",
          "Lead perdido para concorrente → Reativar após 3-6 meses",
        ],
      },
      {
        titulo: "Script: Lead 30-60 dias",
        descricao: "Abordagem leve e contextual:",
        script: `Oi, [Nome]! Tudo bem? 😊

Passando para dar um oi e compartilhar uma novidade: acabamos de lançar [novidade/serviço/resultado] que achei super relevante para o segmento de vocês.

Lembra que conversamos sobre [tema da conversa anterior]? Gostaria de retomar de onde paramos, se fizer sentido para você.

Tem 10 minutinhos essa semana? ☕`,
      },
      {
        titulo: "Script: Lead 90+ dias",
        descricao: "Nova abordagem, como se fosse a primeira vez:",
        script: `Olá, [Nome]! 

[Seu Nome] da NOEXCUSE aqui. Faz um tempo que conversamos e muita coisa mudou de lá pra cá — tanto no mercado quanto nos nossos serviços.

Preparei um diagnóstico rápido da presença digital da [Empresa] e encontrei [X] oportunidades que vocês podem estar perdendo.

Posso compartilhar com você? São dados bem relevantes 📊`,
      },
      {
        titulo: "Dicas de Reativação",
        descricao: "Melhores práticas:",
        dicas: [
          "Nunca diga 'estou ligando de novo' — traga algo novo sempre",
          "Use dados atualizados do mercado/concorrentes como gancho",
          "Mencione resultados recentes com clientes do mesmo segmento",
          "Ofereça algo gratuito (diagnóstico, análise, consultoria rápida)",
          "Respeite quem pediu para não ser contatado",
          "Mude o canal — se tentou WhatsApp, tente e-mail ou ligação",
          "Atualize o status no CRM após cada tentativa",
        ],
      },
    ],
  },
];
