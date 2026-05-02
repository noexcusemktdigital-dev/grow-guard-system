// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';
import {
  PROMPT_VERSION,
  CLASSIFY_RESTRICTIONS_SYSTEM_PROMPT,
  getLayoutRulesForPrompt,
  getQualityInstructions,
  getArtStyleInstructions,
  buildCotSystemPrompt,
  buildCotUserMessage,
  buildFinalPrompt,
  buildFallbackPrompt,
} from '../_shared/prompts/generate-social-image.ts';

const CREDIT_COST = 25;

// --- Fetch URL and convert to base64 data URI ---

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch reference image (${res.status}): ${url}`);
      return null;
    }
    let contentType = res.headers.get("content-type") || "image/png";

    // SVG: convert to PNG by re-rendering via AI model
    if (contentType.includes("svg")) {
      console.log(`🔄 SVG detected, converting to PNG via AI: ${url}`);
      try {
        const svgText = new TextDecoder().decode(new Uint8Array(await res.clone().arrayBuffer()));
        const svgB64 = `data:image/svg+xml;base64,${btoa(svgText)}`;
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          console.warn("No LOVABLE_API_KEY for SVG conversion, skipping");
          return null;
        }
        const convResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Render this SVG logo as a clean PNG image on a TRANSPARENT background (alpha channel). Maintain exact colors, proportions and text. Output only the rendered image with no background.",
                },
                { type: "image_url", image_url: { url: svgB64 } },
              ],
            }],
            modalities: ["image", "text"],
          }),
        });
        if (convResp.ok) {
          const convData = await convResp.json();
          const pngUrl = convData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (pngUrl) {
            console.log("✅ SVG converted to PNG successfully");
            return pngUrl;
          }
        }
        console.warn("SVG→PNG conversion failed, using raw SVG base64 as fallback");
        const svgTextFallback = new TextDecoder().decode(new Uint8Array(await res.arrayBuffer()));
        return `data:image/svg+xml;base64,${btoa(svgTextFallback)}`;
      } catch (svgErr) {
        console.warn("SVG→PNG conversion error:", svgErr);
        return null;
      }
    }

    if (!contentType.startsWith("image/")) {
      contentType = "image/png";
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn(`Error fetching reference image: ${url}`, err);
    return null;
  }
}

// --- Classify restrictions into visual, copy, global ---

type ClassifiedRestrictions = import('../_shared/prompts/generate-social-image.ts').ClassifiedRestrictions;

async function classifyRestrictions(apiKey: string, restrictions: string): Promise<ClassifiedRestrictions> {
  const defaultResult: ClassifiedRestrictions = {
    restrictions_visual: [],
    restrictions_copy: [],
    restrictions_global: [],
  };
  if (!restrictions || restrictions.trim().length === 0) return defaultResult;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: CLASSIFY_RESTRICTIONS_SYSTEM_PROMPT,
          },
          { role: "user", content: restrictions },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_restrictions",
              description: "Classify user restrictions into visual, copy, and global categories.",
              parameters: {
                type: "object",
                properties: {
                  restrictions_visual: {
                    type: "array",
                    items: { type: "string" },
                    description: "Visual/image restrictions",
                  },
                  restrictions_copy: {
                    type: "array",
                    items: { type: "string" },
                    description: "Text/copy restrictions",
                  },
                  restrictions_global: {
                    type: "array",
                    items: { type: "string" },
                    description: "Global feel restrictions that apply to both text and image",
                  },
                },
                required: ["restrictions_visual", "restrictions_copy", "restrictions_global"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_restrictions" } },
      }),
    });

    if (!response.ok) {
      console.warn("Restriction classification failed:", response.status);
      return defaultResult;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("✅ Restrictions classified:", JSON.stringify(parsed));
      return parsed as ClassifiedRestrictions;
    }
    return defaultResult;
  } catch (err) {
    console.warn("Restriction classification error:", err);
    return defaultResult;
  }
}

// --- Structured prompt result from chain-of-thought ---

type TextHierarchy = import('../_shared/prompts/generate-social-image.ts').TextHierarchy;
type StructuredPromptResult = import('../_shared/prompts/generate-social-image.ts').StructuredPromptResult;

async function analyzeAndOptimizePrompt(
  apiKey: string,
  context: import('../_shared/prompts/generate-social-image.ts').CotPromptContext,
  referenceBase64s?: { type: string; image_url: { url: string } }[],
): Promise<StructuredPromptResult | null> {
  const hasRefs = referenceBase64s && referenceBase64s.length > 0;
  const cotCtx = { ...context, hasRefs };

  const systemPrompt = buildCotSystemPrompt(cotCtx);
  const userMessage = buildCotUserMessage(cotCtx);

  try {
    let messageContent: string | { type: string; text?: string; image_url?: { url: string } }[];
    if (hasRefs) {
      messageContent = [
        { type: "text", text: userMessage },
        ...referenceBase64s!,
      ];
    } else {
      messageContent = userMessage;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "structured_visual_prompt",
              description: "Return the structured visual prompt sections for image generation. ALL content MUST be in English.",
              parameters: {
                type: "object",
                properties: {
                  scene: { type: "string", description: "Detailed scene description. 100-200 words. English only." },
                  environment: { type: "string", description: "Background, lighting, atmosphere with specific colors/hex codes." },
                  design_layout: { type: "string", description: "Precise spatial composition describing exact layout grid and element positions." },
                  layout_zones: { type: "string", description: "2-3 distinct zones of the composition with specific descriptions of what goes in each zone." },
                  color_palette: { type: "string", description: "Exact colors with hex codes and where each appears." },
                  mood: { type: "string", description: "5-8 mood keywords, comma-separated." },
                  style_closing: { type: "string", description: "One definitive style sentence." },
                  brand_design_elements: { type: "string", description: "5-8 specific brand design elements, comma-separated." },
                  reference_style_replication: { type: "string", description: "6-10 specific visual elements extracted from brand reference images that must be replicated. Empty if no references." },
                  text_hierarchy: {
                    type: "object",
                    description: "Structured text elements to render in the image, each with content and rendering instructions.",
                    properties: {
                      headline: { type: "string", description: "Main headline with rendering instructions (font, size, position, color). Include the exact text in quotes." },
                      highlight_headline: { type: "string", description: "Secondary/highlight headline with distinct styling (different color or weight). Include exact text in quotes." },
                      supporting_text: { type: "string", description: "Body/explanatory text with rendering instructions. Include exact text in quotes." },
                      bullet_points: { type: "string", description: "Listed items with rendering instructions. Include exact text in quotes." },
                      cta: { type: "string", description: "Call-to-action text with rendering instructions (accent color, button style, position)." },
                      brand: { type: "string", description: "Brand name with rendering instructions (small, corner placement)." },
                    },
                    required: ["headline"],
                    additionalProperties: false,
                  },
                },
                required: ["scene", "environment", "design_layout", "layout_zones", "color_palette", "mood", "style_closing", "brand_design_elements", "reference_style_replication", "text_hierarchy"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "structured_visual_prompt" } },
      }),
    });

    if (!response.ok) {
      console.warn("Chain-of-thought optimization failed (HTTP):", response.status);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("✅ Chain-of-thought structured prompt:", JSON.stringify(parsed).slice(0, 600) + "...");
      return parsed as StructuredPromptResult;
    }

    console.warn("Chain-of-thought: no tool call in response, falling back.");
    return null;
  } catch (err) {
    console.warn("Chain-of-thought optimization error (non-blocking):", err);
    return null;
  }
}

async function getFeedbackHistory(supabase: ReturnType<typeof createClient>, organizationId: string): Promise<string> {
  try {
    const { data: feedback } = await supabase
      .from("social_art_feedback")
      .select("status, prompt_used, style, nivel, feedback_note")
      .eq("organization_id", organizationId)
      .in("status", ["approved", "rejected", "changes_requested"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!feedback || feedback.length === 0) return "";

    const approved = feedback.filter((f: { status: string }) => f.status === "approved");
    const rejected = feedback.filter((f: { status: string }) => f.status === "rejected");

    let summary = "\n\nPAST FEEDBACK CONTEXT:";
    if (approved.length > 0) {
      summary += `\n- ${approved.length} images APPROVED. Successful themes: ${approved.slice(0, 5).map((a: { prompt_used?: string }) => a.prompt_used?.slice(0, 80) || "N/A").join("; ")}`;
    }
    if (rejected.length > 0) {
      summary += `\n- ${rejected.length} images REJECTED. Avoid these approaches: ${rejected.slice(0, 5).map((r: { prompt_used?: string; feedback_note?: string }) => `"${r.prompt_used?.slice(0, 60)}" ${r.feedback_note ? `(reason: ${r.feedback_note})` : ""}`).join("; ")}`;
    }
    return summary;
  } catch {
    return "";
  }
}

// buildFinalPrompt and buildFallbackPrompt are imported from _shared/prompts/generate-social-image.ts

// --- Main handler ---

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-social-image');
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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-social-image', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const body = await req.json();
    const {
      prompt, format, file_path, nivel, persona, identidade_visual,
      organization_id, reference_images, art_style,
      tipo_postagem, headline, subheadline, cta, cena, elementos_visuais,
      manual_colors, manual_style, brand_name,
      supporting_text, bullet_points,
      layout_type, logo_url, primary_ref_index, objective,
      extract_logo,
      photo_images,
      output_mode,
      print_format,
      // New art direction engine fields
      topic, audience, text_mode, restrictions, elements,
      base_image_url, character_image_url, background_image_url,
      // Layout customization (Step 8)
      logo_position, title_position, background_type, color_tone,
      primary_color, secondary_color,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Extract logo mode ───
    if (extract_logo && reference_images?.length > 0) {
      console.log("🔍 Extract logo mode: analyzing references...");
      const refB64s: { type: string; image_url: { url: string } }[] = [];
      for (const refUrl of reference_images.slice(0, 3)) {
        const b64 = await urlToBase64(refUrl);
        if (b64) refB64s.push({ type: "image_url", image_url: { url: b64 } });
      }
      if (refB64s.length === 0) {
        return new Response(JSON.stringify({ error: "Could not load reference images" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `Look at these reference images carefully. Find the brand logo/logotype that appears in them.
Extract ONLY the logo — remove all other elements.
Place the extracted logo on a clean solid white background.
Maintain the original colors, proportions, and text of the logo exactly.
If there are multiple logos, extract the most prominent one.
Output ONLY the extracted logo image.`,
              },
              ...refB64s,
            ],
          }],
          modalities: ["image", "text"],
        }),
      });

      if (!extractResponse.ok) {
        console.error("Logo extraction failed:", extractResponse.status);
        return new Response(JSON.stringify({ error: "Logo extraction failed" }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const extractData = await extractResponse.json();
      const extractedImage = extractData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!extractedImage) {
        return new Response(JSON.stringify({ error: "No logo found in references" }), {
          status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Upload extracted logo
      const logoPath = `logos/${organization_id}/${Date.now()}_extracted.png`;
      const logoBase64 = extractedImage.replace(/^data:image\/\w+;base64,/, "");
      const logoBinary = Uint8Array.from(atob(logoBase64), (c) => c.charCodeAt(0));
      const { error: uploadErr } = await supabase.storage
        .from("social-arts")
        .upload(logoPath, logoBinary, { contentType: "image/png", upsert: true });
      if (uploadErr) throw new Error(`Logo upload failed: ${uploadErr.message}`);
      const { data: logoUrlData } = supabase.storage.from("social-arts").getPublicUrl(logoPath);

      console.log("✅ Logo extracted and uploaded:", logoUrlData.publicUrl);
      return new Response(JSON.stringify({ logo_url: logoUrlData.publicUrl }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    log.info(`PROMPT_VERSION=${PROMPT_VERSION}`);

    // BOLA/IDOR guard: ensure caller belongs to the target org
    if (organization_id) {
      await assertOrgMember(supabase, _authUser.id, organization_id);
    }

    // Debit credits BEFORE generation (skip for test orgs and before GPS is approved)
    const isTestOrg = typeof organization_id === "string" && organization_id.startsWith("test-");
    if (organization_id && !isTestOrg) {
      const { data: gpsApproved } = await supabase
        .from("marketing_strategies")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (!gpsApproved) {
        console.log("GPS not yet approved — skipping credit debit");
      } else {
        const { error: debitError } = await supabase.rpc("debit_credits", {
          _org_id: organization_id,
          _amount: CREDIT_COST,
          _description: "Arte de rede social gerada",
          _source: "client-posts",
        });
        if (debitError) {
          const isInsufficient = debitError.message?.includes("INSUFFICIENT_CREDITS") || debitError.message?.includes("WALLET_NOT_FOUND");
          return new Response(
            JSON.stringify({ error: isInsufficient ? "INSUFFICIENT_CREDITS" : debitError.message }),
            { status: isInsufficient ? 402 : 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
        console.log(`✅ Debited ${CREDIT_COST} credits from org ${organization_id}`);
      }
    }

    const estilo = identidade_visual?.estilo || identidade_visual?.style || manual_style || "";

    // Feedback history
    let feedbackContext = "";
    if (organization_id) {
      feedbackContext = await getFeedbackHistory(supabase, organization_id);
    }

    // ─── Classify restrictions (Phase 1: Smart Restrictions) ───
    let classifiedRestrictions: ClassifiedRestrictions | undefined;
    if (restrictions && restrictions.trim().length > 0) {
      console.log("🔍 Classifying user restrictions...");
      classifiedRestrictions = await classifyRestrictions(LOVABLE_API_KEY, restrictions);
    }

    // Build enriched prompt for CoT (in English labels)
    let enrichedPrompt = prompt || "";
    if (topic) enrichedPrompt += `\nTopic/Subject: ${topic}`;
    if (audience) enrichedPrompt += `\nTarget Audience: ${audience}`;
    if (objective) enrichedPrompt += `\nObjective: ${objective}`;
    if (cena) enrichedPrompt += `\nScene: ${cena}`;
    if (elementos_visuais) enrichedPrompt += `\nVisual elements: ${elementos_visuais}`;
    if (elements && elements.length > 0) enrichedPrompt += `\nDesired elements: ${elements.join(", ")}`;
    if (headline) enrichedPrompt += `\nHeadline: ${headline}`;
    if (subheadline) enrichedPrompt += `\nSubheadline: ${subheadline}`;
    if (supporting_text) enrichedPrompt += `\nSupporting text: ${supporting_text}`;
    if (bullet_points) enrichedPrompt += `\nBullet points: ${bullet_points}`;
    if (cta) enrichedPrompt += `\nCTA: ${cta}`;
    if (tipo_postagem) enrichedPrompt += `\nPost type: ${tipo_postagem}`;
    if (brand_name) enrichedPrompt += `\nBrand: ${brand_name}`;
    if (layout_type) enrichedPrompt += `\nLayout type: ${layout_type}`;
    if (logo_url) enrichedPrompt += `\nBrand logo: provided as separate image`;
    if (restrictions) enrichedPrompt += `\nNEGATIVE CONSTRAINTS (AVOID): ${restrictions}`;
    if (feedbackContext) enrichedPrompt += feedbackContext;

    // Convert reference images to base64 EARLY so CoT can use them too
    const hasRefs = reference_images && reference_images.length > 0;
    const base64Refs: { type: string; image_url: { url: string } }[] = [];

    if (hasRefs) {
      console.log(`📥 Converting ${Math.min(reference_images.length, 5)} reference images to base64...`);
      for (const refUrl of reference_images.slice(0, 5)) {
        const b64 = await urlToBase64(refUrl);
        if (b64) {
          base64Refs.push({ type: "image_url", image_url: { url: b64 } });
        }
      }
      console.log(`✅ ${base64Refs.length} reference images converted`);
    }

    // Chain-of-Thought optimization (NOW receives reference images + classified restrictions!)
    console.log(`🧠 Starting chain-of-thought for ${format} image (refs for CoT: ${base64Refs.length}, restrictions classified: ${!!classifiedRestrictions})...`);

    const optimized = await analyzeAndOptimizePrompt(LOVABLE_API_KEY, {
      userPrompt: enrichedPrompt,
      format,
      nivel: nivel || "simples",
      estilo,
      identidade_visual,
      persona,
      tipo_postagem,
      headline,
      subheadline,
      cta,
      cena,
      elementos_visuais,
      manual_colors,
      manual_style,
      brand_name,
      supporting_text,
      bullet_points,
      layout_type,
      logo_url,
      primary_ref_index,
      objective,
      classifiedRestrictions,
    }, base64Refs.length > 0 ? base64Refs : undefined);

    // Quality, style and layout instructions
    const qualityInstructions = getQualityInstructions(nivel || "simples");
    const artStyleInstructions = art_style ? getArtStyleInstructions(art_style) : "";
    const layoutInstructions = layout_type ? getLayoutRulesForPrompt(layout_type) : "";

    const formatDescMap: Record<string, string> = {
      feed: "square 1:1 (1080×1080px) social media post for Instagram feed",
      portrait: "portrait 4:5 (1080×1350px) social media post for Instagram",
      story: "vertical 9:16 (1080×1920px) story/reel for Instagram Stories",
      banner: "landscape 16:9 (1920×1080px) banner for social media cover",
      // Print formats
      cartao_visita: "business card front (1063×591px, 9×5cm at 300dpi) for CMYK print",
      cartao_visita_verso: "business card back (1063×591px, 9×5cm at 300dpi) for CMYK print",
      flyer_a5: "A5 flyer (1748×2480px, 14.8×21cm at 300dpi) for CMYK print",
      flyer_a4: "A4 flyer (2480×3508px, 21×29.7cm at 300dpi) for CMYK print",
      banner_100x60: "large banner (1920×1152px, 100×60cm) for CMYK print",
    };
    const formatDescription = formatDescMap[format] || formatDescMap.feed;

    // Print mode instructions
    const isPrint = output_mode === "print";

    // Build final prompt
    let fullPrompt: string;

    if (optimized) {
      fullPrompt = buildFinalPrompt(optimized, qualityInstructions, artStyleInstructions, formatDescription, hasRefs, classifiedRestrictions);
    } else {
      fullPrompt = buildFallbackPrompt(
        { prompt, cena, headline, subheadline, cta, brand_name, elementos_visuais, supporting_text, bullet_points },
        qualityInstructions, artStyleInstructions, formatDescription,
        identidade_visual, manual_colors, manual_style, classifiedRestrictions,
      );
    }

    // Add print-specific instructions
    if (isPrint) {
      fullPrompt += `\n\nPRINT MODE (CMYK): This design is for PHYSICAL PRINTING. Use CMYK-safe colors only — NO neon, fluorescent, or overly saturated RGB colors. Ensure high resolution suitable for 300dpi print. Design should have proper bleed margins. Text must be extra crisp for print quality.`;
    }

    // Append layout instructions to prompt if not already in CoT
    if (layoutInstructions && !optimized) {
      fullPrompt += `\n\n${layoutInstructions}`;
    }

    // Inject objective-based style direction
    const objectiveStyleMap: Record<string, string> = {
      sales: "OBJECTIVE STYLE: High contrast, bold headline, aggressive layout, prominent CTA. Colors should be vibrant and attention-grabbing.",
      leads: "OBJECTIVE STYLE: Clean and clear layout, objective message, clean visual, focus on action. CTA must be the most prominent element.",
      engagement: "OBJECTIVE STYLE: Eye-catching visual, dynamic rhythm, appealing imagery. Layout should invite interaction.",
      authority: "OBJECTIVE STYLE: Minimal clutter, elegant, well-organized, generous breathing room. Premium and refined feel.",
      informative: "OBJECTIVE STYLE: Clear hierarchy of information, blocks of content, logical organization. Easy to scan and digest.",
    };
    if (objective && objectiveStyleMap[objective]) {
      fullPrompt += `\n\n${objectiveStyleMap[objective]}`;
    }

    // Inject audience context
    if (audience) {
      fullPrompt += `\n\nTARGET AUDIENCE: ${audience}. Adapt visual language, tone, and imagery to resonate with this audience.`;
    }

    // Instruct the model to RESERVE SPACE for the logo instead of rendering it
    if (logo_url) {
      fullPrompt += `\n\nBRAND LOGO PLACEMENT: Leave a CLEAN, EMPTY rectangular space (approximately 10-15% of image width) in the top-left corner of the design for the brand logo. This space must have a solid, uniform background matching the surrounding design — do NOT place any text, graphics, or busy patterns there. The logo will be composited in post-production. DO NOT render any logo, logotype, brand mark, or brand name text ANYWHERE in the image.`;
    }

    // Convert photo_images to base64 for inclusion in the design
    const photoBase64s: { type: string; image_url: { url: string } }[] = [];
    if (photo_images && photo_images.length > 0) {
      console.log(`📷 Converting ${photo_images.length} photo images for inclusion in art...`);
      for (const photoUrl of photo_images.slice(0, 4)) {
        const b64 = await urlToBase64(photoUrl);
        if (b64) photoBase64s.push({ type: "image_url", image_url: { url: b64 } });
      }
      fullPrompt += `\n\nPHOTOS TO INCLUDE IN THE DESIGN: ${photoBase64s.length} photo(s) have been attached. These photos MUST appear as visual elements IN the final design composition. Incorporate them naturally into the layout — they are real product/person/place photos that the client wants visible in the art. Do NOT use them just as style reference.
MANDATORY PHOTO RESTRICTION: Use ONLY the attached photos as visual/photographic elements. Do NOT generate, add, or include ANY additional photographs, people, objects, or illustrated elements beyond the provided photos.`;
    }

    // ─── LAYOUT CUSTOMIZATION RULES (from Step 8 personalizer) ───
    // Injected before CRITICAL TEXT RULES so they take precedence over template defaults.
    const customizationRules: string[] = [];

    if (logo_position === "none") {
      customizationRules.push("DO NOT include any brand logo, logotype, brand mark or brand name text anywhere in the image.");
    } else if (logo_position) {
      const posLabel = String(logo_position).replace("_", " ");
      customizationRules.push(`LOGO POSITION: Reserve clean empty space for the brand logo at the ${posLabel} corner of the composition.`);
    }

    if (title_position) {
      const zoneMap: Record<string, string> = {
        top:    "upper third (top zone) of the canvas",
        center: "center of the canvas, vertically and horizontally balanced",
        bottom: "lower third (bottom zone) of the canvas",
      };
      customizationRules.push(`TITLE POSITION: Place the main headline in the ${zoneMap[title_position] || "center"}.`);
    }

    if (background_type === "solid_color" && primary_color) {
      customizationRules.push(`BACKGROUND: Solid flat color ${primary_color}. NO photographs, NO textures, NO gradients — completely uniform color across the entire canvas.`);
    } else if (background_type === "gradient") {
      const a = primary_color || "#000000";
      const b = secondary_color || "#ffffff";
      customizationRules.push(`BACKGROUND: Smooth diagonal gradient from ${a} to ${b}. NO photographs, NO textures — only the gradient.`);
    } else if (background_type === "clean") {
      customizationRules.push(`BACKGROUND: Pure white or very light off-white background, completely clean with NO imagery, NO photos, NO textures.`);
    } else if (background_type === "ai_photo") {
      customizationRules.push(`BACKGROUND: A high-quality photographic background appropriate to the topic, with subtle dark overlay for text legibility.`);
    }

    if (color_tone) {
      const toneMap: Record<string, string> = {
        brand:   `Use the brand palette strictly: primary color ${primary_color || "#000000"}, secondary color ${secondary_color || "#ffffff"}. Do not introduce other dominant colors.`,
        neutral: "Color palette: neutral tones — warm grays, off-white, charcoal, beige. NO saturated colors. Refined and editorial.",
        vibrant: "Color palette: vibrant saturated bold colors — high-energy and attention-grabbing. Use bright primaries and contrasting accents.",
        dark:    "Color palette: dark luxurious — near-black or deep navy background with a single bright metallic or jewel-tone accent color.",
        pastel:  "Color palette: soft pastels — muted desaturated tones with high lightness (light pinks, mint, lavender, peach). Gentle and friendly.",
      };
      customizationRules.push(`COLOR TONE: ${toneMap[color_tone] || toneMap.brand}`);
    }

    if (customizationRules.length > 0) {
      fullPrompt += `\n\nLAYOUT CUSTOMIZATION (MANDATORY — overrides template defaults):\n- ${customizationRules.join("\n- ")}`;
    }

    // ─── CRITICAL TEXT RENDERING RULES (always appended last) ───
    fullPrompt += `

CRITICAL TEXT RENDERING RULES (MANDATORY):
- All text must be crisp, sharp, and perfectly legible at thumbnail size
- Use HIGH CONTRAST: white text on dark backgrounds OR dark text on light backgrounds — never low-contrast combinations
- Font size hierarchy (relative to a 1080px design): headline minimum ~60px equivalent, subheadline ~36px, body ~24px
- NEVER place text over busy/detailed image areas — use solid color overlays, gradients, or clean negative space behind text
- Text alignment must be centered or left-aligned only — NEVER diagonal, vertical, curved, or rotated
- Maximum 3 lines per text block
- Leave at least 40px equivalent padding around all text elements
- Maximum 3 text blocks total in the whole composition (headline + subheadline + CTA), no more than ~40 words combined
- NO text shadows, glows, outlines or blur effects — text must be flat, clean, and typographically pure
- Spelling and accents in Brazilian Portuguese must be 100% correct`;

    console.log(`🎨 Generating ${format} image (refs: ${base64Refs.length}, photos: ${photoBase64s.length}, layout: ${layout_type || "none"}, logo: ${logo_url ? "YES" : "NO"}, CoT: ${optimized ? "YES" : "FALLBACK"}, restrictions: ${classifiedRestrictions ? "CLASSIFIED" : "none"})...`);
    console.log(`📝 Final prompt preview: ${fullPrompt.slice(0, 800)}...`);

    // Stage 2: Generate image (with photo images if provided)
    let messageContent: string | { type: string; text?: string; image_url?: { url: string } }[];
    if (photoBase64s.length > 0) {
      messageContent = [
        { type: "text", text: fullPrompt },
        ...photoBase64s,
      ];
    } else {
      messageContent = fullPrompt;
    }

    // ─── Stage 2: Generate with primary model + fallback ───
    // Primary: Gemini 3.1 Flash Image (Nano Banana 2) — fast & cheap
    // Fallback: Gemini 3 Pro Image — slower but stronger on complex typography
    // 429/402 errors propagate immediately (fallback won't help with rate/credits)
    const PRIMARY_MODEL = "google/gemini-3.1-flash-image-preview";
    const FALLBACK_MODEL = "google/gemini-3-pro-image-preview";

    async function callImageModel(model: string) {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: messageContent }],
          modalities: ["image", "text"],
        }),
      });
    }

    let usedModel = PRIMARY_MODEL;
    const response = await callImageModel(PRIMARY_MODEL);

    // Hard stops on rate limit / credit exhaustion — never fall back
    if (response.status === 429) {
      const errorText = await response.text();
      console.error("AI image gateway rate-limited:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      const errorText = await response.text();
      console.error("AI image gateway credits exhausted:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let data: any = null;
    let imageData: string | undefined;

    if (response.ok) {
      data = await response.json();
      imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ Primary model ${PRIMARY_MODEL} failed (${response.status}): ${errorText.slice(0, 300)}`);
    }

    // Fallback when primary returned non-OK or returned no image
    if (!imageData) {
      console.log(`🔁 Falling back to ${FALLBACK_MODEL}...`);
      const fbResponse = await callImageModel(FALLBACK_MODEL);

      if (fbResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (fbResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (!fbResponse.ok) {
        const errorText = await fbResponse.text();
        console.error("AI image gateway fallback error:", fbResponse.status, errorText);
        throw new Error(`AI image gateway error: ${fbResponse.status}`);
      }
      data = await fbResponse.json();
      imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      usedModel = FALLBACK_MODEL;
    }

    if (!imageData) {
      console.error("No image in response (both models):", JSON.stringify(data).slice(0, 500));
      throw new Error("No image generated");
    }

    console.log(`✅ Image generated by model: ${usedModel}`);

    // ─── Stage 3: Logo Composition (overlay real logo) ───
    if (logo_url) {
      console.log("🖼️ Stage 3: Compositing brand logo onto generated art...");
      const logoB64 = await urlToBase64(logo_url);
      if (logoB64) {
        try {
          const compositeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [{
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are a professional graphic designer doing final production. 

TASK: Place the brand logo (second image) onto the design artwork (first image).

RULES:
- Place the logo in the top-left corner area of the design
- Scale the logo to approximately 8-12% of the image width
- The logo must appear EXACTLY as provided — same colors, same shape, same proportions, same text
- Do NOT redraw, stylize, modify, reinterpret, or simplify the logo in ANY way
- Do NOT change any other part of the design — keep everything else pixel-perfect
- If there is already a logo or brand mark visible in the design, REMOVE IT and replace with the provided logo
- There must be EXACTLY ONE logo in the final image — the one provided
- Maintain the overall design composition and quality
- Do NOT add any text, elements, or modifications beyond placing the logo

CONTRAST PROTECTION (CRITICAL):
- Analyze the dominant color of the area where the logo will be placed
- If the logo and background have LOW CONTRAST (both dark or both light), you MUST use ONE of these two strategies:
  STRATEGY A — BACKGROUND SHAPE: Place a solid rounded rectangle (pill shape) in a contrasting color behind the logo. Use a fully opaque, clean shape that matches the design style. Example: white pill behind dark logo on dark background, or dark pill behind light logo on light background.
  STRATEGY B — COLOR INVERSION: Invert the logo colors to contrast with the background. Example: if the logo is black and the background is dark, render the logo in white instead.
- Choose the strategy that looks most professional for the specific design
- Do NOT use glow, shadow, halo, blur, or semi-transparent effects — they produce unreliable results
- The logo must ALWAYS have 100% legibility regardless of the background

OUTPUT: The same design with the real brand logo composited in, fully legible.`,
                  },
                  { type: "image_url", image_url: { url: imageData } },
                  { type: "image_url", image_url: { url: logoB64 } },
                ],
              }],
              modalities: ["image", "text"],
            }),
          });

          if (compositeResponse.ok) {
            const compositeData = await compositeResponse.json();
            const compositedImage = compositeData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (compositedImage) {
              console.log("✅ Logo composited successfully");
              imageData = compositedImage;
            } else {
              console.warn("⚠️ Stage 3 returned no image, using Stage 2 result");
            }
          } else {
            console.warn("⚠️ Stage 3 failed (HTTP " + compositeResponse.status + "), using Stage 2 result");
          }
        } catch (compErr) {
          console.warn("⚠️ Stage 3 error (non-blocking):", compErr);
        }
      } else {
        console.warn("⚠️ Could not convert logo to base64, skipping Stage 3");
      }
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("social-arts")
      .upload(file_path, binaryData, { contentType: "image/png", upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(file_path);
    console.log(`✅ Image uploaded: ${urlData.publicUrl}`);

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("generate-social-image error", { error: String(e) });
    return authErrorResponse(e, getCorsHeaders(req));
  }
});
