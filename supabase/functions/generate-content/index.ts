// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { parseOrThrow, validationErrorResponse, GenerateSchemas } from '../_shared/schemas.ts';
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-content.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const CREDIT_COST_PER_CONTENT = 30;

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-content');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-content', { windowSeconds: 60, maxRequests: 20 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const rawBody = await req.json();
    const {
      quantidade, formatos, objetivos, tema, plataforma, tom, publico,
      estrategia, funilMomento, contextoEspecial, contextoDetalhe,
      estiloLote, nomeEmpresa, produto, diferencial, doresPublico, desejosPublico,
      organization_id,
    } = parseOrThrow(GenerateSchemas.Content, rawBody);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = Number(quantidade) || 8;
    const totalCreditCost = CREDIT_COST_PER_CONTENT * count;

    // BOLA/IDOR guard + Pre-check + débito condicional ao GPS aprovado
    if (organization_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await assertOrgMember(adminClient, _authUser.id, organization_id);
      const debited = await debitIfGPSDone(
        adminClient, organization_id, totalCreditCost, `Geração de ${count} conteúdo(s)`, "generate-content",
        Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      if (debited === false) {
        // GPS ainda não aprovado: não debita, mas valida saldo mínimo
        const { data: wallet } = await adminClient
          .from("credit_wallets")
          .select("balance")
          .eq("organization_id", organization_id)
          .maybeSingle();
        if (!wallet || wallet.balance < totalCreditCost) {
          return new Response(
            JSON.stringify({ error: `Créditos insuficientes. Você precisa de ${totalCreditCost} créditos para ${count} conteúdos.`, code: "INSUFFICIENT_CREDITS" }),
            { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Build distribution string
    const formatDist = (formatos || [])
      .map((f: { qtd: number; tipo: string }) => `${f.qtd}x ${f.tipo}`)
      .join(", ");

    const objList = (objetivos || []).join(", ");

    // ── STRATEGY CONTEXT (rich extraction) ──
    let estrategiaCtx = "";
    if (estrategia) {
      const icp = estrategia.icp || {};
      const tomComm = estrategia.tomComunicacao || {};
      const pilares = estrategia.pilares || [];
      const funil = estrategia.funil || {};
      const proposta = estrategia.propostaValor;
      const concorrencia = estrategia.analiseConcorrencia;
      const answers = estrategia.answers || {};

      const sections: string[] = [];

      // Company info from answers
      const empresa = answers.empresa || answers.step_0 || "";
      const produtoStrat = answers.produto || answers.step_1 || "";
      const segmento = answers.segmento || answers.step_2 || "";
      if (empresa) sections.push(`Empresa: ${empresa}`);
      if (produtoStrat) sections.push(`Produto/Serviço: ${produtoStrat}`);
      if (segmento) sections.push(`Segmento: ${segmento}`);

      // ICP
      if (icp.nome_persona) sections.push(`Persona: ${icp.nome_persona}`);
      if (icp.descricao) sections.push(`Público-alvo: ${icp.descricao}`);
      if (icp.dores?.length) sections.push(`Dores do público: ${icp.dores.join("; ")}`);
      if (icp.desejos?.length) sections.push(`Desejos do público: ${icp.desejos.join("; ")}`);
      if (icp.objecoes?.length) sections.push(`Objeções comuns: ${icp.objecoes.join("; ")}`);
      if (icp.gatilhos_compra?.length) sections.push(`Gatilhos de compra: ${icp.gatilhos_compra.join("; ")}`);

      // Value proposition
      if (proposta) {
        if (typeof proposta === "string") {
          sections.push(`Proposta de valor: ${proposta}`);
        } else {
          sections.push(`Proposta de valor: ${JSON.stringify(proposta)}`);
        }
      }

      // Tone
      if (tomComm.tom_principal) sections.push(`Tom de comunicação: ${tomComm.tom_principal}`);
      if (tomComm.personalidade_marca?.length) sections.push(`Personalidade da marca: ${tomComm.personalidade_marca.join(", ")}`);
      if (tomComm.palavras_usar?.length) sections.push(`Palavras para USAR: ${tomComm.palavras_usar.join(", ")}`);
      if (tomComm.palavras_evitar?.length) sections.push(`Palavras para EVITAR: ${tomComm.palavras_evitar.join(", ")}`);

      // Pillars
      if (pilares.length) {
        const pilarNames = pilares.map((p: unknown) =>
          typeof p === "string" ? p : p.nome || p.pilar || p.name || JSON.stringify(p)
        );
        sections.push(`Pilares de conteúdo: ${pilarNames.join(", ")}`);
      }

      // Funnel
      if (funil && Object.keys(funil).length > 0) {
        sections.push(`Funil de aquisição: ${JSON.stringify(funil)}`);
      }

      // Competition
      if (concorrencia) {
        sections.push(`Análise de concorrência: ${typeof concorrencia === "string" ? concorrencia : JSON.stringify(concorrencia)}`);
      }

      estrategiaCtx = `
ESTRATÉGIA DE MARKETING ATIVA DO CLIENTE:
${sections.map(s => `- ${s}`).join("\n")}

IMPORTANTE: Use TODOS estes dados para personalizar cada conteúdo. Respeite o tom de voz, use as palavras indicadas, aborde as dores e desejos do público, e evite as palavras listadas.`;
    }

    // ── SALES PLAN CONTEXT ──
    let salesPlanCtx = "";
    if (organization_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: salesPlan } = await adminClient
        .from("sales_plans")
        .select("answers")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (salesPlan?.answers && Object.keys(salesPlan.answers).length > 3) {
        const sp = salesPlan.answers as Record<string, unknown>;
        const parts: string[] = [];
        if (sp.produtos_servicos) parts.push(`Produtos/Serviços: ${sp.produtos_servicos}`);
        if (sp.diferenciais) parts.push(`Diferenciais: ${sp.diferenciais}`);
        if (sp.dor_principal) parts.push(`Dor do cliente: ${sp.dor_principal}`);
        if (sp.segmento) parts.push(`Segmento: ${sp.segmento}`);
        if (sp.modelo_negocio) parts.push(`Modelo: ${sp.modelo_negocio}`);
        if (sp.ticket_medio) parts.push(`Ticket médio: ${sp.ticket_medio}`);
        if (parts.length > 0) {
          salesPlanCtx = `
CONTEXTO DO PLANO DE VENDAS:
${parts.map(p => `- ${p}`).join("\n")}
Use estas informações para personalizar os conteúdos com dados reais do negócio.`;
        }
      }
    }

    // ── MANUAL BUSINESS INFO (when no strategy) ──
    let manualCtx = "";
    if (!estrategia && (nomeEmpresa || produto || diferencial || doresPublico || desejosPublico)) {
      const parts: string[] = [];
      if (nomeEmpresa) parts.push(`Empresa: ${nomeEmpresa}`);
      if (produto) parts.push(`Produto/Serviço: ${produto}`);
      if (diferencial) parts.push(`Diferencial: ${diferencial}`);
      if (publico) parts.push(`Público-alvo: ${publico}`);
      if (doresPublico) parts.push(`Dores do público: ${doresPublico}`);
      if (desejosPublico) parts.push(`Desejos do público: ${desejosPublico}`);
      manualCtx = `
INFORMAÇÕES DO NEGÓCIO:
${parts.map(p => `- ${p}`).join("\n")}
Use estas informações para personalizar os conteúdos.`;
    }

    // ── FUNNEL CONTEXT ──
    let funilCtx = "";
    if (funilMomento) {
      const funilMap: Record<string, string> = {
        topo: "TOPO DE FUNIL — Conteúdos para atrair e educar novos públicos. Foco em awareness, dicas práticas, curiosidades e problemas comuns.",
        meio: "MEIO DE FUNIL — Conteúdos para nutrir e gerar consideração. Foco em aprofundamento, cases, comparações e autoridade.",
        fundo: "FUNDO DE FUNIL — Conteúdos para converter e vender. Foco em ofertas, provas sociais, depoimentos, urgência e CTAs diretos.",
      };
      funilCtx = funilMap[funilMomento] || "";
    }

    // ── SPECIAL CONTEXT ──
    let specialCtx = "";
    if (contextoEspecial && contextoEspecial !== "nenhum") {
      specialCtx = `CONTEXTO ESPECIAL: ${contextoEspecial}${contextoDetalhe ? ` — ${contextoDetalhe}` : ""}. Adapte os conteúdos a este contexto.`;
    }

    // ── STYLE ──
    let styleCtx = "";
    if (estiloLote) {
      styleCtx = `ESTILO DESTE LOTE: ${estiloLote}. Ajuste a profundidade e linguagem conforme essa diretriz.`;
    }

    const systemPrompt = buildSystemPrompt({
      count,
      formatDist,
      objList,
      plataforma,
      tom,
      publico,
      tema,
      funilCtx,
      specialCtx,
      styleCtx,
      estrategiaCtx,
      manualCtx,
      salesPlanCtx,
    });
    const userPrompt = buildUserPrompt(count);
    log.info(`prompt_version=${PROMPT_VERSION}`);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_batch_content",
                description: "Retorna o lote de conteúdos gerados",
                parameters: {
                  type: "object",
                  properties: {
                    conteudos: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          titulo: { type: "string" },
                          formato: { type: "string" },
                          objetivo: { type: "string" },
                          conteudo_principal: { description: "Estrutura conforme formato" },
                          legenda: { type: "string" },
                          headlines: { type: "array", items: { type: "string" } },
                          hashtags: { type: "array", items: { type: "string" } },
                          embasamento: { type: "string" },
                        },
                        required: ["titulo", "formato", "objetivo", "conteudo_principal", "legenda", "headlines", "hashtags", "embasamento"],
                      },
                    },
                  },
                  required: ["conteudos"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_batch_content" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Resposta inesperada da IA" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (e) {
    const valResp = validationErrorResponse(e, getCorsHeaders(req));
    if (valResp) return valResp;
    console.error("generate-content error:", e);
    return authErrorResponse(e, getCorsHeaders(req));
  }
});
