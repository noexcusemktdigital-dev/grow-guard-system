

# Corrigir sincronização Google Ads — account_id nulo

## Diagnóstico confirmado (logs do backend)

A cadeia de erro é:

```text
OAuth callback → listAccessibleCustomers retorna HTML (não JSON)
→ accountId fica null → conexão salva sem account_id
→ ads-sync-metrics → "No Google Ads customer ID" → erro
```

O `listAccessibleCustomers` retornou HTML em vez de JSON. Isso acontece quando:
- O Developer Token tem nível "Test Account" (só funciona com contas de teste)
- Ou o Developer Token não foi aprovado para "Basic Access"

## Plano de correção (2 partes)

### Parte 1: Verificação do Developer Token (ação manual)
No Google Ads MCC → Tools → API Center, verificar o nível de acesso do Developer Token:
- **Test Account**: só funciona com contas de teste do Google Ads, não com contas reais
- **Basic Access**: funciona com contas reais (é o que você precisa)

Se estiver em "Test Account", é preciso solicitar "Basic Access" ao Google.

### Parte 2: Melhorias no código (3 correções)

#### 1. `ads-oauth-callback` — não salvar conexão sem account_id
Atualmente o callback salva a conexão mesmo quando não consegue obter o customer ID. Vou:
- Adicionar log detalhado do erro (status HTTP + corpo da resposta)
- Se `accountId` for null após a tentativa, redirecionar com erro específico (`no_ad_account`)
- Não salvar conexão sem account_id

#### 2. `ads-oauth-callback` — tratar resposta não-JSON do Google
O código atual faz `.json()` direto sem verificar o content-type. Vou:
- Verificar se a resposta é JSON antes de parsear
- Logar o corpo da resposta em caso de erro para debug

#### 3. `AdConnectionCards.tsx` — mensagem de erro mais clara
Adicionar tratamento para o novo código de erro `no_ad_account` na tela, explicando que o Developer Token pode não ter permissão.

## Arquivos modificados
- `supabase/functions/ads-oauth-callback/index.ts`
- `src/components/trafego/AdConnectionCards.tsx`

## Resultado esperado
- Se o Developer Token não tiver acesso, o usuário verá um erro claro em vez de uma conexão "fantasma" sem métricas
- Se o token tiver acesso correto, a conexão será salva com o customer ID e a sincronização funcionará

