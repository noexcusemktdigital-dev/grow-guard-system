

# NOE Academy -- EAD Completo no Modulo Comercial

## Resumo

Criar a secao **NOE Academy** dentro do modulo Comercial como um EAD completo com: modulos organizados por categoria, aulas com embed de YouTube, controle de progresso, provas (quiz) com nota e tentativas, certificados automaticos, e area de administracao para a franqueadora. Tudo com dados mock, preparado para integracao futura com Supabase.

---

## Arquitetura de Arquivos

```text
CRIAR:
src/data/academyData.ts                    -- tipos, interfaces, mock data, helpers
src/pages/Academy.tsx                      -- pagina principal com abas internas
src/components/academy/AcademyModules.tsx   -- grid de modulos/trilhas
src/components/academy/AcademyModuleDetail.tsx -- detalhe de um modulo (aulas + progresso)
src/components/academy/AcademyLesson.tsx    -- player de aula (YouTube embed + marcar concluida)
src/components/academy/AcademyJourney.tsx   -- "Minha Jornada" (progresso do usuario)
src/components/academy/AcademyQuiz.tsx      -- tela de prova (quiz interativo)
src/components/academy/AcademyCertificates.tsx -- lista de certificados
src/components/academy/AcademyAdmin.tsx     -- gestao de conteudo (CRUD modulos/aulas/provas)
src/components/academy/AcademyReports.tsx   -- relatorios de progresso por franquia/usuario

MODIFICAR:
src/components/FranqueadoraSidebar.tsx      -- ativar Treinamentos (remover disabled)
src/App.tsx                                 -- adicionar rota /franqueadora/treinamentos
```

---

## 1. Dados Mock (`src/data/academyData.ts`)

### Tipos e Interfaces

```text
AcademyModuleCategory = "Comercial" | "Estrategia" | "Institucional" | "Produtos"
AcademyModuleStatus = "draft" | "published"
AcademyLessonStatus = "not_started" | "in_progress" | "completed"
AcademyQuizQuestionType = "mcq" | "truefalse"
AcademyAttemptStatus = "passed" | "failed"

AcademyModule:
  id, title, category, description, coverImage (placeholder URL),
  status, order, lessonsCount, estimatedHours, version

AcademyLesson:
  id, moduleId, title, description, youtubeUrl, order,
  estimatedMinutes, attachments (opcional: {name, url}[])

AcademyQuiz:
  id, moduleId, passingScore (ex: 70), attemptsAllowed (ex: 3),
  timeLimit (minutos, opcional), showFeedback (bool)

AcademyQuizQuestion:
  id, quizId, type, prompt, options (string[]), correctAnswer (string),
  points (number)

AcademyProgress (por usuario):
  userId, lessonId, status, completedAt, lastSeenAt

AcademyQuizAttempt:
  userId, quizId, attemptNumber, score, status, submittedAt

AcademyCertificate:
  id, userId, moduleId, issuedAt, certificateId (UUID curto)
```

### Mock Data Inicial

- 4 modulos (1 por categoria):
  - "Tecnicas de Venda" (Comercial, 4 aulas)
  - "Planejamento Estrategico" (Estrategia, 3 aulas)
  - "Cultura Noexcuse" (Institucional, 3 aulas)
  - "Produto SaaS - Nivel 1" (Produtos, 5 aulas)
- 15 aulas distribuidas com URLs de YouTube placeholder (ex: `https://www.youtube.com/embed/dQw4w9WgXcQ`)
- 4 quizzes (1 por modulo), cada um com 5 questoes mock
- Progresso mock para 1 usuario simulado (algumas aulas concluidas, 1 prova aprovada, 1 certificado)
- 3 franquias mock com progresso variado (para relatorios)

### Helpers

- `getModulesByCategory(cat)`, `getLessonsByModule(moduleId)`, `getQuizByModule(moduleId)`
- `getModuleProgress(moduleId)` -- retorna % concluido
- `getUserCertificates()`, `getNextRecommendedLesson()`
- `getCategoryModuleCount(cat)`, `getTotalProgress()`

---

## 2. Pagina Principal (`src/pages/Academy.tsx`)

### Header

- Titulo "NOE Academy" com icone GraduationCap
- Badge "Franqueadora (acesso total)"
- Descricao: "Plataforma de treinamento e capacitacao da rede"
- Indicador visual de progresso geral (barra de progresso circular ou linear)

### Abas Internas (estilo visual similar ao Marketing, com cards coloridos)

Franqueado ve 4 abas, Franqueadora ve 6:

1. **Trilhas / Modulos** (icone `BookOpen`, cor azul)
2. **Minha Jornada** (icone `Route`, cor verde)
3. **Provas** (icone `ClipboardCheck`, cor laranja)
4. **Certificados** (icone `Award`, cor amarelo)
5. **Gestao do Conteudo** (icone `Settings`, cor roxo) -- badge "Admin"
6. **Relatorios** (icone `BarChart3`, cor rose) -- badge "Admin"

---

## 3. Trilhas / Modulos (`AcademyModules.tsx`)

### Layout

- Filtro por categoria (chips: Comercial, Estrategia, Institucional, Produtos, Todos)
- Grid de cards de modulo (2 colunas desktop, 1 mobile)

### Card de Modulo

- Capa (imagem placeholder com gradiente colorido por categoria)
- Badge de categoria (canto superior)
- Badge de status: "Publicado" (verde) / "Rascunho" (cinza, so admin)
- Titulo em destaque
- Descricao curta (2 linhas max)
- Metadados: X aulas, ~Yh estimadas, versao
- Barra de progresso do usuario (% concluido)
- Botao "Continuar" ou "Iniciar" conforme progresso
- Clicar no card abre o detalhe do modulo

---

## 4. Detalhe do Modulo (`AcademyModuleDetail.tsx`)

### Header do Modulo

- Capa grande, titulo, descricao completa
- Barra de progresso (X de Y aulas concluidas)
- Info: categoria, duracao estimada, versao

### Lista de Aulas

- Lista vertical numerada (1, 2, 3...)
- Cada aula mostra:
  - Numero + titulo
  - Duracao estimada
  - Status: icone check (concluida, verde), play (em andamento), lock (nao iniciada)
  - Material anexo (se houver): icone de PDF/link
- Clicar na aula abre o componente de aula

### Secao de Prova

- Card destacado no final da lista de aulas
- Texto: "Prova Final -- Nota minima: 70%"
- Status: "Disponivel" (quando todas aulas concluidas) / "Bloqueada" (aulas pendentes)
- Tentativas: "X de Y usadas"
- Botao "Fazer Prova" ou "Refazer Prova"

### Certificado

- Se aprovado na prova: card de certificado com botao "Ver Certificado" e "Baixar PDF"

---

## 5. Player de Aula (`AcademyLesson.tsx`)

### Layout

- Breadcrumb: NOE Academy > [Modulo] > [Aula]
- Embed do YouTube (iframe responsivo 16:9)
  - `src="https://www.youtube.com/embed/{videoId}"` com `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`
- Abaixo do video:
  - Titulo e descricao da aula
  - Duracao estimada
  - Materiais anexos (se houver) com botao de download
- Botao "Marcar como Concluida" (destaque, aparece apos renderizar)
  - Ao clicar: toast "Aula concluida!", atualiza progresso, muda icone para check
  - Se ja concluida: botao cinza "Concluida" com check
- Navegacao: "Aula Anterior" / "Proxima Aula" (botoes no rodape)
- Se ultima aula e todas concluidas: botao "Ir para Prova"

---

## 6. Minha Jornada (`AcademyJourney.tsx`)

### Cards de Resumo (topo)

- Progresso geral (% total do EAD)
- Modulos concluidos / total
- Provas aprovadas / total
- Certificados obtidos

### Por Modulo

- Lista de cards (um por modulo), cada um com:
  - Titulo + categoria
  - Barra de progresso
  - "X de Y aulas concluidas"
  - Status da prova: Pendente / Aprovado (nota) / Reprovado
  - Proxima aula recomendada (link direto)

### Proxima Aula Recomendada

- Card destacado no topo: "Continue de onde parou"
- Mostra modulo + aula + botao "Continuar"

---

## 7. Provas (`AcademyQuiz.tsx`)

### Tela Pre-Prova

- Info do quiz: modulo, nota minima, tentativas permitidas, tempo limite
- Historico de tentativas (tabela: tentativa, nota, status, data)
- Botao "Iniciar Prova" (ou "Bloqueada" se aulas pendentes)

### Tela de Prova (quiz interativo)

- Uma questao por vez (ou todas de uma vez, controlado por state)
- Timer no topo (se timeLimit configurado)
- Tipos de questao:
  - **Multipla escolha**: RadioGroup com opcoes
  - **Verdadeiro/Falso**: dois botoes
- Navegacao: "Anterior" / "Proxima" + indicador de progresso (questao X de Y)
- Botao "Finalizar Prova" no final

### Tela Pos-Prova

- Resultado: nota + status (Aprovado/Reprovado)
- Se showFeedback: mostrar acertos/erros por questao
- Se aprovado: confetti visual (opcional) + link para certificado
- Se reprovado: "Voce pode tentar novamente" + tentativas restantes

---

## 8. Certificados (`AcademyCertificates.tsx`)

### Lista de Certificados

- Grid de cards, um por certificado obtido
- Card mostra:
  - Nome do modulo
  - Data de emissao
  - ID do certificado (codigo curto)
  - Botoes: "Visualizar" e "Baixar PDF"
- Estado vazio: "Nenhum certificado ainda. Complete modulos e provas para obte-los."

### Preview do Certificado (Dialog)

- Layout visual de certificado (simulado em HTML/CSS):
  - Logo NOE Academy / Noexcuse no topo
  - "Certificado de Conclusao"
  - Nome do usuario
  - Nome do modulo/trilha
  - Data de emissao
  - ID unico
  - Assinatura decorativa (placeholder)
- Botao "Baixar PDF" (toast "Em breve -- funcionalidade de PDF sera implementada com backend")

---

## 9. Gestao do Conteudo -- Admin (`AcademyAdmin.tsx`)

### Abas internas (dentro da aba Admin)

- **Modulos**: CRUD de modulos
- **Aulas**: CRUD de aulas (filtrado por modulo selecionado)
- **Provas**: CRUD de questoes (filtrado por modulo)

### CRUD de Modulos

- Tabela com: titulo, categoria, status, aulas, ordem, acoes
- Dialog de criacao/edicao:
  - Titulo, Categoria (select), Descricao (textarea), Status (draft/published), Ordem
- Botoes: Editar, Publicar/Despublicar, Excluir (com confirmacao)

### CRUD de Aulas

- Select de modulo no topo para filtrar
- Tabela com: ordem, titulo, duracao, YouTube URL, acoes
- Dialog de criacao/edicao:
  - Titulo, Descricao, YouTube URL (Input), Ordem, Duracao estimada, Materiais (input simples)
- Preview do embed dentro do dialog ao colar a URL

### CRUD de Provas/Questoes

- Select de modulo
- Config do quiz: nota minima, tentativas, tempo, feedback (inputs)
- Lista de questoes com botao "+ Nova Questao"
- Dialog de questao:
  - Tipo (select: mcq/truefalse)
  - Pergunta (textarea)
  - Opcoes (inputs dinamicos, ate 5 opcoes para mcq)
  - Resposta correta (select entre opcoes)
  - Pontos

---

## 10. Relatorios -- Admin (`AcademyReports.tsx`)

### Cards de Resumo

- Total de usuarios ativos
- Taxa de conclusao media
- Nota media geral
- Certificados emitidos

### Tabela: Progresso por Franquia

- Franquia, usuarios, % conclusao media, provas aprovadas, certificados
- Clique expande para ver usuarios individuais

### Tabela: Progresso por Usuario

- Nome, franquia, modulos concluidos, provas aprovadas, nota media, ultimo acesso
- Filtros: por franquia, por modulo, por status

### Alertas

- Cards de alerta: "X usuarios inativos ha mais de 7 dias", "Y reprovacoes repetidas"

---

## 11. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Remover `disabled: true` do item Treinamentos:
```text
{ label: "Treinamentos", icon: GraduationCap, path: "/franqueadora/treinamentos" }
```

### App.tsx

Adicionar rota:
```text
<Route path="treinamentos" element={<Academy />} />
```

---

## 12. Detalhes de UX

### Navegacao interna

- State `activeTab` controla a aba visivel
- State `selectedModule` controla qual modulo esta aberto (detalhe)
- State `selectedLesson` controla qual aula esta sendo assistida
- State `quizActive` controla se o quiz esta em andamento
- Breadcrumb dinamico: NOE Academy > [Aba] > [Modulo] > [Aula/Prova]

### Cores por categoria de modulo

- Comercial: azul
- Estrategia: roxo
- Institucional: verde
- Produtos: laranja

### Responsividade

- Grid de modulos: 2 colunas desktop, 1 mobile
- YouTube embed: 16:9 responsivo com max-width
- Quiz: questoes empilhadas no mobile
- Tabelas de admin: scroll horizontal no mobile

---

## 13. Ordem de Implementacao

1. `academyData.ts` -- todos os tipos, interfaces, mock data e helpers
2. `AcademyModules.tsx` -- grid de modulos com filtro por categoria
3. `AcademyModuleDetail.tsx` -- detalhe com lista de aulas e prova
4. `AcademyLesson.tsx` -- player YouTube embed + marcar concluida
5. `AcademyJourney.tsx` -- minha jornada com progresso
6. `AcademyQuiz.tsx` -- quiz interativo completo
7. `AcademyCertificates.tsx` -- lista e preview de certificados
8. `AcademyAdmin.tsx` -- CRUD de modulos, aulas e provas
9. `AcademyReports.tsx` -- relatorios e alertas
10. `Academy.tsx` -- pagina principal com abas e navegacao
11. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

