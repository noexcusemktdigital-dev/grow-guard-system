

# Plano: Teste Funcional Completo do Portal Cliente

## Credenciais
- **Email**: cliente.teste@noexcuse.com | **Senha**: 19961996

## Metodologia
Para cada módulo: login → navegar → executar ações reais (criar, editar, deletar, gerar com IA) → capturar resultado → reportar OK ou BUG.

## Sequência de Testes (26 ações funcionais)

### Bloco 1 — Dashboard e Sistema (4 ações)
1. **Login** → Verificar redirect para `/cliente/inicio`
2. **Dashboard** → Clicar em cada atalho rápido e validar navegação
3. **Checklist** → Marcar/desmarcar um item do checklist diário
4. **Notificações** → Abrir sino, marcar uma como lida

### Bloco 2 — CRM (5 ações)
5. **Criar Lead** → Preencher formulário completo (nome, telefone, valor, tags)
6. **Editar Lead** → Abrir sheet, alterar etapa via dropdown
7. **Mover Lead** → Arrastar card no Kanban para outra coluna
8. **Criar Atividade** → Adicionar nota/ligação no detalhe do lead
9. **Deletar Lead** → Excluir o lead de teste criado

### Bloco 3 — Comercial (5 ações)
10. **Scripts — Criar com IA** → Abrir dialog, preencher briefing, gerar script
11. **Scripts — Criar Manual** → Alternar para modo manual, salvar
12. **Scripts — Editar** → Alterar título de um script existente
13. **Scripts — Deletar** → Excluir script de teste
14. **Plano de Vendas** → Verificar wizard/briefing do Agente Rafael

### Bloco 4 — Marketing (6 ações)
15. **Estratégia** → Iniciar briefing ou verificar score existente
16. **Conteúdos — Gerar** → Executar wizard de geração com IA (1 conteúdo)
17. **Conteúdos — Deletar** → Excluir conteúdo gerado
18. **Redes Sociais** → Verificar histórico, tentar gerar postagem
19. **Sites** → Abrir wizard, verificar se chega até step 3
20. **Tráfego Pago** → Verificar recomendações geradas

### Bloco 5 — Sistema e Config (4 ações)
21. **Configurações** → Editar nome da empresa, salvar, verificar persistência
22. **Plano e Créditos** → Verificar saldo, histórico de transações
23. **Suporte** → Criar ticket de teste, verificar listagem
24. **Gamificação** → Verificar XP, nível e troféus

### Bloco 6 — Responsividade e Segurança (2 ações)
25. **Mobile 375px** → Testar Dashboard, CRM e Config em viewport mobile
26. **Logout** → Executar logout e verificar redirect para `/app`

## Entregável

Tabela consolidada com:
| # | Módulo | Ação | Status | Detalhe |
Para cada BUG: screenshot + descrição técnica + correção proposta.

## Execução

O teste será realizado via browser automatizado em blocos sequenciais. Cada ação será executada com `act` (não apenas `observe`), validando o resultado real da operação.

