

# Integração Nativa Google Ads + Meta Ads — Relatórios e Análise

## Visão geral

Conectar as contas de anúncio do cliente diretamente na plataforma via OAuth2, puxar dados de campanhas (impressões, cliques, custo, conversões, CPL) e exibir dashboards analíticos. A IA usa esses dados reais para criar/ajustar estratégias.

## Pré-requisitos externos (fora da plataforma)

Antes de implementar, você precisa criar apps nas plataformas de anúncios:

1. **Google Ads**: Criar um projeto no Google Cloud Console, habilitar a Google Ads API, criar credenciais OAuth2 (Web App), e solicitar um Developer Token no Google Ads (aprovação pode levar 1-3 semanas para "Basic Access" — suficiente para leitura de relatórios)
2. **Meta Ads**: Criar um Meta App no developers.facebook.com, solicitar acesso à Marketing API, configurar OAuth2 com as permissões `ads_read` e `ads_management` (para leitura)

Ambos exigem secrets que serão armazenadas nas Edge Functions: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_APP_ID`, `META_APP_SECRET`.

## Arquitetura

```text
┌──────────────────┐     OAuth2      ┌────────────────────┐
│  Cliente clica   │ ──────────────→ │  Google / Meta      │
│  "Conectar conta"│ ←── token ───── │  (consent screen)   │
└──────────────────┘                 └────────────────────┘
        │ salva tokens
        ▼
┌──────────────────┐   fetch data    ┌────────────────────┐
│  Edge Function   │ ──────────────→ │  Google Ads API     │
│  ads-sync        │ ──────────────→ │  Meta Marketing API │
│                  │ ←── metrics ─── │                     │
└──────────────────┘                 └────────────────────┘
        │ salva métricas
        ▼
┌──────────────────┐
│  Dashboard       │  gráficos, KPIs, comparativos
│  + IA Analysis   │  insights automáticos
└──────────────────┘
```

## Mudanças no banco de dados

### Tabela `ad_platform_connections`
Armazena tokens OAuth2 por organização:
- `id`, `organization_id`, `platform` (google_ads | meta_ads), `account_id`, `account_name`
- `access_token` (encriptado), `refresh_token` (encriptado), `token_expires_at`
- `status` (active | expired | disconnected), `last_synced_at`

### Tabela `ad_campaign_metrics`
Dados de campanhas sincronizados:
- `id`, `organization_id`, `connection_id`, `platform`
- `campaign_id`, `campaign_name`, `campaign_status`
- `date` (dia da métrica), `impressions`, `clicks`, `spend`, `conversions`, `ctr`, `cpc`, `cpl`
- `raw_data` (JSONB com dados completos da API)

## Edge Functions (4 novas)

### 1. `ads-oauth-callback`
Recebe o código OAuth2 após o consentimento do cliente, troca por tokens, salva em `ad_platform_connections`.

### 2. `ads-sync-metrics`
Chamada sob demanda ou periódica. Usa os tokens salvos para buscar métricas dos últimos 30 dias via Google Ads API (Google Ads Query Language) e Meta Marketing API (Insights endpoint). Refresh automático de tokens expirados.

### 3. `ads-disconnect`
Revoga tokens e desconecta a conta.

### 4. `ads-analyze` (IA)
Recebe as métricas sincronizadas e gera insights automáticos: quais campanhas performam melhor, onde está o desperdício, sugestões de otimização. Usa Gemini Flash.

## Frontend — Nova aba "Métricas" na página de Tráfego Pago

### Seção 1: Conexão de Contas
- Cards "Google Ads" e "Meta Ads" com botão "Conectar"
- Após conectado: mostra nome da conta, último sync, botão "Sincronizar agora"

### Seção 2: Dashboard de Métricas
- Filtros: período (7d, 30d, 90d, custom), plataforma (todas, Google, Meta)
- KPI cards: Investimento total, Impressões, Cliques, CTR, CPC, CPL, Conversões
- Gráfico de evolução diária (spend vs conversions)
- Tabela de campanhas com ranking por performance
- Comparativo Google vs Meta (side-by-side)

### Seção 3: Análise IA
- Botão "Analisar com IA" que envia as métricas ao `ads-analyze`
- Retorna insights formatados: pontos fortes, pontos fracos, recomendações

## Integração com Estratégia existente

O wizard de estratégia de tráfego passa a receber dados reais das campanhas ativas. A IA não gera estratégia "no vácuo" — ela analisa o que já está rodando e sugere ajustes baseados em dados.

## Custo em créditos

| Ação | Créditos |
|------|----------|
| Sincronizar métricas | 0 (gratuito) |
| Análise IA | 30 créditos |
| Gerar/Ajustar estratégia (já existe) | 50 créditos |

## Arquivos envolvidos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/ads-oauth-callback/index.ts` | Novo — OAuth2 token exchange |
| `supabase/functions/ads-sync-metrics/index.ts` | Novo — Sync de métricas |
| `supabase/functions/ads-disconnect/index.ts` | Novo — Desconexão |
| `supabase/functions/ads-analyze/index.ts` | Novo — Análise IA |
| `src/hooks/useAdPlatforms.ts` | Novo — hooks de conexão e métricas |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Modificado — adicionar aba Métricas |
| `src/components/trafego/AdConnectionCards.tsx` | Novo — UI de conexão |
| `src/components/trafego/AdMetricsDashboard.tsx` | Novo — Dashboard |
| `src/components/trafego/AdCampaignTable.tsx` | Novo — Tabela de campanhas |
| `src/components/trafego/AdAIAnalysis.tsx` | Novo — Painel de análise IA |
| Migração SQL | Nova — tabelas `ad_platform_connections` e `ad_campaign_metrics` |

## Ordem de implementação

1. Migração SQL (tabelas)
2. Edge functions OAuth + sync
3. Hooks frontend
4. UI de conexão de contas
5. Dashboard de métricas
6. Análise IA
7. Integração com wizard de estratégia

## Bloqueio: Secrets necessárias

Antes de implementar, você precisa fornecer 5 secrets:
- `GOOGLE_ADS_CLIENT_ID` + `GOOGLE_ADS_CLIENT_SECRET` + `GOOGLE_ADS_DEVELOPER_TOKEN`
- `META_APP_ID` + `META_APP_SECRET`

Posso guiá-lo na criação dos apps no Google Cloud e Meta for Developers.

