

## Plano — Vincular Calculadora à Estratégia + Configuração de Excedente do Franqueado

### Visão geral

Três mudanças na calculadora de propostas:

1. **Trocar "Vincular ao Lead" por "Vincular à Estratégia"** — o select passa a listar estratégias salvas (do `franqueado_strategies`). Ao vincular, puxa o nome do cliente da estratégia para o campo `clientName`.

2. **Painel de configuração de excedente** — um bloco colapsável acima de "Selecione os Serviços" onde o franqueado configura:
   - Tipo: valor fixo (R$) ou percentual (%)
   - Valor do excedente
   - Botão salvar (persiste no banco, tabela `calculator_settings` por `organization_id`)
   - O excedente é somado invisível aos preços — o cliente nunca vê a separação

3. **Salvar proposta no sistema ou exportar PDF** — já existe parcialmente, manter e garantir que ao vincular à estratégia, o `strategy_id` é salvo na proposta.

---

### Mudanças técnicas

#### 1. Nova tabela `calculator_settings`

```sql
CREATE TABLE public.calculator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  surplus_type text NOT NULL DEFAULT 'percentage', -- 'fixed' | 'percentage'
  surplus_value numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;
-- RLS: membros da org podem ler/atualizar
```

#### 2. Hook `useCalculatorSettings`

**Novo arquivo:** `src/hooks/useCalculatorSettings.ts`

- Busca `calculator_settings` pela org do franqueado
- Mutation para upsert tipo e valor do excedente
- Retorna `surplusType`, `surplusValue`

#### 3. Modificar `useCalculator.ts`

- Aceitar parâmetro opcional `surplus: { type: 'fixed' | 'percentage', value: number }`
- No `calculateServicePrice`, aplicar excedente ao preço final:
  - Se `percentage`: `price * (1 + value/100)`
  - Se `fixed`: `price + value` (por serviço selecionado)
- O excedente NÃO aparece nos breakdowns — é invisível

#### 4. Modificar `FranqueadoPropostas.tsx` — CalculadoraTab

- **Remover** select de "Vincular ao Lead"
- **Adicionar** select de "Vincular à Estratégia" — lista estratégias com status `completed` via `useStrategies()`
- Ao selecionar estratégia, preencher `clientName` com o título/nome do cliente da estratégia
- **Adicionar** painel colapsável de configuração de excedente acima dos módulos:
  - Toggle tipo (fixo/percentual)
  - Input do valor
  - Botão salvar
  - Indicador visual discreto quando configurado (ex: badge "Excedente ativo")
- Ao salvar proposta, incluir `strategy_id` no payload

#### 5. Atualizar tabela `crm_proposals`

Adicionar coluna `strategy_id uuid` (nullable) para persistir o vínculo.

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar `calculator_settings` + adicionar `strategy_id` em `crm_proposals` |
| `src/hooks/useCalculatorSettings.ts` | Novo hook para configuração de excedente |
| `src/hooks/useCalculator.ts` | Aplicar excedente invisível nos cálculos |
| `src/pages/franqueado/FranqueadoPropostas.tsx` | Trocar lead→estratégia, adicionar painel excedente |

