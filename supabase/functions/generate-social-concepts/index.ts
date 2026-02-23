import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getVisualGuideByType(tipo: string): string {
  const guides: Record<string, string> = {
    produto: `For PRODUCT posts:
- Professional studio photography style with controlled lighting
- Product centered on an elegant surface (marble, wood, fabric)
- Soft gradient or bokeh background
- Studio lighting: key light + fill light + rim light
- Show texture, details, packaging
- Premium product photography, commercial quality`,
    servico: `For SERVICE posts:
- Show the service being delivered or its results
- Professional environment, clean workspace
- People interacting naturally (if applicable)
- Before/after visual metaphors
- Clean, trust-inspiring composition`,
    promocao: `For PROMOTIONAL posts:
- Bold graphic design with geometric shapes
- Dynamic composition suggesting urgency and excitement
- Gradients, abstract shapes, energy-filled layout
- Visual elements that suggest deals/savings (without text)
- Eye-catching, vibrant, action-oriented design`,
    institucional: `For INSTITUTIONAL posts:
- Corporate brand imagery, sophisticated composition
- Clean, minimalist layout with breathing room
- Professional environment or abstract brand elements
- Convey trust, authority, and professionalism
- Subtle gradients, refined color palette`,
    educativo: `For EDUCATIONAL posts:
- Clear, didactic visual elements
- Infographic-style composition with visual hierarchy
- Icons, diagrams, or step-by-step visual flow
- Clean layout that organizes information visually
- Professional but approachable aesthetic`,
    depoimento: `For TESTIMONIAL posts:
- Authentic, real-people photography style
- Warm lighting, natural environment
- Emotional connection, genuine expressions
- Soft focus backgrounds, intimate framing
- Trust and authenticity above all`,
  };
  return guides[tipo] || guides["institucional"];
}

function getNivelInstructions(nivel: string): string {
  switch (nivel) {
    case "alto_padrao":
      return `QUALITY LEVEL: ULTRA-PREMIUM
- Luxury brand aesthetic, magazine-quality
- Rich textures, dramatic lighting with deep shadows and highlights
- Sophisticated color grading, cinematic feel
- Every detail must be polished to perfection
- Think Vogue, Apple, luxury fashion campaigns`;
    case "elaborado":
      return `QUALITY LEVEL: ELABORATE
- Strong composition with careful attention to balance
- Vibrant but harmonious colors, polished finish
- Professional-grade lighting and depth of field
- Layered visual interest, thoughtful details
- Agency-quality creative work`;
    default:
      return `QUALITY LEVEL: CLEAN & PROFESSIONAL
- Simple, effective composition
- Clean lines, clear focal point
- Professional but not over-designed
- Practical, ready-to-use social media content`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefing, quantidade, estilo, tipo_post, nivel, descricao_produto, roteiros_importados, persona, identidade_visual, referencias_tipo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tipoGuide = getVisualGuideByType(tipo_post || "institucional");
    const nivelGuide = getNivelInstructions(nivel || "simples");

    let importedContext = "";
    if (roteiros_importados && roteiros_importados.length > 0) {
      importedContext = `\n\nIMPORTED CONTENT SCRIPTS (use these as creative base for captions and visual context):
${roteiros_importados.map((r: any, i: number) => `
Script ${i + 1}:
- Title: ${r.titulo || "N/A"}
- Caption/Body: ${r.legenda || r.roteiro || "N/A"}
- Funnel Stage: ${r.etapa || r.funil || "N/A"}
- Format: ${r.formato || "N/A"}
`).join("")}
Use these scripts to create more contextually relevant visual prompts and pre-fill captions.`;
    }

    let personaContext = "";
    if (persona?.nome || persona?.descricao) {
      personaContext = `\n\nTARGET AUDIENCE (PERSONA):
${persona.nome ? `Name: ${persona.nome}` : ""}
${persona.descricao ? `Description: ${persona.descricao}` : ""}

Adapt ALL content (captions, CTAs, visual prompts) to resonate with this specific persona.
Visual prompts must reflect the aesthetic preferences and world of this persona.
Use language, tone, and references that connect with this audience.`;
    }

    let identityContext = "";
    if (identidade_visual) {
      const iv = identidade_visual;
      identityContext = `\n\nBRAND IDENTITY:
${iv.paleta ? `- Colors: ${iv.paleta}` : ""}
${iv.fontes ? `- Fonts: ${iv.fontes}` : ""}
${iv.estilo ? `- Style: ${iv.estilo}` : ""}
${iv.referencias ? `- Visual References: ${iv.referencias}` : ""}
${iv.concorrencia ? `- Competitors Visual Style: ${iv.concorrencia}` : ""}
${iv.tom_visual ? `- Visual Tone: ${iv.tom_visual}` : ""}

Use these brand guidelines to ensure visual consistency across all generated prompts.
The visual prompts MUST reflect this brand identity.`;
    }

    let referenciasTipoContext = "";
    if (referencias_tipo) {
      referenciasTipoContext = `\n\nTYPE-SPECIFIC REFERENCES (${tipo_post || "general"}):
${referencias_tipo}

Use these references as inspiration for the visual style, composition, and aesthetic of the generated prompts.
Match the quality level and visual approach shown in these references.`;
    }

    const systemPrompt = `Você é um diretor criativo SÊNIOR de uma agência de marketing digital premiada, especializado em artes para redes sociais de altíssima qualidade.

Gere exatamente ${quantidade} conceitos de posts para redes sociais.

TIPO DE POST: ${tipo_post || "institucional"}
${tipoGuide}

${nivelGuide}

${descricao_produto ? `PRODUTO/SERVIÇO: ${descricao_produto}` : ""}
${importedContext}
${personaContext}
${identityContext}
${referenciasTipoContext}

Cada conceito DEVE ter:
- titulo: título curto e chamativo do post (máx 60 caracteres)
- legenda: legenda completa para Instagram (150-300 palavras), com emojis, parágrafos e CTA
- cta: call-to-action curto (ex: "Agende sua demo", "Link na bio")
- hashtags: array de 5-8 hashtags relevantes sem #
- visual_prompt_feed: prompt ULTRA DETALHADO em inglês para gerar uma arte de Instagram Feed (1:1 square, 1080x1080). 
- visual_prompt_story: prompt ULTRA DETALHADO em inglês para gerar uma arte de Instagram Story (9:16 vertical, 1080x1920).

REGRAS CRÍTICAS para os prompts visuais:
1. SEMPRE inclua "Do NOT include any text, letters, numbers or words in the image"
2. SEMPRE inclua "Leave compositional space for text overlay" 
3. Descreva EXATAMENTE: composição, iluminação, ângulo de câmera, texturas, materiais, profundidade de campo
4. Especifique o estilo: ${estilo}
5. Cores: ${briefing.cores || identidade_visual?.paleta || "cores vibrantes e profissionais"}
6. Cada prompt deve ter pelo menos 80 palavras de descrição visual detalhada
7. Feed é quadrado (1:1), Story é vertical (9:16) - adapte a composição para cada formato
8. Para Story, use composição vertical com elementos empilhados
9. Para Feed, use composição centrada e equilibrada
10. NUNCA gere prompts genéricos como "professional social media post" - seja ESPECÍFICO sobre cada elemento visual`;

    const userPrompt = `Briefing do cliente:
- Mês: ${briefing.mes}
- Objetivo: ${briefing.objetivo}
- Tipo de Post: ${tipo_post || "Institucional"}
- Nível de Qualidade: ${nivel || "simples"}
- Estilo Visual: ${estilo}
- Cores: ${briefing.cores || identidade_visual?.paleta || "A critério criativo"}
- Temas: ${briefing.temas || "Variados"}
- Promoções: ${briefing.promocoes || "Nenhuma"}
- Observações: ${briefing.observacoes || "Nenhuma"}
${descricao_produto ? `- Descrição do Produto/Serviço: ${descricao_produto}` : ""}

Gere ${quantidade} conceitos de posts com prompts visuais EXTREMAMENTE detalhados.`;

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
