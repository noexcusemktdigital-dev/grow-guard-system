

# Corrigir Erros de Build nas Edge Functions

Existem erros de tipagem TypeScript em 4 edge functions que precisam ser corrigidos.

## Arquivos e Correções

### 1. `supabase/functions/ai-agent-reply/index.ts` (linha 667)
- **Erro:** `.catch()` não existe em `PromiseLike<void>`
- **Fix:** Remover `.then(() => {}).catch(() => {}) as unknown as Promise<void>` — o insert do Supabase já retorna uma promise válida, basta usar sem encadear

### 2. `supabase/functions/asaas-list-payments/index.ts` (linhas 93, 162)
- **Erro 1 (L93):** `p.customer` é `unknown`, não pode ser usado como índice
- **Fix:** Cast para string: `customerNameMap[p.customer as string]`
- **Erro 2 (L162):** `.localeCompare` não existe em `{}`
- **Fix:** Cast os valores: `((b.dueDate as string) || "").localeCompare((a.dueDate as string) || "")`

### 3. `supabase/functions/asaas-test-connection/index.ts` (linhas 78-79)
- **Erro:** `parsed?.errors?.length` possivelmente undefined
- **Fix:** Adicionar nullish check: `(parsed?.errors?.length ?? 0) > 0` e `parsed!.errors![0]?.code`

### 4. `supabase/functions/asaas-webhook/index.ts` (múltiplas linhas)
- **Erro:** `SupabaseClient<any>` incompatível com tipagem das funções auxiliares
- **Fix:** Tipar `getOrCreateWallet` e `notifyOrgMembers` com `adminClient: any` em vez de `ReturnType<typeof createClient>`, eliminando o conflito de generics. Mesma abordagem para `updatePaymentStatus`.

## Resumo
São todas correções de tipagem — nenhuma lógica muda, apenas casts e ajustes de tipos para satisfazer o compilador Deno/TypeScript.

