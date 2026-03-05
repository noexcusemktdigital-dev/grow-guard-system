

# Plano: Otimização de Integrações, Plano & Créditos, Configurações e Avaliações

## Problemas Identificados

### 1. Integrações — Excesso e Duplicidade

**BUG/DESIGN**: `ClienteIntegracoes.tsx` lista 7 integrações (Meta Ads, Google Ads, TikTok Ads, RD Station, Google Calendar, WhatsApp, Widget Chat) que **não fazem nada real** — apenas salvam config no banco sem nenhum backend que consuma esses dados.

**BUG**: Duplicidade — `CrmIntegrations.tsx` (aba "Integ." no CRM Config) tem Make/Zapier/n8n/custom webhook, enquanto `ClienteIntegracoes.tsx` tem uma seção separada de API & Webhook. São duas interfaces para a mesma coisa.

**BUG**: Linha 182 de `ClienteIntegracoes.tsx` expõe o project ID do Supabase hardcoded na URL do webhook. Deveria usar `VITE_SUPABASE_PROJECT_ID`.

**Correção**: Reestruturar a página de Integrações para ter 3 seções claras:
1. **WhatsApp (Z-API)** — manter como está (funcional)
2. **API Aberta** — Chave de API + Webhook de Leads (manter)
3. **Automações** — Apenas **Make** e **Zapier** como plataformas de integração (webhooks de saída). Remover n8n, custom, e todas as integrações falsas (Meta, Google, TikTok, RD Station, Google Calendar). Mover a config de Make/Zapier do CrmIntegrations para cá (fonte única).

### 2. Configurações — Notificações não persistem

**BUG**: `NotificationsTab` usa `useState` local. As preferências de notificação se perdem ao recarregar. O mesmo padrão do bug de FinanceiroConfiguracoes.

**Correção**: Persistir preferências de notificação no campo `notification_preferences` (JSONB) da tabela `organizations` (ou no perfil do usuário). Carregar ao montar, salvar ao toggle.

### 3. Plano & Créditos — Sem problemas críticos

A página está funcional. Pequenas melhorias:
- Adicionar badge visual do plano atual no topo
- Mostrar data de início do trial e dias restantes quando `status === "trial"`

### 4. Avaliações — Funcional mas limitado

**Melhorias**:
- Adicionar possibilidade de **autoavaliação** (o usuário pode se avaliar)
- Adicionar botão de **excluir avaliação** (apenas o avaliador pode deletar)
- Mostrar **tendência** (seta ↑↓) comparando última avaliação com a anterior

## Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteIntegracoes.tsx` | Reestruturar: remover integrações falsas, manter WhatsApp + API + Make/Zapier |
| `src/components/crm/CrmIntegrations.tsx` | Remover seção de webhooks outbound (movido para Integrações) — manter apenas CSV import e webhook inbound |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Persistir preferências de notificação |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Melhorar exibição de trial (dias restantes) |
| `src/pages/cliente/ClienteAvaliacoes.tsx` | Autoavaliação + excluir + tendência |
| `src/hooks/useEvaluations.ts` | Adicionar deleteEvaluation mutation |

## Migration Necessária

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}';
```

Preferências por usuário (não por org), pois cada membro pode ter configurações diferentes.

