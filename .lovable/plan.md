

## Plano: Corrigir sobreposição de Tutorial + Tour no SaaS

### Problema

O `FeatureTutorialButton` (em cada página como Plano de Vendas) auto-abre o dialog tutorial na primeira visita via `useState(() => !localStorage.getItem(...))`. Isso acontece **simultaneamente** com o `OnboardingTour` que abre via `ClienteLayout`, causando a sobreposição visível no print.

### Solução

Fazer o `FeatureTutorialDialog` **não auto-abrir** enquanto o tour ainda não foi concluído. A lógica: se `localStorage.getItem("onboarding_tour_done")` não existir, o tutorial não deve abrir automaticamente.

### Mudança

| Arquivo | O quê |
|---------|-------|
| `src/components/cliente/FeatureTutorialButton.tsx` | Verificar se o tour já foi concluído antes de auto-abrir o tutorial |

### Código

```typescript
// FeatureTutorialButton.tsx — line 14
// Antes:
const [open, setOpen] = useState(() => !localStorage.getItem(`feature_tutorial_${slug}_seen`));

// Depois:
const [open, setOpen] = useState(() => {
  const tourDone = localStorage.getItem("onboarding_tour_done");
  if (!tourDone) return false; // Tour still pending, don't auto-open tutorial
  return !localStorage.getItem(`feature_tutorial_${slug}_seen`);
});
```

Mudança de 1 linha. O botão `?` continua permitindo abrir o tutorial manualmente a qualquer momento. Apenas o auto-open na primeira visita é bloqueado enquanto o tour não foi concluído.

