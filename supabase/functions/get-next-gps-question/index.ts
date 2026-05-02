// @ts-nocheck
/**
 * get-next-gps-question
 * Returns the next adaptive question for the GPS briefing based on prior answers.
 * Powered by Lovable AI gateway (google/gemini-3-flash-preview).
 *
 * Request:  { answers_so_far: Record<string,unknown>, question_index: number, section: 'marketing'|'comercial' }
 * Response: { question, type, options?, placeholder?, done? }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const MAX_QUESTIONS = 15;
const SYSTEM_PROMPT = `Você é um consultor de marketing estratégico da NOEXCUSE.
Está coletando informações de um empresário para criar uma estratégia de marketing personalizada.

REGRAS RÍGIDAS:
- NUNCA repita perguntas já respondidas
- Se já sabe o ticket médio, não pergunte de novo
- Se o negócio é B2B, aprofunde em ciclo de vendas, decisores e prospecção
- Se é B2C, aprofunde em comportamento do consumidor, jornada e gatilhos de compra
- Se já tem redes sociais informadas, pergunte sobre performance/engajamento atual
- Adapte o vocabulário ao segmento do negócio
- Máximo ${MAX_QUESTIONS} perguntas por seção
- Se as respostas já são suficientes para uma estratégia robusta, retorne done=true
- Pergunta deve ser CURTA, direta e objetiva (máx. 1 frase)
- Para 'select' e 'multiselect', forneça 3-6 opções relevantes`;

function jsonResp(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

const QUESTION_TOOL = {
  type: "function",
  function: {
    name: "next_question",
    description: "Retorna a próxima pergunta adaptativa do briefing, ou done=true se já é suficiente.",
    parameters: {
      type: "object",
      properties: {
        done: { type: "boolean", description: "true se as respostas já são suficientes" },
        question: { type: "string", description: "A pergunta a fazer" },
        type: { type: "string", enum: ["text", "select", "multiselect", "number", "textarea"] },
        options: { type: "array", items: { type: "string" }, description: "Opções (apenas para select/multiselect)" },
        placeholder: { type: "string", description: "Placeholder do campo" },
      },
      required: ["done"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'get-next-gps-question');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp(req, { error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return jsonResp(req, { error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { answers_so_far = {}, question_index = 0, section = "marketing" } = body || {};

    if (typeof question_index !== "number" || question_index < 0) {
      return jsonResp(req, { error: "Invalid question_index" }, 400);
    }
    if (!["marketing", "comercial"].includes(section)) {
      return jsonResp(req, { error: "Invalid section (use 'marketing' or 'comercial')" }, 400);
    }

    // Hard cap — sinaliza done sem chamar IA
    if (question_index >= MAX_QUESTIONS) {
      return jsonResp(req, { done: true, reason: "max_questions_reached" });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResp(req, { error: "AI not configured" }, 500);

    const userPrompt = `RESPOSTAS JÁ COLETADAS:
${JSON.stringify(answers_so_far, null, 2)}

SEÇÃO ATUAL: ${section}
PERGUNTA NÚMERO: ${question_index + 1} de no máximo ${MAX_QUESTIONS}

Gere a próxima pergunta mais relevante. Use a ferramenta next_question para responder.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [QUESTION_TOOL],
        tool_choice: { type: "function", function: { name: "next_question" } },
      }),
    });

    if (aiResp.status === 429) {
      return jsonResp(req, { error: "Limite de requisições excedido. Tente novamente em alguns segundos." }, 429);
    }
    if (aiResp.status === 402) {
      return jsonResp(req, { error: "Créditos insuficientes para gerar a próxima pergunta." }, 402);
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return jsonResp(req, { error: "Falha ao gerar próxima pergunta" }, 502);
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      console.warn("No tool_call returned", JSON.stringify(data).slice(0, 500));
      return jsonResp(req, { done: true, reason: "no_tool_call" });
    }

    let parsed: any;
    try {
      parsed = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
    } catch (e) {
      console.error("Failed to parse tool args:", argsRaw);
      return jsonResp(req, { done: true, reason: "parse_error" });
    }

    if (parsed.done) {
      return jsonResp(req, { done: true });
    }

    if (!parsed.question || !parsed.type) {
      return jsonResp(req, { done: true, reason: "incomplete_question" });
    }

    return jsonResp(req, {
      done: false,
      question: parsed.question,
      type: parsed.type,
      options: parsed.options,
      placeholder: parsed.placeholder,
    });
  } catch (err) {
    console.error("get-next-gps-question error:", err);
    return jsonResp(req, { error: String((err as Error)?.message || err) }, 500);
  }
});
