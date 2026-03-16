

## Plano: 3 Correções no Fluxo SaaS (Senha, Email, Tour)

### 1. Indicador de força de senha no cadastro

**Arquivo:** `src/pages/SaasAuth.tsx`

Adicionar abaixo do campo de senha no formulário de signup:
- Barra de força visual (fraca/média/forte) com cores vermelho/amarelo/verde
- Lista de dicas visíveis enquanto digita:
  - ✓/✗ Mínimo 8 caracteres
  - ✓/✗ Letra maiúscula
  - ✓/✗ Número
  - ✓/✗ Caractere especial (!@#$...)
- Bloquear submit se senha < 8 caracteres (atualmente aceita 6)

### 2. Aviso sobre lixo eletrônico na tela de verificação

**Arquivo:** `src/pages/SaasAuth.tsx` (seção `verify-email`)

Adicionar texto na tela de confirmação de email:
> "Não encontrou? Verifique sua pasta de **Spam** ou **Lixo eletrônico**."

### 3. Corrigir sobreposição Tour + TrialWelcomeModal + AnnouncementPopup

**Problema:** No primeiro acesso SaaS, três elementos aparecem ao mesmo tempo com z-index conflitante: `TrialWelcomeModal`, `OnboardingTour` (z-[9999]) e `AnnouncementPopupDialog`. Resultado: tudo trava.

**Solução: sequenciar os 3 via eventos no `ClienteLayout`**

| Ordem | Componente | Condição para abrir |
|-------|-----------|-------------------|
| 1º | `TrialWelcomeModal` | Abre normalmente (trial + não visto) |
| 2º | `OnboardingTour` | Só abre DEPOIS que TrialWelcomeModal fechar |
| 3º | `AnnouncementPopupDialog` | Só abre DEPOIS que OnboardingTour fechar (ou se não houve tour) |

**Implementação:**
- `TrialWelcomeModal` e `OnboardingTour` recebem callbacks `onComplete`
- `ClienteLayout.tsx` gerencia o estado de sequência: `welcomeDone → tourDone → announcements`
- `AnnouncementPopupDialog` recebe prop `enabled` para atrasar abertura
- O tour já marca `localStorage` para não repetir — manter esse comportamento

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/SaasAuth.tsx` | Indicador de força de senha + aviso spam |
| `src/components/cliente/TrialWelcomeModal.tsx` | Aceitar prop `onComplete` |
| `src/components/cliente/OnboardingTour.tsx` | Aceitar prop `onComplete` + `enabled` |
| `src/components/AnnouncementPopupDialog.tsx` | Aceitar prop `enabled` |
| `src/components/ClienteLayout.tsx` | Orquestrar sequência dos 3 componentes |

