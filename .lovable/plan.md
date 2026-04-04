

## Plano — Entregáveis vinculados à Calculadora + PDF profissional + botão "Gerar Proposta"

### Visão geral

Adicionar ao final do plano estratégico uma seção clara de **Entregáveis / Execuções** que mapeia exatamente quais serviços da calculadora NoExcuse precisam ser executados para o plano funcionar. Substituir os botões atuais por dois botões principais: **Salvar em PDF** (gera PDF A4 diagramado como apresentação profissional) e **Gerar Proposta** (vai para a calculadora com os itens pré-selecionados).

---

### Mudanças

#### 1. Edge function — Melhorar prompt dos entregáveis

**Arquivo:** `supabase/functions/generate-strategy/index.ts`

Atualizar o prompt da terceira chamada (projeções) para instruir a IA a:
- Mapear **exatamente** os serviços do catálogo NoExcuse que precisam ser executados para cada etapa do plano estratégico
- Incluir quantidades reais (ex: 8 artes orgânicas/mês, 4 vídeos reels, 1 LP de captura, gestão de tráfego Meta, etc.)
- Vincular cada entregável à etapa do plano (conteúdo, tráfego, web, sales, escala)
- Usar justificativas que referenciem ações específicas do plano

Atualizar o schema de `entregaveis_calculadora` para incluir campo `etapa` (qual das 5 etapas o entregável suporta).

#### 2. Interface de resultados — Seção de Execuções + botões

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx`

- Reorganizar a seção "Entregáveis Recomendados" para ser uma seção de **Execuções do Plano**, agrupada por etapa (Conteúdo, Tráfego, Web, Sales, Escala)
- Cada item mostra: nome do serviço, quantidade, justificativa vinculada ao plano
- Substituir os botões do topo por dois botões grandes e visíveis no final:
  1. **Salvar em PDF** — gera PDF A4 profissional diagramado como apresentação (com capa, seções, cores da marca NoExcuse)
  2. **Gerar Proposta** — navega para `/franqueado/propostas` com os entregáveis pré-selecionados

#### 3. PDF profissional A4

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx`

Refatorar a função `exportPdf` para gerar um PDF com diagramação profissional:
- Capa com logo NoExcuse, título "Diagnóstico Estratégico", nome do cliente, data
- Seções separadas com headers visuais: Resumo Executivo, Scores, Persona, Concorrência, 5 Etapas, Projeções, Entregáveis
- Forçar fundo branco, texto escuro, bordas e cores consistentes
- Usar o padrão existente `jspdf` + `html2canvas`

#### 4. Botões na tela de resultado

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategia.tsx`

- Manter botão "Novo Diagnóstico" e select de CRM no topo
- No `StrategyResultView`, os botões "Salvar em PDF" e "Gerar Proposta" ficam **no final do conteúdo**, após a seção de entregáveis, com destaque visual

#### 5. Atualizar tipos

**Arquivo:** `src/hooks/useFranqueadoStrategies.ts`

Adicionar campo `etapa` ao tipo `entregaveis_calculadora`:
```typescript
entregaveis_calculadora?: {
  service_id: string;
  service_name: string;
  quantity: number;
  justificativa: string;
  etapa?: string; // conteudo, trafego, web, sales, validacao
}[];
```

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-strategy/index.ts` | Melhorar prompt e schema de entregáveis com campo `etapa` |
| `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx` | Seção Execuções agrupada + PDF profissional + botões no final |
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Ajustar layout dos botões na tela de resultado |
| `src/hooks/useFranqueadoStrategies.ts` | Adicionar `etapa` ao tipo entregáveis |

