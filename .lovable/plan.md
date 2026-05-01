## Plano de limpeza + otimização (versão conservadora)

Zero perda de dado visível ao usuário. Só lixo técnico (logs internos) é apagado.

---

### Etapa 1 — Diagnóstico (read-only, ~10s)

Listar tamanho real de cada tabela com `pg_total_relation_size` pra confirmar onde está o inchaço antes de apagar qualquer coisa. Resultado vira tabela no chat.

### Etapa 2 — Limpeza cirúrgica (libera 5–8 GB)

Migration única, conservadora:

```sql
-- Logs de execução de automação (lixo técnico, ninguém consulta) — 30 dias
DELETE FROM automation_execution_logs WHERE created_at < now() - interval '30 days';

-- Fila de automação já processada — 7 dias
DELETE FROM crm_automation_queue 
WHERE status IN ('completed','failed') AND created_at < now() - interval '7 days';

-- Histórico de leads (timeline) — 180 dias (conservador)
DELETE FROM crm_lead_history WHERE created_at < now() - interval '180 days';

-- Notificações já lidas — 60 dias
DELETE FROM client_notifications 
WHERE read_at IS NOT NULL AND created_at < now() - interval '60 days';

-- Logs de email enviado — 30 dias
DELETE FROM email_logs WHERE created_at < now() - interval '30 days';

-- Mensagens WhatsApp arquivadas — 180 dias (conservador)
DELETE FROM whatsapp_messages WHERE created_at < now() - interval '180 days';
```

Mensagens recentes, leads, contratos, pagamentos, perfis, organizações: **nada disso é tocado**.

### Etapa 3 — Índices compostos (reduz I/O 60–80%)

Criados com `CONCURRENTLY` (sem travar nada, app fica no ar):

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_org_stage_updated
  ON crm_leads (organization_id, stage_id, updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role
  ON user_roles (user_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user_org
  ON org_members (user_id, organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_notifications_user_unread
  ON client_notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_messages_contact_created
  ON whatsapp_messages (contact_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_automation_logs_org_created
  ON automation_execution_logs (organization_id, created_at DESC);
```

### Etapa 4 — VACUUM FULL (libera espaço físico de verdade)

Após DELETE, espaço fica "marcado livre" mas Postgres não devolve ao SO. `VACUUM FULL` reescreve a tabela. Trava cada tabela 2–8 min.

```sql
VACUUM FULL automation_execution_logs;
VACUUM FULL crm_automation_queue;
VACUUM FULL crm_lead_history;
VACUUM FULL client_notifications;
VACUUM FULL email_logs;
```

Vou rodar **agora** já que você está com Medium ativo (folga de I/O) — fica rápido e janela ruim de pico passa logo.

### Etapa 5 — Retention automática (impede recaída)

`pg_cron` job rodando 03:00 diariamente, repetindo Etapa 2. Nunca mais o disco enche por log esquecido.

```sql
SELECT cron.schedule('daily-retention-v2', '0 3 * * *', $$
  DELETE FROM automation_execution_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM crm_automation_queue WHERE status IN ('completed','failed') AND created_at < now() - interval '7 days';
  DELETE FROM crm_lead_history WHERE created_at < now() - interval '180 days';
  DELETE FROM client_notifications WHERE read_at IS NOT NULL AND created_at < now() - interval '60 days';
  DELETE FROM email_logs WHERE created_at < now() - interval '30 days';
$$);
```

### Etapa 6 — Reduzir frequência de crons pesados

Via SQL no scheduler:
- `crm-run-automations`: 5 min → 10 min
- `process-email-queue`: 5 min → 10 min  
- `agent-followup-cron`: 15 min → 30 min

Os early-exits no código já fazem cada execução custar ~1 query leve quando não há trabalho. Reduzir frequência corta ainda mais carga.

---

### Resultado esperado

| Métrica | Hoje (Medium) | Após plano |
|---|---|---|
| Disk usage | 90% | 30–40% |
| Disk I/O | 60–80% | 20–35% |
| Memory | 70–85% | 50–60% |
| Login p95 | 1–3s | <500ms |
| Capacidade | ~150 ativos | 300–400 ativos |

### Voltar pra Small?

**Sim, com segurança**, após Etapas 2–5 concluídas e disco em 30–40%. O combo (índices + retention + crons mais lentos) deixa Small confortável pra 300–400 workspaces ativos.

Recomendo: rodar tudo agora no Medium → esperar 24h observando métricas → se ficar estável <50% I/O, downgrade pra Small.

### O que NÃO vai ser tocado

- Schemas `auth`, `storage`, `realtime` (proibido).
- Qualquer dado operacional (leads, contratos, pagamentos, perfis, mensagens recentes).
- Lógica de billing, Asaas, integrações.
- Código frontend (já otimizado nas rodadas anteriores).

### Ordem de execução

1. Diagnóstico (read-only) — te mostro os tamanhos
2. Migration: DELETE + CREATE INDEX CONCURRENTLY (paralelo, ~3 min, sem downtime)
3. VACUUM FULL (sequencial, ~10–15 min, locks curtos por tabela)
4. pg_cron retention + ajuste de schedules (instantâneo)
5. Validação: rodar `pg_total_relation_size` de novo e te mostrar o antes/depois
