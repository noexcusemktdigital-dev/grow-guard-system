# Estabilização da Cloud + Roadmap de Otimização

## 1. Estado atual (diagnóstico)

- O banco continua retornando **timeout 544** ("Connection terminated due to connection timeout") em consultas mínimas.
- Logs de Postgres/Auth/Edge estão **vazios via API** — sinal claro que a instância ainda está em janela de manutenção/resize, não acessível ao serviço de logs.
- A UI da Cloud (Users, Advanced) mostra "carregando" pelo mesmo motivo: o painel depende da mesma instância.

**Conclusão:** o sistema não está "quebrado" por bug — está num período de **propagação do upgrade**. Não há nada a fazer no código enquanto a instância não voltar a `ACTIVE_HEALTHY`.

## 2. Tempo esperado do upgrade

- **Resize de disco/compute na Cloud**: tipicamente **5 a 15 minutos**, mas pode chegar a **30–45 min** em casos de WAL/replicação grandes.
- Sinais de que terminou:
  1. Aba **Advanced settings** carrega métricas (CPU, RAM, disco) sem erro.
  2. Aba **Users** lista os usuários.
  3. Login funciona sem cair em "serviço lento".
- **Ação imediata**: aguardar mais 10–15 min e recarregar. Se passar de 45 min sem voltar, é caso de suporte (instância travada em `UPGRADING`).

## 3. Capacidade real da instância (resposta direta)

Sim, a sua leitura está correta: **temos poucos usuários e bastante espaço**, então o gargalo **não é volume de dados** — é **I/O e conexões concorrentes** mal distribuídas.

Estimativa por tamanho de instância (assumindo o app atual com realtime ativo, RLS, ~30 tabelas):

| Instância | RAM | Conexões diretas seguras | Usuários simultâneos ativos | Workspaces saudáveis |
|-----------|-----|--------------------------|------------------------------|----------------------|
| Micro (1GB)  | 1GB | ~30  | ~20–40  | ~5–10  |
| Small (2GB)  | 2GB | ~60  | ~50–100 | ~15–25 |
| Medium (4GB) | 4GB | ~120 | ~150–300| ~40–70 |
| Large (8GB)  | 8GB | ~200 | ~400–800| ~100–180 |
| XL (16GB)    |16GB | ~400 | ~1k–2k  | ~250–400 |

"Usuário simultâneo ativo" = sessão logada fazendo requisições nos últimos 60s. A maioria dos usuários reais fica idle, então **a capacidade total cadastrada é ~10x maior**.

**O que derruba esses números rápido:**
- Queries sem índice (sequential scan em tabela grande).
- Realtime com muitos canais por usuário.
- Edge functions chamando o DB em loop.
- Pooler PgBouncer mal usado (conexões longas em vez de transação).

## 4. Otimizações que multiplicam a capacidade (sem trocar de plano)

Ordenadas por impacto estimado:

### 4.1. Índices e RLS (ganho 3–10x no I/O)
- Auditar policies RLS que fazem subselect em `user_roles` / `org_members` sem índice composto.
- Garantir índices em: `user_roles(user_id, role)`, `org_user_permissions(user_id, org_id)`, `messages(conversation_id, created_at desc)`, `notifications(user_id, created_at desc, read)`, `crm_leads(org_id, stage_id, updated_at)`, `tasks(org_id, assigned_to, due_date)`.
- Substituir `select *` por colunas específicas no AuthContext (hoje busca `profiles.*`).

### 4.2. Realtime sob controle (ganho 2–5x em conexões)
Hoje há **9+ pontos** abrindo canais (`NotificationBell`, `useTeamChat`, `ClienteChat`, `Atendimento`, `ClienteIntegracoes`, `FranqueadoSuporte`...).
- Centralizar via `realtimeManager` (já existe) e **proibir** `supabase.channel()` direto nos componentes.
- Reduzir escopo: usar filtros `filter: 'org_id=eq.X'` em todos os canais para o servidor não fazer broadcast geral.
- Cleanup garantido em `useEffect` return.

### 4.3. Bootstrap de Auth mais leve (ganho direto no login)
- AuthContext faz hoje em sequência: `profiles.select(*)` → `get_user_role` → eventualmente `get_user_org_id` + `user_roles.select`. São 3–4 round-trips antes da UI liberar.
- Consolidar em **uma única RPC** `bootstrap_user_session(_user_id, _portal)` que retorna `{role, org_id, profile_minimal, permissions}` em um round-trip.
- Cachear resultado em `localStorage` por 5 min (já temos `noe-cached-role`, expandir).

### 4.4. React Query com staleTime agressivo (ganho 2–3x menos requisições)
- Padrão global: `staleTime: 2min`, `gcTime: 10min`, `refetchOnWindowFocus: false`.
- Hoje muitas listas reconsultam a cada foco da aba — multiplica I/O sem ganho.

### 4.5. Edge Functions com connection pool
- Funções que rodam em loop (cron, webhooks Asaas, notificações) devem usar **service role + pooler transacional** (porta 6543), não conexão direta (5432).
- Verificar `process-asaas-webhook`, `send-email-resend`, jobs de CRM.

### 4.6. Limpeza de tabelas crescendo silenciosamente
- `audit_log`, `notifications`, `email_logs`, `whatsapp_messages`: criar **retention policy** (delete > 90 dias) via `pg_cron`.
- Hoje sem isso o disco enche e o `autovacuum` trava — foi provavelmente o gatilho do incidente atual.

### 4.7. Paginação obrigatória
- Auditar telas de listagem (CRM, Tasks, Leads, Mensagens) e garantir `.range()` ou `.limit()` sempre. Sem isso, um usuário com 5k leads derruba a tela e prende uma conexão.

## 5. Ordem sugerida de execução (após Cloud voltar)

1. **Hoje** (assim que voltar): rodar `supabase--linter` para listar índices faltantes e queries lentas reais.
2. **Sprint 1** (alto ROI): consolidar bootstrap em RPC única + cache localStorage + staleTime global. → Resolve 80% do "login lento" mesmo sob carga.
3. **Sprint 2**: auditoria RLS + índices compostos faltantes + retention de logs.
4. **Sprint 3**: centralizar realtime no `realtimeManager` e migrar todos os 9 pontos.
5. **Sprint 4**: paginação obrigatória nas listas grandes.

## 6. Detalhes técnicos

**Arquivos que serão tocados nas sprints:**
- `src/contexts/AuthContext.tsx` — bootstrap consolidado
- `src/lib/realtimeManager.ts` + componentes que abrem canais direto
- `src/lib/queryClient.ts` (se não existir, criar) — defaults de React Query
- `supabase/migrations/*` — RPC `bootstrap_user_session`, índices, `pg_cron` de retenção
- `src/integrations/supabase/client.ts` — **NÃO TOCAR** (auto-gerado), mas validar se está usando pooler

**Métricas para acompanhar (na aba Advanced da Cloud):**
- CPU < 60% sustentado
- RAM < 75%
- Disk I/O budget > 40% disponível
- Conexões ativas < 50% do limite do plano

## 7. Próximo passo agora

Aguardar mais ~15 min e recarregar a Cloud. Quando os Users e métricas voltarem, **me avisa** e eu já começo pela Sprint 1 (bootstrap consolidado) — é a mudança que mais alivia o login sob carga.
