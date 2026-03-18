

# Plano: Teste Automatizado Completo (26 itens)

## Abordagem

Usar o browser automatizado para percorrer todos os 26 itens do checklist com as credenciais fornecidas:
- **Email**: cliente.teste@noexcuse.com
- **Senha**: 19961996

## Sequência de Execução

### Bloco 1 — Login e Dashboard (itens 1-2)
1. Navegar para `/app`, fazer login com as credenciais
2. Verificar redirecionamento para `/cliente/inicio`
3. Validar saudação dinâmica, KPIs, checklist, atalhos, alertas

### Bloco 2 — CRM (item 3)
4. Navegar para `/cliente/crm` e `/cliente/crm/config`
5. Verificar funis, criação de lead, kanban, sheet de detalhe, CSV import

### Bloco 3 — Comercial (itens 4-9)
6. Scripts (`/cliente/scripts`), Plano de Vendas (`/cliente/plano-vendas`)
7. Chat (`/cliente/chat`), Agentes IA (`/cliente/agentes-ia`), Disparos (`/cliente/disparos`) — verificar feature gates
8. Dashboard Comercial (`/cliente/dashboard`)

### Bloco 4 — Marketing (itens 10-15)
9. Marketing Hub, Plano Marketing, Conteúdos, Redes Sociais, Sites, Tráfego Pago

### Bloco 5 — Sistema (itens 16-24)
10. Plano e Créditos, Configurações, Integrações, Agenda, Avaliações, Gamificação, Suporte, Notificações, Checklist

### Bloco 6 — Responsividade e Segurança (itens 25-26)
11. Testar viewport mobile (375px) em 3 telas críticas (Dashboard, CRM, Configurações)
12. Verificar logout e redirecionamento

## Entregável

Relatório com status de cada item (OK / BUG), screenshots dos problemas encontrados e correções propostas para cada bug.

## Observação Técnica

Cada tela será validada com `observe` + `screenshot`. Interações (cliques, formulários) serão feitas via `act`. O processo será dividido em mensagens sequenciais para respeitar os limites do browser.

