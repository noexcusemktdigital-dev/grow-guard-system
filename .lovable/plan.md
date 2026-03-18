

# Investigação: Bug do ScriptGeneratorDialog

## Análise do Código

Após investigar detalhadamente os arquivos envolvidos, o código está estruturalmente correto:

1. **`ClienteScripts.tsx` (linha 250-255)**: Usa o padrão `{showCreate && <ScriptGeneratorDialog open={showCreate} .../>}` — conditional mount + open prop.
2. **`ScriptGeneratorDialog.tsx` (linha 423-425)**: Usa `<Dialog open={open} onOpenChange={onOpenChange}>` com portal — deveria renderizar sobre qualquer elemento.
3. **`dialog.tsx`**: Usa Radix Portal padrão com z-50.

## Causa Raiz Identificada

O bug pode se manifestar em dois cenários:

1. **FeatureGateOverlay bloqueando**: A rota `/cliente/scripts` está em `SALES_PLAN_REQUIRED` (FeatureGateContext, linha 56). Se o Plano de Vendas não estiver completo, um overlay `absolute inset-0 z-50` cobre toda a página, impedindo o clique no botão. Neste caso não é bug do Dialog — é o gate funcionando.

2. **Timing de mount/unmount**: O padrão `{showCreate && <Component/>}` causa unmount ao fechar. Em alguns cenários de race condition (click rápido, re-render do parent), o Dialog pode montar e desmontar antes de animar. A solução mais robusta é **sempre montar o Dialog** e controlar visibilidade apenas via prop `open`.

## Plano de Correção

### Arquivo: `src/pages/cliente/ClienteScripts.tsx`

Alterar o padrão de renderização do dialog de conditional mount para always-mounted:

**Antes (linhas 250-256):**
```tsx
{showCreate && (
  <ScriptGeneratorDialog
    open={showCreate}
    onOpenChange={setShowCreate}
    onSave={handleSaveFromDialog}
  />
)}
```

**Depois:**
```tsx
<ScriptGeneratorDialog
  open={showCreate}
  onOpenChange={setShowCreate}
  onSave={handleSaveFromDialog}
/>
```

### Arquivo: `src/components/cliente/ScriptGeneratorDialog.tsx`

Adicionar reset de estado quando o dialog abre (já que não terá mais unmount automático):

No componente principal, adicionar um `useEffect` que reseta o step e campos quando `open` muda para `true`:

```tsx
import { useState, useEffect } from "react";

// Dentro do componente, após as declarações de state:
useEffect(() => {
  if (open) {
    setStep(1);
    setMode("ai");
    setStage(initialStage || "prospeccao");
    setBriefing({});
    setGeneratedContent("");
    setGeneratedTitle("");
    setGeneratedTags([]);
    setShowTutorial(true);
    setReferenceLinks([]);
    setAdditionalContext("");
    setManualTitle("");
    setManualContent("");
  }
}, [open]);
```

Isso garante que o Dialog está sempre montado no DOM (sem race conditions de portal) e reseta o estado a cada abertura.

