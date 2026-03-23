

# Corrigir seleção de conta Meta Ads + conta errada

## Problema identificado

1. **Conta errada conectada**: O Meta conectou automaticamente a conta "Thiago Superti (Gerenciador)" (act_156755487722472) sem dar opção de escolha. O callback só mostrou 1 conta porque a API `/me/adaccounts` retorna apenas contas pessoais — contas de **Business Manager** precisam de endpoint diferente.

2. **Métricas vazias**: A conta conectada retorna `{"data":[]}` — sem campanhas ativas nos últimos 30 dias, confirmando que é a conta errada.

3. **Sem opção de trocar**: O usuário não consegue mudar para outra conta depois de conectado.

## Plano de correção

### 1. Ampliar busca de contas no callback (`ads-oauth-callback`)
- Além de `/me/adaccounts` (contas pessoais), buscar também contas via Business Manager: `/me/businesses` → `/BUSINESS_ID/owned_ad_accounts`
- Isso garante que todas as contas de anúncio apareçam (pessoais + de gerenciadores de negócios)
- Com mais contas encontradas, o picker será ativado automaticamente

### 2. Adicionar botão "Trocar conta" no frontend (`AdConnectionCards.tsx`)
- Quando já existe uma conexão ativa, mostrar um botão "Trocar conta" ao lado do botão de desconectar
- Ao clicar, desconecta a conta atual e inicia novo fluxo OAuth automaticamente
- Isso permite ao usuário reconectar e escolher outra conta

### 3. Forçar picker quando há múltiplas contas
- Alterar a lógica: se houver 2+ contas, SEMPRE mostrar o picker (já implementado, mas não ativado porque só 1 conta era encontrada)

## Arquivos modificados
- `supabase/functions/ads-oauth-callback/index.ts` — buscar contas de Business Manager
- `src/components/trafego/AdConnectionCards.tsx` — botão "Trocar conta"

