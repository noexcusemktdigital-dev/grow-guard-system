// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, CrmSchemas } from '../_shared/schemas.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'crm-run-automations');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5 * 60 * 1000; // 5min between retries

    // PERF: hard time budget. Edge function was running 91-125s and returning 500/502/503,
    // saturating the worker pool and indirectly causing auth token refresh failures
    // (which manifest as random logouts for end users).
    // Tightened: 25s → 12s budget, batch 15 → 8.
    const startedAt = Date.now();
    const TIME_BUDGET_MS = 12_000;
    const timeLeft = () => Date.now() - startedAt < TIME_BUDGET_MS;

    // INSTANT MODE: if invoked with a specific event_id (from the queue trigger),
    // process only that event and skip the heavy periodic scans. This keeps
    // automations near-realtime without re-introducing the worker avalanche
    // that caused the immediate trigger to be removed in the past.
    let targetEventId: string | null = null;
    try {
      if (req.method === "POST") {
        const rawBody = await req.json().catch(() => null);
        if (rawBody) {
          const body = parseOrThrow(CrmSchemas.RunAutomations, rawBody);
          if (typeof body.event_id === "string") {
            targetEventId = body.event_id;
          }
        }
      }
    } catch (_) { /* ignore body parsing errors — cron invocations have no body */ }

    // Periodic scans only run in batch mode (cron / manual "Executar agora")
    if (!targetEventId) {
      // PERF early-exit: if there is no pending automation queue at all,
      // skip the heavy stuck-lead / no-contact-SLA detectors entirely.
      const { count: queueCount } = await admin
        .from("crm_automation_queue")
        .select("id", { count: "exact", head: true })
        .eq("processed", false);
      if (!queueCount || queueCount === 0) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: "empty_queue" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (timeLeft()) await detectStuckLeads(admin);
      if (timeLeft()) await detectNoContactSla(admin);
    }

    let eventsQuery = admin
      .from("crm_automation_queue")
      .select("*")
      .eq("processed", false)
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order("created_at");

    if (targetEventId) {
      eventsQuery = eventsQuery.eq("id", targetEventId).limit(1);
    } else {
      eventsQuery = eventsQuery.limit(8);
    }

    const { data: events, error: evErr } = await eventsQuery;

    if (evErr) throw evErr;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let processedCount = 0;

    for (const event of events) {
      if (!timeLeft()) break; // graceful stop — remaining events stay in queue for next run
      try {
        // Find matching active automations for this org + trigger
        const { data: automations } = await admin
          .from("crm_automations")
          .select("*")
          .eq("organization_id", event.organization_id)
          .eq("trigger_type", event.trigger_type)
          .eq("is_active", true);

        if (!automations || automations.length === 0) {
          await markProcessed(admin, event.id);
          processedCount++;
          continue;
        }

        // Fetch the lead data
        const { data: lead } = await admin
          .from("crm_leads")
          .select("*")
          .eq("id", event.lead_id)
          .single();

        if (!lead) {
          await markProcessed(admin, event.id);
          processedCount++;
          continue;
        }

        for (const automation of automations) {
          // Check trigger_config filters
          if (!matchesTriggerConfig(automation.trigger_config, event.trigger_data)) {
            // INT-006: log skipped execution
            await admin.from("automation_execution_logs").insert({
              organization_id: event.organization_id,
              automation_id: automation.id,
              event_id: event.id,
              lead_id: event.lead_id,
              action_type: automation.action_type,
              status: "skipped",
              metadata: { reason: "trigger_config_mismatch", trigger_data: event.trigger_data },
            });
            continue;
          }

          try {
            await executeAction(admin, supabaseUrl, serviceRoleKey, automation, lead, event);

            // INT-006: log successful execution
            await admin.from("automation_execution_logs").insert({
              organization_id: event.organization_id,
              automation_id: automation.id,
              event_id: event.id,
              lead_id: event.lead_id,
              action_type: automation.action_type,
              status: "success",
              metadata: { automation_name: automation.name },
            });

            // Update execution stats
            await admin
              .from("crm_automations")
              .update({
                execution_count: (automation.execution_count || 0) + 1,
                last_executed_at: new Date().toISOString(),
              })
              .eq("id", automation.id);
          } catch (actionErr) {
            console.error(`Action error for automation ${automation.id}:`, actionErr);
            // INT-006: log failed execution
            await admin.from("automation_execution_logs").insert({
              organization_id: event.organization_id,
              automation_id: automation.id,
              event_id: event.id,
              lead_id: event.lead_id,
              action_type: automation.action_type,
              status: "error",
              error_message: actionErr instanceof Error ? actionErr.message : String(actionErr),
              metadata: { automation_name: automation.name },
            });
          }
        }

        await markProcessed(admin, event.id);
        processedCount++;
      } catch (eventErr) {
        console.error(`Event processing error for ${event.id}:`, eventErr);
        // API-005: DLQ — retry up to MAX_RETRIES before marking as permanently failed
        const currentErrors = (event.error_count || 0) + 1;
        if (currentErrors >= MAX_RETRIES) {
          await admin.from("crm_automation_queue").update({
            processed: true,
            error_count: currentErrors,
            last_error: eventErr instanceof Error ? eventErr.message : String(eventErr),
          }).eq("id", event.id);
        } else {
          const nextRetry = new Date(Date.now() + RETRY_DELAY_MS * currentErrors).toISOString();
          await admin.from("crm_automation_queue").update({
            error_count: currentErrors,
            last_error: eventErr instanceof Error ? eventErr.message : String(eventErr),
            next_retry_at: nextRetry,
          }).eq("id", event.id);
          console.log(`Event ${event.id} queued for retry #${currentErrors} at ${nextRetry}`);
        }
        processedCount++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: processedCount }),
      { headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" } }
    );
  } catch (err) {
    log.error("crm-run-automations error", { error: String(err) });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

async function markProcessed(admin: ReturnType<typeof createClient>, eventId: string) {
  await admin
    .from("crm_automation_queue")
    .update({ processed: true, error_count: 0 })
    .eq("id", eventId);
}

function matchesTriggerConfig(config: Record<string, unknown> | null, triggerData: Record<string, unknown> | null): boolean {
  if (!config || Object.keys(config).length === 0) return true;

  // Filter by source
  if (config.source && triggerData?.source && config.source !== triggerData.source) {
    return false;
  }

  // Filter by stage (UI may save as `stage` or `specific_stage`)
  const cfgStage = (config as any).stage ?? (config as any).specific_stage;
  if (cfgStage && triggerData?.new_stage && cfgStage !== triggerData.new_stage) {
    return false;
  }

  // Filter by funnel — single id
  if (config.funnel_id && triggerData?.funnel_id && config.funnel_id !== triggerData.funnel_id) {
    return false;
  }

  // Filter by funnels — array of allowed funnel ids (empty = all)
  const cfgFunnels = (config as any).funnels;
  if (Array.isArray(cfgFunnels) && cfgFunnels.length > 0 && triggerData?.funnel_id) {
    if (!cfgFunnels.includes(triggerData.funnel_id)) return false;
  }

  // Filter by tag
  if (config.tag && triggerData?.tag && config.tag !== triggerData.tag) {
    return false;
  }

  return true;
}

async function executeAction(
  admin: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceRoleKey: string,
  automation: Record<string, unknown>,
  lead: Record<string, unknown>,
  event: Record<string, unknown>
) {
  const actionType = automation.action_type;
  const actionConfig = automation.action_config || {};
  const orgId = lead.organization_id;

  // Anti-recursion: if this lead was just created by THIS automation (duplicate),
  // skip to prevent infinite duplication chains.
  // NOTE: crm_leads has no `metadata` column — we store this marker inside `custom_fields`.
  const leadCustom = ((lead as any).custom_fields || {}) as Record<string, unknown>;
  if (leadCustom.duplicated_by_automation_id === automation.id) {
    console.log(`[anti-recursion] skipping automation ${automation.id} on duplicated lead ${lead.id}`);
    return;
  }

  switch (actionType) {
    case "create_task": {
      const dueDate = new Date(
        Date.now() + (actionConfig.due_days || 1) * 86400000
      ).toISOString();

      // Resolver responsável: lead.assigned_to → fallback para um cliente_admin da org
      let taskAssignedTo: string | null = lead.assigned_to || null;
      if (!taskAssignedTo) {
        const { data: adminMember } = await admin
          .from("organization_memberships")
          .select("user_id")
          .eq("organization_id", orgId)
          .eq("role", "cliente_admin")
          .limit(1)
          .maybeSingle();
        taskAssignedTo = adminMember?.user_id || null;
      }

      // Inserir na tabela do CRM
      const { data: crmTask } = await admin
        .from("crm_tasks")
        .insert({
          organization_id: orgId,
          lead_id: lead.id,
          title: actionConfig.task_title || `Tarefa: ${automation.name}`,
          task_type: actionConfig.task_type || "follow_up",
          due_date: dueDate,
          assigned_to: taskAssignedTo,
        })
        .select()
        .single();

      // Sincronizar com a ferramenta Tarefas (client_tasks)
      await admin.from("client_tasks").insert({
        organization_id: orgId,
        title: `[CRM] ${actionConfig.task_title || automation.name}`,
        description: `Lead: ${lead.name} | Funil: ${lead.funnel_id} | Etapa: ${lead.stage}`,
        due_date: dueDate.split("T")[0],
        priority: actionConfig.priority || "medium",
        status: "pending",
        source: "crm_automation",
        assigned_to: taskAssignedTo,
        created_by: null,
        metadata: {
          crm_task_id: crmTask?.id,
          lead_id: lead.id,
          automation_id: automation.id,
        },
      });
      break;
    }

    case "change_stage": {
      if (actionConfig.target_stage) {
        await admin
          .from("crm_leads")
          .update({ stage: actionConfig.target_stage })
          .eq("id", lead.id);
      }
      break;
    }

    case "add_tag": {
      if (actionConfig.tag) {
        const currentTags = lead.tags || [];
        if (!currentTags.includes(actionConfig.tag)) {
          await admin
            .from("crm_leads")
            .update({ tags: [...currentTags, actionConfig.tag] })
            .eq("id", lead.id);
        }
      }
      break;
    }

    case "remove_tag": {
      if (actionConfig.tag && lead.tags) {
        await admin
          .from("crm_leads")
          .update({ tags: lead.tags.filter((t: string) => t !== actionConfig.tag) })
          .eq("id", lead.id);
      }
      break;
    }

    case "notify": {
      const { data: members } = await admin
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", orgId);

      if (members) {
        const notifications = members.map((m: { user_id: string }) => ({
          user_id: m.user_id,
          organization_id: orgId,
          title: actionConfig.notification_title || `Automação: ${automation.name}`,
          message: actionConfig.notification_message ||
            `Lead "${lead.name}" disparou a automação "${automation.name}"`,
          type: "CRM",
          action_url: "/crm",
        }));
        await admin.from("client_notifications").insert(notifications);
      }
      break;
    }

    case "send_whatsapp": {
      const phone = normalizePhone(lead.phone);
      if (!phone) break;
      const message = actionConfig.message || `Olá ${lead.name}!`;
      await sendWhatsApp(admin, orgId, phone, message);
      break;
    }

    case "ai_first_contact": {
      const phone = normalizePhone(lead.phone);
      if (!phone) {
        console.log(`Lead ${lead.id} has no phone, skipping ai_first_contact`);
        break;
      }

      const contactId = await ensureWhatsAppContact(admin, orgId, phone, lead);
      const agentId = automation.agent_id || actionConfig.agent_id;

      if (agentId) {
        // Assign agent and set AI mode
        await admin
          .from("whatsapp_contacts")
          .update({
            attending_mode: "ai",
            assigned_agent_id: agentId,
          })
          .eq("id", contactId);
      }

      // Trigger AI agent reply with proactive first message
      const initialMessage = actionConfig.initial_message ||
        `Olá ${lead.name || ""}! Vi que você demonstrou interesse. Como posso ajudar?`;

      await triggerAiReply(supabaseUrl, serviceRoleKey, {
        organization_id: orgId,
        contact_id: contactId,
        message_text: initialMessage,
        message_type: "text",
        contact_phone: phone,
        is_proactive: true,
      });
      break;
    }

    case "ai_followup": {
      const phone = normalizePhone(lead.phone);
      if (!phone) break;

      const contactId = await ensureWhatsAppContact(admin, orgId, phone, lead);
      const agentId = automation.agent_id || actionConfig.agent_id;

      if (agentId) {
        await admin
          .from("whatsapp_contacts")
          .update({
            attending_mode: "ai",
            assigned_agent_id: agentId,
          })
          .eq("id", contactId);
      }

      // Set follow-up config on contact metadata
      const followupConfig = {
        enabled: true,
        delay_hours: actionConfig.delay_hours || 24,
        max_attempts: actionConfig.max_attempts || 3,
        current_attempt: 0,
        next_followup_at: new Date(
          Date.now() + (actionConfig.delay_hours || 24) * 3600000
        ).toISOString(),
      };

      await admin
        .from("whatsapp_contacts")
        .update({
          followup_config: followupConfig,
        })
        .eq("id", contactId);
      break;
    }

    case "ai_qualify": {
      const phone = normalizePhone(lead.phone);
      if (!phone) break;

      const contactId = await ensureWhatsAppContact(admin, orgId, phone, lead);
      const agentId = automation.agent_id || actionConfig.agent_id;

      if (agentId) {
        await admin
          .from("whatsapp_contacts")
          .update({
            attending_mode: "ai",
            assigned_agent_id: agentId,
          })
          .eq("id", contactId);
      }

      const qualifyMessage = actionConfig.initial_message ||
        `Olá ${lead.name || ""}! Gostaria de entender melhor sua necessidade para te ajudar da melhor forma. Posso te fazer algumas perguntas rápidas?`;

      await triggerAiReply(supabaseUrl, serviceRoleKey, {
        organization_id: orgId,
        contact_id: contactId,
        message_text: qualifyMessage,
        message_type: "text",
        contact_phone: phone,
        is_proactive: true,
      });
      break;
    }

    case "assign_to_person": {
      if (actionConfig.assigned_to) {
        await admin
          .from("crm_leads")
          .update({ assigned_to: actionConfig.assigned_to })
          .eq("id", lead.id);
      }
      break;
    }

    case "assign_to_team": {
      // API-006: Round-robin com advisory lock via assign_lead_round_robin RPC
      // O advisory lock pg_advisory_xact_lock(org_id) serializa workers concorrentes,
      // prevenindo que dois workers atribuam o mesmo lead ao mesmo agente.
      if (actionConfig.team_id) {
        const { data: assignedUserId, error: rpcErr } = await admin.rpc(
          "assign_lead_round_robin",
          {
            p_organization_id: orgId,
            p_lead_id: lead.id,
            p_team_id: actionConfig.team_id,
          }
        );

        if (rpcErr) {
          console.error("assign_lead_round_robin error:", rpcErr.message);
        } else if (!assignedUserId) {
          console.log(`assign_lead_round_robin: no eligible agents for team ${actionConfig.team_id}`);
        }
      }
      break;
    }

    case "move_to_funnel": {
      const targetFunnelId = actionConfig.target_funnel_id;
      if (!targetFunnelId) break;

      // Resolve target stage: explicit value, or first stage of destination funnel
      let targetStage: string | null = actionConfig.target_stage || null;
      if (!targetStage) {
        const { data: tf } = await admin
          .from("crm_funnels")
          .select("stages")
          .eq("id", targetFunnelId)
          .maybeSingle();
        const stages = (tf?.stages as any[]) || [];
        targetStage = stages[0]?.key || null;
      }
      if (!targetStage) break;

      const moveMode = actionConfig.move_mode === "duplicate" ? "duplicate" : "transfer";

      if (moveMode === "duplicate") {
        // Create a copy in the target funnel; original lead stays untouched.
        // IMPORTANT: crm_leads has neither `metadata` nor `notes` columns —
        // we persist the duplication trail inside `custom_fields` (jsonb).
        const newCustomFields = {
          ...(((lead as any).custom_fields || {}) as Record<string, unknown>),
          duplicated_from_lead_id: lead.id,
          duplicated_by_automation_id: automation.id,
          duplicated_at: new Date().toISOString(),
          duplicated_by_automation_name: automation.name,
        };
        const { error: insErr } = await admin.from("crm_leads").insert({
          organization_id: lead.organization_id,
          funnel_id: targetFunnelId,
          stage: targetStage,
          name: lead.name,
          phone: (lead as any).phone ?? null,
          email: (lead as any).email ?? null,
          company: (lead as any).company ?? null,
          value: (lead as any).value ?? null,
          source: (lead as any).source ?? "automation_duplicate",
          assigned_to: (lead as any).assigned_to ?? null,
          tags: (lead as any).tags ?? null,
          custom_fields: newCustomFields,
          // Reset lifecycle fields so the copy is "fresh" in the new funnel
          won_at: null,
          lost_at: null,
          lost_reason: null,
        });
        if (insErr) throw insErr;
      } else {
        // Transfer: update the original lead to the target funnel/stage.
        await admin
          .from("crm_leads")
          .update({
            funnel_id: targetFunnelId,
            stage: targetStage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead.id);
      }
      // Note: we no longer manually enqueue stage_change here.
      // The DB trigger `enqueue_crm_automation` already handles INSERT/UPDATE,
      // and manual enqueue was causing duplicate executions / loops.
      break;
    }

    default:
      console.log(`Unknown action type: ${actionType}`);
  }
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, "");
}

async function ensureWhatsAppContact(
  admin: ReturnType<typeof createClient>,
  orgId: string,
  phone: string,
  lead: Record<string, unknown>
): Promise<string> {
  // Check existing contact
  const { data: existing } = await admin
    .from("whatsapp_contacts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    // Update crm_lead_id link if missing
    await admin
      .from("whatsapp_contacts")
      .update({ crm_lead_id: lead.id })
      .eq("id", existing.id);
    return existing.id;
  }

  // Get first active instance for this org
  const { data: instance } = await admin
    .from("whatsapp_instances")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "connected")
    .limit(1)
    .single();

  const { data: newContact } = await admin
    .from("whatsapp_contacts")
    .insert({
      organization_id: orgId,
      phone,
      name: lead.name || null,
      crm_lead_id: lead.id,
      attending_mode: "ai",
      instance_id: instance?.id || null,
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    })
    .select("id")
    .single();

  return newContact!.id;
}

async function sendWhatsApp(
  admin: ReturnType<typeof createClient>,
  orgId: string,
  phone: string,
  message: string
) {
  const { data: instance } = await admin
    .from("whatsapp_instances")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "connected")
    .limit(1)
    .single();

  if (!instance) {
    console.log("No connected WhatsApp instance for org", orgId);
    return;
  }

  try {
    const url = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": instance.client_token,
      },
      body: JSON.stringify({ phone, message }),
    });
  } catch (e) {
    console.error("WhatsApp send error:", e);
  }
}

async function triggerAiReply(
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: Record<string, unknown>
) {
  try {
    const url = `${supabaseUrl}/functions/v1/ai-agent-reply`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("AI reply trigger error:", e);
  }
}

/**
 * Detect leads stuck in a stage for N days and enqueue `lead_stuck` events.
 * Only enqueues once per lead per day to avoid duplicates.
 */
async function detectStuckLeads(admin: ReturnType<typeof createClient>) {
  // Find active automations that use lead_stuck trigger
  const { data: automations } = await admin
    .from("crm_automations")
    .select("organization_id, trigger_config")
    .eq("trigger_type", "lead_stuck")
    .eq("is_active", true);

  if (!automations || automations.length === 0) return;

  for (const auto of automations) {
    const days = (auto.trigger_config as any)?.days || 3;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();

    // Find leads that haven't been updated since cutoff, not won/lost
    const { data: stuckLeads } = await admin
      .from("crm_leads")
      .select("id, stage, funnel_id")
      .eq("organization_id", auto.organization_id)
      .is("won_at", null)
      .is("lost_at", null)
      .lte("updated_at", cutoff)
      .limit(20);

    if (!stuckLeads || stuckLeads.length === 0) continue;

    for (const lead of stuckLeads) {
      // Check if already enqueued today
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await admin
        .from("crm_automation_queue")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("trigger_type", "lead_stuck")
        .gte("created_at", today)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await admin.from("crm_automation_queue").insert({
        organization_id: auto.organization_id,
        lead_id: lead.id,
        trigger_type: "lead_stuck",
        trigger_data: { stage: lead.stage, funnel_id: lead.funnel_id, stuck_days: days },
      });
    }
  }
}

/**
 * Detect leads without any activity (SLA breach) and enqueue `no_contact_sla` events.
 */
async function detectNoContactSla(admin: ReturnType<typeof createClient>) {
  const { data: automations } = await admin
    .from("crm_automations")
    .select("organization_id, trigger_config")
    .eq("trigger_type", "no_contact_sla")
    .eq("is_active", true);

  if (!automations || automations.length === 0) return;

  for (const auto of automations) {
    const hours = (auto.trigger_config as any)?.hours || 24;
    const cutoff = new Date(Date.now() - hours * 3600000).toISOString();

    // Leads created before cutoff with no activities
    const { data: leads } = await admin
      .from("crm_leads")
      .select("id, stage, funnel_id")
      .eq("organization_id", auto.organization_id)
      .is("won_at", null)
      .is("lost_at", null)
      .lte("created_at", cutoff)
      .limit(20);

    if (!leads || leads.length === 0) continue;

    for (const lead of leads) {
      // Check if lead has any activity
      const { data: activities } = await admin
        .from("crm_activities")
        .select("id")
        .eq("lead_id", lead.id)
        .limit(1);

      if (activities && activities.length > 0) continue;

      // Check if already enqueued today
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await admin
        .from("crm_automation_queue")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("trigger_type", "no_contact_sla")
        .gte("created_at", today)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await admin.from("crm_automation_queue").insert({
        organization_id: auto.organization_id,
        lead_id: lead.id,
        trigger_type: "no_contact_sla",
        trigger_data: { stage: lead.stage, funnel_id: lead.funnel_id, sla_hours: hours },
      });
    }
  }
}
