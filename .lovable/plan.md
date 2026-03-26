

## Remover Diagramação + Textos por Arte com Aprovação Individual

### 1. Remover Step 4 (Diagramação/Layout)

O layout agora será derivado das referências visuais. Remover o step 4 inteiro e ajustar a numeração:

- Step 1: Modo de saída (digital/print) — mantém
- Step 2: Briefing + Objetivo — mantém
- Step 3: Tipo + Quantidade — mantém
- ~~Step 4: Diagramação~~ — **REMOVIDO**
- Step 4 (antigo 5): Logo
- Step 5 (antigo 6): Referências — adicionar nota: "O layout da arte será baseado na referência principal ⭐"
- Step 6 (antigo 7): Fotos
- Step 7 (antigo 8): Formato
- Step 8 (antigo 9): Revisão final

`TOTAL_STEPS` muda de 9 para 8. Remover import de `LayoutPicker`, remover `LAYOUT_TYPES` do import de constants (se não usado em outro lugar). O `layoutTypes` state continua existindo mas será `["auto"]` (a IA decide baseado na referência).

Na etapa de referências, adicionar texto: "A diagramação e o layout da arte serão criados com base na sua referência principal ⭐. Escolha referências que representem o estilo de composição desejado."

Remover a linha "Diagramação:" do summary na revisão final.

### 2. Textos por arte (não um bloco único)

Atualmente o step 9 gera um único conjunto de textos (headline, sub, apoio, CTA) para todas as peças. Precisa gerar **um conjunto por peça**.

**Mudanças no state:**
- Substituir `headline`, `subheadline`, `cta`, `supportingText` (strings) por arrays: `artTexts: { headline, subheadline, cta, supportingText, approvedHeadline, approvedSub, approvedSupport, approvedCta }[]`
- Cada item do array representa os textos de uma peça

**Mudança na geração AI (`handleAutoFillTexts`):**
- Chamar `onFillWithAI` uma vez por peça (ou passar `quantity` para que retorne um array)
- Para simplicidade: chamar uma vez e replicar o resultado base, permitindo edição individual

**UI da revisão (step 8 novo):**
- Renderizar um card por peça: "Peça 1 de 3", "Peça 2 de 3", etc.
- Cada card mostra headline, subheadline, texto de apoio e CTA
- Cada campo tem um botão de aprovação individual (checkbox/toggle verde)
- Campos editáveis inline (click to edit)
- Botão "Gerar" só fica habilitado quando **todos os 4 campos de todas as peças** estiverem aprovados

**Estrutura de aprovação por campo:**
```
┌─ Peça 1 de 3 ────────────────────────┐
│ ☐ Headline:  "Investir é estratégia" │ [Editar]
│ ☐ Subheadline: "Não é sorte"         │ [Editar]
│ ☐ Texto de apoio: "Lorem ipsum..."   │ [Editar]
│ ☐ CTA: "Saiba mais"                  │ [Editar]
└───────────────────────────────────────┘
```
Ao aprovar, o checkbox fica ✅ verde. Todos precisam estar aprovados para habilitar "Gerar".

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/social/ArtWizard.tsx` | Remover step 4 layout, renumerar, textos por arte com aprovação individual |
| `src/components/cliente/social/LayoutPicker.tsx` | Pode ser mantido no codebase mas removido dos imports do wizard |

