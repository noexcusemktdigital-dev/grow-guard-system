
## Plano

### O que está acontecendo hoje
Revisei o código atual e identifiquei 3 pontos principais:

1. A estratégia até chama `setActiveTab("campanhas")` depois da aprovação, mas isso acontece só localmente no `onSuccess`. Se a criação automática das campanhas demorar, falhar parcialmente, ou a tela recarregar logo em seguida, o usuário pode continuar vendo a aba errada.
2. O botão `Criar Campanha` já existe no código da aba de campanhas, mas ele só aparece quando `c.type` bate exatamente com as chaves de tutorial (`Google`, `Meta`, `TikTok`, `LinkedIn`). Se houver campanhas antigas ou tipos inconsistentes, o botão some.
3. A renderização defensiva de `campaign_structure` foi feita só no resultado da estratégia. Na aba de campanhas, essa estrutura ainda não está sendo exibida com o mesmo tratamento, então Google e Meta continuam “mal formatados”.

### O que vou ajustar

#### 1. Tornar o pós-aprovação confiável
No `src/pages/cliente/ClienteTrafegoPago.tsx`:
- adicionar um fluxo de redirecionamento mais robusto para a aba `campanhas`
- após aprovar e criar as campanhas, marcar um estado de “ir para campanhas”
- usar os dados atualizados do repositório para confirmar a transição, em vez de depender só do `setActiveTab` imediato

Isso evita o caso em que a aprovação acontece, mas a interface continua na aba Estratégia.

#### 2. Garantir o botão “Criar Campanha” em todas as campanhas válidas
No `src/pages/cliente/ClienteTrafegoPago.tsx`:
- normalizar o tipo da plataforma antes de verificar `PLATFORM_TUTORIALS`
- aceitar variações como `google`, `Google Ads`, `meta ads`, etc.
- usar essa mesma normalização para ícone, cor e tutorial

Assim o botão aparece também para campanhas já existentes que foram salvas com `type` diferente do esperado.

#### 3. Reaproveitar a mesma renderização de estrutura de campanha
No `src/pages/cliente/ClienteTrafegoPagoResult.tsx`:
- extrair a lógica defensiva de `campaign_structure` para um renderer reutilizável/componente auxiliar exportado

No `src/pages/cliente/ClienteTrafegoPago.tsx`:
- usar esse mesmo renderer dentro dos cards da aba Campanhas

Isso unifica a exibição e corrige a má diagramação de estrutura para Google e Meta tanto na estratégia quanto nas campanhas.

#### 4. Melhorar a diagramação da estrutura
Na apresentação da estrutura:
- separar campanha, conjunto de anúncios e anúncios em blocos visuais
- tratar `string`, `array`, objeto com `campaigns`, e formatos híbridos
- mostrar nomes, segmentação e descrições com hierarquia visual melhor
- adicionar fallback legível para formatos inesperados em vez de quebrar o layout

### Arquivos a ajustar
- `src/pages/cliente/ClienteTrafegoPago.tsx`
- `src/pages/cliente/ClienteTrafegoPagoResult.tsx`

### Resultado esperado
Depois dessas mudanças:
- ao aprovar, a estratégia vai de forma confiável para a aba de campanhas
- o botão `Criar Campanha` aparece corretamente nos cards de Google e Meta
- a estrutura de campanha deixa de ficar quebrada/mal formatada
- estratégia e campanhas passam a compartilhar a mesma renderização visual da estrutura
