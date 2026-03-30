

## Correção — Forçar onboarding no primeiro login após criação de conta

### Causa raiz

O fluxo de redirecionamento para onboarding já existe (`ClienteLayout` → `/cliente/onboarding`), mas **nunca é acionado** porque:

1. A coluna `onboarding_completed` na tabela `organizations` é `boolean | null` (sem default)
2. A função `signup-saas` cria a org sem definir `onboarding_completed`, então o valor fica `null`
3. O gate no `ClienteLayout` verifica `=== false` — como o valor é `null`, a condição nunca é verdadeira

### Solução

Duas mudanças simples:

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/signup-saas/index.ts` | Adicionar `onboarding_completed: false` no payload de criação da org (linha 249) |
| `src/components/ClienteLayout.tsx` | Mudar a condição de `=== false` para `!== true`, cobrindo tanto `false` quanto `null` |
| **Migração SQL** | Setar default da coluna para `false` e corrigir orgs existentes com `null` → `false` (para quem ainda não fez onboarding) |

### Migração SQL

```sql
ALTER TABLE organizations ALTER COLUMN onboarding_completed SET DEFAULT false;
UPDATE organizations SET onboarding_completed = false WHERE onboarding_completed IS NULL AND type = 'cliente';
```

### Resultado

Após criar a conta e fazer o primeiro login, o usuário é redirecionado automaticamente para a tela de onboarding (cadastro da empresa). Só depois de preencher os dados e clicar "Finalizar" é que ele acessa o sistema.

