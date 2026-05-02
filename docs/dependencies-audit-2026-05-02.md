# Dependencies Audit — Sistema Noé — 2026-05-02

## Sumário

- PROD deps: 65
- DEV deps: 27
- Total: 92

## Categorias

### Core (não mexer sem ADR)

- react@^18.3.1
- react-dom@^18.3.1
- vite@^6.4.2
- vite-plugin-pwa@^1.2.0
- @supabase/supabase-js@^2.97.0
- @tanstack/react-query@^5.83.0
- react-router-dom@^6.30.1

### UI / shadcn

- @radix-ui/react-accordion@^1.2.11
- @radix-ui/react-alert-dialog@^1.1.14
- @radix-ui/react-aspect-ratio@^1.1.7
- @radix-ui/react-avatar@^1.1.10
- @radix-ui/react-checkbox@^1.3.2
- @radix-ui/react-collapsible@^1.1.11
- @radix-ui/react-context-menu@^2.2.15
- @radix-ui/react-dialog@^1.1.14
- @radix-ui/react-dropdown-menu@^2.1.15
- @radix-ui/react-hover-card@^1.1.14
- @radix-ui/react-label@^2.1.7
- @radix-ui/react-menubar@^1.1.15
- @radix-ui/react-navigation-menu@^1.2.13
- @radix-ui/react-popover@^1.1.14
- @radix-ui/react-progress@^1.1.7
- @radix-ui/react-radio-group@^1.3.7
- @radix-ui/react-scroll-area@^1.2.9
- @radix-ui/react-select@^2.2.5
- @radix-ui/react-separator@^1.1.7
- @radix-ui/react-slider@^1.3.5
- @radix-ui/react-slot@^1.2.3
- @radix-ui/react-switch@^1.2.5
- @radix-ui/react-tabs@^1.1.12
- @radix-ui/react-toast@^1.2.14
- @radix-ui/react-toggle@^1.1.9
- @radix-ui/react-toggle-group@^1.1.10
- @radix-ui/react-tooltip@^1.2.7
- tailwindcss@^3.4.17
- tailwindcss-animate@^1.0.7
- tailwind-merge@^2.6.0
- lucide-react@^0.462.0
- framer-motion@^12.34.3
- class-variance-authority@^0.7.1
- clsx@^2.1.1
- cmdk@^1.1.1
- next-themes@^0.3.0
- sonner@^1.7.4
- vaul@^0.9.9
- embla-carousel-react@^8.6.0
- react-resizable-panels@^2.1.9

### Forms / Validação

- zod@^3.25.76
- react-hook-form@^7.61.1
- @hookform/resolvers@^3.10.0
- input-otp@^1.4.2

### Drag & Drop

- @dnd-kit/core@^6.3.1
- @dnd-kit/modifiers@^9.0.0
- @dnd-kit/sortable@^10.0.0

### IA

Nenhuma dep direta — invocação via Edge Functions → Lovable AI Gateway.

### PDF / Docs

- jspdf@^4.2.1
- html2canvas@^1.4.1
- docx@9.5.0
- file-saver@^2.0.5
- @types/file-saver@^2.0.7

### Charts / Data Viz

- recharts@^2.15.4
- @tanstack/react-virtual@^3.13.23
- react-day-picker@^8.10.1

### Storage / PWA

- idb-keyval@^6.2.2
- workbox-window@^7.4.0
- @vitejs/plugin-react-swc@^3.11.0

### Segurança / Sanitização

- dompurify@^3.3.3
- @types/dompurify@^3.0.5

### Auth / Cloud

- @lovable.dev/cloud-auth-js@^1.0.0

### Utilitários

- date-fns@^3.6.0

### Tests

- vitest@^3.2.4
- @vitest/coverage-v8@^3.2.4
- @testing-library/react@^16.0.0
- @testing-library/dom@^10.4.1
- @testing-library/user-event@^14.6.1
- @testing-library/jest-dom@^6.6.0
- jsdom@^20.0.3

### CI / Lint

- eslint@^9.32.0
- @eslint/js@^9.32.0
- eslint-plugin-react-hooks@^5.2.0
- eslint-plugin-react-refresh@^0.4.20
- typescript@^5.8.3
- typescript-eslint@^8.38.0
- globals@^15.15.0
- @types/node@^22.16.5
- @types/react@^18.3.23
- @types/react-dom@^18.3.7
- autoprefixer@^10.4.21
- postcss@^8.5.6
- react-snap@^1.23.0
- lovable-tagger@^1.1.13
- vite-imagetools@6.2.9
- @tailwindcss/typography@^0.5.16

## Vulnerabilidades

Status: pendente — `npm audit` não roda no worktree (sem `node_modules` instalados).

Recomendação: adicionar ao CI:

```yaml
- run: npm audit --audit-level=high
```

Renovate (via `renovate.json` presente no repo) resolve patches e minors automaticamente via PR. Majors devem ser tratados manualmente via PR com ADR quando aplicável.

## Deps Deprecadas / Abandonadas

Inspeção manual recomendada com:

```bash
npx npm-check-updates
```

Itens com pinning exato (sem `^`) merecem atenção especial:

- `docx@9.5.0` — versão fixada, verificar se há patch de segurança disponível
- `vite-imagetools@6.2.9` — versão fixada, monitorar

## Branch Protection

`CODEOWNERS` presente no repositório — exige review em mudanças de `package.json`.

## Próximos Passos

1. Rodar `npm audit --audit-level=high` em CI semanal
2. Confirmar setup do Renovate App (pendente Rafael) para automação de patches
3. Auditoria semestral de deps obsoletas com `npx npm-check-updates`
4. Avaliar upgrade `react-day-picker` (v8 → v9 disponível)
5. Verificar `docx@9.5.0` e `vite-imagetools@6.2.9` para patches de segurança
