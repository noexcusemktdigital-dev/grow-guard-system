

## Plano: Editar e Excluir Unidades + Confirmar Onboarding Automático

### Situação atual

- **Edição**: A aba "Dados" (`UnidadeDadosEdit`) já permite editar campos da unidade. Funciona.
- **Exclusão**: Não existe nenhum botão ou lógica de exclusão de unidade.
- **Onboarding automático**: A Edge Function `provision-unit` **já cria** o onboarding e o checklist automaticamente (steps 4-5). Isso já está funcionando.

### Mudanças necessárias

#### 1. Adicionar botão "Excluir Unidade" na página `Unidades.tsx`

Quando uma unidade está selecionada (visão de detalhe), exibir um botão "Excluir Unidade" com ícone de lixeira no header. Ao clicar:

- Abre um `AlertDialog` de confirmação com mensagem clara: "Tem certeza que deseja excluir a unidade **{nome}**? Esta ação não pode ser desfeita."
- Ao confirmar, chama a Edge Function `delete-unit` que faz a limpeza completa.

#### 2. Criar Edge Function `delete-unit`

A exclusão de uma unidade envolve dados em várias tabelas (organization, memberships, onboarding, etc.). Usar uma Edge Function com `service_role` para:

- Validar que o caller é membro da org pai
- Deletar registros relacionados: `onboarding_checklist`, `onboarding_units`, `franchisee_system_payments`, `referral_discounts`, `organization_memberships` (da unit_org_id), `user_roles` (dos membros), a própria `units` row, e por fim a `organizations` row da unidade
- Retornar sucesso

#### 3. Adicionar mutation `deleteUnit` no hook `useUnits.ts`

Nova mutation que invoca `delete-unit` e invalida as queries.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/delete-unit/index.ts` | Nova Edge Function para exclusão segura |
| `src/hooks/useUnits.ts` | Adicionar `deleteUnit` mutation |
| `src/pages/Unidades.tsx` | Botão excluir + AlertDialog de confirmação |

### Sobre o onboarding automático

A Edge Function `provision-unit` já cria automaticamente o registro em `onboarding_units` com status `in_progress`, prazo de 30 dias, e popula as 16 etapas padrão do checklist. Não é necessária nenhuma mudança — já está funcionando conforme desejado.

