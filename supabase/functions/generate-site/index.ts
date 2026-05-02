// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import {
  PROMPT_VERSION,
  buildGenerateSystemPrompt,
  EDIT_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
  buildEditUserPrompt,
} from '../_shared/prompts/generate-site.ts';

const CREDIT_COST = 100;

serve(async (req) => {
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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-site', { windowSeconds: 60, maxRequests: 10 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const body = await req.json();
    const {
      tipo, objetivo, estilo, cta_principal,
      nome_empresa, slogan, descricao_negocio, segmento,
      servicos, diferencial, faixa_preco,
      publico_alvo, faixa_etaria, dores,
      depoimentos, numeros_impacto, logos_clientes,
      cores_principais, fontes_preferidas, tom_comunicacao, referencia_visual,
      telefone, email_contato, endereco, redes_sociais, link_whatsapp,
      instrucoes_adicionais,
      persona, identidade_visual, estrategia,
      logo_url,
      sections,
      edit_mode, current_html, edit_instructions,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const organization_id = body.organization_id;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Skip credit debit on edit mode and before GPS is approved
    if (!edit_mode && organization_id) {
      const { data: gpsApproved } = await adminClient
        .from("marketing_strategies")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (!gpsApproved) {
        console.log("GPS not yet approved — skipping credit debit");
      } else {
        const { error: debitError } = await adminClient.rpc("debit_credits", {
          _org_id: organization_id,
          _amount: CREDIT_COST,
          _description: "Geração de site com IA",
          _source: "generate-site",
        });
        if (debitError) {
          const isInsufficient = debitError.message?.includes("INSUFFICIENT_CREDITS") || debitError.message?.includes("WALLET_NOT_FOUND");
          return new Response(
            JSON.stringify({
              error: isInsufficient ? `Créditos insuficientes. Você precisa de ${CREDIT_COST} créditos.` : "Erro ao debitar créditos.",
              code: isInsufficient ? "INSUFFICIENT_CREDITS" : "DEBIT_ERROR",
            }),
            { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`[generate-site] PROMPT_VERSION=${PROMPT_VERSION}`);

    // Build section list for prompt
    const sectionsList = (sections || ["hero", "sobre", "servicos", "contato", "footer"])
      .map((s: string) => `<section id="section-${s}">`)
      .join(", ");

    const systemPrompt = edit_mode
      ? EDIT_SYSTEM_PROMPT
      : buildGenerateSystemPrompt(sectionsList);

    const userPrompt = edit_mode
      ? buildEditUserPrompt({ current_html, edit_instructions })
      : buildGenerateUserPrompt({
          tipo, objetivo, estilo, cta_principal, nome_empresa, slogan, descricao_negocio,
          segmento, servicos, diferencial, faixa_preco, publico_alvo, faixa_etaria, dores,
          depoimentos, numeros_impacto, logos_clientes, cores_principais, fontes_preferidas,
          tom_comunicacao, referencia_visual, logo_url, telefone, email_contato,
          endereco, redes_sociais, link_whatsapp, persona, identidade_visual, estrategia,
          instrucoes_adicionais, sections,
        });

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
        stream: false,
      }),
    });

    if (!response.ok) {
      // Refund credits on AI failure (only if not edit mode)
      if (!edit_mode && organization_id) {
        try {
          const { data: wallet } = await adminClient
            .from("credit_wallets")
            .select("balance")
            .eq("organization_id", organization_id)
            .maybeSingle();
          if (wallet) {
            await adminClient
              .from("credit_wallets")
              .update({ balance: wallet.balance + CREDIT_COST, updated_at: new Date().toISOString() })
              .eq("organization_id", organization_id);
            await adminClient
              .from("credit_transactions")
              .insert({
                organization_id,
                type: "refund",
                amount: CREDIT_COST,
                balance_after: wallet.balance + CREDIT_COST,
                description: "Reembolso - falha na geração de site",
                metadata: { source: "generate-site-refund" },
              });
          }
        } catch (refundErr) {
          console.error("Refund failed:", refundErr);
        }
      }

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar site. Tente novamente." + (!edit_mode ? " (Créditos foram reembolsados)" : "") }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

    return new Response(JSON.stringify({ html }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-site error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

