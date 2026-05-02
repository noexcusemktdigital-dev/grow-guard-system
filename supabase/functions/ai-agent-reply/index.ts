// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';

const rolePrompts: Record<string, string> = {
  sdr: `Você atua como SDR (Sales Development Representative) altamente qualificado. Seu foco EXCLUSIVO é qualificar leads e enviá-los preparados para os vendedores.

COMPORTAMENTO OBRIGATÓRIO:
1. Seja DIRETO e OBJETIVO — faça UMA pergunta por mensagem, não mais.
2. Siga a metodologia BANT de qualificação:
   - Budget (Orçamento): "Qual investimento você tem em mente para essa solução?"
   - Authority (Autoridade): "Você é a pessoa que toma a decisão final?" / "Quem mais participa dessa decisão?"
   - Need (Necessidade): "Qual o principal problema que você está tentando resolver?"
   - Timeline (Urgência): "Para quando você precisa dessa solução funcionando?"
3. Classifique o lead mentalmente como Quente (pronto para comprar), Morno (interessado mas com objeções) ou Frio (apenas pesquisando).
4. Quando o lead estiver qualificado (pelo menos 3 de 4 critérios BANT identificados), use [AI_ACTION:HANDOFF:Lead qualificado — Resumo: Nome, Necessidade, Orçamento, Decisor, Urgência].
5. NUNCA tente vender, apresentar preços ou fechar negócios — isso é trabalho do closer.
6. Se o lead pedir preço ou quiser comprar, diga que vai conectá-lo com um especialista que poderá ajudar melhor.`,

  closer: `Você atua como Closer de vendas altamente assertivo. Seu foco é QUALIFICAR RAPIDAMENTE e FECHAR a venda, enviando links de produtos/serviços diretamente.

COMPORTAMENTO OBRIGATÓRIO:
1. Faça no máximo 2-3 perguntas de qualificação rápida antes de apresentar uma solução.
2. Identifique a necessidade principal e apresente o produto/serviço IDEAL da base de conhecimento.
3. Envie links de venda usando [AI_ACTION:SEND_PRODUCT_LINK:url_do_produto] — extraia URLs da sua base de conhecimento.
4. Ao enviar o link, descreva brevemente os benefícios e crie senso de urgência ("vagas limitadas", "condição especial essa semana").
5. Quando o cliente confirmar interesse ou disser que vai comprar, parabenize e confirme os próximos passos.
6. Supere objeções usando argumentos da base de conhecimento — NUNCA invente informações.
7. Se o cliente tiver dúvidas muito técnicas que você não consegue resolver, use [AI_ACTION:HANDOFF:Cliente com dúvida técnica sobre X].
8. NÃO agende reuniões — seu papel é resolver tudo na conversa e fechar direto.`,

  pos_venda: `Você atua como agente de Pós-venda focado em colher feedback e medir satisfação (NPS).

COMPORTAMENTO OBRIGATÓRIO:
1. Inicie SEMPRE parabenizando o cliente pela compra/contratação de forma genuína.
2. Pergunte como está sendo a experiência com o produto/serviço (UMA pergunta por vez).
3. Escute atentamente o feedback — valide os pontos positivos e demonstre empatia nos negativos.
4. Após coletar feedback, solicite a nota NPS: "Em uma escala de 1 a 10, o quanto você recomendaria nosso produto/serviço para um amigo ou colega?"
5. Quando o cliente der a nota, registre usando [AI_ACTION:REGISTER_NPS:nota|comentário_resumido].
6. Se a nota for 1-6 (detratores): pergunte o que poderia melhorar e ofereça ajuda concreta.
7. Se a nota for 7-8 (neutros): pergunte o que faria dar 10.
8. Se a nota for 9-10 (promotores): agradeça efusivamente e pergunte se poderia dar um depoimento.
9. NUNCA force a nota — se o cliente não quiser responder, agradeça e encerre positivamente.
10. Se identificar um problema não resolvido, use [AI_ACTION:HANDOFF:Cliente reportou problema: descrição].`,

  suporte: `Você atua como agente de Suporte especializado em diagnosticar e resolver problemas.

COMPORTAMENTO OBRIGATÓRIO:
1. Acolha o cliente com empatia: "Entendo sua frustração, vou te ajudar a resolver isso."
2. Faça perguntas DIAGNÓSTICAS assertivas para entender o problema REAL:
   - "O que exatamente está acontecendo?"
   - "Quando começou esse problema?"
   - "Você já tentou alguma solução?"
   - "Tem alguma mensagem de erro?"
3. Busque a solução EXCLUSIVAMENTE na base de conhecimento — NUNCA invente soluções.
4. Apresente a solução em passos claros e numerados.
5. SEMPRE confirme se resolveu: "Isso resolveu seu problema?" / "Conseguiu seguir os passos?"
6. Se o cliente confirmar que resolveu, encerre positivamente.
7. Se NÃO resolveu ou você não encontrou a solução na base de conhecimento, transfira para um especialista humano com resumo completo:
   [AI_ACTION:HANDOFF:Problema não resolvido — Diagnóstico: {descrição do problema}, Tentativas: {o que já foi tentado}, Urgência: {alta/média/baixa}]
8. NUNCA deixe o cliente sem resposta — sempre direcione para o próximo passo.`,
};

// ─── Engagement rule helpers ───

function isWithinWorkingHours(workingHours: Record<string, any> | null): boolean {
  if (!workingHours?.enabled) return true;
  const tz = (workingHours.timezone || "America/Sao_Paulo") as string;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz as string });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p: { type: string; value: string }) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p: { type: string; value: string }) => p.type === "minute")?.value || "0");
  const currentMinutes = hour * 60 + minute;
  const [startH, startM] = ((workingHours.start as string) || "08:00").split(":").map(Number);
  const [endH, endM] = ((workingHours.end as string) || "18:00").split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

async function debitCredits(adminClient: any, orgId: string, tokensUsed: number, agentName: string, supabaseUrl: string, serviceRoleKey: string) {
  const FIXED_CREDIT_COST = 2;
  try {
    const debited = await debitIfGPSDone(
      adminClient,
      orgId,
      FIXED_CREDIT_COST,
      `Mensagem IA — ${agentName}`,
      "ai-agent-reply",
      supabaseUrl,
      serviceRoleKey,
    );
    if (!debited) console.log("GPS not yet approved — skipping credit debit");
  } catch (e) {
    console.error("Debit credits error (non-blocking):", e);
  }
}

async function executeHandoff(adminClient: any, orgId: string, contactId: string, agentName: string, reason: string) {
  await adminClient.from("whatsapp_contacts").update({ attending_mode: "human" }).eq("id", contactId);
  const { data: members } = await adminClient.from("organization_memberships").select("user_id").eq("organization_id", orgId);
  if (members) {
    await adminClient.from("client_notifications").insert(
      members.map((m: { user_id: string }) => ({
        organization_id: orgId,
        user_id: m.user_id,
        title: "IA transferiu atendimento",
        message: `Agente ${agentName}: ${reason}`,
        type: "warning",
        action_url: "/cliente/chat",
      }))
    );
  }
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'ai-agent-reply');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, contact_id, message_text, message_type, media_url, contact_phone } = await req.json();

    // Skip groups and broadcasts
    if (contact_phone) {
      const isGroupOrBroadcast = contact_phone.endsWith("-group") || contact_phone.includes("@broadcast");
      if (isGroupOrBroadcast) {
        return new Response(JSON.stringify({ skipped: true, reason: "group_or_broadcast" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    if (!organization_id || !contact_id || (!message_text && !media_url)) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── CHECK 1: Credit balance ───
    const { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("balance")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (wallet && wallet.balance <= 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_credits" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get contact
    const { data: contact } = await adminClient
      .from("whatsapp_contacts")
      .select("*, agent_id, attending_mode, phone, crm_lead_id")
      .eq("id", contact_id)
      .eq("organization_id", organization_id)
      .single();

    if (!contact || contact.attending_mode === "human") {
      return new Response(JSON.stringify({ skipped: true, reason: "not in ai mode" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Find active AI agent — with fallback if assigned agent is inactive
    let agent: Record<string, any> | null = null;
    if (contact.agent_id) {
      const { data: assignedAgents } = await adminClient
        .from("client_ai_agents")
        .select("*")
        .eq("id", contact.agent_id)
        .eq("organization_id", organization_id)
        .eq("status", "active")
        .eq("channel", "whatsapp")
        .limit(1);
      agent = assignedAgents?.[0] || null;
    }

    // Fallback: if assigned agent not found/inactive, pick any active agent
    if (!agent) {
      const { data: fallbackAgents } = await adminClient
        .from("client_ai_agents")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("status", "active")
        .eq("channel", "whatsapp")
        .limit(1);
      agent = fallbackAgents?.[0] || null;
      if (agent && contact.agent_id) {
        console.warn(`Agent fallback: assigned agent ${contact.agent_id} inactive, using ${agent.id} (${agent.name})`);
        await adminClient.from("whatsapp_contacts").update({ agent_id: agent.id }).eq("id", contact_id);
      }
    }

    if (!agent) {
      // No active agent — auto-unlock contact to human mode
      if (contact.attending_mode !== "human") {
        await adminClient
          .from("whatsapp_contacts")
          .update({ attending_mode: "human" })
          .eq("id", contact_id);

        // Notify org members
        const { data: members } = await adminClient
          .from("organization_memberships")
          .select("user_id")
          .eq("organization_id", organization_id);

        if (members && members.length > 0) {
          const notifications = members.map((m: { user_id: string }) => ({
            user_id: m.user_id,
            organization_id,
            title: "Atendimento transferido para humano",
            message: `Nenhum agente IA ativo. Contato ${contact.phone || contact_id} aguardando resposta humana.`,
            type: "Chat",
            action_url: "/cliente/chat",
          }));
          await adminClient.from("client_notifications").insert(notifications);
        }
      }
      return new Response(JSON.stringify({ skipped: true, reason: "no active agent, contact moved to human" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check whatsapp_instance_ids restriction
    const instanceIds: any[] = agent.whatsapp_instance_ids || [];
    if ((instanceIds as any[]).length > 0) {
      const { data: instance } = await adminClient
        .from("whatsapp_instances")
        .select("id")
        .eq("organization_id", organization_id)
        .single();
      if (instance && !(instanceIds as any[]).includes(instance.id)) {
        return new Response(JSON.stringify({ skipped: true, reason: "agent not assigned to this instance" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // Assign agent if not set
    if (!contact.agent_id) {
      await adminClient.from("whatsapp_contacts").update({ agent_id: agent.id }).eq("id", contact_id);
    }

    const promptConfig: Record<string, any> = agent.prompt_config || {};
    const engagementRules: Record<string, any> = promptConfig.engagement_rules || {};

    // ─── CHECK 2: Working hours ───
    if (!isWithinWorkingHours(engagementRules.working_hours)) {
      return new Response(JSON.stringify({ skipped: true, reason: "outside_working_hours" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── CHECK 3: Message count limit ───
    const maxMessages = engagementRules.max_messages ?? 10;
    const { count: msgCount } = await adminClient
      .from("whatsapp_messages")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id);

    if ((msgCount ?? 0) >= maxMessages) {
      const limitAction = engagementRules.limit_action || "handoff";
      if (limitAction === "handoff") {
        await executeHandoff(adminClient, organization_id, contact_id, agent.name, `Limite de ${maxMessages} mensagens atingido`);
      }
      return new Response(JSON.stringify({ skipped: true, reason: "message_limit_reached", action: limitAction }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── CHECK 4: Inactivity timeout ───
    const timeoutHours = engagementRules.inactivity_timeout_hours ?? 48;
    const { data: lastContactMsg } = await adminClient
      .from("whatsapp_messages")
      .select("created_at")
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(2);

    // If there's a previous inbound message and the gap is > timeout
    if (lastContactMsg && lastContactMsg.length >= 2) {
      const previousMsgTime = lastContactMsg[1].created_at;
      if (hoursSince(previousMsgTime) > timeoutHours) {
        const timeoutAction = engagementRules.timeout_action || "handoff";
        if (timeoutAction === "handoff") {
          await executeHandoff(adminClient, organization_id, contact_id, agent.name, `Contato retornou após ${timeoutHours}h de inatividade`);
          return new Response(JSON.stringify({ skipped: true, reason: "inactivity_timeout", action: "handoff" }), {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        if (timeoutAction === "ignore") {
          return new Response(JSON.stringify({ skipped: true, reason: "inactivity_timeout", action: "ignore" }), {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        // "restart" — continue normally (reset context effectively by limiting history)
      }
    }

    // ─── All checks passed — process message ───

    // Handle audio transcription if message_type is audio
    let processedMessage = message_text || "";
    const audioUrl = media_url || message_text;
    if (message_type === "audio" && audioUrl && audioUrl.startsWith("http")) {
      try {
        console.log("Downloading audio from:", audioUrl);
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
          console.error("Failed to download audio:", audioResponse.status);
        } else {
          const audioBuffer = await audioResponse.arrayBuffer();
          const audioBytes = new Uint8Array(audioBuffer);
          console.log("Audio downloaded, size:", audioBytes.length, "bytes");

          // Convert to base64
          let binary = "";
          for (let i = 0; i < audioBytes.length; i++) {
            binary += String.fromCharCode(audioBytes[i]);
          }
          const audioBase64 = btoa(binary);
          const contentType = audioResponse.headers.get("content-type") || "audio/ogg";
          console.log("Audio content-type:", contentType);

          // Send as multimodal content using data URI (Gemini supports audio via image_url)
          const transcribeRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "Transcreva o áudio a seguir. Retorne apenas o texto transcrito, sem formatação adicional." },
                { role: "user", content: [
                  { type: "image_url", image_url: { url: `data:${contentType};base64,${audioBase64}` } }
                ]},
              ],
            }),
          });

          if (transcribeRes.ok) {
            const transcribeData = await transcribeRes.json();
            const transcribed = transcribeData.choices?.[0]?.message?.content;
            console.log("Transcription result:", transcribed?.substring(0, 100));
            if (transcribed) processedMessage = transcribed;
          } else {
            console.error("Transcription API error:", transcribeRes.status, await transcribeRes.text());
          }
        }
      } catch (e) {
        console.error("Audio transcription failed:", e);
      }
    }

    // Fetch CRM lead context
    let leadContext = "";
    let leadData: Record<string, any> | null = null;
    let funnelStages: { key: string; label?: string }[] = [];
    const crmActions: Record<string, any> = agent.crm_actions || {};
    const role = (agent.role as string) || "sdr";

    if (contact.crm_lead_id) {
      const { data: lead } = await adminClient
        .from("crm_leads")
        .select("id, name, stage, value, tags, funnel_id")
        .eq("id", contact.crm_lead_id)
        .single();

      if (lead) {
        leadData = lead;
        if (lead.funnel_id) {
          const { data: funnel } = await adminClient.from("crm_funnels").select("stages").eq("id", lead.funnel_id).single();
          if (funnel?.stages && Array.isArray(funnel.stages)) funnelStages = funnel.stages;
        }

        const stageNames = funnelStages.map((s: { key: string; label?: string }) => s.label || s.key).join(", ");
        leadContext = `\n\nInformações do lead vinculado:
- Nome: ${lead.name}
- Etapa atual: ${lead.stage}
- Valor potencial: R$ ${lead.value || 0}
- Tags: ${(lead.tags || []).join(", ") || "nenhuma"}
${stageNames ? `- Etapas disponíveis: ${stageNames}` : ""}

Ações automáticas disponíveis (inclua no FINAL da resposta, o usuário NÃO verá):`;

        if (crmActions.can_move_stage) leadContext += "\n- [AI_ACTION:MOVE_STAGE:nome_da_etapa]";
        if (crmActions.can_handoff) leadContext += "\n- [AI_ACTION:HANDOFF:motivo]";
        if (crmActions.can_update_value) leadContext += "\n- [AI_ACTION:UPDATE_LEAD:value=10000]";
        if (crmActions.can_add_tags) leadContext += "\n- [AI_ACTION:UPDATE_LEAD:tags_add=nome_da_tag]";
        if (role === "closer") leadContext += "\n- [AI_ACTION:SEND_PRODUCT_LINK:url_do_produto] — enviar link de produto/serviço";
        if (role === "pos_venda") leadContext += "\n- [AI_ACTION:REGISTER_NPS:nota|comentário] — registrar nota NPS (1-10)";
      }
    }

    // Fetch message history — if "restart" after timeout, limit to recent only
    const timeoutAction = engagementRules.timeout_action || "handoff";
    const historyLimit = (timeoutAction === "restart" && lastContactMsg && lastContactMsg.length >= 2 && hoursSince(lastContactMsg[1].created_at) > timeoutHours) ? 2 : 20;

    const { data: history } = await adminClient
      .from("whatsapp_messages")
      .select("direction, content, created_at")
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(historyLimit, 15));

    const chatHistory = (history || []).reverse().map((m: { direction: string; content: string }) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content || "",
    }));

    // Build system prompt with role-specific instructions
    const persona: Record<string, any> = agent.persona || {};
    const knowledgeBase: any[] = agent.knowledge_base || [];
    const objectives: any[] = agent.objectives || [];

    let systemPrompt = promptConfig.system_prompt || `Você é ${agent.name}, um assistente virtual.`;

    if (rolePrompts[role]) systemPrompt += `\n\n${rolePrompts[role]}`;

    if (persona.generated_description) {
      systemPrompt += `\n\nPersona: ${persona.generated_description}`;
    } else {
      if (persona.formality) systemPrompt += `\nFormalidade: ${persona.formality}`;
      if (persona.emojis) systemPrompt += `\nEmojis: ${persona.emojis}`;
      if (persona.message_length) systemPrompt += `\nMensagens: ${persona.message_length}`;
      if (persona.traits?.length) systemPrompt += `\nTraços: ${persona.traits.join(", ")}`;
    }

    if (persona.restrictions) systemPrompt += `\n\nRestrições: ${persona.restrictions}`;
    if (agent.gender) systemPrompt += `\nGênero da persona: ${agent.gender}`;
    if (agent.description) systemPrompt += `\nDescrição: ${agent.description}`;

    if (objectives.length > 0) {
      systemPrompt += `\n\nSeus objetivos nesta conversa: ${objectives.join(", ")}`;
    }

    // Add objections from prompt_config
    const objections: any[] = promptConfig.objections || [];
    if (objections.length > 0) {
      systemPrompt += `\n\nObjeções comuns e como responder:\n${objections.map((o: { objection: string; response: string }) => `- Objeção: "${o.objection}" → Resposta sugerida: "${o.response}"`).join("\n")}`;
    }

    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      let kbText = knowledgeBase
        .map((item: unknown) => typeof item === "string" ? item : (item as Record<string, string>).content || JSON.stringify(item))
        .join("\n---\n");
      // Truncate knowledge base to avoid exceeding context window
      if (kbText.length > 4000) kbText = kbText.slice(0, 4000) + "\n[...base de conhecimento truncada]";
      systemPrompt += `\n\nBase de conhecimento:\n${kbText}`;
    }

    systemPrompt += leadContext;

    // ─── Team & Calendar context for scheduling awareness ───
    let teamContext = "";
    try {
      const { data: teamMembers } = await adminClient
        .from("organization_memberships")
        .select("user_id, profiles(full_name)")
        .eq("organization_id", organization_id);

      const memberNames = (teamMembers || []).map((m: any) => {
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return p?.full_name || "Sem nome";
      }).filter(Boolean);

      let assignedName = "Nenhum atribuído";
      if (leadData?.assigned_to) {
        const assigned = (teamMembers || []).find((m: any) => m.user_id === leadData.assigned_to);
        if (assigned) {
          const p = Array.isArray(assigned.profiles) ? assigned.profiles[0] : assigned.profiles;
          assignedName = p?.full_name || "Sem nome";
        }
      }

      teamContext += `\n\nInformações da equipe:`;
      teamContext += `\n- Responsável pelo lead: ${assignedName}`;
      teamContext += `\n- Membros da equipe: ${memberNames.join(", ") || "nenhum"}`;

      // Fetch calendar events for next 48h
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data: upcomingEvents } = await adminClient
        .from("calendar_events")
        .select("title, start_at, end_at, created_by")
        .eq("organization_id", organization_id)
        .gte("start_at", now.toISOString())
        .lte("start_at", in48h.toISOString())
        .order("start_at", { ascending: true })
        .limit(20);

      if (upcomingEvents && upcomingEvents.length > 0) {
        teamContext += `\n\nAgenda das próximas 48h (horários já ocupados):`;
        for (const ev of upcomingEvents) {
          const start = new Date(ev.start_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
          const end = new Date(ev.end_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
          const owner = (teamMembers || []).find((m: any) => m.user_id === ev.created_by);
          const ownerP = owner ? (Array.isArray(owner.profiles) ? owner.profiles[0] : owner.profiles) : null;
          const ownerName = ownerP?.full_name || "—";
          teamContext += `\n- ${start} a ${end} — ${ev.title} (responsável: ${ownerName})`;
        }
      } else {
        teamContext += `\n\nAgenda das próximas 48h: Nenhum compromisso agendado.`;
      }

      teamContext += `\n\nREGRAS PARA AGENDAMENTO:
1. Nunca marque reunião em horário que já esteja ocupado na agenda acima
2. Sugira horários livres dentro do horário comercial (seg-sex, 9h-18h)
3. Sempre confirme o horário com o lead antes de agendar
4. Direcione a reunião para o responsável do lead. Se não houver, sugira um membro da equipe
5. Ao confirmar uma reunião, use a ação [AI_ACTION:SCHEDULE_MEETING:titulo|data_hora_inicio_ISO|data_hora_fim_ISO|responsavel_nome]`;
    } catch (e) {
      console.error("Failed to fetch team/calendar context:", e);
    }

    systemPrompt += teamContext;
    systemPrompt += `\n\nVocê tem no máximo ${maxMessages} mensagens nesta conversa para cumprir seu objetivo. Seja direto, eficiente e conduza a conversa de forma objetiva. Se não conseguir cumprir o objetivo dentro desse limite, use [AI_ACTION:HANDOFF:Limite de mensagens atingido sem conclusão do objetivo].`;
    systemPrompt += "\n\nResponda de forma concisa e natural, como em uma conversa de WhatsApp. Use parágrafos curtos.";

    const model = promptConfig.model || "google/gemini-3-flash-preview";

    // Call AI (with 1 retry on 429)
    const aiRequestBody = JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: processedMessage },
      ],
    });
    const aiHeaders = { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" };

    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", headers: aiHeaders, body: aiRequestBody,
    });

    // Retry once on 429 with 3s backoff
    if (!aiResponse.ok && aiResponse.status === 429) {
      console.log("Rate limited (429), retrying in 3s...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", headers: aiHeaders, body: aiRequestBody,
      });
    }

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      await adminClient.from("ai_conversation_logs").insert({
        organization_id, contact_id, agent_id: agent.id,
        input_message: processedMessage, output_message: `[ERROR ${status}] ${errText}`, tokens_used: 0, model,
      });
      return new Response(JSON.stringify({ error: "AI gateway error", status }), {
        status: status === 402 ? status : 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || "";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    if (!replyText) {
      return new Response(JSON.stringify({ skipped: true, reason: "empty ai response" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Parse and execute AI actions
    const actionRegex = /\[AI_ACTION:([A-Z_]+):([^\]]+)\]/g;
    const actions: { type: string; value: string }[] = [];
    let match;
    while ((match = actionRegex.exec(replyText)) !== null) {
      actions.push({ type: match[1], value: match[2] });
    }
    const cleanReply = replyText.replace(/\[AI_ACTION:[^\]]+\]/g, "").trim();

    // Execute actions
    for (const action of actions) {
      try {
        if (action.type === "MOVE_STAGE" && leadData && crmActions.can_move_stage) {
          const targetStage = funnelStages.find(
            (s: { key: string; label?: string }) => (s.label || "").toLowerCase() === action.value.toLowerCase() || (s.key || "") === action.value
          );
          const stageKey = targetStage?.key || action.value;
          await adminClient.from("crm_leads").update({ stage: stageKey }).eq("id", leadData.id);
          await adminClient.from("crm_activities").insert({
            organization_id, lead_id: leadData.id, type: "note",
            title: `IA moveu lead para etapa "${targetStage?.label || stageKey}"`,
            description: `Ação automática da IA (${agent.name} — ${(agent.role || "sdr").toUpperCase()})`,
          });
        }

        if (action.type === "HANDOFF" && crmActions.can_handoff) {
          await executeHandoff(adminClient, organization_id, contact_id, agent.name, action.value);
        }

        if (action.type === "UPDATE_LEAD" && leadData) {
          const [field, val] = action.value.split("=");
          if (field === "value" && crmActions.can_update_value) {
            await adminClient.from("crm_leads").update({ value: parseFloat(val) }).eq("id", leadData.id);
          } else if (field === "tags_add" && crmActions.can_add_tags) {
            const currentTags = leadData.tags || [];
            if (!currentTags.includes(val)) {
              await adminClient.from("crm_leads").update({ tags: [...currentTags, val] }).eq("id", leadData.id);
            }
          }
        }

        if (action.type === "SCHEDULE_MEETING") {
          const parts = action.value.split("|");
          const meetingTitle = parts[0] || "Reunião com lead";
          const startAt = parts[1];
          const endAt = parts[2] || (startAt ? new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString() : undefined);
          const assigneeName = parts[3] || "";
          if (startAt) {
            // Check for overlap before inserting
            const { data: conflicts } = await adminClient
              .from("calendar_events")
              .select("id, title")
              .eq("organization_id", organization_id)
              .lt("start_at", endAt || startAt)
              .gt("end_at", startAt)
              .limit(1);

            if (conflicts && conflicts.length > 0) {
              console.warn(`SCHEDULE_MEETING blocked: overlap with "${conflicts[0].title}" (${conflicts[0].id})`);
            } else {
              await adminClient.from("calendar_events").insert({
                organization_id,
                title: meetingTitle,
                start_at: startAt,
                end_at: endAt || startAt,
                description: `Reunião agendada pela IA (${agent.name}) com ${contact.name || contact.phone}${assigneeName ? ` — Responsável: ${assigneeName}` : ""}`,
                visibility: "private",
              });
              await adminClient.from("crm_activities").insert({
                organization_id,
                lead_id: leadData?.id || contact.crm_lead_id,
                type: "note",
                title: `IA agendou reunião: ${meetingTitle}`,
                description: `${startAt} — ${assigneeName || "sem responsável definido"}. Agente: ${agent.name}`,
              });
            }
          }
        }

        // ─── SEND_PRODUCT_LINK: Closer sends product URLs ───
        if (action.type === "SEND_PRODUCT_LINK") {
          // The link is embedded in the reply text already by the AI; 
          // we log it as an activity
          if (leadData) {
            await adminClient.from("crm_activities").insert({
              organization_id, lead_id: leadData.id, type: "note",
              title: `IA enviou link de produto: ${action.value}`,
              description: `Ação automática do Closer (${agent.name})`,
            });
          }
        }

        // ─── REGISTER_NPS: Pós-venda registers NPS score ───
        if (action.type === "REGISTER_NPS") {
          const [scoreStr, ...commentParts] = action.value.split("|");
          const score = parseInt(scoreStr);
          const comment = commentParts.join("|") || "";
          if (score >= 1 && score <= 10) {
            await adminClient.from("client_nps_responses").insert({
              organization_id,
              contact_id: contact_id,
              agent_id: agent.id,
              score,
              comment,
            });
            if (leadData) {
              await adminClient.from("crm_activities").insert({
                organization_id, lead_id: leadData.id, type: "note",
                title: `NPS registrado: ${score}/10`,
                description: `Feedback: "${comment}" — Agente: ${agent.name}`,
              });
            }
          }
        }
      } catch (actionErr) {
        console.error(`Error executing AI action ${action.type}:`, actionErr);
      }
    }

    // Send via Z-API — prefer the contact's instance, fallback to any connected instance
    let instance: Record<string, any> | null = null;
    if (contact.instance_id) {
      const { data: contactInstance } = await adminClient.from("whatsapp_instances").select("*").eq("id", contact.instance_id).eq("status", "connected").maybeSingle();
      if (contactInstance) instance = contactInstance;
    }
    if (!instance) {
      const { data: fallbackInstance } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", organization_id).eq("status", "connected").limit(1).maybeSingle();
      instance = fallbackInstance;
    }
    if (!instance) {
      return new Response(JSON.stringify({ error: "WhatsApp not connected" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const isGroup = contact.phone.endsWith("-group");
    const cleanPhone = isGroup
      ? contact.phone.replace(/-group$/, "")
      : contact.phone.replace(/[\s+()-]/g, "");

    // ─── Simulate human typing delay ───
    const delayMs = Math.min(Math.max(Math.round((cleanReply.length / 40) * 1000 + 1500), 2000), 12000);
    try {
      if (instance.provider === "evolution") {
        // Evolution API doesn't have a native typing endpoint — skip silently
        console.log("Typing indicator skipped for Evolution API");
      } else {
        const typingUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-typing`;
        await fetch(typingUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Client-Token": instance.client_token },
          body: JSON.stringify({ phone: cleanPhone }),
        });
      }
    } catch (e) {
      console.error("Failed to send typing indicator:", e);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));

    let sendRes: Response;
    let sendData: Record<string, unknown>;

    if (instance.provider === "evolution") {
      const baseUrl = (instance.base_url || "").replace(/\/+$/, "");
      const evNumber = isGroup ? cleanPhone + "@g.us" : cleanPhone;
      sendRes = await fetch(`${baseUrl}/message/sendText/${instance.instance_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: instance.client_token },
        body: JSON.stringify({ number: evNumber, text: cleanReply }),
      });
      sendData = await sendRes.json();
    } else {
      const zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
      sendRes = await fetch(zapiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Client-Token": instance.client_token },
        body: JSON.stringify({ phone: cleanPhone, message: cleanReply }),
      });
      sendData = await sendRes.json();
    }

    const messageStatus = sendRes.ok ? "sent" : "failed";

    await adminClient.from("whatsapp_messages").insert({
      organization_id, contact_id,
      message_id_zapi: (sendData as any)?.messageId || (sendData as any)?.key?.id || null,
      direction: "outbound", type: "text", content: cleanReply, status: messageStatus,
      metadata: { ...sendData, ai_generated: true, agent_id: agent.id, agent_role: agent.role, ai_actions: actions.length > 0 ? actions : undefined },
    });

    await adminClient.from("whatsapp_contacts").update({ last_message_at: new Date().toISOString() }).eq("id", contact_id);

    await adminClient.from("ai_conversation_logs").insert({
      organization_id, contact_id, agent_id: agent.id,
      input_message: processedMessage, output_message: cleanReply, tokens_used: tokensUsed, model,
    });

    // ─── Debit credits after successful response ───
    await debitCredits(adminClient, organization_id, tokensUsed, agent.name, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ success: true, reply: cleanReply, actions }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("ai-agent-reply error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
