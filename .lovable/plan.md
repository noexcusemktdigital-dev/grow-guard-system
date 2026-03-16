

## Plano: Rebalancear Custos de Créditos em Todas as Edge Functions

### Problema encontrado

Os custos REAIS nas Edge Functions estão **completamente desalinhados** com o que está documentado em `plans.ts`. Um usuário com 500 créditos (Starter) não consegue nem completar o fluxo básico.

| Ferramenta | Custo em `plans.ts` | Custo REAL (Edge Function) | Fator |
|-----------|--------------------|-----------------------------|-------|
| generate-strategy (Plano de Vendas) | 50 | **300** | 6x |
| generate-script | 20 | **150** | 7.5x |
| generate-content | 30/unidade | **200/unidade** | 6.7x |
| generate-site | 100 | **500** | 5x |
| generate-social-image | 25 | **100** | 4x |
| generate-traffic-strategy | 50 | **200** | 4x |
| generate-prospection | 30 | **250** | 8.3x |
| generate-daily-checklist | 5 | **50** | 10x |
| generate-social-video-frames | 25/frame | **100/frame** | 4x |
| ai-generate-agent-config | 10 | OK (10) | ✓ |
| ai-agent-simulate | 10 | OK (10) | ✓ |

**Cenário atual (Starter 500cr):** Fazer o plano de vendas (300) + 1 script (150) = 450 créditos. Sobram 50. Não dá pra fazer mais nada.

**Cenário corrigido (Starter 500cr):** Plano de vendas (50) + 3 scripts (60) + 1 estratégia marketing (50) + 2 artes (50) + 1 conteúdo (30) + 2 checklists (10) = 250. Sobram 250 para explorar mais.

### Solução

Alinhar os custos nas Edge Functions com os valores definidos em `plans.ts`. Apenas alterar a constante `CREDIT_COST` em cada arquivo.

### Arquivos impactados (9 Edge Functions)

| Arquivo | De → Para |
|---------|-----------|
| `supabase/functions/generate-strategy/index.ts` | 300 → **50** |
| `supabase/functions/generate-script/index.ts` | 150 → **20** |
| `supabase/functions/generate-content/index.ts` | 200 → **30** |
| `supabase/functions/generate-site/index.ts` | 500 → **100** |
| `supabase/functions/generate-social-image/index.ts` | 100 → **25** |
| `supabase/functions/generate-traffic-strategy/index.ts` | 200 → **50** |
| `supabase/functions/generate-prospection/index.ts` | 250 → **30** |
| `supabase/functions/generate-daily-checklist/index.ts` | 50 → **5** |
| `supabase/functions/generate-social-video-frames/index.ts` | 100/frame → **25/frame** |

Cada mudança é 1 linha (a constante `CREDIT_COST`). Nenhuma lógica adicional muda.

