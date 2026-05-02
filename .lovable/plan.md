# Plano: Críticos Pendentes (versão final)

## Auditoria invalidou 2 itens da lista — começo por aí

| Item da sua lista | Status real | O que fazer |
|---|---|---|
| Migrar Gemini de artes (descontinuado) | **Falso positivo** — `generate-social-image` já usa `gemini-3.1-flash-image-preview` (Nano Banana 2), `generate-social-video-frames` usa `gemini-3-pro-image-preview`. Ambos são modelos atuais. | **Nada** |
| GPS adaptativo por respostas | **Já existe** — `get-next-gps-question` está deployado e é chamado por `AdaptiveChatBriefing.tsx`. Perguntas se adaptam dinamicamente. | **Nada** |
| Paginar CRM (PAGE_SIZE=50) | **Falso positivo** — `useCrmLeads` já está com `PAGE_SIZE = 50` e `crm_tasks` já é query separada (`useCrmLeadTasks`). | **Nada** |

Sobram **6 frentes reais**:

---

## Frente 1 — `get-inicio-data` consolidado (CRÍTICO)

**Problema:** `ClienteInicio.tsx` dispara **13 hooks paralelos** no login (anúncios, views, tasks, profile, org, gamification, checklist, leads, goals, goalProgress, wa-instance, wa-contacts, agents, dailyMessage). Cada um = round-trip + JWT + RLS.

**Solução:**
1. Criar edge function `get-inicio-data` (recebe `org_id`, `user_id`).
2. Executa tudo em paralelo no servidor com `service_role` e retorna **JSON único com resumos agregados**:
   ```ts
   { profile, org, gamification: { xp, level },
     leads_summary: { this_month, prev_month, won_this_month, won_prev, my_count, my_won },
     goals: [...], goal_progress: {...},
     checklist_today, my_tasks_today,
     announcements_unread_count,
     wa_status, agents_count, daily_message }
   ```
   - Importante: `leads_summary` calculado em SQL (`COUNT/SUM` com `WHERE`), NÃO trafega array de leads.
3. Hook novo `useInicioData()` com `staleTime: 2min`. `ClienteInicio` consome só esse hook.
4. Manter os 13 hooks individuais — eles continuam servindo outras páginas, só não rodam mais na home.

**Ganho:** 13 round-trips → 1.

---

## Frente 2 — `calculate-gamification` no backend (CRÍTICO)

**Problema:** `ClienteGamificacao.tsx` faz **18 queries paralelas** (leads, team, evals, contents, dispatches, sites, agents, profile, org, waInstance, members, teams, activeStrategy, calendarEvents, checklistDoneCount, academyProgress, customFunnels, claims, teamGamification) só para calcular pontos.

**Solução:**
1. Criar edge function `calculate-gamification` (recebe `org_id`, `user_id`).
2. Move toda a lógica de `ClienteGamificacaoHelpers.tsx` para o backend. Retorna:
   ```ts
   { total_xp, level, next_level_xp,
     breakdown: { leads, content, dispatch, site, agent, evaluation, calendar, checklist, academy },
     claims_available: [...], team_ranking: [...] }
   ```
3. Hook `useGamificationData()` com `staleTime: 5min`.
4. Frontend recebe pronto. Mantém só mutation `claimReward`.

**Ganho:** 18 queries → 1.

---

## Frente 3 — Crons mais leves + early-exit (ALTO)

**Schedules atuais** (`20260323120000_schedule_email_cron_jobs.sql`):
- `process-email-queue`: `* * * * *` (1 min)
- `agent-followup-cron`: `*/15 * * * *` (15 min)
- `crm-run-automations`: `*/5 * * * *` (5 min)

**Solução:**
1. Migration nova com `cron.alter_job` para:
   - `agent-followup-cron`: 15 → **30 min**
   - `crm-run-automations`: 5 → **10 min**
   - `process-email-queue`: **mantém 1 min** (OTP é time-sensitive)
2. Adicionar **early-exit** no início de cada uma das 3 functions:
   - `process-email-queue`: `SELECT count(*) FROM pgmq.q_auth_emails + q_transactional_emails`. Se 0, retorna 200 imediatamente.
   - `agent-followup-cron`: se `whatsapp_agents WHERE active=true LIMIT 1` retornar vazio → exit.
   - `crm-run-automations`: se `crm_automations WHERE active=true LIMIT 1` retornar vazio → exit.

**Ganho:** ~50% menos invocações + 80% das chamadas restantes saem em <50ms quando não há trabalho.

---

## Frente 4 — Onboarding + popup consultoria gratuita (FASE 1)

**Solução:**
1. Após signup completo, redirecionar `/cliente/inicio?welcome=1`.
2. Novo componente `WelcomeAssessoriaDialog`:
   - Headline: "Bem-vindo! Quer acelerar seus resultados?"
   - 2 CTAs: **"Quero consultoria gratuita de 30 min"** e **"Continuar sozinho"**.
3. CTA "consultoria" abre form (nome, telefone, melhor horário) → grava em nova tabela `consultoria_requests` (RLS: cliente vê os próprios; matriz vê todos) → dispara email para a matriz via `send-transactional-email`.
4. Nova aba `/franqueadora/consultorias` lista os pedidos com status (pendente/agendado/concluído).

**Aplicar `AssessoriaPopup` existente nas 4 ferramentas faltantes:** CRM, Conteúdo, Disparos, Agentes — usando `storageKey` único por ferramenta. Componente já existe, só falta importar e montar.

---

## Frente 5 — Metas individuais visíveis ao usuário final

**Problema:** `useGoals` / página de metas só renderiza para `isAdmin`.

**Solução:**
1. Em `ClienteMetasRanking.tsx`: remover gate `isAdmin` da lista.
2. SQL filtra: usuário comum vê **só metas onde `assigned_to = user.id` OU do time dele**. Admin continua vendo tudo.
3. Card "Minhas Metas" novo na home (`ClienteInicio`) com `GoalProgressRing` + valor restante. Renderiza para todos, não só admin. Dados já vêm do `useInicioData` (Frente 1).

---

## Frente 6 — Banner de venda assessoria publicado em todas as ferramentas

Já existe em 4 ferramentas (Acompanhamento, Redes Sociais Hub, Sites, Tráfego). Adicionar `AssessoriaTeamBanner` (componente pronto) também em: Dashboard inicial, Plano de Marketing, Conteúdos, CRM. Trabalho mecânico — 4 imports + JSX.

---

## Ordem recomendada

| # | Frente | Esforço | Impacto |
|---|--------|---------|---------|
| 1 | get-inicio-data | M | **Altíssimo** — toda sessão de cliente |
| 2 | calculate-gamification | M | Alto — página gamificação |
| 3 | Crons + early-exit | P | Alto — custo de edge functions |
| 4 | Onboarding consultoria + 4 popups | M | Médio — conversão |
| 5 | Metas para usuário comum | P | Médio — engajamento |
| 6 | Banner assessoria 4 telas | PP | Baixo — receita |

**Sugestão:** rodada 1 = frentes **1+2+3** (todas performance, mesmo padrão de refactor). Rodada 2 = **4+5+6** (UX/conversão).

## Riscos e cuidados

- Frentes 1 e 2 mudam onde dados vêm. Manter os hooks antigos vivos (não deletar) — só não chamar mais em Inicio/Gamificação. Se algo quebrar, fácil reverter.
- Frente 3: testar early-exit em homologação antes — uma exceção mal tratada pode parar o cron.
- Frente 4: tabela `consultoria_requests` precisa de RLS bem desenhada (dois owners: cliente + matriz).

Aprove para eu executar (recomendo começar pela rodada 1 = performance).
