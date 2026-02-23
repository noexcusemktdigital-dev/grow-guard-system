import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefing, quantidade, estilo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um diretor criativo de agência de marketing digital especializada em redes sociais.
Gere exatamente ${quantidade} conceitos de posts para redes sociais.

Cada conceito deve ter:
- titulo: título curto e chamativo do post (máx 60 caracteres)
- legenda: legenda completa para Instagram (150-300 palavras), com emojis, parágrafos e CTA
- cta: call-to-action curto (ex: "Agende sua demo", "Link na bio")
- hashtags: array de 5-8 hashtags relevantes sem #
- visual_prompt_feed: prompt detalhado em inglês para gerar uma arte de Instagram Feed (1:1 square). Descreva composição, cores, elementos visuais, estilo. NÃO inclua texto na imagem.
- visual_prompt_story: prompt detalhado em inglês para gerar uma arte de Instagram Story (9:16 vertical). Descreva composição, cores, elementos visuais, estilo. NÃO inclua texto na imagem.

IMPORTANTE para os prompts visuais:
- Sempre inclua "Do NOT include any text, letters, numbers or words in the image"
- Descreva o estilo visual: ${estilo}
- Cores: ${briefing.cores || "cores vibrantes e profissionais"}
- Os prompts devem criar artes profissionais de social media, não fotos genéricas
- Feed é quadrado (1:1), Story é vertical (9:16)`;

    const userPrompt = `Briefing do cliente:
- Mês: ${briefing.mes}
- Objetivo: ${briefing.objetivo}
- Estilo Visual: ${estilo}
- Cores: ${briefing.cores || "A critério criativo"}
- Temas: ${briefing.temas || "Variados"}
- Promoções: ${briefing.promocoes || "Nenhuma"}
- Observações: ${briefing.observacoes || "Nenhuma"}

Gere ${quantidade} conceitos de posts.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_concepts",
              description: "Return the generated social media post concepts",
              parameters: {
                type: "object",
                properties: {
                  concepts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        legenda: { type: "string" },
                        cta: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                        visual_prompt_feed: { type: "string" },
                        visual_prompt_story: { type: "string" },
                      },
                      required: ["titulo", "legenda", "cta", "hashtags", "visual_prompt_feed", "visual_prompt_story"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["concepts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_concepts" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar conteúdo." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response");

    const concepts = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(concepts), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-social-concepts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
