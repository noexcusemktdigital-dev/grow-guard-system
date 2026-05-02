// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const CREDIT_COST = 25;

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
  const ctx = newRequestContext(req, 'generate-social-concepts');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // SEC-NOE-002: User auth required
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: _authUser }, error: _authErr } = await userClient.auth.getUser();
  if (_authErr || !_authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-social-concepts', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const { briefing, quantidade, estilo, tipo_post, nivel, descricao_produto, roteiros_importados, persona, identidade_visual, referencias_tipo, organization_id, reference_images, incluir_video, art_style, video_style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // BOLA/IDOR guard + Pre-check credits
    if (organization_id) {
      await assertOrgMember(supabaseAdmin, _authUser.id, organization_id);
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

    // Fetch sales plan for enrichment
    let salesPlanCtx = "";
    if (organization_id) {
      const { data: salesPlan } = await supabaseAdmin
        .from("sales_plans")
        .select("answers")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (salesPlan?.answers && Object.keys(salesPlan.answers).length > 3) {
        const sp = salesPlan.answers as Record<string, unknown>;
        const parts: string[] = [];
        if (sp.produtos_servicos) parts.push(`Products: ${sp.produtos_servicos}`);
        if (sp.diferenciais) parts.push(`Differentials: ${sp.diferenciais}`);
        if (sp.dor_principal) parts.push(`Customer pain: ${sp.dor_principal}`);
        if (parts.length > 0) {
          salesPlanCtx = `\n\nSALES PLAN CONTEXT:\n${parts.map(p => `- ${p}`).join("\n")}\nUse these business details to make visuals and copy more relevant and specific.`;
        }
      }
    }

    const tipoGuide = getVisualGuideByType(tipo_post || "institucional");
    const nivelGuide = getNivelInstructions(nivel || "simples");

    let importedContext = "";
    if (roteiros_importados && roteiros_importados.length > 0) {
      importedContext = `\n\nIMPORTED CONTENT SCRIPTS (use these as creative base for captions and visual context):
${roteiros_importados.map((r: { titulo?: string; legenda?: string; roteiro?: string; etapa?: string; funil?: string; formato?: string }, i: number) => `
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

    let referenceImageContext = "";
    if (reference_images && reference_images.length > 0) {
      referenceImageContext = `

REFERENCE IMAGES: The user has provided ${reference_images.length} visual reference image(s).
Analyze them carefully:
- Extract the dominant color palette and color treatment
- Identify the composition style (grid, centered, asymmetric, layered)
- Note the lighting approach (soft, dramatic, flat, cinematic)
- Observe textures, materials, and visual elements
- Understand the overall mood, aesthetic, and quality level
- Note any recurring patterns, shapes, or design motifs

Your generated visual_prompt_feed and visual_prompt_story MUST
replicate the style, mood, and quality seen in these references
while adapting to the brand identity and briefing.
Be EXTREMELY specific about replicating the visual language you observe.`;
    }

    let artStyleContext = "";
    if (art_style) {
      const artStyleGuides: Record<string, string> = {
        foto_texto: "ART STYLE: Photo + Text overlay. Use photorealistic backgrounds (professional photography) with clean compositional space for text. Studio lighting, sharp details, editorial feel.",
        composicao: "ART STYLE: Graphic Composition. Abstract shapes, geometric elements, bold color blocks, layered visual design. Modern graphic design aesthetic with dynamic composition.",
        mockup: "ART STYLE: Product Mockup. Show products in realistic contexts (desk, hand, lifestyle setting). Natural lighting, contextual backgrounds, commercial photography feel.",
        quote: "ART STYLE: Quote Card. Stylized background (gradient, texture, or pattern) optimized for text overlay. Minimalist, clean, focused on legibility. Think inspirational quote format.",
        before_after: "ART STYLE: Before & After. Split composition showing two contrasting states side by side or top/bottom. Clear visual contrast, same framing angle, transformation theme.",
      };
      artStyleContext = `\n\n${artStyleGuides[art_style] || ""}`;
    }

    let videoStyleContext = "";
    if (video_style) {
      const videoStyleGuides: Record<string, string> = {
        slideshow: "VIDEO STYLE: Slideshow + Text. Generate frames that work as a cinematic slideshow with smooth Ken Burns transitions. Each frame should have a distinct visual moment. Subtle variations in angle and zoom for dynamic motion.",
        kinetic: "VIDEO STYLE: Kinetic Typography. Generate bold, high-contrast backgrounds/textures. The motion graphics engine will add animated text. Focus on visually striking but text-overlay-friendly compositions.",
        revelacao: "VIDEO STYLE: Product Reveal. Generate frames with dramatic zoom-in progression. Start wide/mysterious, progressively reveal the subject. Dramatic lighting, suspenseful composition.",
        countdown: "VIDEO STYLE: Countdown. Generate frames with escalating visual intensity. Each frame should feel more urgent/exciting than the last. Bold compositions, dynamic energy.",
      };
      videoStyleContext = `\n\n${videoStyleGuides[video_style] || ""}`;
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
${referenceImageContext}
${artStyleContext}
${videoStyleContext}
${salesPlanCtx}

Cada conceito DEVE ter:
- titulo: título curto e chamativo do post (máx 60 caracteres)
- legenda: legenda completa para Instagram (150-300 palavras), com emojis, parágrafos e CTA
- cta: call-to-action curto (ex: "Agende sua demo", "Link na bio")
- hashtags: array de 5-8 hashtags relevantes sem #
- visual_prompt_feed: prompt ULTRA DETALHADO em inglês para gerar uma arte de Instagram Feed (1:1 square, 1080x1080). 
- visual_prompt_story: prompt ULTRA DETALHADO em inglês para gerar uma arte de Instagram Story (9:16 vertical, 1080x1920).
${incluir_video ? `- video_script: roteiro completo de vídeo curto (15-60s) com timecodes detalhados (ex: "0-3s: Gancho visual impactante...", "3-8s: Contexto do problema...", "8-15s: Solução...")
- video_description: descrição visual frame-by-frame de cada cena do vídeo (movimentos de câmera, transições, elementos visuais)
- audio_suggestion: sugestão de trilha sonora/áudio (gênero, mood, exemplos de músicas)
- visual_prompt_thumbnail: prompt ULTRA DETALHADO em inglês para gerar uma thumbnail/capa do vídeo (1:1 square, 1080x1080). Deve ser impactante e convidativo para assistir.` : ""}

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
10. NUNCA gere prompts genéricos como "professional social media post" - seja ESPECÍFICO sobre cada elemento visual
${incluir_video ? `11. Para roteiros de vídeo, crie conteúdo dinâmico e envolvente pensando em Reels/TikTok
12. O roteiro deve ter gancho nos primeiros 3 segundos para prender a atenção
13. A thumbnail deve ser a cena mais impactante do vídeo` : ""}`;

    const userTextPrompt = `Briefing do cliente:
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

    // Build multimodal user message if references exist
    const hasRefs = reference_images && reference_images.length > 0;
    const userContent: string | { type: string; text?: string; image_url?: { url: string } }[] = hasRefs
      ? [
          { type: "text", text: userTextPrompt },
          ...reference_images.slice(0, 5).map((url: string) => ({
            type: "image_url",
            image_url: { url },
          })),
          { type: "text", text: "Analyze the images above as visual references. Replicate their style, composition, lighting, and color treatment in your generated visual prompts." },
        ]
      : userTextPrompt;

    // Use multimodal model when references are provided
    const model = hasRefs ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
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
                        ...(incluir_video ? {
                          video_script: { type: "string" },
                          video_description: { type: "string" },
                          audio_suggestion: { type: "string" },
                          visual_prompt_thumbnail: { type: "string" },
                        } : {}),
                      },
                      required: ["titulo", "legenda", "cta", "hashtags", "visual_prompt_feed", "visual_prompt_story", ...(incluir_video ? ["video_script", "video_description", "audio_suggestion", "visual_prompt_thumbnail"] : [])],
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
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar conteúdo." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response");

    const concepts = JSON.parse(toolCall.function.arguments);

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
            _description: `Geração de ${quantidade} conceitos visuais`,
            _source: "generate-social-concepts",
          });
        }
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

    return new Response(JSON.stringify(concepts), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("generate-social-concepts error", { error: String(e) });
    return authErrorResponse(e, getCorsHeaders(req));
  }
});
