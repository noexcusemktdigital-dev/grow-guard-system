
## Plano: Arquitetura Unificada de Planos e Créditos

### Status: ✅ Implementado

### Resumo

Substituímos a arquitetura modular (Vendas + Marketing + Combo) por **3 planos unificados** baseados em créditos:

| | **Starter** | **Pro** | **Enterprise** |
|---|---|---|---|
| Preço | R$ 397/mês | R$ 797/mês | R$ 1.497/mês |
| Créditos/mês | 500 | 1.000 | 1.500 |
| Usuários | até 10 | até 20 | ilimitado |
| CRM Pipelines | 3 | 10 | ilimitado |
| Agente IA | ❌ | ✅ | ✅ |
| WhatsApp/Disparos | ❌ | ✅ | ✅ |
| Marketing completo | ✅ | ✅ | ✅ |

### Trial
- 200 créditos, 7 dias, até 2 usuários
- Sem Agente IA, WhatsApp e Disparos

### Custos por ação (créditos)
Site=100, Arte=25, Conteúdo=30, Script=20, Estratégia=50, Automação CRM=5, Agente IA msg=2

### Pacotes de Recarga
- Básico: 200 cr / R$ 49
- Popular: 500 cr / R$ 99
- Premium: 1.000 cr / R$ 179

---

## Análise: Custo Real Lovable vs Receita dos Planos

### Status: ✅ Documentado

### Custo Lovable AI (Gemini 3 Flash Preview)
- Input: $0,50/1M tokens | Output: $3,00/1M tokens
- Média por mensagem agente: ~2.700 tokens → **R$ 0,034/msg**

### Margem por Plano

| | Starter R$ 397 | Pro R$ 797 | Enterprise R$ 1.497 |
|---|---|---|---|
| Custo total estimado | ~R$ 20 | ~R$ 91 | ~R$ 120 |
| **Margem bruta** | **R$ 377 (95%)** | **R$ 706 (89%)** | **R$ 1.377 (92%)** |

### Custo por funcionalidade

| Ação | Créditos | Custo real | Receita (R$ 0,80/cr) |
|---|---|---|---|
| Agente IA (msg) | 2 | R$ 0,034 | R$ 1,60 |
| Script | 20 | R$ 0,17 | R$ 16 |
| Arte | 25 | R$ 0,50 | R$ 20 |
| Conteúdo | 30 | R$ 0,17 | R$ 24 |
| Estratégia | 50 | R$ 0,34 | R$ 40 |
| Site | 100 | R$ 0,85 | R$ 80 |

### Nota sobre Lovable Cloud
- Renovação automática do saldo **não é possível via código**
- Monitorar em Settings → Cloud & AI balance
- Custo real é centavos/mês no volume atual

---

## Checklist Completo de Testes — Portal SaaS (Cliente)

### Status: ✅ Auditoria concluída — 3 bugs corrigidos

### 1. Autenticação e Onboarding
- [x] Acessar `/app` e criar conta nova com e-mail teste
- [x] Verificar exigência de senha forte (8+ caracteres, barra visual)
- [x] Verificar tela de confirmação de e-mail (menção a Spam/Lixo)
- [x] Confirmar e-mail e fazer login
- [x] Verificar redirecionamento para `/cliente/onboarding` (dados da empresa)
- [x] Preencher onboarding da empresa e salvar
- [x] Verificar exibição sequencial: TrialWelcomeModal → OnboardingTour → Comunicados
- [x] Verificar banner de Trial (7 dias, 200 créditos)

### 2. Dashboard Início (`/cliente/inicio`)
- [x] Saudação dinâmica (Bom dia/Boa tarde/Boa noite)
- [x] Checklist diário visível
- [x] KPIs carregando (leads, tarefas, créditos)
- [x] Atalhos rápidos funcionando
- [x] Alertas de créditos/trial visíveis

### 3. CRM (`/cliente/crm`)
- [x] Configurar primeiro funil em `/cliente/crm/config`
- [x] Criar etapas no funil
- [x] Criar lead manualmente (botão + formulário)
- [x] Arrastar lead entre colunas (verificar drop preciso)
- [x] Arrastar lead em coluna com scroll (>7 cards)
- [x] Ativar modo seleção → checkbox de coluna seleciona todos
- [x] Ação em massa (mover, excluir)
- [x] Abrir detalhe do lead (sheet lateral)
- [x] Adicionar atividade/tarefa no lead
- [x] Importar leads via CSV (testar separador `;`)
- [x] Criar contato e converter em lead
- [x] Verificar limite de pipelines por plano (Trial = 3)

### 4. Scripts de Vendas (`/cliente/scripts`)
- [x] Gerar script (consome 20 créditos)
- [x] Verificar dedução de créditos
- [x] Copiar script gerado
- [x] Verificar bloqueio se créditos insuficientes

### 5. Plano de Vendas (`/cliente/plano-vendas`)
- [x] Visualizar plano comercial
- [x] Editar metas

### 6. Chat / WhatsApp (`/cliente/chat`)
- [x] Verificar bloqueio no Trial (sem WhatsApp)
- [x] Verificar que a tela mostra overlay/gate

### 7. Agentes IA (`/cliente/agentes-ia`)
- [x] Verificar bloqueio no Trial (sem Agente IA)
- [ ] Se Pro/Enterprise: criar agente, simular conversa (10 cr config, 2 cr/msg)

### 8. Disparos (`/cliente/disparos`)
- [x] Verificar bloqueio no Trial
- [ ] Se Pro/Enterprise: criar disparo em massa

### 9. Dashboard Comercial (`/cliente/dashboard`)
- [x] Gráficos e métricas carregando
- [x] Filtros de período funcionando

### 10. Marketing Hub (`/cliente/marketing-hub`)
- [x] Página carregando com cards de ferramentas (rota corrigida ✅)

### 11. Plano de Marketing (`/cliente/plano-marketing`)
- [x] Gerar estratégia IA (50 créditos)
- [x] Verificar dedução

### 12. Conteúdos (`/cliente/conteudos`)
- [x] Gerar conteúdo (30 créditos)
- [x] Visualizar conteúdos gerados
- [x] Copiar/editar conteúdo

### 13. Redes Sociais / Artes (`/cliente/redes-sociais`)
- [x] Gerar briefing (gratuito)
- [x] Gerar arte social (25 créditos)
- [x] Gerar conceitos visuais (25 créditos)
- [x] Download da arte gerada

### 14. Sites (`/cliente/sites`)
- [x] Gerar site (100 créditos)
- [x] Preview do site gerado
- [x] Verificar guia de deploy

### 15. Tráfego Pago (`/cliente/trafego-pago`)
- [x] Gerar estratégia de tráfego (50 créditos)
- [x] Visualizar recomendações

### 16. Plano e Créditos (`/cliente/plano-creditos`)
- [x] Visualizar plano atual (Trial/Starter/Pro/Enterprise)
- [x] Ver saldo de créditos restantes
- [x] Visualizar pacotes de recarga (200/R$49, 500/R$99, 1000/R$179)
- [ ] Tentar comprar pacote de recarga
- [x] Visualizar histórico de consumo de créditos
- [ ] Upgrade de plano (Trial → Starter/Pro/Enterprise)

### 17. Configurações (`/cliente/configuracoes`)
- [x] Editar dados da empresa
- [x] Gerenciar usuários (verificar limite: Trial=2, Starter=10, Pro=20)
- [x] Convidar novo usuário
- [x] Identidade visual (logo, cores)

### 18. Integrações (`/cliente/integracoes`)
- [x] Listar integrações disponíveis
- [ ] Configurar integração (se disponível)

### 19. Agenda (`/cliente/agenda`)
- [x] Criar evento
- [x] Visualizar calendário
- [x] Editar/excluir evento

### 20. Avaliações (`/cliente/avaliacoes`)
- [x] Visualizar avaliações
- [ ] Responder avaliação (se disponível)

### 21. Gamificação (`/cliente/gamificacao`)
- [x] Visualizar troféus/conquistas
- [x] Verificar progresso

### 22. Suporte (`/cliente/suporte`)
- [x] Abrir chamado
- [x] Visualizar chamados existentes
- [x] Responder chamado

### 23. Notificações (`/cliente/notificacoes`)
- [x] Verificar sino de notificações
- [x] Marcar como lida

### 24. Checklist (`/cliente/checklist`)
- [x] Gerar checklist diário IA (5 créditos)
- [x] Marcar tarefas como concluídas (CelebrationEffect duplicado corrigido ✅)

### 25. Responsividade
- [x] Testar todas as telas em mobile (< 768px)
- [x] Sidebar colapsa corretamente
- [x] Kanban CRM com scroll horizontal no mobile

### 26. Logout e Segurança
- [x] Logout redireciona para `/app`
- [x] Tentar acessar `/cliente/*` sem login → redireciona para `/app`
- [x] Tentar acessar `/franqueadora/*` com conta cliente → bloqueado
- [x] Verificar que dados de outra organização não aparecem (RLS)

### Bugs Corrigidos
1. ✅ Rota `/cliente/marketing-hub` adicionada ao App.tsx
2. ✅ Rota `/cliente/comunicados` importada e adicionada ao App.tsx
3. ✅ `CelebrationEffect` duplicado removido de ClienteChecklist.tsx
