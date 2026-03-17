

## Checklist Completo de Testes — Portal SaaS (Cliente)

Este é um roteiro de testes manuais para percorrer toda a plataforma do cliente SaaS, identificando erros de usabilidade, bugs visuais e falhas funcionais.

---

### 1. Autenticação & Onboarding
- [ ] Cadastro com email + senha (validação de força da senha)
- [ ] Verificação de email (tela de orientação sobre spam)
- [ ] Login com credenciais corretas
- [ ] Login com credenciais erradas (mensagem de erro clara?)
- [ ] Reset de senha (fluxo completo)
- [ ] Google OAuth (se habilitado)
- [ ] Modal de boas-vindas (TrialWelcomeModal) aparece na primeira vez
- [ ] Tour de onboarding roda após o modal
- [ ] Popup de comunicados aparece após o tour
- [ ] Onboarding de empresa (/cliente/onboarding) — todos os campos funcionam

### 2. Início (/cliente/inicio)
- [ ] KPIs carregam corretamente
- [ ] Checklist diário aparece
- [ ] Atalhos rápidos funcionam e redirecionam
- [ ] Mensagem do dia aparece (se configurada)
- [ ] Banner de trial/créditos exibe quando aplicável
- [ ] Comunicados da rede aparecem

### 3. Tarefas (/cliente/checklist)
- [ ] Lista de tarefas carrega
- [ ] Marcar/desmarcar tarefa como concluída
- [ ] Filtros por tipo (Comercial, Marketing, Gestão)
- [ ] Tarefas automáticas vs manuais

### 4. Agenda (/cliente/agenda)
- [ ] Calendário renderiza corretamente
- [ ] Criar novo evento
- [ ] Editar evento existente
- [ ] Deletar evento
- [ ] Visualização por dia/semana/mês
- [ ] Eventos da rede aparecem (se aplicável)

### 5. Gamificação (/cliente/gamificacao)
- [ ] Pontuação e XP exibem corretamente
- [ ] Ranking carrega
- [ ] Medalhas mostram status (desbloqueada/bloqueada)

### 6. CRM (/cliente/crm)
- [ ] **Pré-requisito**: Configurar pelo menos 1 funil em /cliente/crm/config
- [ ] Kanban carrega com colunas do funil
- [ ] Criar novo lead (dialog abre, campos validam)
- [ ] Arrastar lead entre etapas (precisão do cursor — recém corrigido)
- [ ] Abrir detalhe do lead (sheet lateral)
- [ ] Editar campos do lead
- [ ] Adicionar nota ao lead
- [ ] Criar tarefa no lead
- [ ] Timeline de atividades aparece
- [ ] Filtros de temperatura (Quente/Morno/Frio)
- [ ] Busca por nome/telefone
- [ ] Visão de Contatos funciona
- [ ] Importação CSV funciona
- [ ] Trocar entre funis
- [ ] Configurações do CRM (/cliente/crm/config) — funis, etapas, automações, equipes, produtos, parceiros

### 7. Conversas / Chat (/cliente/chat)
- [ ] Lista de contatos carrega
- [ ] Selecionar contato abre conversa
- [ ] Enviar mensagem de texto
- [ ] Receber mensagem (se WhatsApp conectado)
- [ ] Layout responsivo (chat ocupa tela inteira sem scroll externo)
- [ ] Painel de lead vinculado ao contato

### 8. Agentes IA (/cliente/agentes-ia)
- [ ] Lista de agentes carrega
- [ ] Criar novo agente (formulário completo)
- [ ] Editar agente existente
- [ ] Configurar persona, base de conhecimento, prompt
- [ ] Selecionar papel (SDR, Closer, Pós-venda, Suporte)
- [ ] Simular agente funciona

### 9. Scripts (/cliente/scripts)
- [ ] Lista de scripts carrega
- [ ] Criar novo script
- [ ] Editar script existente
- [ ] Gerar script via IA (dialog funciona, créditos são debitados)
- [ ] Categorias filtram corretamente

### 10. Disparos (/cliente/disparos) — Admin only
- [ ] Acesso bloqueado para cliente_user
- [ ] Wizard de criação (3 etapas) funciona
- [ ] Seleção de segmento e conta WhatsApp
- [ ] Preview da mensagem
- [ ] Envio / agendamento

### 11. Relatórios / Dashboard (/cliente/dashboard) — Admin only
- [ ] Acesso bloqueado para cliente_user
- [ ] Gráficos e métricas carregam
- [ ] Filtros de período funcionam

### 12. Plano de Vendas (/cliente/plano-vendas)
- [ ] Conteúdo carrega
- [ ] cliente_user vê em modo somente leitura

### 13. Marketing — Estratégia (/cliente/plano-marketing)
- [ ] Plano de marketing carrega
- [ ] cliente_user vê em modo somente leitura

### 14. Conteúdos (/cliente/conteudos)
- [ ] Lista de conteúdos carrega
- [ ] Gerar conteúdo via IA (créditos debitados)
- [ ] Aprovar/reprovar conteúdo

### 15. Redes Sociais (/cliente/redes-sociais)
- [ ] Mockup de Instagram carrega
- [ ] Templates de arte disponíveis

### 16. Sites (/cliente/sites)
- [ ] Lista de sites carrega
- [ ] Wizard de criação (3 etapas)
- [ ] Preview do site
- [ ] Deploy guide

### 17. Tráfego Pago (/cliente/trafego-pago) — Admin only
- [ ] Acesso bloqueado para cliente_user
- [ ] Estratégia de tráfego carrega

### 18. Integrações (/cliente/integracoes) — Admin only
- [ ] Acesso bloqueado para cliente_user
- [ ] WhatsApp setup wizard funciona
- [ ] Google Calendar OAuth funciona
- [ ] Website chat config funciona

### 19. Plano & Créditos (/cliente/plano-creditos) — Admin only
- [ ] Plano atual exibe corretamente
- [ ] Saldo de créditos exibe
- [ ] **Assinar/mudar plano**: dialog abre, escolha de PIX/Boleto/Cartão
- [ ] **PIX**: QR Code exibe inline após confirmar
- [ ] **Boleto**: Link do boleto exibe inline
- [ ] **Cartão**: Invoice URL abre checkout
- [ ] Créditos NÃO são liberados antes do pagamento (recém corrigido)
- [ ] Comprar créditos extras (CreditPackDialog)
- [ ] Histórico de transações carrega

### 20. Configurações (/cliente/configuracoes)
- [ ] Dados da organização carregam e são editáveis
- [ ] Gerenciar membros da equipe
- [ ] Convidar novo membro
- [ ] Editar/remover membro
- [ ] Identidade visual (cores, logo)

### 21. Avaliações (/cliente/avaliacoes)
- [ ] Lista de avaliações carrega
- [ ] Criar nova avaliação (nota 1-5)
- [ ] NPS (nota 1-10) funciona se habilitado

### 22. Suporte (/cliente/suporte)
- [ ] Lista de tickets carrega
- [ ] Criar novo ticket
- [ ] Adicionar mensagem a ticket existente
- [ ] Upload de anexo funciona
- [ ] Status do ticket atualiza

### 23. Notificações (/cliente/notificacoes)
- [ ] Lista de notificações carrega
- [ ] Marcar como lida
- [ ] Sino de notificação (NotificationBell) mostra contagem
- [ ] Clicar na notificação redireciona

### 24. Navegação & UX Global
- [ ] Sidebar colapsa/expande corretamente
- [ ] Mobile: menu hamburger abre sheet lateral
- [ ] Mobile: links fecham o sheet ao clicar
- [ ] Busca global (GlobalSearch) funciona
- [ ] UserMenu (logout, perfil)
- [ ] Dark mode toggle funciona
- [ ] Todas as páginas admin-only mostram bloqueio para cliente_user
- [ ] Feature gate overlay aparece para recursos do plano não contratado
- [ ] Transições de página (animação page-enter)

### 25. Responsividade
- [ ] Testar em 1920px (desktop grande)
- [ ] Testar em 1366px (laptop)
- [ ] Testar em 768px (tablet)
- [ ] Testar em 375px (mobile)

---

### Como executar
Acesse `/app` → faça login com o usuário teste → percorra cada item acima anotando: funciona / bug visual / erro funcional / travamento.

Posso começar testando via browser automation se quiser, ou posso implementar correções conforme você for relatando os problemas encontrados.

