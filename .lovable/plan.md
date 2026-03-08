

## Plano: Implementar aba "Provas" no NOE Academy

### Contexto

A aba "Provas" (`case "provas"`) em `Academy.tsx` retorna `null`. Precisa exibir uma lista de todas as provas disponíveis (quizzes vinculados a módulos publicados), com status de tentativas do usuário e acesso direto ao quiz.

### Componente novo: `AcademyQuizList.tsx`

Criar `src/components/academy/AcademyQuizList.tsx` que:

1. Busca todos os módulos publicados, quizzes, lessons, progress e quiz attempts do usuário
2. Para cada módulo que tem quiz, exibe um card com:
   - Nome do módulo e categoria (badge colorida)
   - Progresso das aulas (X/Y concluídas)
   - Status da prova: "Bloqueada" (aulas incompletas), "Disponível", "Aprovado" (score), "Reprovado"
   - Botão para fazer/refazer a prova (abre o module player no modo quiz)
   - Histórico de tentativas (score, data, aprovado/reprovado)
3. Módulos sem quiz mostram "Sem prova cadastrada"

### Mudança em `Academy.tsx`

- Importar `AcademyQuizList`
- No `renderTabContent`, `case "provas"` retorna `<AcademyQuizList onStartQuiz={(moduleId) => setSelectedModuleId(moduleId)} />`

### Hooks utilizados (já existentes)

- `useAcademyModules`, `useAcademyQuizzes` (sem moduleId = todos), `useAcademyLessons` (sem moduleId = todos), `useAcademyProgress`, `useAcademyQuizAttempts` (sem quizId = todos)
- `computeModuleProgress` para verificar se aulas estão completas

### Nenhuma migração SQL necessária

Todos os dados já estão disponíveis nas tabelas existentes.

