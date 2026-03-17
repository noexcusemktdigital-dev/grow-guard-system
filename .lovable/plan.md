

## Plano: Corrigir CRM (funil + leads) + Tutoriais por Ferramenta

### Parte 1: Bug — Leads não aparecem no CRM

**Causa raiz**: `CrmNewLeadDialog` chama `createLead` sem passar `funnel_id`. O lead é inserido no banco sem vínculo ao funil. Como `useCrmLeads` filtra por `funnel_id` (linha 22: `.eq("funnel_id", funnelId)`), o lead nunca aparece.

**Correção**:
- Adicionar prop `funnelId` ao `CrmNewLeadDialog`
- Passar `funnel_id` no objeto do `createLead.mutate()`
- Atualizar os 3 chamadores (`ClienteCRM.tsx`, `FranqueadoCRM.tsx`, `CrmExpansao.tsx`) para passar o `selectedFunnelId`

### Parte 2: Bug — Funil não salva

**Causa raiz**: A RLS policy `Admins can manage funnels` no `crm_funnels` exige role `cliente_admin`. Preciso verificar se o usuário SaaS recebe essa role no signup. Se não receber, a operação INSERT é negada silenciosamente.

**Correção**: Adicionar policy para que membros da org possam criar/atualizar funis (ou garantir que o signup SaaS atribua `cliente_admin`). A solução mais segura é adicionar uma policy INSERT/UPDATE para membros:

```sql
CREATE POLICY "Members can manage own org funnels"
ON crm_funnels FOR ALL
USING (is_member_of_org(auth.uid(), organization_id))
WITH CHECK (is_member_of_org(auth.uid(), organization_id));
```

### Parte 3: Tutoriais por Ferramenta

Criar um componente reutilizável `FeatureTutorialDialog` que recebe dados de tutorial específicos por ferramenta. Cada ferramenta terá:
- **O que é**: descrição da ferramenta e sua importância
- **Como acessar**: onde encontrar no menu
- **O que faz**: funcionalidades principais (com ícones)
- **Benefícios**: resultados que o usuário pode esperar

Tutoriais para as ~12 ferramentas principais do SaaS:

| Ferramenta | Página |
|-----------|--------|
| CRM / Pipeline | ClienteCRM |
| Plano de Vendas | ClientePlanoVendas |
| Scripts de Vendas | ClienteScripts |
| Agentes IA | ClienteAgentesIA |
| Disparos em Massa | ClienteDisparos |
| Conteúdos IA | ClienteConteudos |
| Redes Sociais | ClienteRedesSociais |
| Sites IA | ClienteSites |
| Tráfego Pago | ClienteTrafegoPago |
| Chat / WhatsApp | ClienteChat |
| Checklist Diário | ClienteChecklist |
| Gamificação | ClienteGamificacao |

**Implementação**:
1. Criar `src/components/cliente/FeatureTutorialDialog.tsx` — componente genérico com steps visuais (ícone, título, descrição, benefícios)
2. Criar `src/constants/featureTutorials.ts` — dados de tutorial para cada ferramenta
3. Adicionar botão "?" (HelpCircle) no `PageHeader` de cada página que abre o tutorial correspondente
4. Salvar no localStorage qual tutorial já foi visto (`feature_tutorial_[slug]_seen`)
5. Abrir automaticamente na primeira visita do usuário àquela ferramenta

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/components/crm/CrmNewLeadDialog.tsx` | Adicionar prop `funnelId`, passar no mutate |
| `src/pages/cliente/ClienteCRM.tsx` | Passar `selectedFunnelId` ao dialog |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Passar `selectedFunnelId` ao dialog |
| `src/pages/CrmExpansao.tsx` | Passar `selectedFunnelId` ao dialog |
| Migration SQL | Atualizar RLS do `crm_funnels` |
| `src/components/cliente/FeatureTutorialDialog.tsx` | **Novo** — componente tutorial reutilizável |
| `src/constants/featureTutorials.ts` | **Novo** — dados de 12 tutoriais |
| ~12 páginas cliente | Adicionar botão help + auto-open tutorial |

