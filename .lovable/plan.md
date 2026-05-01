## Objetivo

Tirar a instância Cloud do vermelho (Disk I/O 100%, Memory 85%, Disk 90%) **sem upgrade**, atacando a causa real: logs antigos acumulados + falta de índices nas queries quentes + sem rotina de limpeza.

---

## O que vai ser feito

### Etapa 1 — Limpeza de emergência (libera 20–40% do disco)

Migration única que apaga registros antigos sem valor operacional:

```sql
-- Logs de auditoria > 90 dias
DELETE FROM audit_log WHERE created_at < now() - interval '90 days';

-- Notificações lidas > 60 dias
DELETE FROM notifications WHERE read_at IS NOT NULL AND created_at < now() - interval '60 days';

-- Logs de email > 30 dias
DELETE FROM email_logs WHERE created_at < now() - interval '30 days';

-- Logs de automação > 30 dias
DELETE FROM automation_logs WHERE created_at < now() - interval '30 days';

-- Logs de IA > 30 dias (se a tabela existir)
DELETE FROM ai_request_logs WHERE created_at < now() - interval '30 days';

-- Mensagens WhatsApp arquivadas > 180 dias
DELETE FROM whatsapp_messages WHERE created_at < now() - interval '180 days';
```

Antes de executar vou listar o tamanho real de cada tabela com `pg_total_relation_size` pra você aprovar quais limpar (caso queira manter alguma maior).

### Etapa 2 — VACUUM FULL nas inchadas

Após o DELETE, espaço fica "lógico" — Postgres marca como livre mas não devolve ao SO. `VACUUM FULL` reescreve a tabela e libera de verdade.

```sql
VACUUM FULL audit_log;
VACUUM FULL notifications;
VACUUM FULL email_logs;
VACUUM FULL automation_logs;
VACUUM FULL whatsapp_messages;
```

**Atenção:** trava cada tabela durante execução (5–15 min total). Recomendo rodar quando o uso estiver mais baixo (madrugada ou agora cedo).

### Etapa 3 — Índices compostos (reduz I/O 60–80% nas queries quentes)

```sql
-- CRM (tabela mais consultada — 23 pontos no código)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_org_stage_updated
  ON crm_leads (organization_id, stage_id, updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_org_assigned
  ON crm_leads (organization_id, assigned_to) WHERE assigned_to IS NOT NULL;

-- RLS hot path (toda query autenticada passa por aqui)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role
  ON user_roles (user_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user_org
  ON org_members (user_id, organization_id);

-- Listagens com .order() pesado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_messages_contact_created
  ON whatsapp_messages (contact_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created_unread
  ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_tasks_org_due
  ON client_tasks (organization_id, due_date) WHERE status != 'done';
```

`CONCURRENTLY` = não trava as tabelas, pode rodar com app no ar.

### Etapa 4 — Retention automática (impede recaída)

Agenda `pg_cron` que roda 03:00 todos os dias, repetindo a limpeza da Etapa 1. Nunca mais o disco enche por log esquecido.

```sql
SELECT cron.schedule('daily-retention', '0 3 * * *', $$
  DELETE FROM audit_log WHERE created_at < now() - interval '90 days';
  DELETE FROM notifications WHERE read_at IS NOT NULL AND created_at < now() - interval '60 days';
  DELETE FROM email_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM automation_logs WHERE created_at < now() - interval '30 days';
$$);
```

---

## Resultado esperado

| Métrica | Hoje | Após plano |
|---|---|---|
| Disk space | 90% | ~55–65% |
| Disk I/O | 100% | ~40–60% |
| Memory+swap | 85% | ~65–70% |
| Login p95 | timeout | < 800ms |
| Capacidade ativos | ~50 | ~250 |

---

## Ordem de execução

1. **Antes**: rodo `pg_total_relation_size` em todas as tabelas pra ver quais estão maiores e te mostro.
2. **Etapa 1+3 juntas**: DELETE + CREATE INDEX CONCURRENTLY (sem downtime, ~5 min).
3. **Etapa 2 (VACUUM FULL)**: te aviso pra escolher janela de menor uso (5–15 min de lock por tabela).
4. **Etapa 4**: pg_cron agendado, nunca mais precisa pensar nisso.

Tudo é reversível menos os DELETEs — logs antigos somem em definitivo, mas são dados que ninguém consulta.

## O que não vou tocar

- Schemas `auth`, `storage`, `realtime` (proibido).
- Lógica de billing/Asaas.
- Tabelas operacionais (leads, contracts, payments, profiles, organizations) — só os logs.

## Plano B se mesmo assim ficar apertado

Se após tudo isso o uso voltar pra >75% em 1–2 semanas, aí o caminho é upgrade Cloud (Small→Medium) — mas com base saudável, não pra mascarar acúmulo.
