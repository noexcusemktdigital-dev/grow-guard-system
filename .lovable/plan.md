

# Redesign UX/UI do NOE Academy -- Visual, Didatico e Moderno

## Problemas Identificados

1. **Header repetitivo**: O header "NOE Academy" com progresso aparece sempre, mesmo nas sub-telas (aula, quiz), ocupando espaco sem necessidade
2. **Abas confusas**: As 6 abas sao pequenas, sem descricao do que cada uma faz, e parecem "soltas" sem hierarquia clara
3. **Cards de modulo monotonos**: Os gradientes sao cores chapadas sem textura, sem icone representativo, sem indicacao visual clara do status
4. **Detalhe do modulo**: A lista de aulas e flat demais -- aulas concluidas com strikethrough parecem "apagadas" ao inves de "completas com orgulho"
5. **Tela de aula**: O video ocupa a tela inteira sem sidebar de navegacao, breadcrumb simples demais, botao "Marcar como Concluida" sem destaque visual
6. **Minha Jornada**: KPIs genericos sem visualizacao atraente, cards de modulo sem hierarquia visual
7. **Quiz**: Tela pre-prova sem apelo visual, questoes sem numeracao contextual destacada
8. **Certificados**: Card simples demais, preview do certificado sem impacto visual

---

## 1. Header Contextual (`Academy.tsx`)

### Na tela principal (com abas)
- Header com gradiente sutil, titulo "NOE Academy" grande com icone animado (GraduationCap)
- Subtitulo descritivo
- Barra de progresso circular (ring) ao inves de barra linear fina
- Contadores rapidos: "X modulos concluidos", "Y certificados"

### Nas sub-telas (modulo, aula, quiz)
- Header compacto: apenas breadcrumb estilizado + mini progresso
- Esconder as abas e o header grande

---

## 2. Abas Visuais Melhoradas (`Academy.tsx`)

- Cards maiores com **descricao curta** abaixo do nome (ex: "Veja todas as trilhas disponiveis")
- Contagem de itens dentro de cada aba (ex: "4 trilhas", "2 certificados")
- Efeito de hover com elevacao + brilho sutil
- Aba ativa com borda lateral grossa (nao apenas bottom line fina)
- Separar abas de usuario e admin visualmente (divisor com label "Administracao")

---

## 3. Grid de Modulos Redesenhado (`AcademyModules.tsx`)

- Cards com layout horizontal no desktop (imagem/gradiente a esquerda, conteudo a direita) para melhor escaneabilidade
- Icone tematico por categoria dentro do gradiente (nao so cor chapada)
- Badge de progresso mais visual: circulo com % ao inves de barra fina
- Status visual claro: checkmark grande verde se 100%, indicador de "em andamento" pulsante
- Botao "Continuar" ou "Iniciar" com seta animada no hover
- Filtros de categoria como pills com icone + contagem

---

## 4. Detalhe do Modulo Redesenhado (`AcademyModuleDetail.tsx`)

- Header com gradiente + icone grande da categoria + stats em cards inline (aulas, horas, versao)
- Lista de aulas como "timeline vertical" com linha conectora entre os itens
- Aulas concluidas: icone check verde com fundo, titulo normal (sem strikethrough), badge "Concluida"
- Aula atual/em progresso: highlight com borda colorida + badge "Em andamento"
- Aulas pendentes: numeracao sutil, aparencia mais clara
- Card da prova com visual mais impactante: gradiente, icone Trophy grande, call-to-action claro
- Sidebar lateral (desktop) com mini-mapa das aulas para navegacao rapida

---

## 5. Player de Aula Melhorado (`AcademyLesson.tsx`)

- Layout com sidebar lateral no desktop: video (70%) + painel lateral (30%)
  - Painel lateral: lista de aulas do modulo com status visual, navegacao direta
- Video com cantos arredondados e sombra
- Abaixo do video: card com titulo, descricao, duracao, materiais
- Botao "Marcar como Concluida" mais visual: grande, verde, com animacao de confetti ao clicar
- Barra de progresso do modulo no topo (mini, contextual)
- Navegacao inferior mais visual: cards compactos com preview da proxima/anterior aula

---

## 6. Minha Jornada Visual (`AcademyJourney.tsx`)

- KPIs no topo com icones grandes, cores vibrantes, e animacao de contagem
- Card "Continue de onde parou" mais visual: thumbnail do modulo, titulo da aula, botao CTA grande
- Progress por modulo em cards visuais com:
  - Mini gradiente da categoria no topo
  - Barra de progresso estilizada com marcadores
  - Proxima aula recomendada como link direto
  - Indicadores visuais: estrela para aprovado, relogio para em andamento

---

## 7. Quiz Melhorado (`AcademyQuiz.tsx`)

### Pre-prova
- Card visual grande com gradiente, icone Trophy, informacoes claras em grid
- Historico de tentativas em timeline visual (nao tabela)
- Botao CTA destacado com contagem regressiva visual das tentativas

### Prova ativa
- Questao com numero grande e destaque visual
- Opcoes como cards clicaveis (nao radio buttons soltos)
- Barra de progresso com indicadores de questoes respondidas/pendentes
- Timer mais visual (se aplicavel)

### Resultado
- Tela de resultado com animacao (confetti se aprovado)
- Score em circulo grande animado
- Detalhamento em acordeao (nao tudo aberto)

---

## 8. Certificados Premium (`AcademyCertificates.tsx`)

- Cards com miniatura visual do certificado (simulada)
- Preview do certificado mais elaborado:
  - Borda dupla decorativa
  - Selo/stamp visual
  - Tipografia mais sofisticada
  - Fundo com pattern sutil
  - Gradiente dourado

---

## 9. Efeitos e Animacoes Gerais

- Transicoes entre telas com fade-in suave (classe `animate-fade-in`)
- Cards com hover: elevacao + brilho sutil
- Botoes com transicao de gap/scale no hover
- Progresso com animacao de fill
- Icones de status com micro-animacao (pulse no "em andamento")
- Loading skeleton enquanto troca de tela

---

## Detalhes Tecnicos

### Arquivos modificados

```text
src/pages/Academy.tsx                        -- header contextual, abas melhoradas, separador admin
src/components/academy/AcademyModules.tsx     -- grid horizontal, filtros com icone, progress circular
src/components/academy/AcademyModuleDetail.tsx -- timeline de aulas, sidebar mini-mapa, visual prova
src/components/academy/AcademyLesson.tsx      -- layout com sidebar, video estilizado, botao animado
src/components/academy/AcademyJourney.tsx     -- KPIs visuais, card CTA, progress cards
src/components/academy/AcademyQuiz.tsx        -- opcoes como cards, resultado animado, historico visual
src/components/academy/AcademyCertificates.tsx -- miniatura visual, preview premium
src/components/academy/AcademyReports.tsx     -- KPIs coloridos, tabela com barras visuais
src/data/academyData.ts                       -- adicionar icone e descricao por categoria
```

### Estrategia de Implementacao

Implementar em 3 etapas por causa do tamanho:

**Etapa 1**: Academy.tsx (header + abas) + AcademyModules.tsx (grid redesenhado) + academyData.ts (helpers extras)

**Etapa 2**: AcademyModuleDetail.tsx (timeline) + AcademyLesson.tsx (layout sidebar) + AcademyJourney.tsx (visual)

**Etapa 3**: AcademyQuiz.tsx (cards clicaveis) + AcademyCertificates.tsx (premium) + AcademyReports.tsx (polish)

