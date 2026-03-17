

## Plano: Esconder banners/avisos durante o Tour de onboarding

### Problema
Quando o tour está ativo (OnboardingTour), os banners (TrialCountdownBanner, CreditAlertBanner, ActionAlertsBanner) e o AnnouncementPopupDialog aparecem por trás/ao redor do overlay, causando confusão visual e impedindo cliques no tour.

### Solução
Usar o estado `tourDone` que já existe no `ClienteLayout` para esconder **todos os banners e popups** enquanto o tour estiver ativo. Só exibi-los depois que o tour for concluído.

### Mudança

**Arquivo:** `src/components/ClienteLayout.tsx`

1. Passar `tourDone` como condição para renderizar os banners:
```tsx
{tourDone && <TrialCountdownBanner />}
{tourDone && <CreditAlertBanner />}
// ...
{tourDone && !isChatRoute && <ActionAlertsBanner />}
```

2. O `AnnouncementPopupDialog` já recebe `enabled={tourDone}`, então está correto.

Isso garante sequência limpa: Welcome Modal → Tour → Banners + Avisos.

