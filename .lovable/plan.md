

## Plano — Custo de 25 créditos + fluxo de campanhas + publicação

### Resumo das mudanças

1. **Alterar custo de tráfego pago de 200 para 25 créditos** — em todos os locais (hook, UI, constantes)
2. **Atualizar referências de trial de "200 créditos" para "500 créditos"** — landing, modal de boas-vindas
3. **Publicar as alterações** para que os clientes vejam as atualizações

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useTrafficStrategy.ts` | `_amount: 200` → `_amount: 25` |
| `src/constants/plans.ts` | `generate-traffic-strategy` cost: `50` → `25` |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Toast "200 créditos" → "25 créditos", Badge "200 créditos na aprovação" → "25 créditos" |
| `src/pages/cliente/ClienteTrafegoPagoResult.tsx` | Botão "Aprovar (200 créditos)" → "Aprovar (25 créditos)" |
| `src/components/cliente/TrialWelcomeModal.tsx` | "200 créditos" → "500 créditos" |
| `src/pages/SaasLanding.tsx` | "200 créditos" → "500 créditos" em todas as referências |

### Sobre o fluxo de campanhas e aba Estratégia

O fluxo atual já funciona assim: ao aprovar, cria campanhas no repositório e redireciona para a aba Campanhas. Ao regerar uma estratégia, a antiga é desativada (via `is_active = false` no backend) e as campanhas previamente criadas permanecem no repositório. A estratégia ativa mais recente é sempre exibida na aba Estratégia. Esse comportamento já atende ao pedido — não é necessária alteração de lógica.

### Publicação

Após as alterações, farei o deploy para que os usuários finais vejam as mudanças no acesso deles.

