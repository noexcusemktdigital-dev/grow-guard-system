

## Plano: Funil obrigatório + Config CRM unificado em todos portais

### Problema 1: Funil aleatório ao criar lead
Quando o usuário cria um lead (manual ou via contato) sem ter funil configurado, o sistema usa `DEFAULT_STAGES` hardcoded e o lead fica "solto". O correto é **obrigar** a criação de pelo menos 1 funil antes de permitir criar leads.

### Problema 2: Franqueado e Matriz não têm página de config do CRM
O SaaS (`/cliente/crm/config`) tem a página `CrmConfigPage` completa (funis, equipe, produtos, parceiros, roleta, SLA, integrações, automações). Já o Franqueado e a Matriz só abrem o `CrmFunnelManager` como dialog — sem acesso às demais configurações.

### Solução

#### 1. Empty State obrigatório de funil
Em `ClienteCRM.tsx`, `CrmExpansao.tsx` e `FranqueadoCRM.tsx`, quando `funnelsData` estiver carregado e vazio (`length === 0`):
- Exibir um **empty state** com título "Configure seu primeiro funil" e botão "Criar funil"
- Bloquear acesso ao pipeline e contatos até que haja pelo menos 1 funil
- O botão abre o `CrmFunnelManager` (já existente) inline ou como dialog
- No `CrmNewLeadDialog`, se não houver funil, exibir toast de erro e impedir criação

#### 2. Rota de config do CRM para Franqueado e Matriz
- Adicionar rotas `/franqueado/crm/config` e `/franqueadora/crm/config` no `App.tsx`, apontando para o mesmo `CrmConfigPage`
- No `CrmExpansao.tsx` e `FranqueadoCRM.tsx`, trocar o botão Settings2 de `setFunnelManagerOpen(true)` para `navigate("config")` (relativo), igual ao SaaS
- Remover o `CrmFunnelManager` dialog desses dois arquivos (não será mais necessário como dialog)

### Mudanças por arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar rotas `/franqueado/crm/config` e `/franqueadora/crm/config` → `CrmConfigPage` |
| `src/pages/cliente/ClienteCRM.tsx` | Adicionar empty state obrigatório quando `funnelsData.length === 0` |
| `src/pages/CrmExpansao.tsx` | Empty state + trocar Settings2 para `navigate` → config page |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Empty state + trocar Settings2 para `navigate` → config page |
| `src/components/crm/CrmNewLeadDialog.tsx` | Receber `funnelId` obrigatório; se não houver funil, bloquear criação |

### Fluxo resultante

```text
Usuário abre CRM (qualquer portal)
  → funnels carregados?
    → 0 funis → Empty State: "Crie seu primeiro funil para começar"
                 [Botão: Criar Funil] → abre CrmFunnelManager
    → 1+ funis → Pipeline normal
  
Settings2 em qualquer portal → navega para /[portal]/crm/config
  → CrmConfigPage (funis, equipe, produtos, parceiros, roleta, SLA, integ, autom)
```

