

# Marketing Drive + NOE Academy - Reformulacao Completa

## 1. Marketing - Drive de Materiais Completo

A pagina atual do franqueado (`FranqueadoMateriais.tsx`) e muito simples: lista flat de assets sem navegacao por pastas, sem categorias, sem preview. Vamos transformar em um drive profissional.

### Novo layout com navegacao por pastas
- Sidebar lateral com arvore de pastas (usando `marketing_folders` com `parent_id` para hierarquia)
- Area principal com grid de arquivos da pasta selecionada
- Breadcrumb de navegacao mostrando caminho atual (ex: "Marketing > Campanhas > Black Friday")
- Preview inline: imagens mostram thumbnail, PDFs mostram icone tipado, videos mostram player embed
- Filtros por tipo de arquivo (Imagem, Video, PDF, Documento, Apresentacao)
- Filtro por tags
- Botao de download individual e download em lote (selecao multipla com checkboxes)
- Visualizador modal: ao clicar num arquivo, abre modal com preview grande + detalhes (tamanho, data, tags, quem enviou)

### Categorias visuais por tipo
| Tipo | Icone | Cor |
|------|-------|-----|
| Imagem (jpg/png/webp) | Image | blue |
| Video (mp4/mov) | Video | purple |
| PDF | FileText | red |
| Documento (doc/docx) | FileSpreadsheet | green |
| Apresentacao (ppt/pptx) | Presentation | orange |
| Outro | File | gray |

### Arquivos editados
- `src/pages/franqueado/FranqueadoMateriais.tsx` - reescrever com navegacao por pastas, filtros, preview modal, breadcrumb, selecao multipla

---

## 2. NOE Academy - Plataforma EAD Completa

Renomear "Academy e Treinamentos" para "NOE Academy" em toda a aplicacao. Transformar a pagina simples em uma plataforma EAD real com todas as funcionalidades.

### 2.1 Renomear
- Sidebar: "Academy e Treinamentos" -> "NOE Academy"
- PageHeader: "NOE Academy" com subtitulo "Plataforma de treinamentos e certificacoes da rede"

### 2.2 Layout com abas
Organizar em abas de navegacao:

| Aba | Descricao |
|-----|-----------|
| Trilhas | Grid de modulos com cards visuais, progresso individual, filtro por categoria |
| Minha Evolucao | Dashboard pessoal: progresso geral, horas assistidas, sequencia de dias, grafico de evolucao |
| Certificados | Lista de certificados obtidos com opcao de download/visualizacao |
| Ranking | Ranking gamificado entre usuarios da franquia |

### 2.3 Aba Trilhas (modulos)
- Cards de modulo com: thumbnail, titulo, categoria (badge colorido), dificuldade, barra de progresso, total de aulas, duracao estimada
- Ao clicar num modulo, abre pagina de detalhe com:
  - Lista de aulas com status (nao iniciada / em andamento / concluida)
  - Player de video YouTube embed
  - Botao "Marcar como concluida"
  - Ao final do modulo, botao "Fazer Prova" (se houver quiz)
  - Quiz com perguntas de multipla escolha, feedback imediato, nota final
  - Se aprovado: gera certificado automaticamente

### 2.4 Aba Minha Evolucao
- KPIs: Modulos concluidos, Aulas assistidas, Horas totais, Certificados obtidos
- Grafico de progresso mensal (recharts - AreaChart)
- Lista de modulos em andamento com progresso
- Sequencia de dias estudando (streak)
- Trofeus desbloqueados (baseados em marcos: 1a aula, 1o modulo, 5 modulos, todas as provas aprovadas)

### 2.5 Aba Certificados
- Grid de certificados com: nome do modulo, data de emissao, nota da prova
- Botao de download (PDF ou imagem)
- Badge visual do certificado

### 2.6 Aba Ranking
- Tabela com ranking dos usuarios da franquia
- Colunas: posicao, nome, modulos concluidos, aulas assistidas, pontuacao total
- Destaque para top 3 (ouro, prata, bronze)
- Dados vindos de `academy_progress` agrupados por usuario

### 2.7 Gamificacao - Trofeus
Trofeus sao conquistas desbloqueadas automaticamente. Nao precisam de tabela nova - sao computados a partir dos dados existentes:

| Trofeu | Condicao |
|--------|----------|
| Primeiro Passo | Completou a primeira aula |
| Estudante Dedicado | Completou 10 aulas |
| Modulo Completo | Terminou o primeiro modulo inteiro |
| Mestre | Completou 5 modulos |
| Aprovado | Passou na primeira prova |
| Nota Maxima | Tirou 100% em alguma prova |
| Certificado | Obteve o primeiro certificado |
| Colecionador | Obteve 3+ certificados |

### Arquivos editados/criados
- `src/components/FranqueadoSidebar.tsx` - renomear label para "NOE Academy"
- `src/pages/franqueado/FranqueadoAcademy.tsx` - reescrever completamente com abas (Trilhas, Minha Evolucao, Certificados, Ranking)
- `src/components/academy/AcademyModulePlayer.tsx` (novo) - player de aulas com video embed + lista lateral de aulas + botao concluir
- `src/components/academy/AcademyEvolution.tsx` (novo) - dashboard de evolucao pessoal com graficos e trofeus
- `src/components/academy/AcademyRanking.tsx` (novo) - ranking gamificado entre usuarios

### Dados existentes no banco
As tabelas ja existem e suportam tudo:
- `academy_modules` - modulos com `is_published`, `category`, `difficulty`, `thumbnail_url`
- `academy_lessons` - aulas com `video_url`, `duration_minutes`, `content`
- `academy_progress` - progresso por aula com `completed_at`, `progress_percent`
- `academy_quizzes` - provas por modulo com `passing_score`
- `academy_quiz_questions` - perguntas com `options` (jsonb) e `correct_answer`
- `academy_quiz_attempts` - tentativas com `score`, `passed`
- `academy_certificates` - certificados emitidos

Nenhuma migracao de banco necessaria. Todos os hooks ja existem em `useAcademy.ts`.

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/FranqueadoSidebar.tsx` | Renomear "Academy e Treinamentos" -> "NOE Academy" |
| `src/pages/franqueado/FranqueadoMateriais.tsx` | Reescrever com navegacao por pastas, filtros, preview |
| `src/pages/franqueado/FranqueadoAcademy.tsx` | Reescrever com 4 abas (Trilhas, Evolucao, Certificados, Ranking) |
| `src/components/academy/AcademyModulePlayer.tsx` | Novo - player de modulo com video + aulas + quiz |
| `src/components/academy/AcademyEvolution.tsx` | Novo - dashboard de evolucao + trofeus |
| `src/components/academy/AcademyRanking.tsx` | Novo - ranking gamificado |

