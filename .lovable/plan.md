

## Modulo SaaS na Franqueadora

Novo modulo completo no painel da Franqueadora para gestao centralizada da plataforma SaaS, com 5 sub-abas internas.

### Estrutura do Modulo

O modulo sera acessado via `/franqueadora/saas` e tera navegacao interna por Tabs com as seguintes abas:

1. **Clientes Ativos** - Lista de todas as organizacoes tipo `client` com status da subscription, plano, creditos, data de criacao, ultimo acesso
2. **Dashboard de Custos** - Visao consolidada de receita vs custos (creditos consumidos por org, transacoes, margem estimada por cliente)
3. **Gerenciamento** - Acoes administrativas: ativar/desativar orgs, alterar planos, ajustar creditos manualmente, ver detalhes de cada org
4. **Suporte** - Visao de todos os tickets de suporte de TODAS as orgs (nao filtrado por org do admin), com status e respostas
5. **Erros** - Log de erros da plataforma capturados automaticamente (erros de Edge Functions, falhas de pagamento, erros de IA)

### Banco de Dados

**Nova tabela: `platform_error_logs`**
```sql
CREATE TABLE platform_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  source TEXT NOT NULL DEFAULT 'edge_function',  -- edge_function, webhook, client_app
  function_name TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',  -- warning, error, critical
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS: Apenas super_admin e admin podem ler/gerenciar.

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/franqueadora/SaasDashboard.tsx` | Pagina principal com Tabs para as 5 abas |
| `src/hooks/useSaasAdmin.ts` | Hooks para queries: orgs com subscriptions, custos agregados, error logs |

### Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/FranqueadoraSidebar.tsx` | Adicionar item "SaaS" na secao Administrativo com icone `Cloud` |
| `src/App.tsx` | Adicionar rota `saas` dentro do bloco franqueadora |

### Detalhes Tecnicos

**Sidebar (`FranqueadoraSidebar.tsx`):**
- Adicionar na `adminSection` antes de "Drive Corporativo":
```tsx
{ label: "SaaS", icon: Cloud, path: "/franqueadora/saas" }
```

**Rota (`App.tsx`):**
```tsx
<Route path="saas" element={<SaasDashboard />} />
```

**Hook `useSaasAdmin.ts`:**
- `useSaasClients()` - Query que faz join de `organizations` (type=client) + `subscriptions` + `credit_wallets` para montar lista completa
- `useSaasCostDashboard()` - Agrega `credit_transactions` por org para calcular consumo
- `usePlatformErrors()` - Query na tabela `platform_error_logs` ordenada por data
- `useAllSupportTickets()` - Query em `support_tickets` SEM filtro de org (visao global)

**Pagina `SaasDashboard.tsx`:**
- Tab "Clientes" mostra tabela com: Nome, Plano, Status, Creditos, Usuarios, Data Criacao
- Tab "Custos" mostra KPIs (MRR total, creditos consumidos no mes, custo estimado IA) + tabela por cliente
- Tab "Gerenciamento" mostra acoes: badge de status, botao para ajustar creditos, ver detalhes
- Tab "Suporte" reutiliza dados do `support_tickets` com visao global
- Tab "Erros" mostra lista de erros com filtros por severidade e source, com botao "Resolver"

**Edge Functions - Log de erros automatico:**
- Adicionar try/catch wrapper nas edge functions existentes que registra erros na tabela `platform_error_logs` automaticamente
- Prioridade: `asaas-webhook`, `ai-agent-reply`, `generate-content`, `whatsapp-send`

