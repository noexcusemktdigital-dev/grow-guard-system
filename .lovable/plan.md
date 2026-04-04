

## Plano — Reformulação visual do Criador de Estratégia (estilo GPS do Negócio)

### Problema

A ferramenta "Criação de Estratégia" do franqueado continua com a mesma aparência visual do antigo criador: tabs genéricos, formulário wizard simples com cards glass. O conteúdo das perguntas mudou, mas o visual e a experiência não.

### Objetivo

Transformar a experiência visual para ser similar ao GPS do Negócio do SaaS (cliente), com:
- Tela de boas-vindas animada com ícone destacado e cards explicativos das 5 etapas
- Indicação visual de tempo e metodologia (ECE)
- Animação de geração com etapas progressivas
- Layout mais imersivo e profissional

### Mudanças planejadas

**Arquivo principal:** `src/pages/franqueado/FranqueadoEstrategia.tsx`

1. **Tela Welcome** — Substituir os cards "Preenchimento Manual / Upload de Briefing" por uma tela de boas-vindas no estilo GPS:
   - Ícone grande com gradiente (Target/Compass) no topo
   - Título "Diagnóstico Estratégico" com subtítulo sobre a metodologia NoExcuse
   - 5 cards animados representando cada etapa (Conteúdo, Tráfego, Web, Sales, Escala)
   - Indicadores de tempo (~10 min) e metodologia ECE
   - Dois botões de ação: "Preencher Diagnóstico" e "Upload de Briefing"

2. **Animação de geração** — Substituir o simples spinner por uma tela de loading animada (como o GPS):
   - Ícone pulsante central
   - Texto de progresso que muda: "Analisando negócio..." → "Calculando score de maturidade..." → "Gerando plano das 5 etapas..." → "Criando projeções financeiras..."
   - Usar `framer-motion` para transições suaves

3. **Header da página** — Mudar título de "Criador de Estratégia" para "Diagnóstico Estratégico" e subtítulo para algo mais impactante

4. **Tabs** — Renomear:
   - "Novo Diagnóstico" → "Novo Diagnóstico Estratégico"
   - "Meus Diagnósticos" → "Histórico"

**Arquivo de formulário:** `src/pages/franqueado/FranqueadoEstrategiaDiagnosticForm.tsx`

5. **Visual do formulário** — Melhorar com:
   - Número da etapa grande e colorido (01, 02, 03...) no header
   - Barra de progresso mais visível com cores por etapa
   - Ícones maiores e mais destaque visual

**Arquivo de resultados:** `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx`

6. Sem mudanças estruturais — já foi reescrito com KPIs, radar, etapas colapsáveis etc.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Welcome animado, loading screen, renomear tabs e header |
| `src/pages/franqueado/FranqueadoEstrategiaDiagnosticForm.tsx` | Visual melhorado com números grandes e cores por etapa |

### Resultado esperado

A ferramenta terá uma experiência visual premium e imersiva, claramente distinta do antigo "Criador de Estratégia", com identidade própria alinhada ao GPS do Negócio.

