import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch unprocessed queue events (limit 50 per run)
    const { data: events, error: evErr } = await admin
      .from("crm_automation_queue")
      .select("*")
      .eq("processed", false)
      .order("created_at")
      .limit(50);

    if (evErr) throw evErr;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processedCount = 0;

    for (const event of events) {
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
            continue;
          }

          try {
            await executeAction(admin, supabaseUrl, serviceRoleKey, automation, lead, event);

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
          }
        }

        await markProcessed(admin, event.id);
        processedCount++;
      } catch (eventErr) {
        console.error(`Event processing error for ${event.id}:`, eventErr);
        await markProcessed(admin, event.id);
        processedCount++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("crm-run-automations error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function markProcessed(admin: any, eventId: string) {
  await admin
    .from("crm_automation_queue")
    .update({ processed: true })
    .eq("id", eventId);
}

function matchesTriggerConfig(config: any, triggerData: any): boolean {
  if (!config || Object.keys(config).length === 0) return true;

  // Filter by source
  if (config.source && triggerData?.source && config.source !== triggerData.source) {
    return false;
  }

  // Filter by stage
  if (config.stage && triggerData?.new_stage && config.stage !== triggerData.new_stage) {
    return false;
  }

  // Filter by funnel
  if (config.funnel_id && triggerData?.funnel_id && config.funnel_id !== triggerData.funnel_id) {
    return false;
  }

  // Filter by tag
  if (config.tag && triggerData?.tag && config.tag !== triggerData.tag) {
    return false;
  }

  return true;
}

async function executeAction(
  admin: any,
  supabaseUrl: string,
  serviceRoleKey: string,
  automation: any,
  lead: any,
  event: any
) {
  const actionType = automation.action_type;
  const actionConfig = automation.action_config || {};
  const orgId = lead.organization_id;

  switch (actionType) {
    case "create_task": {
      await admin.from("crm_tasks").insert({
        organization_id: orgId,
        lead_id: lead.id,
        title: actionConfig.task_title || `Tarefa automática: ${automation.name}`,
        due_date: new Date(Date.now() + (actionConfig.due_days || 1) * 86400000).toISOString(),
        assigned_to: lead.assigned_to || null,
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
        const notifications = members.map((m: any) => ({
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
      // Round-robin from team members
      if (actionConfig.team_id) {
        const { data: teamMembers } = await admin
          .from("crm_team_members")
          .select("user_id")
          .eq("team_id", actionConfig.team_id)
          .eq("is_active", true);

        if (teamMembers && teamMembers.length > 0) {
          const { data: settings } = await admin
            .from("crm_settings")
            .select("roulette_last_index")
            .eq("organization_id", orgId)
            .single();

          const lastIndex = settings?.roulette_last_index || 0;
          const nextIndex = (lastIndex + 1) % teamMembers.length;

          await admin
            .from("crm_leads")
            .update({ assigned_to: teamMembers[nextIndex].user_id })
            .eq("id", lead.id);

          await admin
            .from("crm_settings")
            .update({ roulette_last_index: nextIndex })
            .eq("organization_id", orgId);
        }
      }
      break;
    }

    case "move_to_funnel": {
      if (actionConfig.target_funnel_id && actionConfig.target_stage) {
        await admin
          .from("crm_leads")
          .update({
            funnel_id: actionConfig.target_funnel_id,
            stage: actionConfig.target_stage,
          })
          .eq("id", lead.id);
      }
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
  admin: any,
  orgId: string,
  phone: string,
  lead: any
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
  admin: any,
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
  payload: any
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
