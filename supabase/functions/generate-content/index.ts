import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CREDIT_COST_PER_CONTENT = 200;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      quantidade, formatos, objetivos, tema, plataforma, tom, publico,
      estrategia, funilMomento, contextoEspecial, contextoDetalhe,
      estiloLote, nomeEmpresa, produto, diferencial, doresPublico, desejosPublico,
      organization_id,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = Number(quantidade) || 8;
    const totalCreditCost = CREDIT_COST_PER_CONTENT * count;

    // Pre-check credits
    if (organization_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: wallet } = await adminClient
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (!wallet || wallet.balance < totalCreditCost) {
        return new Response(
          JSON.stringify({ error: `Créditos insuficientes. Você precisa de ${totalCreditCost} créditos para ${count} conteúdos.`, code: "INSUFFICIENT_CREDITS" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build distribution string
    const formatDist = (formatos || [])
      .map((f: any) => `${f.qtd}x ${f.tipo}`)
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
        const pilarNames = pilares.map((p: any) =>
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
        const sp = salesPlan.answers as Record<string, any>;
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

    const systemPrompt = `Você é um estrategista de marketing digital de alto nível. Sua tarefa é gerar um LOTE de ${count} conteúdos completos, estratégicos e prontos para uso.

${estrategiaCtx}
${manualCtx}
${salesPlanCtx}

DISTRIBUIÇÃO DE FORMATOS: ${formatDist || "decidir pela IA"}
OBJETIVOS SELECIONADOS: ${objList || "educar, autoridade, engajamento, vender"}
PLATAFORMA: ${plataforma || "Instagram"}
TOM: ${tom || "definido pela estratégia ou educativo e direto"}
PÚBLICO: ${publico || "definido pela estratégia"}
${tema ? `TEMA DIRECIONADOR: ${tema}` : "Use os pilares da estratégia como base temática."}
${funilCtx ? `\n${funilCtx}` : ""}
${specialCtx ? `\n${specialCtx}` : ""}
${styleCtx ? `\n${styleCtx}` : ""}

REGRAS DE DISTRIBUIÇÃO DE OBJETIVOS:
- ~40% educação/educar
- ~30% autoridade
- ~20% prova social / engajamento
- ~10% oferta / venda
Distribua os objetivos proporcionalmente entre os ${count} conteúdos.

PARA CADA CONTEÚDO, gere a estrutura conforme o formato:

CARROSSEL: conteudo_principal = array de objetos {slide_numero, titulo, texto} (6-8 slides)
POST ÚNICO: conteudo_principal = {headline, texto, cta}
ROTEIRO DE VÍDEO: conteudo_principal = {hook, desenvolvimento, conclusao, cta, texto_tela}
STORY: conteudo_principal = array de {frame_numero, texto, acao}
ARTIGO: conteudo_principal = {titulo, introducao, secoes: [{subtitulo, texto}], conclusao}
POST EDUCATIVO: conteudo_principal = {headline, texto, dica_pratica, cta}
POST DE AUTORIDADE: conteudo_principal = {headline, texto, dado_autoridade, cta}

Cada conteúdo DEVE ter: titulo, formato, objetivo, conteudo_principal, legenda (completa com emojis), headlines (3 variações), hashtags (5-8), embasamento (por que funciona).

REGRAS DE QUALIDADE:
- Cada conteúdo deve abordar uma dor ou desejo ESPECÍFICO do público
- Use o tom de voz definido de forma consistente
- Inclua gatilhos mentais relevantes (escassez, autoridade, prova social, reciprocidade)
- As legendas devem ter gancho forte na primeira linha
- Os CTAs devem ser claros e acionáveis
- Varie os ângulos — não repita a mesma abordagem

Gere conteúdos COMPLETOS, prontos para publicar. Não gere apenas ideias.`;

    const userPrompt = `Gere exatamente ${count} conteúdos estratégicos seguindo a distribuição solicitada. Retorne no formato da tool.`;

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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Resposta inesperada da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
