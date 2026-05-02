// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-traffic-strategy.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-traffic-strategy');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const _rl = await checkRateLimit(userId, null, 'generate-traffic-strategy', { windowSeconds: 60, maxRequests: 10 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

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
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // BOLA/IDOR guard: ensure caller belongs to the target org
    await assertOrgMember(adminClient, userId, organization_id);

    // Pre-check + débito condicional ao GPS aprovado
    const CREDIT_COST = 25;
    {
      const debited = await debitIfGPSDone(
        adminClient, organization_id, CREDIT_COST, "Estratégia de tráfego", "generate-traffic-strategy",
        supabaseUrl, serviceRoleKey
      );
      if (debited === false) {
        const { data: wallet } = await adminClient
          .from("credit_wallets")
          .select("balance")
          .eq("organization_id", organization_id)
          .maybeSingle();
        if (!wallet || wallet.balance < CREDIT_COST) {
          return new Response(
            JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos.", code: "INSUFFICIENT_CREDITS" }),
            { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
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

    // Busca métricas reais do Meta Ads (últimos 30 dias)
    const { data: adMetrics } = await adminClient
      .from("ad_campaign_metrics")
      .select("campaign_name, campaign_status, impressions, clicks, spend, conversions, ctr, cpc, date")
      .eq("organization_id", organization_id)
      .gte("date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0])
      .order("spend", { ascending: false })
      .limit(20);

    // Busca conexão ativa de Meta Ads
    const { data: adConnection } = await adminClient
      .from("ad_platform_connections")
      .select("account_name, last_synced_at")
      .eq("organization_id", organization_id)
      .eq("platform", "meta_ads")
      .eq("status", "active")
      .maybeSingle();

    let metricsContext = "Sem dados de campanhas ativas ainda.";
    if (adMetrics && adMetrics.length > 0) {
      const totalSpend = adMetrics.reduce((s: number, m: any) => s + (m.spend || 0), 0);
      const totalClicks = adMetrics.reduce((s: number, m: any) => s + (m.clicks || 0), 0);
      const totalConversions = adMetrics.reduce((s: number, m: any) => s + (m.conversions || 0), 0);
      const avgCPL = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "N/A";
      const avgCTR = adMetrics.reduce((s: number, m: any) => s + (m.ctr || 0), 0) / adMetrics.length;

      const topCampaigns = adMetrics.slice(0, 5).map((m: any) =>
        `${m.campaign_name}: R$${m.spend?.toFixed(2)} investido, ${m.clicks} cliques, ${m.conversions} conversões, CPL R$${m.conversions > 0 ? (m.spend / m.conversions).toFixed(2) : "N/A"}, CTR ${m.ctr?.toFixed(2)}%`
      ).join("\n");

      metricsContext = `Conta: ${adConnection?.account_name || "Meta Ads"}
Total investido (30d): R$${totalSpend.toFixed(2)}
Total cliques: ${totalClicks}
Total conversões/leads: ${totalConversions}
CPL médio real: R$${avgCPL}
CTR médio: ${avgCTR.toFixed(2)}%

TOP CAMPANHAS:
${topCampaigns}`;
    }

    // Fetch sales plan
    const { data: salesPlan } = await adminClient
      .from("sales_plans")
      .select("answers")
      .eq("organization_id", organization_id)
      .maybeSingle();

    let salesPlanContext = "";
    if (salesPlan?.answers && Object.keys(salesPlan.answers).length > 3) {
      const sp = salesPlan.answers as Record<string, unknown>;
      const parts: string[] = [];
      if (sp.produtos_servicos) parts.push(`Produtos/Serviços: ${sp.produtos_servicos}`);
      if (sp.diferenciais) parts.push(`Diferenciais: ${sp.diferenciais}`);
      if (sp.dor_principal) parts.push(`Dor do cliente: ${sp.dor_principal}`);
      if (sp.modelo_negocio) parts.push(`Modelo: ${sp.modelo_negocio}`);
      if (sp.ticket_medio) parts.push(`Ticket médio: ${sp.ticket_medio}`);
      if (sp.etapas_funil) parts.push(`Etapas do funil: ${sp.etapas_funil}`);
      if (sp.tem_recorrencia) parts.push(`Recorrência: ${sp.tem_recorrencia}`);
      salesPlanContext = `\nPLANO DE VENDAS:\n${parts.map(p => `- ${p}`).join("\n")}`;
    }

    const strategyContext = strategy?.answers ? JSON.stringify(strategy.answers) : "Nenhuma estratégia de marketing definida";
    const contentsContext = contents?.length
      ? contents.map((c: { title: string; type: string; platform: string; main_message?: string }) => `${c.title} (${c.type}, ${c.platform}) - ${c.main_message || ""}`).join("; ")
      : "Nenhum conteúdo publicado";
    const sitesContext = sites?.length
      ? sites.map((s: { name: string; url?: string; status: string }) => `${s.name}: ${s.url || "sem URL"} (${s.status})`).join("; ")
      : "Nenhum site";
    const postsContext = posts?.length
      ? posts.map((p: { type: string; format?: string; style?: string }) => `${p.type} (${p.format || p.style})`).join("; ")
      : "Nenhum criativo";

    const selectedPlatforms = plataformas.length > 0 ? plataformas.join(", ") : "Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads";
    const publicoText = [...publico, publico_custom].filter(Boolean).join(", ");

    const userPrompt = buildUserPrompt({
      orgName: org?.name || "Empresa",
      orgSegment: org?.segment || "Não definido",
      objetivo,
      produto,
      publicoText,
      pagina_destino,
      orcamento,
      selectedPlatforms,
      regiao,
      ativos,
      strategyContext,
      contentsContext,
      sitesContext,
      postsContext,
      salesPlanContext,
      metricsContext,
    });
    console.log(`[generate-traffic-strategy] prompt_version=${PROMPT_VERSION}`);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, tente novamente em alguns minutos.", code: "RATE_LIMIT" }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
      .update({ is_active: false } as Record<string, unknown>)
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
      } as Record<string, unknown>)
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, strategy: inserted }), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    log.error("generate-traffic-strategy error", { error: String(err) });
    return authErrorResponse(err, getCorsHeaders(req));
  }
});
