

# Revisão do Módulo de Gestão (Financeiro, Contratos, Unidades)

## Problemas Encontrados

### BUG 1 — FinanceiroConfiguracoes: Configurações NÃO são persistidas
**Severidade: Alta**

O `FinanceiroConfiguracoes.tsx` usa apenas `useState` local. O botão "Salvar" exibe um toast mas **não salva nada** no banco. Os valores (% imposto, % repasse, capacidade, etc.) se perdem ao recarregar a página.

**Correção:** Criar uma tabela `finance_settings` (ou usar um campo JSON em `organizations`) para persistir essas configurações. Carregar via query ao montar o componente e salvar via mutation.

**Detalhes técnicos:**
- Migration: Adicionar coluna `finance_settings jsonb default '{}'` na tabela `organizations` (evita criar tabela nova)
- Criar hook ou usar `useOrgProfile` para ler/gravar
- Atualizar `FinanceiroConfiguracoes.tsx` para carregar do DB e salvar com `supabase.from("organizations").update()`

### BUG 2 — ContratosRepositorio usa status em português, DB usa inglês
**Severidade: Média**

`ContratosRepositorio.tsx` filtra por `"Assinado"`, `"Rascunho"`, `"Gerado"`, etc., mas os contratos no DB usam status em inglês (`"active"`, `"signed"`, `"draft"`, `"expired"`, `"cancelled"`). Isso significa que o repositório nunca exibe nenhum contrato — todos os grupos ficam vazios.

**Correção:** Atualizar as constantes `SECTIONS` no `ContratosRepositorio.tsx` para usar os valores reais do DB:
- `"Assinado"` → `"active"`, `"signed"`
- `"Rascunho"`, `"Gerado"`, etc. → `"draft"`
- `"Vencido"`, `"Cancelado"` → `"expired"`, `"cancelled"`

E atualizar `getFileIconColor` e `CONTRATO_STATUS_COLORS` para usar os mesmos valores.

### BUG 3 — Receitas/Despesas criadas sem data
**Severidade: Baixa**

No `FinanceiroReceitas.tsx`, o formulário de criação não pede a data. A receita é criada com `date: undefined`, o que faz o campo "Data" exibir "—" na tabela e prejudica o filtro por mês no Dashboard. O mesmo ocorre no `FinanceiroDespesas.tsx`.

**Correção:** Definir `date: new Date().toISOString().split("T")[0]` como valor default no estado do formulário de ambas as páginas, garantindo que novos lançamentos tenham sempre uma data.

### BUG 4 — Dashboard Fechamentos: taxa de sistema fixa em R$250 para todas as unidades
**Severidade: Baixa**

`FinanceiroFechamentos.tsx` hardcoda `systemFee: 250` para cada unidade. Mas cada unidade pode ter um `system_fee` diferente configurado na aba Financeiro das Unidades.

**Correção:** Buscar os dados de `units` e usar o `system_fee` real de cada unidade em vez do valor hardcoded. Requer cruzar `org_name` do contrato com o `unit_org_id` correspondente.

### MELHORIA 5 — Receitas: sem campo de data no formulário simplificado
**Severidade: Baixa**

O `FinanceiroReceitas.tsx` e `FinanceiroDespesas.tsx` nas páginas dedicadas não incluem campo de data no dialog de criação (diferente do `FinanceiroControle.tsx` que já tem). Adicionar campo `date` com default hoje.

## Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/pages/FinanceiroConfiguracoes.tsx` | Persistir configurações no DB |
| `src/components/ContratosRepositorio.tsx` | Corrigir status para inglês |
| `src/types/contratos.ts` | Atualizar `CONTRATO_STATUS_COLORS` |
| `src/pages/FinanceiroReceitas.tsx` | Adicionar campo de data com default |
| `src/pages/FinanceiroDespesas.tsx` | Adicionar campo de data com default |
| `src/pages/FinanceiroFechamentos.tsx` | Usar system_fee real das unidades |

## Migration Necessária

```sql
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS finance_settings jsonb DEFAULT '{}';
```

Sem novas tabelas. Sem alteração de RLS (a org já tem policy de UPDATE para membros).

