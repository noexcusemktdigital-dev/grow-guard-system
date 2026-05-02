// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const CREDIT_COST = 10;

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'ai-agent-simulate');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { agent_config, message, history, organization_id } = await req.json();

    if (!agent_config || !message) {
      return new Response(JSON.stringify({ error: "Missing agent_config or message" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pre-check credits
    if (organization_id) {
      const { data: wallet } = await supabaseAdmin
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos." }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    const persona = agent_config.persona || {};
    const promptConfig = agent_config.prompt_config || {};
    const knowledgeBase = agent_config.knowledge_base || [];
    const role = agent_config.role || "sdr";

    const rolePrompts: Record<string, string> = {
      sdr: "Você atua como SDR. Seu foco é qualificar leads, fazer perguntas abertas para entender necessidades e agendar reuniões com closers.",
      closer: "Você atua como Closer. Seu foco é apresentar propostas de valor, negociar, superar objeções e fechar vendas.",
      pos_venda: "Você atua como Pós-venda. Seu foco é garantir satisfação, coletar feedback, identificar oportunidades de upsell e fidelizar.",
      suporte: "Você atua como Suporte. Seu foco é resolver problemas com empatia, coletar informações relevantes e escalar quando necessário.",
    };

    let systemPrompt = promptConfig.system_prompt || `Você é ${agent_config.name || "um assistente virtual"}.`;
    systemPrompt += `\n\n${rolePrompts[role] || ""}`;

    if (persona.generated_description) {
      systemPrompt += `\n\nPersona: ${persona.generated_description}`;
    } else {
      if (persona.formality) systemPrompt += `\nFormalidade: ${persona.formality}`;
      if (persona.emojis) systemPrompt += `\nEmojis: ${persona.emojis}`;
      if (persona.message_length) systemPrompt += `\nMensagens: ${persona.message_length}`;
      if (persona.traits?.length) systemPrompt += `\nTraços: ${persona.traits.join(", ")}`;
    }

    if (persona.restrictions) systemPrompt += `\n\nRestrições: ${persona.restrictions}`;

    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      const kbText = knowledgeBase
        .slice(0, 10)
        .map((item: unknown) => typeof item === "string" ? item : (item as Record<string, string>).content || (item as Record<string, string>).name || "")
        .filter(Boolean)
        .join("\n---\n");
      if (kbText) systemPrompt += `\n\nBase de conhecimento:\n${kbText}`;
    }

    if (agent_config.objectives?.length) {
      systemPrompt += `\n\nSeus objetivos: ${agent_config.objectives.join(", ")}`;
    }

    systemPrompt += "\n\nEsta é uma SIMULAÇÃO de teste. Responda normalmente como faria em uma conversa real de WhatsApp.";

    const chatHistory = (history || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
    const model = promptConfig.modelo ? `google/${promptConfig.modelo}` : "google/gemini-3-flash-preview";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "Simulation failed" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    let reply = data.choices?.[0]?.message?.content || "";

    const actionRegex = /\[AI_ACTION:([A-Z_]+):([^\]]+)\]/g;
    const actions: { type: string; value: string }[] = [];
    let match;
    while ((match = actionRegex.exec(reply)) !== null) {
      actions.push({ type: match[1], value: match[2] });
    }
    reply = reply.replace(/\[AI_ACTION:[^\]]+\]/g, "").trim();

    // Debit credits after successful simulation — only after first GPS is approved
    if (organization_id) {
      try {
        const { data: gpsApproved } = await supabaseAdmin
          .from("marketing_strategies")
          .select("id")
          .eq("organization_id", organization_id)
          .eq("status", "approved")
          .limit(1)
          .maybeSingle();

        if (!gpsApproved) {
          console.log("GPS not yet approved — skipping credit debit");
        } else {
          await supabaseAdmin.rpc("debit_credits", {
            _org_id: organization_id,
            _amount: CREDIT_COST,
            _description: "Simulação de agente IA",
            _source: "ai-agent-simulate",
          });
        }
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

    return new Response(JSON.stringify({ reply, actions }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("ai-agent-simulate error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
