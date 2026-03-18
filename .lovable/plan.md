
Objetivo: eliminar o “strobe” visual da tela de Scripts. Pelo código atual, isso não parece mais ser problema de loading/query; o sintoma agora é principalmente de pintura/composição da UI.

1. Diagnóstico principal
- O card de cada script renderiza uma camada decorativa com `absolute inset-0 bg-gradient-to-br ...`, mas o `<Card>` não está com `relative`.
- Resultado: essa camada absoluta pode ficar posicionada em relação ao ancestral errado, cobrindo área maior que o card e forçando repaints estranhos na página inteira.
- Isso explica o comportamento de “piscar” e também o fato de às vezes “parar” ao passar o mouse em botões: o hover muda a composição/pintura da árvore, mascarando temporariamente o problema.

2. Correção principal na tela Scripts
- Em `src/pages/cliente/ClienteScripts.tsx`:
  - adicionar `relative` ao `<Card>` dos scripts
  - idealmente usar `relative isolate overflow-hidden` no card
  - marcar a camada decorativa como `pointer-events-none`
  - manter o conteúdo em camada acima (`relative z-10`)
- Também vou trocar `transition-all` por transições mais específicas (`transform, box-shadow`) para evitar repaints desnecessários.

3. Redução de custo visual
- Revisar o bloco expandido do script:
  - o `backdrop-blur-sm` dentro do conteúdo pode aumentar custo de composição
  - se necessário, substituir por fundo sem blur ou blur mais leve
- Isso é especialmente importante porque essa página usa gradientes + cards expansíveis + hover.

4. Limpeza de renders desnecessários
- `ClienteScripts.tsx` ainda chama `useStrategyData()` mesmo sem usar o valor de forma útil na renderização.
- Vou remover essa dependência da página e deixar o `StrategyBanner` buscar seus próprios dados.
- Também vou memoizar contagens/filtros por etapa para reduzir recomputação a cada hover/digitação.

5. Ajuste secundário relacionado aos warnings
- Os logs mostram warnings no tutorial:
  - `Function components cannot be given refs`
  - `Missing Description for DialogContent`
- Em `src/components/ui/dialog.tsx` e `src/components/cliente/FeatureTutorialDialog.tsx` vou:
  - transformar `DialogHeader` em `forwardRef` para ficar consistente com os outros primitives
  - adicionar `DialogDescription`
- Isso provavelmente não é a causa principal do strobe, mas reduz ruído e possíveis remounts/portals instáveis quando o botão de tutorial entra em cena.

6. Arquivos a ajustar
- `src/pages/cliente/ClienteScripts.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/cliente/FeatureTutorialDialog.tsx`

7. Validação depois da correção
- Abrir `/cliente/scripts` com scripts já carregados
- mover o mouse pela lista, topo e abas
- expandir/fechar cards
- verificar se o brilho/strobe sumiu sem precisar “parar o mouse” em botão
- conferir no console se os warnings do tutorial também desapareceram
