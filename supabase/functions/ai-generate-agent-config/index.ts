// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const CREDIT_COST = 100;

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'ai-generate-agent-config');
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

    const { type, role, persona, knowledge_base, objectives, name, organization_id } = await req.json();

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

    const roleDescriptions: Record<string, string> = {
      sdr: "SDR (Sales Development Representative) — foco em prospecção, qualificação de leads, perguntas abertas para identificar necessidades e agendar reuniões",
      closer: "Closer — foco em fechamento de vendas, apresentação de propostas, negociação, superação de objeções e senso de urgência",
      pos_venda: "Pós-venda — foco em acompanhamento, satisfação do cliente, coleta de feedback, oportunidades de upsell e fidelização",
      suporte: "Suporte/Atendimento — foco em resolução de problemas, empatia, coleta de informações do erro, escalação quando necessário",
    };

    let prompt = "";

    if (type === "greeting") {
      prompt = `Gere uma saudação personalizada para um agente de IA WhatsApp com estas características:
- Nome: ${name || "Agente"}
- Função: ${roleDescriptions[role] || role}
- Formalidade: ${persona?.formality || "profissional"}
- Uso de emojis: ${persona?.emojis || "pouco"}
- Traços: ${(persona?.traits || []).join(", ") || "não definidos"}

Escreva APENAS a saudação (1-3 frases curtas), sem explicações.`;
    } else if (type === "persona") {
      prompt = `Gere uma descrição completa de persona para um agente de IA com as seguintes características:
- Nome: ${name || "Agente"}
- Função: ${roleDescriptions[role] || role}
- Saudação: ${persona?.greeting || "informal"}
- Formalidade: ${persona?.formality || "profissional"}
- Uso de emojis: ${persona?.emojis || "pouco"}
- Comprimento de mensagens: ${persona?.message_length || "medias"}
- Traços de personalidade: ${(persona?.traits || []).join(", ") || "não definidos"}
- Restrições: ${persona?.restrictions || "nenhuma especificada"}

Escreva em português brasileiro, com 3-4 parágrafos descrevendo como esse agente deve se comportar.`;
    } else if (type === "prompt") {
      const kbSummary = (knowledge_base || [])
        .slice(0, 5)
        .map((item: unknown) => typeof item === "string" ? item : (item as Record<string, string>).content || (item as Record<string, string>).name)
        .filter(Boolean)
        .join("; ");

      prompt = `Gere um system prompt completo para um agente de IA WhatsApp com as seguintes configurações:
- Nome: ${name || "Agente"}
- Função: ${roleDescriptions[role] || role}
- Saudação: ${persona?.greeting || "informal"}
- Formalidade: ${persona?.formality || "profissional"}
- Emojis: ${persona?.emojis || "pouco"}
- Mensagens: ${persona?.message_length || "medias"}
- Personalidade: ${(persona?.traits || []).join(", ") || "não definidos"}
- Restrições: ${persona?.restrictions || "nenhuma"}
- Objetivos: ${(objectives || []).join(", ") || "não definidos"}
${kbSummary ? `- Base de conhecimento inclui: ${kbSummary}` : ""}

Gere um system prompt detalhado e prático em português brasileiro.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em configuração de agentes de IA para WhatsApp comercial. Responda diretamente com o conteúdo solicitado, sem formatação markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const result = data.choices?.[0]?.message?.content || "";

    // Debit credits after successful generation — only after first GPS is approved
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
            _description: `Config. automática agente (${type})`,
            _source: "ai-generate-agent-config",
          });
        }
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("ai-generate-agent-config error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
