

# Plano: Finalizar Testes CRM + Continuar Blocos Restantes

## Status Atual

| # | Ação | Status |
|---|------|--------|
| 1-4 | Funis (criar, editar, padrão, trocar) | ✅ OK (bug padrão corrigido) |
| 5-18 | Deletar funil, Contatos, Config, Automações | ⏳ Pendente |
| 19-39 | Comercial, Marketing, Sistema, Mobile | ⏳ Pendente |

## Proposta: Execução Sequencial Completa

### Fase 1 — Finalizar CRM (14 ações restantes)
5. Deletar funil de teste
6-9. Contatos: criar, editar, converter em lead, deletar
10-14. Config: equipe, produtos CRUD, parceiros CRUD, SLA, integrações (webhook URL)
15-18. Automações: criar, editar, toggle ativo/inativo, deletar

### Fase 2 — Comercial (5 ações)
Scripts IA, Scripts manual, editar, deletar, Plano de Vendas

### Fase 3 — Marketing (6 ações)
Estratégia, Conteúdos (gerar + deletar), Redes Sociais, Sites wizard, Tráfego Pago

### Fase 4 — Sistema e Mobile (6 ações)
Configurações, Plano/Créditos, Suporte, Gamificação, Mobile 375px, Logout

## Entregável
Tabela consolidada com todos os 39 testes, status OK/BUG, e correções propostas para cada bug encontrado.

## Execução
Tudo via browser automation com `act` (interações reais). Cada bug encontrado será reportado com screenshot e fix proposto. Posso corrigir bugs inline ou acumular todos ao final.

