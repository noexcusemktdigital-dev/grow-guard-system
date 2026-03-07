

## Plano: Onboarding Automático ao Criar Unidade

### Estado atual

- **Tabelas**: `onboarding_units`, `onboarding_checklist`, `onboarding_meetings`, `onboarding_tasks`, `onboarding_indicators` — todas existem com RLS
- **Página**: `Onboarding.tsx` — funcional com lista de implantações, criação manual via dialog, abas (Etapas, Reuniões, Indicadores, Plano de Ação)
- **Edge Function `provision-unit`**: Cria org, user, membership, role, unit, payment config — mas **não cria onboarding automaticamente**

### O que precisa ser feito

**1. Automação: Criar onboarding ao provisionar unidade**

Alterar `provision-unit/index.ts` para, após criar a unit, automaticamente:
- Criar um registro em `onboarding_units` vinculado à nova unidade
- Popular `onboarding_checklist` com as etapas padrão do onboarding (~30 dias)
- Definir `target_date` como `start_date + 30 dias`

Etapas padrão a serem inseridas automaticamente:

| Fase | Etapas |
|------|--------|
| Pré-Implantação | Assinatura do contrato, Pagamento da taxa, Acesso ao sistema liberado, Acesso Academy liberado |
| Estruturação | Configuração comercial, Definição de metas, Treinamento inicial, Apresentação dos produtos |
| Primeiros Movimentos | Primeiro lead gerado, Primeira proposta enviada, Primeiro contrato fechado, Primeira campanha ativa |
| Consolidação | Pipeline organizado, Metas ativas, Primeira DRE analisada, Ajustes estratégicos |

**2. Melhorias na página Onboarding.tsx**

- Adicionar coluna `target_date` na visualização (prazo de 30 dias)
- Mostrar dias restantes/atrasados no card da implantação
- Ao criar manualmente, calcular `target_date = start_date + 30 dias` automaticamente
- Filtrar unidades que já têm onboarding ativo no dialog "Nova Implantação" (evitar duplicatas)

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/provision-unit/index.ts` | Adicionar criação automática de onboarding + checklist padrão |
| `src/pages/Onboarding.tsx` | Exibir target_date, dias restantes, filtrar unidades com onboarding existente |

### Ordem de execução

1. Atualizar `provision-unit` com criação automática
2. Melhorar UI do `Onboarding.tsx`

