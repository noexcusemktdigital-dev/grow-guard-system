

## Correção — WhatsApp não conecta + "Easytech" → "Izitech"

### Causa raiz do erro

O arquivo `supabase/functions/izitech-provision/index.ts` tem um **bug crítico** na função helper `json()` (linha 14-17): ela referencia `req` para chamar `getCorsHeaders(req)`, mas `req` é declarado apenas dentro do callback de `Deno.serve()`. Isso causa um `ReferenceError` em tempo de execução, fazendo a Edge Function falhar silenciosamente com erro genérico. **Não tem relação com o plano trial** — nenhum usuário consegue conectar WhatsApp por essa rota.

### Plano de correção

**1. Corrigir `izitech-provision/index.ts`**
- Transformar `json` em função que recebe `req` como parâmetro, ou mover a definição para dentro do `Deno.serve()` callback
- Aplicar o mesmo padrão de extração de erro do SDK (como fizemos no `invite-user`)

**2. Substituir "Easytech" → "Izitech" no wizard (já deveria ter sido feito)**
- `src/components/cliente/WhatsAppSetupWizard.tsx` — 6 ocorrências de "Easytech" para trocar por "Izitech"
- Placeholder `https://api.easytech.com.br` → `https://api.izitech.com.br`

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/izitech-provision/index.ts` | Mover `json()` helper para dentro do callback ou passar `req` como parâmetro |
| `src/components/cliente/WhatsAppSetupWizard.tsx` | Trocar 6x "Easytech" → "Izitech" |

