import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefing_text, content_data, identidade_visual, persona } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!briefing_text && !content_data) {
      return new Response(
        JSON.stringify({ error: "Informe um briefing ou selecione um conteúdo." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for the AI
    let contextBlock = "";

    if (briefing_text) {
      contextBlock += `BRIEFING DO USUÁRIO:\n${briefing_text}\n\n`;
    }

    if (content_data) {
      contextBlock += `CONTEÚDO GERADO ANTERIORMENTE:\n`;
      if (content_data.title) contextBlock += `Título: ${content_data.title}\n`;
      if (content_data.body) contextBlock += `Corpo: ${content_data.body}\n`;
      if (content_data.cta) contextBlock += `CTA: ${content_data.cta}\n`;
      if (content_data.main_message) contextBlock += `Mensagem principal: ${content_data.main_message}\n`;
      if (content_data.objective) contextBlock += `Objetivo: ${content_data.objective}\n`;
      if (content_data.result) {
        const r = content_data.result;
        if (r.titulo) contextBlock += `Título resultado: ${r.titulo}\n`;
        if (r.legenda) contextBlock += `Legenda: ${r.legenda}\n`;
        if (r.conteudo_principal) {
          if (r.conteudo_principal.headline) contextBlock += `Headline: ${r.conteudo_principal.headline}\n`;
          if (r.conteudo_principal.texto) contextBlock += `Texto: ${r.conteudo_principal.texto}\n`;
          if (r.conteudo_principal.cta) contextBlock += `CTA: ${r.conteudo_principal.cta}\n`;
          if (r.conteudo_principal.dica_pratica) contextBlock += `Dica prática: ${r.conteudo_principal.dica_pratica}\n`;
        }
      }
      contextBlock += "\n";
    }

    if (identidade_visual) {
      contextBlock += `IDENTIDADE VISUAL DA MARCA:\n`;
      if (identidade_visual.palette) contextBlock += `Paleta: ${JSON.stringify(identidade_visual.palette)}\n`;
      if (identidade_visual.style) contextBlock += `Estilo: ${identidade_visual.style}\n`;
      if (identidade_visual.tone) contextBlock += `Tom visual: ${identidade_visual.tone}\n`;
      if (identidade_visual.fonts) contextBlock += `Fontes: ${JSON.stringify(identidade_visual.fonts)}\n`;
      contextBlock += "\n";
    }

    if (persona) {
      contextBlock += `PERSONA/PÚBLICO-ALVO:\n`;
      if (typeof persona === "string") contextBlock += persona + "\n";
      else contextBlock += JSON.stringify(persona) + "\n";
      contextBlock += "\n";
    }

    const systemPrompt = `Você é um diretor de arte e estrategista de marketing digital especializado em redes sociais.

Seu trabalho: Analisar o briefing do usuário (que pode ser um texto livre descrevendo a postagem desejada, OU um conteúdo já gerado pela ferramenta de conteúdos) e extrair os campos estruturados necessários para gerar uma arte de alta qualidade para redes sociais.

REGRAS:
1. A headline deve ser CURTA e IMPACTANTE (máx 6 palavras). Frases partidas funcionam bem (ex: "Investir não é sorte" / "É estratégia").
2. A subheadline complementa a headline em 2-4 palavras.
3. O CTA deve ser uma chamada para ação curta e direta.
4. A descrição da cena deve ser VISUAL e ESPECÍFICA — descreva personagens, ambiente, iluminação, ação.
5. Os elementos visuais são objetos concretos que devem aparecer na imagem.
6. O supporting_text é um texto de apoio que contextualiza a mensagem (1-2 frases).
7. Bullet points são 2-4 palavras-chave separadas por vírgula.
8. Sugira o formato mais adequado (square=1:1, portrait=4:5, story=9:16) e o tipo de postagem.

IMPORTANTE: Pense como um designer que vai passar esse briefing para geração de imagem com IA. Cada campo deve contribuir para uma composição visual rica e profissional.`;

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
          { role: "user", content: contextBlock },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_briefing_fields",
              description: "Extract structured fields from the briefing for social media art generation.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Short impactful headline for the art (max 6 words)." },
                  subheadline: { type: "string", description: "Complementary subheadline (2-4 words)." },
                  cta: { type: "string", description: "Call to action text." },
                  cena: { type: "string", description: "Detailed visual scene description (100-200 words)." },
                  elementos_visuais: { type: "string", description: "Comma-separated concrete visual elements to include." },
                  supporting_text: { type: "string", description: "Supporting text that contextualizes the message (1-2 sentences)." },
                  bullet_points: { type: "string", description: "2-4 keywords separated by comma." },
                  suggested_format: { type: "string", enum: ["feed", "portrait", "story"], description: "Best format for this post." },
                  suggested_tipo: { type: "string", enum: ["post_unico", "capa_carrossel", "slide_carrossel", "story"], description: "Best post type." },
                },
                required: ["headline", "subheadline", "cta", "cena", "elementos_visuais", "supporting_text", "bullet_points", "suggested_format", "suggested_tipo"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_briefing_fields" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("Erro ao processar briefing com IA");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("IA não retornou os campos estruturados");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("✅ Briefing structured:", JSON.stringify(result).slice(0, 200));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-social-briefing error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
