import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debit credits
    try {
      await adminClient.rpc("debit_credits", {
        _org_id: organization_id,
        _amount: CREDIT_COST,
        _description: "Geração de Estratégia de Tráfego Pago",
        _source: "traffic_strategy",
      });
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes", code: "INSUFFICIENT_CREDITS" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // Fetch marketing strategy
    const { data: strategy } = await adminClient
      .from("marketing_strategies")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch org info
    const { data: org } = await adminClient
      .from("organizations")
      .select("name, segment")
      .eq("id", organization_id)
      .single();

    // Fetch active contents
    const { data: contents } = await adminClient
      .from("client_content")
      .select("title, type, platform")
      .eq("organization_id", organization_id)
      .eq("status", "published")
      .limit(10);

    // Fetch sites
    const { data: sites } = await adminClient
      .from("client_sites")
      .select("name, url, status")
      .eq("organization_id", organization_id)
      .limit(5);

    const strategyContext = strategy?.answers ? JSON.stringify(strategy.answers) : "Nenhuma estratégia de marketing definida";
    const contentsContext = contents?.length ? contents.map((c: any) => `${c.title} (${c.type}, ${c.platform})`).join("; ") : "Nenhum conteúdo publicado";
    const sitesContext = sites?.length ? sites.map((s: any) => `${s.name}: ${s.url || "sem URL"} (${s.status})`).join("; ") : "Nenhum site";

    const prompt = `Você é um estrategista de tráfego pago experiente. Com base nos dados abaixo, gere uma estratégia detalhada de tráfego pago para 4 plataformas: Google Ads, Meta Ads, TikTok Ads e LinkedIn Ads.

DADOS DA EMPRESA:
- Nome: ${org?.name || "Empresa"}
- Segmento: ${org?.segment || "Não definido"}

ESTRATÉGIA DE MARKETING ATIVA:
${strategyContext}

CONTEÚDOS PUBLICADOS:
${contentsContext}

SITES:
${sitesContext}

Para CADA plataforma, retorne os seguintes campos em JSON:
- platform: "Google" | "Meta" | "TikTok" | "LinkedIn"
- objective: objetivo da campanha
- audience: público-alvo detalhado (idade, interesses, comportamentos, localização)
- budget_suggestion: orçamento mensal sugerido em reais
- ad_copies: array com 2-3 copies de anúncio
- creative_formats: formatos de criativos recomendados
- kpis: { estimated_reach, estimated_clicks, estimated_cpc, estimated_cpl }
- keywords: array de palavras-chave (apenas para Google)
- interests: array de interesses/comportamentos (para Meta e TikTok)
- tips: array com 2-3 dicas específicas da plataforma

Retorne APENAS um array JSON válido com 4 objetos (um por plataforma). Sem texto adicional.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um estrategista de tráfego pago. Retorne APENAS JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "[]";
    
    // Clean markdown fences
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let platforms;
    try {
      platforms = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent.substring(0, 500));
      platforms = [];
    }

    // Deactivate previous
    await adminClient
      .from("traffic_strategies")
      .update({ is_active: false } as any)
      .eq("organization_id", organization_id)
      .eq("is_active", true);

    // Insert new
    const { data: inserted, error: insertErr } = await adminClient
      .from("traffic_strategies")
      .insert({
        organization_id,
        platforms,
        source_data: {
          strategy_answers: strategy?.answers || null,
          org_name: org?.name,
          org_segment: org?.segment,
          contents_count: contents?.length || 0,
          sites_count: sites?.length || 0,
          generated_at: new Date().toISOString(),
        },
        is_active: true,
        created_by: userId,
      } as any)
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, strategy: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-traffic-strategy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
