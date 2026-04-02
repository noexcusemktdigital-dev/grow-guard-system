

## Plano — Tutoriais personalizados com base no GPS do Negócio

### O que muda

Os tutoriais que aparecem na primeira visita a cada ferramenta passarão a incluir uma **4ª aba "Para o seu negócio"** com recomendações personalizadas extraídas do GPS do Negócio (ICP, segmento, tom de voz, dores, produtos, ticket médio, etc.). Se o GPS ainda não foi preenchido, a aba mostra um incentivo para completá-lo.

### Mudanças

#### 1. Criar mapeamento de recomendações personalizadas

**Novo arquivo**: `src/utils/personalizedTutorialTips.ts`

Função `getPersonalizedTips(slug: string, strategyData: ReturnType<typeof useStrategyData>): string[]` que retorna 3-5 dicas contextuais por ferramenta. Exemplos:

- **CRM**: Se ticket médio alto → "Com ticket de R$X, foque em qualificar bem antes de avançar no funil". Se segmento = saúde → "Adicione etapas de retorno e acompanhamento no funil".
- **Scripts**: Usa `dores` do ICP → "Crie um script de prospecção abordando a dor: '{dor principal}'". Usa `personalidadeMarca` → "Mantenha o tom {tom} nos scripts".
- **Roteiros de vídeo**: Usa `pilares` de conteúdo → "Grave sobre o pilar '{pilar}' para atrair seu público". Usa `canaisPrioritarios` → "Priorize vídeos para {canal}".
- **Postagem**: Usa `palavrasUsar`/`palavrasEvitar` → "Use as palavras: {lista}. Evite: {lista}".
- **Sites**: Usa `propostaValor` → "Destaque sua proposta de valor: '{proposta}'". Usa `publicoAlvo` → "Direcione a landing page para: {público}".
- **Tráfego**: Usa `objecoes` do ICP → "Quebre a objeção '{objeção}' nos seus anúncios". Usa `ticketMedio` → recomenda orçamento proporcional.
- **Agentes IA**: Usa `salesPlanProducts` → "Configure a base de conhecimento com: {produtos}".
- **Disparos**: Usa `personaName` → "Segmente seus disparos por perfil semelhante a '{persona}'".
- **Chat**: Usa `tomPrincipal` → "Mantenha o tom '{tom}' nas respostas do WhatsApp".
- **Checklist/Gamificação**: Usa metas e `estrategiasVendas` → "Foque nas ações: {ações do plano}".

#### 2. Adicionar 4ª aba ao FeatureTutorialDialog

**Arquivo**: `src/components/cliente/FeatureTutorialDialog.tsx`

- Importar `useStrategyData` e `getPersonalizedTips`
- Adicionar aba "Para você" (com ícone Sparkles) após "Benefícios"
- Se `hasStrategy` → mostrar as dicas personalizadas com ícone de estrela
- Se não tem GPS → mostrar card incentivando a completar o GPS primeiro
- `totalSteps` passa de 3 para 4

#### 3. Atualizar interface do tutorial

**Arquivo**: `src/constants/featureTutorials.ts`

Nenhuma alteração — a estrutura estática permanece intacta. A personalização é dinâmica via hook.

### Detalhes técnicos

- `useStrategyData()` já expõe todos os dados necessários (ICP, tom, dores, produtos, pilares, etc.)
- A função `getPersonalizedTips` é pura (não é hook) — recebe os dados e retorna strings
- Se um dado específico não existir no GPS (ex: sem pilares de conteúdo), aquela dica é omitida
- O fallback quando não há GPS é uma mensagem: "Complete o GPS do Negócio para receber recomendações personalizadas para o seu negócio"

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/utils/personalizedTutorialTips.ts` | Novo — lógica de personalização por ferramenta |
| `src/components/cliente/FeatureTutorialDialog.tsx` | Adicionar 4ª aba "Para você" com dados do GPS |

