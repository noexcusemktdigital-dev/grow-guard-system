

# Checklist Completo de Testes — Portal SaaS (Cliente)

Abaixo está a lista completa com todos os 26 itens e seus passos detalhados para teste manual.

---

## 1. Autenticação e Onboarding
- [ ] Acessar `/app` e criar conta nova com e-mail teste
- [ ] Verificar exigência de senha forte (8+ caracteres, barra visual)
- [ ] Verificar tela de confirmação de e-mail (menção a Spam/Lixo)
- [ ] Confirmar e-mail e fazer login
- [ ] Verificar redirecionamento para `/cliente/onboarding` (dados da empresa)
- [ ] Preencher onboarding da empresa e salvar
- [ ] Verificar exibição sequencial: TrialWelcomeModal → OnboardingTour → Comunicados
- [ ] Verificar banner de Trial (7 dias, 200 créditos)

## 2. Dashboard Início (`/cliente/inicio`)
- [ ] Saudação dinâmica (Bom dia/Boa tarde/Boa noite)
- [ ] Checklist diário visível
- [ ] KPIs carregando (leads, tarefas, créditos)
- [ ] Atalhos rápidos funcionando
- [ ] Alertas de créditos/trial visíveis

## 3. CRM (`/cliente/crm`)
- [ ] Configurar primeiro funil em `/cliente/crm/config`
- [ ] Criar etapas no funil
- [ ] Criar lead manualmente (botão + formulário)
- [ ] Arrastar lead entre colunas (verificar drop preciso)
- [ ] Arrastar lead em coluna com scroll (>7 cards)
- [ ] Ativar modo seleção → checkbox de coluna seleciona todos
- [ ] Ação em massa (mover, excluir)
- [ ] Abrir detalhe do lead (sheet lateral)
- [ ] Adicionar atividade/tarefa no lead
- [ ] Importar leads via CSV (testar separador `;`)
- [ ] Criar contato e converter em lead
- [ ] Verificar limite de pipelines por plano (Trial = 3)

## 4. Scripts de Vendas (`/cliente/scripts`)
- [ ] Gerar script (consome 20 créditos)
- [ ] Verificar dedução de créditos
- [ ] Copiar script gerado
- [ ] Verificar bloqueio se créditos insuficientes

## 5. Plano de Vendas (`/cliente/plano-vendas`)
- [ ] Visualizar plano comercial
- [ ] Editar metas

## 6. Chat / WhatsApp (`/cliente/chat`)
- [ ] Verificar bloqueio no Trial (sem WhatsApp)
- [ ] Verificar que a tela mostra overlay/gate

## 7. Agentes IA (`/cliente/agentes-ia`)
- [ ] Verificar bloqueio no Trial (sem Agente IA)
- [ ] Se Pro/Enterprise: criar agente, simular conversa (10 cr config, 2 cr/msg)

## 8. Disparos (`/cliente/disparos`)
- [ ] Verificar bloqueio no Trial
- [ ] Se Pro/Enterprise: criar disparo em massa

## 9. Dashboard Comercial (`/cliente/dashboard`)
- [ ] Gráficos e métricas carregando
- [ ] Filtros de período funcionando

## 10. Marketing Hub (`/cliente/marketing-hub`)
- [ ] Página carregando com cards de ferramentas

## 11. Plano de Marketing (`/cliente/plano-marketing`)
- [ ] Gerar estratégia IA (50 créditos)
- [ ] Verificar dedução

## 12. Conteúdos (`/cliente/conteudos`)
- [ ] Gerar conteúdo (30 créditos)
- [ ] Visualizar conteúdos gerados
- [ ] Copiar/editar conteúdo

## 13. Redes Sociais / Artes (`/cliente/redes-sociais`)
- [ ] Gerar briefing (gratuito)
- [ ] Gerar arte social (25 créditos)
- [ ] Gerar conceitos visuais (25 créditos)
- [ ] Download da arte gerada

## 14. Sites (`/cliente/sites`)
- [ ] Gerar site (100 créditos)
- [ ] Preview do site gerado
- [ ] Verificar guia de deploy

## 15. Tráfego Pago (`/cliente/trafego-pago`)
- [ ] Gerar estratégia de tráfego (50 créditos)
- [ ] Visualizar recomendações

## 16. Plano e Créditos (`/cliente/plano-creditos`)
- [ ] Visualizar plano atual (Trial/Starter/Pro/Enterprise)
- [ ] Ver saldo de créditos restantes
- [ ] Visualizar pacotes de recarga (200/R$49, 500/R$99, 1000/R$179)
- [ ] Tentar comprar pacote de recarga
- [ ] Visualizar histórico de consumo de créditos
- [ ] Upgrade de plano (Trial → Starter/Pro/Enterprise)

## 17. Configurações (`/cliente/configuracoes`)
- [ ] Editar dados da empresa
- [ ] Gerenciar usuários (verificar limite: Trial=2, Starter=10, Pro=20)
- [ ] Convidar novo usuário
- [ ] Identidade visual (logo, cores)

## 18. Integrações (`/cliente/integracoes`)
- [ ] Listar integrações disponíveis
- [ ] Configurar integração (se disponível)

## 19. Agenda (`/cliente/agenda`)
- [ ] Criar evento
- [ ] Visualizar calendário
- [ ] Editar/excluir evento

## 20. Avaliações (`/cliente/avaliacoes`)
- [ ] Visualizar avaliações
- [ ] Responder avaliação (se disponível)

## 21. Gamificação (`/cliente/gamificacao`)
- [ ] Visualizar troféus/conquistas
- [ ] Verificar progresso

## 22. Suporte (`/cliente/suporte`)
- [ ] Abrir chamado
- [ ] Visualizar chamados existentes
- [ ] Responder chamado

## 23. Notificações (`/cliente/notificacoes`)
- [ ] Verificar sino de notificações
- [ ] Marcar como lida

## 24. Checklist (`/cliente/checklist`)
- [ ] Gerar checklist diário IA (5 créditos)
- [ ] Marcar tarefas como concluídas

## 25. Responsividade
- [ ] Testar todas as telas em mobile (< 768px)
- [ ] Sidebar colapsa corretamente
- [ ] Kanban CRM com scroll horizontal no mobile

## 26. Logout e Segurança
- [ ] Logout redireciona para `/app`
- [ ] Tentar acessar `/cliente/*` sem login → redireciona para `/app`
- [ ] Tentar acessar `/franqueadora/*` com conta cliente → bloqueado
- [ ] Verificar que dados de outra organização não aparecem (RLS)

---

**Status da última auditoria de código (26 itens):**
- 23 itens OK
- 3 bugs corrigidos (rotas marketing-hub e comunicados + CelebrationEffect duplicado)

Para testar manualmente, percorra cada item acima no preview. Me avise qual item quer que eu investigue mais a fundo no código.

