

# Prioridade 6: Correções restantes e funcionalidade pendente

## Diagnóstico

1. **Console warning ativo**: `Skeleton` em `skeleton.tsx` não usa `forwardRef` — causa warnings na página Unidades (visível nos logs agora)
2. **"Em breve" pendente**: Botão "Nova Questão" no `AcademyAdmin.tsx` ainda exibe toast placeholder — é a única funcionalidade marcada como "Em breve" que pode ser implementada
3. Os outros "Em breve" encontrados são textos de UX legítimos (opção de select e empty state), não funcionalidades faltantes

## Plano

### 1. Corrigir Skeleton com forwardRef
- **Arquivo**: `src/components/ui/skeleton.tsx`
- Converter para `React.forwardRef` (mesmo padrão aplicado ao Badge na P5)
- Elimina os warnings no console da página Unidades

### 2. Implementar criação de questões no AcademyAdmin
- **Arquivo**: `src/components/academy/AcademyAdmin.tsx`
- Adicionar dialog para criar nova questão de quiz com: pergunta, opções (2-4), resposta correta
- Usar mutation `createQuizQuestion` do hook `useAcademy` (verificar se já existe, senão criar)
- **Arquivo**: `src/hooks/useAcademy.ts` — adicionar mutation para `academy_quiz_questions` se necessário

### 3. Atualizar plano
- **Arquivo**: `.lovable/plan.md` — registrar Prioridade 6 como concluída

| Arquivo | Ação |
|---------|------|
| `src/components/ui/skeleton.tsx` | Adicionar forwardRef |
| `src/components/academy/AcademyAdmin.tsx` | Implementar dialog de nova questão |
| `src/hooks/useAcademy.ts` | Adicionar mutation createQuizQuestion se necessário |
| `.lovable/plan.md` | Atualizar status |

