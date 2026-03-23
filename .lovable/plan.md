

# Corrigir Sincronização Google Ads + Seleção de Conta Meta Ads

## Diagnóstico

### Google Ads
A conexão no banco tem `account_id = NULL` e `account_name = NULL`. Foi salva antes da correção que bloqueia conexões sem account_id. O sync falha com "No Google Ads customer ID". **Solução**: limpar a conexão fantasma e garantir que o fluxo funcione na próxima reconexão.

### Meta Ads
A conexão existe com `account_id = 156755487722472` ("Thiago Superti (Gerenciador)") e `last_synced_at` está preenchido, mas a tabela `ad_campaign_metrics` está vazia — o sync rodou mas não retornou dados, ou falhou silenciosamente. Além disso, o callback pega automaticamente a primeira conta (`meData.data[0]`), sem dar opção de escolha quando há múltiplas contas.

## Plano de Correção

### 1. Limpar conexão Google Ads fantasma (migration)
- DELETE da conexão Google Ads com `account_id IS NULL` para org `adb09618...`
- Isso permitirá reconectar limpo

### 2. Meta Ads: seleção de conta de anúncio (quando há múltiplas)
**Problema**: O callback pega `data[0]` sem perguntar.

**Solução**: Quando houver múltiplas contas, redirecionar para uma página de seleção no frontend:
- `ads-oauth-callback`: Se Meta retorna múltiplas contas, redirecionar com `?ads_select_account=TOKEN_TEMP` e lista de contas como query param
- Criar componente `AdAccountSelector` que mostra as contas disponíveis e permite escolher
- Após seleção, chamar uma nova Edge Function `ads-select-account` que salva a conexão com a conta escolhida

**Alternativa mais simples** (recomendada): Salvar token temporariamente, redirecionar com lista de contas codificada, e completar a conexão no frontend.

### 3. Meta Ads: debug do sync vazio
- Adicionar logs detalhados no `ads-sync-metrics` para Meta (status da API, quantidade de dados retornados)
- Verificar se `act_` prefix está sendo usado corretamente na chamada da API do Meta
- O Meta Insights API usa `act_{account_id}` — verificar se o account_id salvo já tem ou não o prefixo

### 4. Melhorar feedback de erros no frontend
- Mensagem específica para "sync retornou 0 métricas" (pode ser conta sem campanhas ativas)
- Toast informativo quando a conta não tem dados no período

## Arquivos Modificados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/ads-oauth-callback/index.ts` | Suportar múltiplas contas Meta (redirecionamento com lista) |
| `supabase/functions/ads-select-account/index.ts` | **Novo** — recebe token + account_id escolhido e salva conexão |
| `supabase/functions/ads-sync-metrics/index.ts` | Logs detalhados, fix prefixo `act_` do Meta |
| `src/components/trafego/AdConnectionCards.tsx` | Seletor de contas Meta, tratamento novos erros |
| `src/hooks/useAdPlatforms.ts` | Mutation para selecionar conta |
| Migration SQL | Limpar conexão Google fantasma |

## Fluxo Meta Ads Atualizado

```text
1. Usuário clica "Conectar Meta Ads"
2. OAuth → Facebook autoriza
3. Callback recebe token, busca contas
4. Se 1 conta → salva direto (como hoje)
5. Se múltiplas → redireciona com ?ads_pick_account=...
6. Frontend mostra dialog com lista de contas
7. Usuário escolhe → chama ads-select-account
8. Conexão salva com conta correta
9. Sync puxa métricas da conta escolhida
```

