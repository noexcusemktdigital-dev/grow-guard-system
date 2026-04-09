# /ads — Analise Rapida de Campanhas Noexcuse

Quando o usuario invocar `/ads`, execute os passos abaixo em sequencia automaticamente, sem pedir confirmacao.

## Passo 1 — Buscar dados do dia (Meta Ads)

Use o MCP `meta-ads` para buscar insights do dia atual:

```
get_insights(
  object_id="act_961503441507397",
  date_preset="today",
  fields=["campaign_name","adset_name","spend","impressions","clicks","ctr","cpm","actions","cost_per_action_type"],
  level="adset"
)
```

Tambem buscar campanhas ativas para contexto:
```
get_campaigns(
  account_id="act_961503441507397",
  effective_status=["ACTIVE"],
  fields=["name","status","daily_budget","budget_remaining","objective"]
)
```

## Passo 2 — Calcular metricas por campanha/adset

Para cada adset retornado, calcular:
- **Gasto hoje** = `spend`
- **Impressoes** = `impressions`
- **Cliques** = `clicks`
- **CTR** = `ctr` (ou clicks/impressions * 100 se nao vier calculado)
- **CPM** = `cpm`
- **Leads hoje** = extrair de `actions` onde `action_type == "lead"` ou `onsite_conversion.lead_grouped`
- **CPL hoje** = spend / leads (se leads > 0)

## Passo 3 — Formatar snapshot

Apresentar tabela resumida:

```
## Snapshot de Hoje — [DATA]

### Meta Ads — act_961503441507397

| Campanha | Adset | Gasto | Leads | CPL | CTR | Status |
|----------|-------|-------|-------|-----|-----|--------|
| ...      | ...   | R$X   | N     | R$X | X%  | ✅/⚠️/🔴 |

**Total gasto hoje:** R$ X,XX
**Total leads hoje:** N
**CPL medio hoje:** R$ X,XX
```

Legenda de status por adset:
- OK (CPL < R$40 e CTR > 1.5%)
- ATENCAO (CPL R$40-60 ou CTR 1-1.5%)
- CRITICO (CPL > R$60 ou CTR < 1% ou sem leads apos R$20 gasto)

## Passo 4 — Recomendacoes automaticas

Analisar e listar recomendacoes objetivas:

**Se CPL > R$50:**
- Listar qual adset esta acima do benchmark
- Verificar se criativo tem mais de 7 dias (possivel fadiga)
- Sugerir: pausar adset ou trocar criativo

**Se CTR < 1%:**
- Identificar adset especifico
- Sugerir: revisar criativo e copy, testar novo angulo

**Se gasto > R$45/dia em algum adset:**
- Alertar que esta proximo do limite de R$50 sem aprovacao
- Indicar se ha orcamento restante no dia

**Se campanha sem leads em 2+ dias:**
- Sinalizar como candidata a revisao
- Sugerir analise de segmentacao pelo Davi

**Se performance excelente (CPL < R$20 e CTR > 3%):**
- Destacar como candidata a escalar (com aprovacao do Davi)

## Passo 5 — Google Ads (se MCP disponivel)

Tentar buscar dados do Google Ads:
```
run_gaql(
  customer_id="3103704497",
  query="SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion FROM campaign WHERE segments.date DURING TODAY AND campaign.status = 'ENABLED'"
)
```

Se retornar erro de acesso (Basic Access pendente), informar:
> "Google Ads: aguardando aprovacao de Basic Access. Dados indisponiveis."

Se retornar dados, apresentar tabela similar ao Meta.

## Passo 6 — Resumo executivo (3 linhas max)

```
### Resumo do Dia
- Situacao geral: [BOM / ATENCAO / CRITICO]
- Acao imediata necessaria: [sim/nao — qual]
- Proximo ponto de atencao: [ex: "adset X vai atingir R$50 hoje as 18h"]
```

---

## Notas de Uso

- Este skill so analisa — nunca pausa, ativa ou altera campanhas sem confirmacao explicita do usuario
- Para qualquer alteracao, pedir confirmacao e listar exatamente o que sera feito antes de executar
- Sempre mencionar que mudancas de orcamento > R$50/dia requerem aprovacao do Davi ou Rafael
- Consultar `CLAUDE_ADS.md` no projeto para regras de negocio completas
