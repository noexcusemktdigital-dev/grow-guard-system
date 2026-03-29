// @ts-nocheck
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
    descricao: "Como abordar um prospect pela primeira vez oferecendo o diagnóstico gratuito como gancho de valor.",
    icone: "Phone",
    secoes: [
      {
        titulo: "Checklist Pré-Contato",
        descricao: "Antes de ligar ou enviar mensagem, prepare-se:",
        checklist: [
          "Pesquisar o prospect no Google e redes sociais",
          "Identificar o segmento e porte da empresa",
          "Verificar se já existe algum histórico no CRM",
          "Definir o cenário: contato frio, retomada ou lead quente por indicação",
          "Anotar pontos de melhoria visíveis (redes sociais, site, Google)",
          "Preparar uma frase de abertura personalizada com foco no diagnóstico gratuito",
        ],
      },
      {
        titulo: "Script Telefone — Contato Frio",
        descricao: "Roteiro para ligação com prospect que nunca falou conosco:",
        script: `Olá, [Nome]! Tudo bem? Meu nome é [Seu Nome], sou da NOEXCUSE Marketing Estratégico.

Estou entrando em contato porque vi que a [Empresa] atua no segmento de [segmento] e identifiquei algumas oportunidades que vocês podem estar deixando passar no digital.

Nós fazemos um diagnóstico gratuito onde analisamos a presença digital da empresa e criamos uma estratégia personalizada sem nenhum custo. É uma conversa de 30 minutos que traz insights valiosos.

Posso agendar esse diagnóstico para essa semana? Qual horário funciona melhor?

[Se sim] Ótimo! Vou confirmar por WhatsApp com o link da reunião.
[Se não agora] Entendo! Posso enviar um resumo rápido por WhatsApp mostrando o que identifiquei na análise inicial?`,
      },
      {
        titulo: "Script WhatsApp — Contato Frio",
        descricao: "Mensagem para primeiro contato via WhatsApp:",
        script: `Olá, [Nome]! 👋

Me chamo [Seu Nome], da NOEXCUSE Marketing Estratégico.

Analisei rapidamente a presença digital da [Empresa] e vi que vocês têm um potencial enorme para crescer no digital. Identifiquei [X] oportunidades que podem fazer diferença.

Nós oferecemos um diagnóstico gratuito onde criamos uma estratégia personalizada para empresas do segmento de vocês — sem nenhum compromisso. É uma conversa de 30 minutos que já traz insights prontos para aplicar. 📊

Tem interesse em agendar? Posso reservar um horário essa semana! 😊`,
      },
      {
        titulo: "Script WhatsApp — Lead Quente por Indicação",
        descricao: "Quando o lead chegou por indicação de alguém:",
        script: `Olá, [Nome]! 👋

Sou [Seu Nome], da NOEXCUSE Marketing Estratégico. O(a) [Nome de quem indicou] me passou seu contato e comentou que vocês podem estar buscando [resultado/necessidade].

Trabalhamos com a empresa dele(a) e conseguimos [resultado breve]. Gostaria de oferecer o mesmo diagnóstico gratuito para a [Empresa] — é uma conversa de 30 minutos onde analisamos sua situação e montamos uma estratégia personalizada.

Como o [Nome de quem indicou] já confia no nosso trabalho, acho que vai ser super proveitoso para vocês! Podemos agendar para essa semana? 📅`,
      },
      {
        titulo: "Erros Comuns",
        descricao: "O que NÃO fazer no primeiro contato:",
        dicas: [
          "❌ Não fale de preços ou pacotes antes do diagnóstico",
          "❌ Não envie áudios longos no WhatsApp (máx. 30 segundos)",
          "❌ Não seja genérico — personalize sempre com dados da empresa",
          "❌ Não tente vender diretamente — o objetivo é agendar o diagnóstico",
          "❌ Não insista se o prospect disser que não tem interesse — registre e agende follow-up",
        ],
      },
    ],
  },
  {
    id: "follow-up",
    titulo: "Follow-up Estratégico",
    categoria: "Abordagem",
    descricao: "Cadência de follow-up para manter o lead engajado e reconduzi-lo ao diagnóstico gratuito.",
    icone: "CalendarClock",
    secoes: [
      {
        titulo: "Cadência Recomendada",
        descricao: "Siga essa sequência para maximizar agendamentos de diagnóstico:",
        passos: [
          "Dia 1: Primeiro contato (telefone + WhatsApp de reforço com convite ao diagnóstico)",
          "Dia 3: Follow-up leve — 'Vi que ainda não conseguimos agendar o diagnóstico...'",
          "Dia 7: Envio de conteúdo de valor (case ou insight do segmento do prospect)",
          "Dia 14: Último follow-up — 'Quero respeitar seu tempo, mas o diagnóstico gratuito continua disponível'",
          "Dia 30: Reativação com nova abordagem ou dado atualizado sobre o mercado",
        ],
      },
      {
        titulo: "Template Dia 3",
        descricao: "WhatsApp de follow-up sutil:",
        script: `Oi, [Nome]! Tudo bem? 😊

Só passando para saber se você viu minha mensagem sobre o diagnóstico gratuito para a [Empresa].

É uma conversa rápida de 30 minutos onde montamos uma estratégia personalizada — sem compromisso. Nossos clientes do segmento de [segmento] costumam sair com pelo menos 3 ações práticas para implementar.

Posso agendar para um horário que funcione? 📅`,
      },
      {
        titulo: "Template Dia 7 (Conteúdo de Valor)",
        descricao: "Envie algo útil, reforçando o convite ao diagnóstico:",
        script: `Oi, [Nome]! 

Separei um case que achei super relevante: a empresa [Case] do segmento de [segmento] conseguiu [resultado] em [período] após passarem pelo nosso diagnóstico e implementarem a estratégia que criamos.

A análise que fazemos para o diagnóstico gratuito é a mesma. Quer ver como ficaria para a [Empresa]? 🎯`,
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
    descricao: "Framework para qualificar leads antes e durante o diagnóstico, incluindo leads quentes por indicação.",
    icone: "Target",
    secoes: [
      {
        titulo: "Framework BANT Adaptado",
        descricao: "Use essas 4 dimensões para qualificar (durante ou antes do diagnóstico):",
        passos: [
          "Budget (Orçamento): A empresa já investe em marketing? Tem verba disponível?",
          "Authority (Autoridade): Estou falando com quem decide? Precisa consultar sócio?",
          "Need (Necessidade): Qual a principal dor? O diagnóstico vai revelar isso em detalhes",
          "Timeline (Timing): Quando precisa de resultados? Há urgência ou sazonalidade?",
        ],
      },
      {
        titulo: "Perguntas-Chave para o Diagnóstico",
        descricao: "Perguntas que ajudam a entender o cenário e personalizar a estratégia:",
        passos: [
          "'Como funciona a captação de clientes da empresa hoje?'",
          "'Vocês já investem em marketing digital? O que fazem atualmente?'",
          "'Qual o principal gargalo de crescimento que vocês enfrentam?'",
          "'Se pudesse mudar UMA coisa no marketing da empresa, o que seria?'",
          "'Quem são os concorrentes que mais incomodam vocês?'",
          "'Qual resultado tornaria esse diagnóstico valioso para você?'",
          "'Além de você, mais alguém participa da decisão sobre marketing?'",
          "'Vocês têm alguma meta ou prazo específico para atingir?'",
        ],
      },
      {
        titulo: "Lead Quente por Indicação",
        descricao: "Quando o lead chegou por indicação, a qualificação é mais rápida:",
        dicas: [
          "✅ Já tem confiança pelo referenciador — aproveite esse capital",
          "✅ Pergunte: 'O [referenciador] comentou algo sobre o que vocês precisam?'",
          "✅ Vá direto ao ponto — 'Pelo que entendi, vocês buscam [X]. Certo?'",
          "✅ Agilize o agendamento — leads por indicação esfriam rápido se demorar",
          "✅ Mencione o resultado obtido com quem indicou para gerar prova social",
        ],
      },
      {
        titulo: "Classificação do Lead",
        descricao: "Após qualificar, classifique o lead:",
        passos: [
          "🟢 Quente: Tem budget, é decisor, tem dor clara e urgência → Agendar diagnóstico ASAP",
          "🟡 Morno: Faltam 1-2 critérios → Nutrir com conteúdo e reforçar convite ao diagnóstico",
          "🔴 Frio: Faltam 3+ critérios → Mover para nutrição a longo prazo",
        ],
      },
    ],
  },
  {
    id: "quebra-objecoes",
    titulo: "Quebra de Objeções",
    categoria: "Objeções",
    descricao: "As objeções mais comuns ao convite de diagnóstico e como responder com técnicas comprovadas.",
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
        titulo: "Objeção: 'Não tenho interesse em contratar nada agora'",
        descricao: "A mais comum — reforce que o diagnóstico é gratuito e sem compromisso:",
        script: `"Eu entendo! E o diagnóstico é justamente para isso — não é uma venda. É uma conversa onde analisamos a presença digital da [Empresa] e compartilhamos insights que vocês podem aplicar por conta própria.

Nossos clientes do segmento de [segmento] costumam sair com pelo menos 3 ações práticas. Mesmo que não contratem nada, o diagnóstico já vale pela clareza que traz.

São só 30 minutos — posso agendar para quando for melhor para você?"`,
        dicas: [
          "Reforce que é gratuito e sem compromisso",
          "Destaque o valor que o prospect leva independente de contratar",
          "Nunca pressione — o objetivo é mostrar valor genuíno",
        ],
      },
      {
        titulo: "Objeção: 'Já tenho uma agência/alguém que faz'",
        descricao: "Posicione o diagnóstico como uma segunda opinião:",
        script: `"Que bom que vocês já investem! O diagnóstico funciona como uma segunda opinião — analisamos o que está sendo feito e identificamos oportunidades que talvez estejam passando despercebidas.

Muitos dos nossos melhores clientes já tinham fornecedores antes. O diagnóstico mostrou pontos cegos que fizeram toda a diferença.

Sem compromisso — é só uma conversa estratégica de 30 minutos. Faz sentido?"`,
      },
      {
        titulo: "Objeção: 'Preciso pensar / Me manda por e-mail'",
        descricao: "Redirecione para o diagnóstico como forma de pensar melhor:",
        script: `"Claro! Inclusive, o diagnóstico é a melhor forma de avaliar — ao invés de ler um PDF genérico, montamos uma análise personalizada da [Empresa] ao vivo.

É como ter uma consultoria gratuita de 30 minutos focada no seu negócio. Assim você toma a decisão com muito mais informação.

Que tal agendarmos? Pode ser na próxima semana se preferir."`,
      },
      {
        titulo: "Objeção: 'Não tenho tempo'",
        descricao: "Mostre que são apenas 30 minutos de alto valor:",
        script: `"Entendo perfeitamente — e é exatamente por isso que o diagnóstico é rápido: 30 minutos.

Nesse tempo, você sai com uma visão clara de onde estão as oportunidades de crescimento da [Empresa] no digital. É o maior ROI de tempo que você pode ter essa semana 😄

Posso encaixar no horário que for melhor — de manhã ou à tarde?"`,
      },
      {
        titulo: "Mais Objeções Comuns",
        descricao: "Respostas rápidas para outras situações:",
        passos: [
          "'Não é prioridade agora' → 'O diagnóstico serve justamente para quando chegar o momento certo — vocês já terão uma estratégia pronta para executar.'",
          "'Meu sobrinho faz o marketing' → 'Ótimo! O diagnóstico pode complementar o trabalho dele com insights de dados e estratégia que vão potencializar os resultados.'",
          "'Já tentei marketing e não deu certo' → 'Por isso o diagnóstico é tão importante — identificamos exatamente o que não funcionou antes e como fazer diferente.'",
          "'Quanto custa?' → 'O diagnóstico é 100% gratuito. Depois dele, se fizer sentido, apresentamos opções. Mas o valor do diagnóstico em si vocês já levam.'",
        ],
      },
    ],
  },
  {
    id: "agendamento-reuniao",
    titulo: "Agendamento do Diagnóstico",
    categoria: "Abordagem",
    descricao: "Técnicas para transformar uma conversa em um diagnóstico agendado.",
    icone: "CalendarPlus",
    secoes: [
      {
        titulo: "Frases de Fechamento para Agendamento",
        descricao: "Use perguntas de alternativa (nunca pergunte 'sim ou não'):",
        passos: [
          "'Tenho disponibilidade terça às 10h ou quinta às 14h para o diagnóstico. Qual funciona melhor?'",
          "'Podemos fazer o diagnóstico em 30 minutos — prefere de manhã ou à tarde?'",
          "'Vou reservar um horário para o seu diagnóstico. Amanhã ou depois funciona?'",
          "'Estou com a agenda abrindo para a próxima semana. Quer que eu já reserve?'",
        ],
      },
      {
        titulo: "Contorno: 'Me manda por e-mail'",
        descricao: "Quando o prospect tenta evitar o agendamento:",
        script: `"Claro, posso enviar! Mas o e-mail seria genérico. O diferencial do nosso diagnóstico é que analisamos especificamente a [Empresa] — é personalizado.

Em 30 minutos, você sai com insights que um PDF nunca vai trazer. Que tal agendarmos e, se não gostar, encerramos antes? Sem compromisso 😄"`,
      },
      {
        titulo: "Pós-Agendamento",
        descricao: "O que fazer depois de confirmar o diagnóstico:",
        checklist: [
          "Enviar convite no Google Calendar com link de videoconferência",
          "Mandar mensagem de confirmação por WhatsApp reforçando o valor do diagnóstico",
          "Pesquisar a fundo a empresa: site, redes sociais, concorrentes",
          "Preparar análise inicial da presença digital para apresentar no diagnóstico",
          "Lembrete 1 dia antes por WhatsApp",
          "Lembrete 1 hora antes por WhatsApp",
          "Registrar no CRM com data e hora do diagnóstico",
        ],
      },
    ],
  },
  {
    id: "diagnostico-comercial",
    titulo: "Diagnóstico / Estratégia Gratuita",
    categoria: "Análise",
    descricao: "Roteiro completo para conduzir a reunião de diagnóstico e apresentar valor real ao prospect.",
    icone: "ClipboardList",
    secoes: [
      {
        titulo: "Estrutura do Diagnóstico (30-45 min)",
        descricao: "Siga esse roteiro para maximizar o valor entregue:",
        passos: [
          "0-5 min: Rapport — Cumprimentos, quebra-gelo, agradecer pelo tempo",
          "5-8 min: Contexto — Apresentar brevemente a NOE (máx. 2 minutos), explicar o que o diagnóstico vai entregar",
          "8-20 min: Diagnóstico — Fazer perguntas-chave, ouvir 80% e falar 20%, entender dores e objetivos",
          "20-30 min: Estratégia — Apresentar a análise e a estratégia personalizada que você preparou",
          "30-40 min: Solução — Mostrar como executaríamos essa estratégia com nossos serviços",
          "40-45 min: Próximos Passos — Definir se faz sentido avançar e como seria",
        ],
      },
      {
        titulo: "Perguntas de Diagnóstico",
        descricao: "Perguntas para entender o cenário e montar a estratégia:",
        passos: [
          "'Como funciona a captação de clientes hoje? De onde vêm os novos clientes?'",
          "'Quantos leads/contatos novos vocês recebem por mês?'",
          "'Qual o ticket médio e ciclo de venda?'",
          "'Quais canais de marketing utilizam atualmente?'",
          "'Quanto investem em marketing por mês (incluindo equipe interna)?'",
          "'Quem são os 3 principais concorrentes? O que eles fazem diferente no digital?'",
          "'Qual resultado tornaria esse diagnóstico valioso para você?'",
          "'O que já tentaram que não funcionou? O que aprenderam?'",
        ],
      },
      {
        titulo: "Como Apresentar a Estratégia",
        descricao: "Entregue valor real durante o diagnóstico:",
        dicas: [
          "Mostre dados concretos — análise do Google, redes sociais, tráfego estimado",
          "Compare com concorrentes — 'A empresa X do seu segmento está fazendo Y'",
          "Apresente 3-5 ações práticas que o prospect pode implementar sozinho",
          "Mostre o potencial: 'Se vocês fizerem X, o resultado esperado é Y'",
          "Só depois de entregar valor, apresente como vocês executariam",
          "Use cases reais — 'Para o [cliente similar], fizemos Z e o resultado foi W'",
          "Calcule o custo da inação — 'Se nada mudar, em 6 meses vocês terão perdido...'",
        ],
      },
    ],
  },
  {
    id: "negociacao-fechamento",
    titulo: "Negociação e Fechamento",
    categoria: "Fechamento",
    descricao: "Técnicas de negociação pós-diagnóstico, ancoragem de preço e gatilhos de fechamento.",
    icone: "Handshake",
    secoes: [
      {
        titulo: "Transição Diagnóstico → Proposta",
        descricao: "Como sair do diagnóstico para a proposta de forma natural:",
        passos: [
          "Resuma os insights do diagnóstico: 'Então identificamos que os principais pontos são A, B e C'",
          "Pergunte: 'Faz sentido atacar essas frentes? O que seria prioridade para vocês?'",
          "Apresente a solução: 'Para executar essa estratégia, o que propomos é...'",
          "Mostre o investimento como execução da estratégia que já foi validada juntos",
          "Use a calculadora NOE para simular em tempo real com o prospect",
        ],
      },
      {
        titulo: "Ancoragem de Preço",
        descricao: "Sempre apresente o valor total antes das condições facilitadas:",
        passos: [
          "Comece com o pacote mais completo (âncora alta)",
          "Mostre o valor total do projeto (setup + mensal x meses)",
          "Depois apresente a diluição (parcelamento do setup no mensal)",
          "O valor mensal diluído parece muito mais acessível após ver o total",
        ],
      },
      {
        titulo: "Gatilhos de Urgência",
        descricao: "Crie senso de urgência legítimo:",
        passos: [
          "'Nossa equipe tem capacidade limitada — temos vagas para mais [X] clientes este mês'",
          "'Essa condição especial é válida para contratos fechados até [data]'",
          "'Seus concorrentes [A] e [B] já estão investindo pesado em digital'",
          "'A sazonalidade de [período] está chegando — se começarmos agora, dá tempo de preparar'",
        ],
      },
      {
        titulo: "Técnicas de Fechamento",
        descricao: "Escolha a técnica mais adequada ao perfil do prospect:",
        passos: [
          "Fechamento Alternativo: 'Prefere o plano semestral ou anual?' (assume a venda)",
          "Fechamento por Resumo: 'Então a estratégia que montamos resolve [A], [B] e [C]. Vamos executar?'",
          "Fechamento Teste: 'Se resolvermos a questão do [objeção], fechamos hoje?'",
          "Fechamento Silêncio: Após apresentar a proposta, fique em silêncio. Quem fala primeiro, perde.",
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
    descricao: "Scripts para reativar leads frios usando o diagnóstico gratuito como novo gancho.",
    icone: "UserPlus",
    secoes: [
      {
        titulo: "Quando Reativar",
        descricao: "Identifique o momento certo:",
        passos: [
          "Lead sem contato há 30-60 dias → Reativação leve com convite ao diagnóstico",
          "Lead sem contato há 60-90 dias → Reativação com novidade ou case novo",
          "Lead sem contato há 90+ dias → Reativação completa (nova abordagem)",
          "Lead que disse 'não agora' → Reativar quando o timing mudar",
          "Lead perdido para concorrente → Reativar após 3-6 meses com diagnóstico comparativo",
        ],
      },
      {
        titulo: "Script: Lead 30-60 dias",
        descricao: "Abordagem leve e contextual:",
        script: `Oi, [Nome]! Tudo bem? 😊

Passando para compartilhar: acabamos de concluir um diagnóstico para uma empresa do segmento de [segmento] e os resultados foram impressionantes — encontramos oportunidades que ninguém tinha visto.

Lembra que conversamos sobre fazer o mesmo para a [Empresa]? O convite continua de pé — 30 minutos, sem custo, com insights personalizados.

Tem um horário essa semana? ☕`,
      },
      {
        titulo: "Script: Lead 90+ dias",
        descricao: "Nova abordagem, como se fosse a primeira vez:",
        script: `Olá, [Nome]! 

[Seu Nome] da NOEXCUSE aqui. Faz um tempo que conversamos e muita coisa mudou — tanto no mercado digital quanto nos resultados dos nossos clientes.

Preparei uma análise rápida da presença digital da [Empresa] e encontrei [X] oportunidades que vocês podem estar perdendo para concorrentes.

Nosso diagnóstico gratuito está com agenda aberta — são 30 minutos onde monto uma estratégia personalizada para vocês. Posso agendar? 📊`,
      },
      {
        titulo: "Dicas de Reativação",
        descricao: "Melhores práticas:",
        dicas: [
          "Nunca diga 'estou ligando de novo' — traga algo novo: case, dado, insight",
          "Use dados atualizados do mercado/concorrentes como gancho",
          "Mencione resultados recentes de diagnósticos com clientes do mesmo segmento",
          "Reforce que o diagnóstico é gratuito e sem compromisso",
          "Respeite quem pediu para não ser contatado",
          "Mude o canal — se tentou WhatsApp, tente ligação ou e-mail",
          "Atualize o status no CRM após cada tentativa",
        ],
      },
    ],
  },
];
