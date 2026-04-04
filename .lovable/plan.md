

## Plano — Reorganizar sidebar da Franqueadora separando Comercial de Franquia

### Situação atual

A sidebar da Franqueadora já possui as ferramentas comerciais (CRM, Prospecção, Estratégia, Propostas, Metas) e as rotas já apontam para os mesmos componentes do Franqueado. Porém, a seção "Rede" mistura ferramentas de franquia (Unidades, Onboarding, Candidatos) com Atendimento, e a organização não está clara.

### Mudanças

#### 1. Reorganizar seções da sidebar (`FranqueadoraSidebar.tsx`)

Nova organização:

- **Principal**: Início, Chat da Equipe, Agenda, Comunicados (sem mudança)
- **Comercial**: CRM de Vendas, Prospecção, Criador de Estratégia, Gerador de Proposta, Metas & Ranking (sem mudança — já existe e já funciona)
- **Franquia** (renomear "Rede"): Unidades, Onboarding, Candidatos, CRM Expansão, Atendimento
- **Marketing & Academy**: Marketing, NOE Academy, Playbooks (sem mudança)
- **Gestão**: Matriz, Contratos, Financeiro, Logs & Erros (sem mudança)

A principal alteração visual é renomear "Rede" para "Franquia" e mover o CRM Expansão (que é o CRM de prospecção de franquia, diferente do CRM de vendas comercial) para dentro dessa seção com label "CRM Expansão". O CRM de Vendas comercial fica na seção Comercial.

#### 2. Ajustar `redeSection` → `franquiaSection`

Renomear a constante e atualizar os itens:
```
franquiaSection = [
  { label: "CRM Expansão", icon: TrendingUp, path: "/franqueadora/crm" },
  { label: "Unidades", icon: Building2, path: "/franqueadora/unidades" },
  { label: "Onboarding", icon: Rocket, path: "/franqueadora/onboarding" },
  { label: "Candidatos", icon: Users, path: "/franqueadora/candidatos" },
  { label: "Atendimento", icon: MessageSquare, path: "/franqueadora/atendimento" },
]
```

#### 3. Adicionar rota de CRM comercial para franqueadora

No `App.tsx`, adicionar uma nova rota `/franqueadora/crm-vendas` que aponta para o mesmo componente `FranqueadoCRM` (CRM de vendas do franqueado). Atualizar o path na sidebar comercial de `/franqueadora/crm` para `/franqueadora/crm-vendas`.

A seção comercial fica:
```
comercialSection = [
  { label: "CRM de Vendas", icon: Target, path: "/franqueadora/crm-vendas" },
  { label: "Prospecção", icon: Sparkles, path: "/franqueadora/prospeccao" },
  { label: "Criador de Estratégia", icon: ClipboardCheck, path: "/franqueadora/estrategia" },
  { label: "Gerador de Proposta", icon: FileText, path: "/franqueadora/propostas" },
  { label: "Metas & Ranking", icon: Trophy, path: "/franqueadora/metas" },
]
```

#### 4. Importar e adicionar rota no `App.tsx`

- Importar `FranqueadoCRM` (lazy)
- Adicionar `<Route path="crm-vendas" element={<FranqueadoCRM />} />`
- Adicionar `<Route path="crm-vendas/config" element={<CrmConfigPage />} />`

#### 5. Atualizar atalhos na Home (`HomeAtalhos.tsx`)

Atualizar o atalho "CRM de Vendas" nos `franqueadoraAtalhos` para apontar para `/franqueadora/crm-vendas`.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Renomear "Rede"→"Franquia", separar CRM Expansão de CRM Vendas, reorganizar itens |
| `src/App.tsx` | Adicionar rota `/franqueadora/crm-vendas` e config |
| `src/components/home/HomeAtalhos.tsx` | Atualizar path do atalho CRM |

### Resultado

A franqueadora terá duas seções claramente distintas: **Comercial** (ferramentas de venda a clientes, idênticas ao franqueado) e **Franquia** (ferramentas de gestão da rede de franquias). O CRM Expansão (prospecção de franquia) fica em Franquia, e o CRM de Vendas (pipeline comercial) fica em Comercial.

