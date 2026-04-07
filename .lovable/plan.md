

## Problema

A página `/apresentacao/:id` mostra "Acompanhamento não encontrado" porque a tabela `client_followups` tem RLS que exige `is_member_of_org(auth.uid(), organization_id)`. O `organization_id` é a **org da matriz**, mas o franqueado é membro da **org da unidade** (`unit_org_id`). O SELECT retorna vazio.

Além disso, a apresentação foi projetada para projeção em reuniões — pode ser aberta em um dispositivo sem sessão ativa.

## Solução

Duas correções complementares:

### 1. Adicionar RLS policy para unit_org_id

Criar migration que adiciona uma policy de SELECT permitindo acesso quando o usuário é membro da org referenciada em `unit_org_id`:

```sql
CREATE POLICY "Unit members can view followups"
  ON public.client_followups FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), unit_org_id));
```

Isso permite que franqueados vejam seus acompanhamentos tanto na listagem quanto na apresentação.

### 2. Fallback na página de apresentação

Na `Apresentacao.tsx`, se a query autenticada falhar (sem sessão ou RLS bloqueou), tentar buscar via uma Edge Function pública que retorna apenas os dados necessários para renderização, validando por ID.

Alternativa mais simples: adicionar policy anon SELECT por ID (menos seguro, mas atende o caso de projeção). A abordagem recomendada é a RLS para authenticated.

### 3. Garantir storageKey correto

Em `src/lib/supabase.ts`, adicionar `/apresentacao` ao mapeamento para que tente ambas as storage keys ou use a do portal que abriu a aba.

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| Nova migration SQL | Policy `Unit members can view followups` |
| `src/lib/supabase.ts` | Mapear `/apresentacao` para detectar portal de origem |
| `src/pages/Apresentacao.tsx` | Tentar ambos clients se primeiro falhar |

## Detalhes técnicos

- A policy usa `FOR SELECT` apenas — franqueados continuam sem permissão de edição via RLS
- O `is_member_of_org` já é uma function existente no projeto
- A migration é aditiva, sem risco para dados existentes

