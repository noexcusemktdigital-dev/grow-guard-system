import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json();
    const {
      organization_id,
      objetivo = "",
      produto = "",
      publico = [],
      publico_custom = "",
      pagina_destino = "",
      orcamento = 0,
      plataformas = [],
      regiao = "",
      ativos = [],
      strategy_id = null,
    } = body;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-check credits (200 for traffic strategy)
    const CREDIT_COST = 200;
    {
      const { data: wallet } = await adminClient
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos.", code: "INSUFFICIENT_CREDITS" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    // Fetch contents
    const { data: contents } = await adminClient
      .from("client_content")
      .select("title, type, platform, main_message")
      .eq("organization_id", organization_id)
      .eq("status", "published")
      .limit(10);

    // Fetch sites
    const { data: sites } = await adminClient
      .from("client_sites")
      .select("name, url, status")
      .eq("organization_id", organization_id)
      .limit(5);

    // Fetch posts/creatives
    const { data: posts } = await adminClient
      .from("client_posts")
      .select("type, format, style, result_url")
      .eq("organization_id", organization_id)
      .eq("status", "done")
      .limit(10);

    const strategyContext = strategy?.answers ? JSON.stringify(strategy.answers) : "Nenhuma estratégia de marketing definida";
    const contentsContext = contents?.length
      ? contents.map((c: any) => `${c.title} (${c.type}, ${c.platform}) - ${c.main_message || ""}`).join("; ")
      : "Nenhum conteúdo publicado";
    const sitesContext = sites?.length
      ? sites.map((s: any) => `${s.name}: ${s.url || "sem URL"} (${s.status})`).join("; ")
      : "Nenhum site";
    const postsContext = posts?.length
      ? posts.map((p: any) => `${p.type} (${p.format || p.style})`).join("; ")
      : "Nenhum criativo";

    const selectedPlatforms = plataformas.length > 0 ? plataformas.join(", ") : "Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads";
    const publicoText = [...publico, publico_custom].filter(Boolean).join(", ");

    const prompt = `Você é um estrategista de tráfego pago experiente. Com base nos dados abaixo, gere uma estratégia COMPLETA de tráfego pago.

DADOS DA EMPRESA:
- Nome: ${org?.name || "Empresa"}
- Segmento: ${org?.segment || "Não definido"}

DADOS DO WIZARD:
- Objetivo da campanha: ${objetivo}
- Produto/Oferta: ${produto}
- Público-alvo: ${publicoText}
- Página de destino: ${pagina_destino}
- Orçamento mensal: R$${orcamento}
- Plataformas selecionadas: ${selectedPlatforms}
- Região de atuação: ${regiao}
- Ativos disponíveis: ${ativos.join(", ") || "Nenhum"}

ESTRATÉGIA DE MARKETING ATIVA:
${strategyContext}

CONTEÚDOS PUBLICADOS:
${contentsContext}

SITES:
${sitesContext}

CRIATIVOS DISPONÍVEIS:
${postsContext}

Para CADA plataforma selecionada, retorne um objeto JSON com:
- platform: nome da plataforma
- objective: objetivo específico da campanha nessa plataforma
- audience: público-alvo detalhado (idade, interesses, comportamentos, localização)
- budget_suggestion: valor em reais da fatia do orçamento para esta plataforma
- budget_percentage: percentual do orçamento total
- ad_copies: array com 2-3 copies de anúncio
- creative_formats: formatos de criativos recomendados
- campaign_structure: { campaigns: [{ name, objective, ad_sets: [{ name, targeting, ads: [{ name, format }] }] }] }
- kpis: { estimated_reach, estimated_clicks, estimated_cpc, estimated_cpl, estimated_ctr, estimated_leads, estimated_clients, estimated_revenue }
- keywords: array de palavras-chave (apenas Google)
- interests: array de interesses/comportamentos (Meta, TikTok)
- tips: array com 3 dicas específicas
- optimization_actions: array com 3 ações de otimização
- tutorial: array com passos de execução na plataforma

Também inclua no topo do JSON:
- diagnostico: análise geral do potencial de aquisição (3-4 frases)
- kpi_tracking: array de métricas sugeridas para acompanhamento (CPC, CTR, CPL, CPA, ROI)
- investment_plan: { total_budget, distribution: [{ platform, percentage, amount }] }
- projections: { total_leads, total_clients, estimated_revenue, estimated_roi }

Retorne APENAS um JSON válido com a estrutura: { diagnostico, kpi_tracking, investment_plan, projections, platforms: [...] }. Sem texto adicional.`;

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
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, tente novamente em alguns minutos.", code: "RATE_LIMIT" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "{}";
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent.substring(0, 500));
      result = { platforms: [], diagnostico: "", kpi_tracking: [], investment_plan: {}, projections: {} };
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
        platforms: result.platforms || [],
        source_data: {
          wizard: { objetivo, produto, publico, publico_custom, pagina_destino, orcamento, plataformas, regiao, ativos },
          strategy_answers: strategy?.answers || null,
          org_name: org?.name,
          org_segment: org?.segment,
          diagnostico: result.diagnostico,
          kpi_tracking: result.kpi_tracking,
          investment_plan: result.investment_plan,
          projections: result.projections,
          generated_at: new Date().toISOString(),
        },
        is_active: true,
        status: "pending",
        created_by: userId,
        strategy_id: strategy_id || null,
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
