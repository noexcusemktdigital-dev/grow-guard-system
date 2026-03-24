

# Correção do CRM — Leads Duplicados, Vínculo, Formatação e Auto-funil

## Problemas Identificados

### BUG CRÍTICO: Leads replicados em todas as colunas do Kanban
A função `parseFunnelStages` no Plano de Vendas gera etapas com formato `{id, name, color}`, mas o CRM espera `{key, label, color, icon}`. Quando o Kanban lê as etapas (linha 319 de `ClienteCRM.tsx`), faz `s.key || s.label?.toLowerCase()...` — como ambos são `undefined`, TODAS as colunas recebem a mesma key `"stage"`. O lead é mapeado para todas as colunas simultaneamente.

### Campo "Vincular a contato" sem utilidade clara
O campo de busca de contatos no diálogo de novo lead não explica sua função e confunde o usuário. Não é essencial para criação de leads.

### Formatação de números sem padrão brasileiro
Valores monetários exibidos sem separador de milhar/decimal correto (ex: `R$ 20000` ao invés de `R$ 20.000`).

### Auto-geração de funil incompleta
Quando o usuário não preenche `etapas_funil` no Plano de Vendas, nenhum funil é criado. Deveria gerar um funil padrão baseado no modelo de negócio.

---

## Plano de Correção

### 1. Corrigir `parseFunnelStages` — formato compatível com CRM
Alterar a função para retornar `{key, label, color, icon}` ao invés de `{id, name, color}`.

```typescript
// DE:  { id: String(i+1), name, color }
// PARA: { key: name.toLowerCase().replace(/\s+/g,"_"), label: name, color: "blue", icon: "circle-dot" }
```

**Arquivo**: `src/pages/cliente/ClientePlanoVendas.tsx`

### 2. Gerar funil padrão quando não há `etapas_funil`
Se o usuário completar o Plano de Vendas sem descrever etapas, gerar automaticamente um funil padrão baseado no `modelo_negocio` (B2B, B2C ou Ambos), usando etapas pré-definidas sensatas.

**Arquivo**: `src/pages/cliente/ClientePlanoVendas.tsx`

### 3. Remover campo "Vincular a contato" do diálogo de novo lead
Eliminar a seção de busca de contatos que confunde o usuário. O preenchimento automático via `prefillContact` continuará funcionando internamente.

**Arquivo**: `src/components/crm/CrmNewLeadDialog.tsx`

### 4. Corrigir formatação de valores monetários no CRM
Aplicar `toLocaleString("pt-BR")` nos valores exibidos no Kanban (cards e resumo do pipeline).

**Arquivo**: `src/pages/cliente/ClienteCRM.tsx`

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Corrigir `parseFunnelStages` + auto-funil padrão |
| `src/components/crm/CrmNewLeadDialog.tsx` | Remover seção "Vincular a contato" |
| `src/pages/cliente/ClienteCRM.tsx` | Corrigir formatação monetária pt-BR |

