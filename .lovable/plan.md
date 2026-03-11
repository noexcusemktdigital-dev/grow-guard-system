

## Plano: Corrigir Scripts & Testar Importação CSV

### Problemas Identificados nos Scripts

Analisei os arquivos `ClienteScripts.tsx` e `ScriptGeneratorDialog.tsx` e identifiquei as causas do flickering:

1. **Hooks de data-fetching dentro do Dialog**: `useCrmProducts`, `useCrmFunnels`, `useSalesPlan` e `useUserOrgId` executam queries toda vez que o componente renderiza, mesmo com o dialog fechado. Cada query resolvida causa re-render do dialog inteiro.

2. **Reset massivo de estados no `handleOpenChange`**: A função `reset()` altera 11 estados simultaneamente ao abrir/fechar, causando múltiplos re-renders em cascata.

3. **Dialog sempre montado no DOM**: O `ScriptGeneratorDialog` é renderizado permanentemente (mesmo quando `open=false`), então os hooks internos ficam ativos o tempo todo, disparando queries desnecessárias.

### Correções Planejadas

**1. Renderização condicional do Dialog**
- Em `ClienteScripts.tsx`, envolver o `ScriptGeneratorDialog` com `{showCreate && <ScriptGeneratorDialog ... />}` para que os hooks só executem quando o dialog está aberto. Isso elimina queries desnecessárias e o flickering principal.

**2. Estado inicial via `key` prop**
- Usar `key={showCreate ? "open" : "closed"}` para forçar unmount/remount limpo, eliminando a necessidade do `reset()` manual com 11 `setState` calls.

**3. Mover hooks para dentro do step correto**
- Os hooks `useCrmProducts`, `useCrmFunnels`, `useSalesPlan` só são usados no Step 2 (AI mode). Criar um sub-componente `BriefingStep` que encapsula esses hooks, evitando queries no Step 1 e Step 3.

### Arquivos a editar
- `src/pages/cliente/ClienteScripts.tsx` — renderização condicional do dialog
- `src/components/cliente/ScriptGeneratorDialog.tsx` — refatorar hooks e reset

### Teste CSV de Leads
Após as correções, posso testar a importação CSV no CRM do cliente usando o browser.

