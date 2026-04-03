

## Plano — Corrigir erro ao salvar credenciais do Google Calendar

### Problema

A Edge Function `google-calendar-oauth` faz um `upsert` com `{ onConflict: "user_id" }`, mas a tabela `google_calendar_tokens` **não possui unique constraint na coluna `user_id`** — só tem a primary key no `id`. Isso faz o Postgres rejeitar o upsert, gerando erro 500.

O fallback (delete + insert) pode funcionar na primeira vez, mas a falta de constraint é a causa raiz. Além disso, o componente `GoogleSetupWizard.tsx` não extrai o erro real do backend, mostrando apenas "Edge Function returned a non-2xx status code".

### Alterações

#### 1. Migração SQL — Adicionar unique constraint em `user_id`

```sql
ALTER TABLE public.google_calendar_tokens
ADD CONSTRAINT google_calendar_tokens_user_id_key UNIQUE (user_id);
```

Isso permite que o `upsert({ onConflict: "user_id" })` funcione corretamente.

#### 2. `src/components/agenda/GoogleSetupWizard.tsx`

Melhorar o tratamento de erro no `handleSaveAndConnect` para usar `extractEdgeFunctionError` e exibir a mensagem real do backend no toast.

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar UNIQUE constraint em `user_id` |
| `src/components/agenda/GoogleSetupWizard.tsx` | Melhorar tratamento de erro |

