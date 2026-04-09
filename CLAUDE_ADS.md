# Contexto de Ads — Sistema Noe / Noexcuse

## Contas de Anuncio

### Meta Ads (Facebook/Instagram)
- **Conta:** `act_961503441507397` (NOE FRANQUIA)
- **Business ID:** `875659046390081`
- **App ID:** `1442494564559760`
- **Status:** Ativa, campanhas rodando

### Google Ads
- **MCC (Manager Account):** `3103704497`
- **Status:** Aguardando aprovacao de Basic Access para acesso completo via API
- **Observacao:** Enquanto nao aprovado, apenas leitura limitada de contas disponivel

---

## Objetivo Principal

**Geracao de leads para franquias Noexcuse.**

O funil padrao e:
1. Anuncio (Meta/Google) -> Landing page Noexcuse
2. Lead preenche formulario (nome, email, cidade, interesse)
3. Lead entra no CRM do Sistema Noe (grow-guard-system)
4. Franqueadora distribui lead para franqueado da regiao
5. Franqueado faz followup via WhatsApp/Email

---

## Historico de Campanhas (Padrao Noexcuse)

### Configuracoes Tipicas — Meta Ads
- **Objetivo:** `OUTCOME_LEADS` (otimizacao para leads)
- **Orcamento diario:** R$ 30 a R$ 50 por campanha
- **Estrategia de lance:** `LOWEST_COST` (sem teto de lance)
- **Segmentacao:** Brasil, 25-55 anos, interesses relacionados a franquias, empreendedorismo, estetica
- **Placements:** Feed Instagram + Facebook, Stories, Reels
- **Formato de criativo:** Imagem estatica ou video curto (15-30s)
- **CTA padrao:** "Saiba Mais" ou "Cadastre-se"

### Metricas de Referencia (benchmarks Noexcuse)
- **CPL meta (custo por lead):** R$ 15 a R$ 40
- **CTR esperado:** 1.5% a 3.5% (campanhas de franquia)
- **Taxa de conversao LP:** 8% a 15%
- **ROAS nao se aplica** — objetivo e lead, nao venda direta

---

## Como Usar os MCP Tools

### Meta Ads — Comandos Principais

#### Ver campanhas ativas
```
get_campaigns(account_id="act_961503441507397", effective_status=["ACTIVE"])
```

#### Ver insights das campanhas (ultimos 7 dias)
```
get_insights(
  object_id="act_961503441507397",
  date_preset="last_7d",
  fields=["campaign_name","spend","impressions","clicks","ctr","cpm","cpp","actions","cost_per_action_type"],
  level="campaign"
)
```

#### Ver insights do dia atual
```
get_insights(
  object_id="act_961503441507397",
  date_preset="today",
  fields=["campaign_name","spend","impressions","clicks","ctr","actions","cost_per_action_type"],
  level="campaign"
)
```

#### Ver adsets de uma campanha
```
get_adsets(campaign_id="CAMPAIGN_ID", effective_status=["ACTIVE"])
```

#### Ver ads ativos de um adset
```
get_ads(adset_id="ADSET_ID", effective_status=["ACTIVE"])
```

#### Ver criativos
```
get_ad_creatives(ad_id="AD_ID")
```

#### Criar campanha nova
```
create_campaign(
  account_id="act_961503441507397",
  name="NOE - Leads Franquia - [Cidade] - [Data]",
  objective="OUTCOME_LEADS",
  status="PAUSED",  # sempre criar PAUSADA primeiro para revisao
  special_ad_categories=[]
)
```

#### Criar adset
```
create_adset(
  campaign_id="CAMPAIGN_ID",
  name="[Segmentacao] - [Faixa etaria]",
  daily_budget=3000,  # valor em centavos = R$30,00
  billing_event="IMPRESSIONS",
  optimization_goal="LEAD_GENERATION",
  bid_strategy="LOWEST_COST_WITHOUT_CAP",
  targeting={
    "geo_locations": {"countries": ["BR"]},
    "age_min": 25,
    "age_max": 55
  },
  status="PAUSED"
)
```

#### Pausar campanha (emergencia)
```
update_campaign(campaign_id="CAMPAIGN_ID", status="PAUSED")
```

#### Alterar orcamento de adset
```
update_adset(adset_id="ADSET_ID", daily_budget=5000)  # R$50,00
```

### Google Ads — Comandos Principais (apos Basic Access)

#### Listar contas
```
list_accounts()
```

#### Consultar campanhas via GAQL
```
run_gaql(
  customer_id="3103704497",
  query="SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_7_DAYS AND campaign.status = 'ENABLED' ORDER BY metrics.cost_micros DESC"
)
```

#### Planner de keywords
```
run_keyword_planner(
  customer_id="3103704497",
  keywords=["franquia estetica", "abrir franquia", "franquia lucrativa"],
  geo_target_constants=["BR"]
)
```

---

## Regras de Negocio (CRITICO)

### Orcamentos
- **NUNCA ativar campanha nova sem revisao do Davi** (gestor de trafego Noexcuse)
- **NUNCA aumentar orcamento de adset acima de R$ 50/dia** sem aprovacao explicita do Davi ou Rafael
- Campanhas novas devem ser criadas com `status="PAUSED"` — Davi ativa manualmente apos revisao
- Alteracoes de orcamento acima de 20% do valor atual requerem aprovacao

### Criativos
- Nao pausar nem arquivar criativos existentes sem autorizacao — pode afetar historico de aprendizado
- Novos criativos devem ser testados em adsets separados (A/B test)

### Leads
- Leads captados via Meta Lead Ads devem ser sincronizados com o CRM do Sistema Noe
- Webhook configurado para receber leads: verificar edge function `receive-lead` no Supabase

### Conformidade
- Campanhas de franquia podem exigir categoria especial em algumas regioes — verificar antes de criar
- Nunca incluir promessas de retorno financeiro garantido nos copies (viola politicas Meta/Google)

---

## Responsaveis

| Papel | Pessoa | Contato |
|-------|--------|---------|
| Gestor de Trafego | Davi | WhatsApp (perguntar ao Rafael) |
| Aprovacao de Orcamento | Rafael Macagnan | rafael@grupolamadre.com.br |
| Acesso tecnico / MCP | Claude Code (agente) | — |

---

## Fluxo de Analise Semanal Recomendado

1. Rodar `/ads` para snapshot rapido do dia
2. Verificar CPL vs benchmark (R$15-40)
3. Se CPL > R$50 em mais de 3 dias consecutivos: pausar adset e notificar Davi
4. Se CTR < 1% por 3 dias: sinalizar criativo como fadado, sugerir novo
5. Se gasto diario > R$50 em algum adset: verificar se houve aprovacao

---

## Status das Integracoes MCP

| MCP | Porta | Status | Observacoes |
|-----|-------|--------|-------------|
| meta-ads | 3001 | Configurado | 36 tools disponiveis |
| google-ads | 3002 | Configurado | Aguarda Basic Access aprovacao |
