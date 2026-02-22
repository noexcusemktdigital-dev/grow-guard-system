import type { 
  AcademyModule, AcademyLesson, AcademyQuiz, AcademyQuizQuestion, 
  AcademyProgress, AcademyQuizAttempt, AcademyCertificate, FranchiseReport 
} from "@/types/academy";

export const mockModules: AcademyModule[] = [
  {
    id: "mod-1",
    title: "Técnicas de Venda",
    category: "Comercial",
    description: "Domine as técnicas essenciais de venda consultiva para aumentar suas conversões e fidelizar clientes.",
    coverImage: "",
    status: "published",
    order: 1,
    lessonsCount: 4,
    estimatedHours: 2.5,
    version: "v1",
  },
  {
    id: "mod-2",
    title: "Planejamento Estratégico",
    category: "Estrategia",
    description: "Aprenda a estruturar o planejamento estratégico da sua unidade com metas claras e indicadores.",
    coverImage: "",
    status: "published",
    order: 2,
    lessonsCount: 3,
    estimatedHours: 2,
    version: "v1",
  },
  {
    id: "mod-3",
    title: "Cultura Noexcuse",
    category: "Institucional",
    description: "Conheça os valores, a missão e a cultura que movem a rede Noexcuse. Essencial para novos franqueados.",
    coverImage: "",
    status: "published",
    order: 3,
    lessonsCount: 3,
    estimatedHours: 1.5,
    version: "v1",
  },
  {
    id: "mod-4",
    title: "Produto SaaS – Nível 1",
    category: "Produtos",
    description: "Entenda a fundo o produto principal da rede, funcionalidades, diferenciais e argumentos de venda.",
    coverImage: "",
    status: "published",
    order: 4,
    lessonsCount: 5,
    estimatedHours: 3,
    version: "v1",
  },
];

export const mockLessons: AcademyLesson[] = [
  // Módulo 1 – Técnicas de Venda
  { id: "les-1", moduleId: "mod-1", title: "Introdução à Venda Consultiva", description: "O que é venda consultiva e por que ela funciona.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 1, estimatedMinutes: 35 },
  { id: "les-2", moduleId: "mod-1", title: "Rapport e Conexão com o Cliente", description: "Técnicas para criar conexão genuína.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 2, estimatedMinutes: 40, attachments: [{ name: "Checklist Rapport.pdf", url: "#" }] },
  { id: "les-3", moduleId: "mod-1", title: "Contorno de Objeções", description: "Como lidar com as objeções mais comuns.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 3, estimatedMinutes: 45 },
  { id: "les-4", moduleId: "mod-1", title: "Fechamento e Pós-venda", description: "Técnicas de fechamento e fidelização.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 4, estimatedMinutes: 30 },
  // Módulo 2 – Planejamento Estratégico
  { id: "les-5", moduleId: "mod-2", title: "Análise SWOT na Prática", description: "Como aplicar SWOT na sua unidade.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 1, estimatedMinutes: 40 },
  { id: "les-6", moduleId: "mod-2", title: "Definição de Metas SMART", description: "Crie metas que realmente funcionam.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 2, estimatedMinutes: 35 },
  { id: "les-7", moduleId: "mod-2", title: "KPIs e Indicadores", description: "Monitore o desempenho com indicadores chave.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 3, estimatedMinutes: 45 },
  // Módulo 3 – Cultura Noexcuse
  { id: "les-8", moduleId: "mod-3", title: "Quem Somos: Missão e Valores", description: "Conheça a essência da marca Noexcuse.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 1, estimatedMinutes: 25 },
  { id: "les-9", moduleId: "mod-3", title: "Padrão de Atendimento", description: "O padrão de excelência esperado em cada unidade.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 2, estimatedMinutes: 30 },
  { id: "les-10", moduleId: "mod-3", title: "Código de Conduta", description: "Diretrizes de conduta e ética profissional.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 3, estimatedMinutes: 20 },
  // Módulo 4 – Produto SaaS
  { id: "les-11", moduleId: "mod-4", title: "Visão Geral do Produto", description: "Overview completo da plataforma SaaS.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 1, estimatedMinutes: 30 },
  { id: "les-12", moduleId: "mod-4", title: "Funcionalidades Principais", description: "Tour pelas funcionalidades core.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 2, estimatedMinutes: 40 },
  { id: "les-13", moduleId: "mod-4", title: "Diferenciais Competitivos", description: "O que nos diferencia da concorrência.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 3, estimatedMinutes: 35 },
  { id: "les-14", moduleId: "mod-4", title: "Argumentos de Venda", description: "Scripts e argumentos para cada perfil de cliente.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 4, estimatedMinutes: 40, attachments: [{ name: "Script de Vendas.pdf", url: "#" }] },
  { id: "les-15", moduleId: "mod-4", title: "Demo e Hands-on", description: "Aprenda a fazer demonstrações impactantes.", youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", order: 5, estimatedMinutes: 35 },
];

export const mockQuizzes: AcademyQuiz[] = [
  { id: "quiz-1", moduleId: "mod-1", passingScore: 70, attemptsAllowed: 3, timeLimit: 30, showFeedback: true },
  { id: "quiz-2", moduleId: "mod-2", passingScore: 70, attemptsAllowed: 3, showFeedback: true },
  { id: "quiz-3", moduleId: "mod-3", passingScore: 70, attemptsAllowed: 3, showFeedback: true },
  { id: "quiz-4", moduleId: "mod-4", passingScore: 70, attemptsAllowed: 3, timeLimit: 45, showFeedback: true },
];

export const mockQuizQuestions: AcademyQuizQuestion[] = [
  // Quiz 1
  { id: "q-1", quizId: "quiz-1", type: "mcq", prompt: "Qual é o principal objetivo da venda consultiva?", options: ["Vender o mais rápido possível", "Entender a necessidade do cliente", "Oferecer desconto", "Fazer cold calling"], correctAnswer: "Entender a necessidade do cliente", points: 20 },
  { id: "q-2", quizId: "quiz-1", type: "truefalse", prompt: "Rapport é uma técnica de manipulação do cliente.", options: ["Verdadeiro", "Falso"], correctAnswer: "Falso", points: 20 },
  { id: "q-3", quizId: "quiz-1", type: "mcq", prompt: "Qual a melhor forma de lidar com objeções?", options: ["Ignorar", "Concordar e redirecionar", "Pressionar mais", "Dar desconto imediato"], correctAnswer: "Concordar e redirecionar", points: 20 },
  { id: "q-4", quizId: "quiz-1", type: "mcq", prompt: "O pós-venda serve para:", options: ["Apenas resolver problemas", "Fidelizar e gerar indicações", "Enviar boletos", "Nenhuma das anteriores"], correctAnswer: "Fidelizar e gerar indicações", points: 20 },
  { id: "q-5", quizId: "quiz-1", type: "truefalse", prompt: "O fechamento da venda é o momento mais importante do processo.", options: ["Verdadeiro", "Falso"], correctAnswer: "Falso", points: 20 },
  // Quiz 2
  { id: "q-6", quizId: "quiz-2", type: "mcq", prompt: "O que significa a letra S em SWOT?", options: ["Strategy", "Strengths", "Sales", "Systems"], correctAnswer: "Strengths", points: 20 },
  { id: "q-7", quizId: "quiz-2", type: "mcq", prompt: "Uma meta SMART deve ser:", options: ["Simples, Mensal, Alta, Rápida, Tática", "Específica, Mensurável, Atingível, Relevante, Temporal", "Super, Macro, Automática, Real, Total", "Nenhuma das anteriores"], correctAnswer: "Específica, Mensurável, Atingível, Relevante, Temporal", points: 20 },
  { id: "q-8", quizId: "quiz-2", type: "truefalse", prompt: "KPIs devem ser revisados apenas no final do ano.", options: ["Verdadeiro", "Falso"], correctAnswer: "Falso", points: 20 },
  { id: "q-9", quizId: "quiz-2", type: "mcq", prompt: "Qual indicador mede a satisfação do cliente?", options: ["CAC", "NPS", "ROI", "EBITDA"], correctAnswer: "NPS", points: 20 },
  { id: "q-10", quizId: "quiz-2", type: "truefalse", prompt: "Planejamento estratégico é necessário apenas para grandes empresas.", options: ["Verdadeiro", "Falso"], correctAnswer: "Falso", points: 20 },
  // Quiz 3
  { id: "q-11", quizId: "quiz-3", type: "mcq", prompt: "Qual é a missão da Noexcuse?", options: ["Vender mais", "Transformar vidas através do empreendedorismo", "Ser a maior rede do Brasil", "Lucrar ao máximo"], correctAnswer: "Transformar vidas através do empreendedorismo", points: 20 },
  { id: "q-12", quizId: "quiz-3", type: "truefalse", prompt: "O padrão de atendimento é opcional para franqueados.", options: ["Verdadeiro", "Falso"], correctAnswer: "Falso", points: 20 },
  { id: "q-13", quizId: "quiz-3", type: "mcq", prompt: "O código de conduta se aplica a:", options: ["Apenas funcionários", "Apenas franqueados", "Todos os membros da rede", "Apenas gestores"], correctAnswer: "Todos os membros da rede", points: 20 },
  { id: "q-14", quizId: "quiz-3", type: "truefalse", prompt: "A cultura organizacional impacta diretamente nos resultados.", options: ["Verdadeiro", "Falso"], correctAnswer: "Verdadeiro", points: 20 },
  { id: "q-15", quizId: "quiz-3", type: "mcq", prompt: "Qual valor NÃO faz parte da cultura Noexcuse?", options: ["Excelência", "Inovação", "Complacência", "Comprometimento"], correctAnswer: "Complacência", points: 20 },
  // Quiz 4
  { id: "q-16", quizId: "quiz-4", type: "mcq", prompt: "O que significa SaaS?", options: ["Software as a Service", "System as a Solution", "Sales as a Strategy", "Support and Service"], correctAnswer: "Software as a Service", points: 20 },
  { id: "q-17", quizId: "quiz-4", type: "truefalse", prompt: "O modelo SaaS elimina a necessidade de instalação local.", options: ["Verdadeiro", "Falso"], correctAnswer: "Verdadeiro", points: 20 },
  { id: "q-18", quizId: "quiz-4", type: "mcq", prompt: "Qual o principal diferencial competitivo do nosso produto?", options: ["Preço mais baixo", "Integração completa com a operação", "Design bonito", "Marca famosa"], correctAnswer: "Integração completa com a operação", points: 20 },
  { id: "q-19", quizId: "quiz-4", type: "mcq", prompt: "Em uma demo, o mais importante é:", options: ["Mostrar todas as features", "Focar na dor do cliente", "Falar rápido", "Usar slides bonitos"], correctAnswer: "Focar na dor do cliente", points: 20 },
  { id: "q-20", quizId: "quiz-4", type: "truefalse", prompt: "Scripts de venda devem ser decorados palavra por palavra.", options: ["Verdadeiro", "Falso"], correctAnswer: "Falso", points: 20 },
];

export let mockProgress: AcademyProgress[] = [
  { userId: "user-1", lessonId: "les-1", status: "completed", completedAt: "2026-01-15T10:00:00", lastSeenAt: "2026-01-15T10:00:00" },
  { userId: "user-1", lessonId: "les-2", status: "completed", completedAt: "2026-01-16T14:00:00", lastSeenAt: "2026-01-16T14:00:00" },
  { userId: "user-1", lessonId: "les-3", status: "completed", completedAt: "2026-01-17T09:00:00", lastSeenAt: "2026-01-17T09:00:00" },
  { userId: "user-1", lessonId: "les-4", status: "completed", completedAt: "2026-01-18T11:00:00", lastSeenAt: "2026-01-18T11:00:00" },
  { userId: "user-1", lessonId: "les-5", status: "completed", completedAt: "2026-01-20T10:00:00", lastSeenAt: "2026-01-20T10:00:00" },
  { userId: "user-1", lessonId: "les-6", status: "in_progress", lastSeenAt: "2026-02-10T15:00:00" },
  { userId: "user-1", lessonId: "les-8", status: "completed", completedAt: "2026-02-01T10:00:00", lastSeenAt: "2026-02-01T10:00:00" },
  { userId: "user-1", lessonId: "les-9", status: "completed", completedAt: "2026-02-02T10:00:00", lastSeenAt: "2026-02-02T10:00:00" },
  { userId: "user-1", lessonId: "les-10", status: "completed", completedAt: "2026-02-03T10:00:00", lastSeenAt: "2026-02-03T10:00:00" },
];

export let mockQuizAttempts: AcademyQuizAttempt[] = [
  { userId: "user-1", quizId: "quiz-1", attemptNumber: 1, score: 80, status: "passed", submittedAt: "2026-01-19T14:00:00" },
  { userId: "user-1", quizId: "quiz-3", attemptNumber: 1, score: 60, status: "failed", submittedAt: "2026-02-04T10:00:00" },
  { userId: "user-1", quizId: "quiz-3", attemptNumber: 2, score: 90, status: "passed", submittedAt: "2026-02-05T10:00:00" },
];

export let mockCertificates: AcademyCertificate[] = [
  { id: "cert-1", userId: "user-1", moduleId: "mod-1", issuedAt: "2026-01-19T14:30:00", certificateId: "NOE-2026-A1B2" },
  { id: "cert-2", userId: "user-1", moduleId: "mod-3", issuedAt: "2026-02-05T10:30:00", certificateId: "NOE-2026-C3D4" },
];

export const mockFranchiseReports: FranchiseReport[] = [
  { franchiseId: "fr-1", franchiseName: "Franquia São Paulo - Centro", usersCount: 5, avgCompletion: 72, quizzesPassed: 12, certificates: 8 },
  { franchiseId: "fr-2", franchiseName: "Franquia Rio de Janeiro", usersCount: 3, avgCompletion: 45, quizzesPassed: 5, certificates: 3 },
  { franchiseId: "fr-3", franchiseName: "Franquia Belo Horizonte", usersCount: 4, avgCompletion: 88, quizzesPassed: 14, certificates: 12 },
];