

## Plano: Finalizar Marketing Drive + NOE Academy

### Estado Atual

**Marketing** -- Ambas as páginas existem e funcionam:
- Franqueadora (`Marketing.tsx`): CRUD de pastas e upload de arquivos OK. Falta: editar/renomear pasta, editar asset, confirmação de exclusão.
- Franqueado (`FranqueadoMateriais.tsx`): Read-only OK. Falta: nada estrutural, apenas pequenos ajustes de UX.

**Academy** -- Ambas as páginas existem:
- Franqueadora (`Academy.tsx` + `AcademyAdmin.tsx`): Criar módulos/aulas/questões OK. Falta: **editar e excluir** módulos, aulas e questões (botões existem mas são placeholder toast). Falta: editar prova config. Falta `deleteModule`, `deleteLesson`, `deleteQuizQuestion`, `updateLesson`, `updateQuizQuestion` no hook.
- Franqueado (`FranqueadoAcademy.tsx`): Trilhas, Evolução, Certificados, Ranking OK. Falta: **aba Provas** (fazer quiz) -- o componente `AcademyQuiz` existe mas não é usado nesta página.

### Mudanças

#### 1. Hook `useAcademy.ts` -- Adicionar mutações faltantes
- `deleteModule` (delete from academy_modules)
- `updateLesson` (update academy_lessons)
- `deleteLesson` (delete from academy_lessons)
- `updateQuizQuestion` (update academy_quiz_questions)
- `deleteQuizQuestion` (delete from academy_quiz_questions)
- `createQuiz` (insert into academy_quizzes para módulos sem prova)
- `updateQuiz` (update passing_score, etc.)

#### 2. `AcademyAdmin.tsx` -- Tornar edição/exclusão real
- Módulos: botão Editar abre dialog preenchido → chama `updateModule`; adicionar botão Excluir → chama `deleteModule` com confirmação
- Aulas: botão Editar abre dialog preenchido → chama `updateLesson`; botão Excluir → chama `deleteLesson` com confirmação
- Provas: editar config (passing_score) → chama `updateQuiz`; botão Criar Prova para módulos sem prova; botão Excluir questão → `deleteQuizQuestion`; botão Editar questão → dialog preenchido → `updateQuizQuestion`

#### 3. `FranqueadoAcademy.tsx` -- Adicionar aba Provas
- Adicionar tab "Provas" que lista módulos com provas disponíveis
- Ao clicar, abre o componente `AcademyQuiz` já existente para fazer a prova
- Mostrar tentativas anteriores e status (aprovado/reprovado)

#### 4. `Marketing.tsx` (Franqueadora) -- Polimentos
- Adicionar dialog de confirmação antes de excluir arquivos/pastas
- Adicionar opção de renomear pasta (já existe `createFolder`, falta update)
- Adicionar rename para assets

#### 5. Hook `useMarketing.ts` -- Adicionar mutações faltantes
- `updateFolder` (rename)
- `updateAsset` (rename)

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/hooks/useAcademy.ts` | Adicionar 7 mutações faltantes |
| `src/components/academy/AcademyAdmin.tsx` | Tornar editar/excluir funcional |
| `src/pages/franqueado/FranqueadoAcademy.tsx` | Adicionar aba Provas |
| `src/pages/Marketing.tsx` | Confirmação de exclusão, rename |
| `src/hooks/useMarketing.ts` | Adicionar updateFolder, updateAsset |

