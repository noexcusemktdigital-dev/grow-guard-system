

## Correção — GPS do Negócio não gera estratégia (timeout na Edge Function)

### Diagnóstico

Os logs da Edge Function `generate-strategy` mostram apenas **"booted"** — sem nenhum log de "Generating..." nem erro. Isso confirma que a função morre por **timeout silencioso** durante a chamada à AI. Mesmo com a divisão em 2 chamadas (marketing + comercial), cada schema ainda é grande demais com muitos `additionalProperties: false` aninhados e propriedades `required` profundas, fazendo o modelo demorar além do limite de 150s.

### Solução: 3 mudanças combinadas

| Mudança | Motivo |
|---------|--------|
| **Dividir marketing em 2 sub-chamadas** | O schema de marketing tem 16 propriedades top-level obrigatórias — dividir em "core" (~8 seções: diagnóstico, ICP, proposta, concorrência, tom, aquisição) e "growth" (~8 seções: conteúdo, crescimento, benchmarks, execução, estrutura, campos simples) | 
| **Remover `additionalProperties: false` dos objetos aninhados** | Esta constraint força o modelo a validar cada nível e desacelera a geração significativamente. Manter apenas no nível top-level de cada schema |
| **Trocar modelo para `google/gemini-3-flash-preview`** | Modelo mais recente e rápido para structured output |

### Fluxo atualizado

```text
Etapa 1/3 — Marketing Core (diagnóstico, ICP, proposta, concorrência, tom, aquisição)
Etapa 2/3 — Marketing Growth (conteúdo, crescimento, benchmarks, execução, estrutura)
Etapa 3/3 — Diagnóstico Comercial (radar, projeções, funil, estratégias, plano)
```

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-strategy/index.ts` | Dividir `MARKETING_TOOL_SCHEMA` em `MARKETING_CORE_SCHEMA` e `MARKETING_GROWTH_SCHEMA`. Aceitar `section` = `marketing-core`, `marketing-growth`, `comercial`. Remover `additionalProperties: false` dos objetos internos. Trocar modelo. Créditos debitados apenas no `marketing-core`. |
| `src/pages/cliente/ClienteGPSNegocio.tsx` | 3 chamadas sequenciais em `handleSofiaComplete`. Progresso: "Etapa 1/3", "Etapa 2/3", "Etapa 3/3". Merge dos 3 resultados antes de salvar. |
| `src/hooks/useMarketingStrategy.ts` | Sem mudança (já suporta `section` genérico) |

### Divisão dos schemas

**Marketing Core** (6 seções):
- `diagnostico`, `objetivo_principal`, `canal_prioritario`, `investimento_recomendado`, `potencial_crescimento`, `resumo_executivo`, `icp`, `proposta_valor`, `analise_concorrencia`, `tom_comunicacao`, `estrategia_aquisicao`

**Marketing Growth** (5 seções):
- `estrategia_conteudo`, `plano_crescimento`, `benchmarks_setor`, `plano_execucao`, `estrutura_recomendada`

**Comercial** (1 seção, sem mudança):
- `diagnostico_comercial`

### Resultado

Cada chamada gera ~5-6 seções em vez de 16, ficando dentro do limite de tempo. O frontend mostra progresso granular em 3 etapas.

