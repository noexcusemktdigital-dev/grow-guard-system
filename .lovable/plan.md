

# Fix: Full-Width Layout for All Pages

## Problem

Every page in the system uses `max-w-3xl` through `max-w-7xl` combined with `mx-auto`, which caps the content at a fixed maximum width and centers it. This leaves large empty margins on both sides, especially on wider screens, making the interface look "disproportionate" and underutilizing the available space.

## Solution

Remove the `max-w-*xl mx-auto` constraint from every page wrapper across all three areas (Cliente, Franqueadora, Franqueado). Replace with `w-full space-y-6` so content fills the full width available inside the layout's padding (`p-6 lg:p-8`).

The layout components (`ClienteLayout`, `FranqueadoraLayout`, `FranqueadoLayout`) already provide padding, so the content doesn't need self-centering constraints.

## Pages to Update

### Cliente Pages (20 files)
| File | Current constraint |
|------|-------------------|
| ClienteInicio.tsx | max-w-7xl |
| ClienteDashboard.tsx | max-w-7xl |
| ClienteCRM.tsx | max-w-7xl / max-w-full |
| ClienteDisparos.tsx | max-w-6xl |
| ClienteConteudos.tsx | max-w-6xl |
| ClienteRedesSociais.tsx | max-w-6xl |
| ClienteTrafegoPago.tsx | max-w-6xl |
| ClientePlanoMarketing.tsx | max-w-6xl |
| ClientePlanoVendas.tsx | max-w-6xl |
| ClientePlanoCreditos.tsx | max-w-6xl |
| ClienteGamificacao.tsx | max-w-5xl |
| ClienteAgentesIA.tsx | max-w-5xl |
| ClienteScripts.tsx | max-w-5xl |
| ClienteChat.tsx | max-w-5xl (empty state only) |
| ClienteAvaliacoes.tsx | max-w-4xl |
| ClienteConfiguracoes.tsx | max-w-4xl |
| ClienteNotificacoes.tsx | max-w-4xl |
| ClienteIntegracoes.tsx | max-w-4xl |
| ClienteChecklist.tsx | max-w-3xl |
| ClienteSites.tsx | max-w-5xl |

### Franqueadora Pages (12+ files)
| File | Current constraint |
|------|-------------------|
| Home.tsx | max-w-7xl |
| Marketing.tsx, Matriz.tsx, MetasRanking.tsx, etc. | max-w-7xl |
| CrmExpansao.tsx, Agenda.tsx, etc. | various |

### Franqueado Pages (12+ files)
| File | Current constraint |
|------|-------------------|
| FranqueadoDashboard.tsx | max-w-7xl |
| FranqueadoContratos.tsx, FranqueadoComunicados.tsx, etc. | max-w-7xl |
| FranqueadoDiagnostico.tsx | max-w-3xl |

## Change Pattern

For every file, the change is the same:

```
Before: <div className="max-w-6xl mx-auto space-y-6">
After:  <div className="w-full space-y-6">
```

Some pages have multiple return paths (loading state + main render), so each `max-w-*xl mx-auto` occurrence must be updated.

## What Won't Change

- Layout padding (`p-6 lg:p-8`) stays in the layout components
- Internal grid structures (`grid-cols-2 lg:grid-cols-4`) remain unchanged and will naturally expand
- The Chat page's connected state already uses `flex-1` (no max-w constraint)
- Responsive breakpoints within cards/grids continue to work

## Estimated Scope

Approximately 34 files with ~50+ occurrences of the pattern to replace.
