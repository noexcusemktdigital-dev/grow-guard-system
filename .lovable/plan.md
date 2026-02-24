

# Seed de Dados de Demonstracao para Franqueado

Criar uma edge function `seed-demo-data` que popula todas as tabelas relevantes com dados realistas para o usuario franqueado de teste (`franqueado.teste@noexcuse.com`), tornando o sistema visualmente completo para treinamento e demonstracao.

## Dados que serao criados

### 1. Perfil do usuario
- Atualizar `profiles` com foto, cargo ("Socio-Diretor"), telefone, bio

### 2. Funil de Vendas (crm_funnels)
- 1 funil padrao com 8 etapas: Novo Lead, Primeiro Contato, Follow-up, Criador de Estrategia, Apresentacao de Estrategia, Proposta, Venda, Oportunidade Perdida

### 3. Leads (crm_leads) - 12 leads distribuidos
- 2 em "Novo Lead" (quente e morno)
- 2 em "Primeiro Contato"
- 1 em "Follow-up"
- 1 em "Criador de Estrategia"
- 2 em "Apresentacao de Estrategia"
- 2 em "Proposta" (valores altos)
- 1 em "Venda" (ganho)
- 1 em "Oportunidade Perdida" (perdido)

### 4. Atividades do CRM (crm_activities) - ~15 registros
- Ligacoes, reunioes, WhatsApp, emails distribuidos nos leads

### 5. Notas nos Leads (crm_lead_notes) - ~8 notas
- Observacoes de acompanhamento em diferentes leads

### 6. Tarefas do CRM (crm_tasks) - ~8 tarefas
- Mix de tarefas pendentes, em andamento e concluidas

### 7. Propostas (crm_proposals) - 4 propostas
- 1 rascunho, 1 enviada, 1 aceita, 1 rejeitada

### 8. Contratos (contracts) - 3 contratos
- 1 ativo, 1 pendente de assinatura, 1 encerrado

### 9. Eventos de Agenda (calendar_events) - 6 eventos
- Reunioes com clientes, follow-ups, eventos da rede

### 10. Comunicados (announcements) - 3 comunicados
- Diferentes prioridades (critica, alta, normal)

### 11. Produtos do CRM (crm_products) - 5 produtos/servicos
- Assessoria de Marketing, Gestao de Redes Sociais, Trafego Pago, etc.

---

## Detalhes tecnicos

### Nova edge function: `supabase/functions/seed-demo-data/index.ts`

A funcao:
1. Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
2. Busca o usuario franqueado pelo email `franqueado.teste@noexcuse.com`
3. Busca a organizacao vinculada via `organization_memberships`
4. Limpa dados existentes dessas tabelas para a org (evita duplicacao)
5. Insere todos os dados em sequencia, usando IDs gerados para manter relacionamentos (lead_id nas propostas, tarefas, etc.)

### Configuracao necessaria no `supabase/config.toml`
- Adicionar `[functions.seed-demo-data]` com `verify_jwt = false` para facilitar execucao

### Execucao
- A funcao sera invocada manualmente via botao ou chamada direta
- Idempotente: pode ser executada multiplas vezes sem duplicar dados (limpa antes de inserir)

Nenhuma mudanca no schema do banco necessaria -- todas as tabelas ja existem.

