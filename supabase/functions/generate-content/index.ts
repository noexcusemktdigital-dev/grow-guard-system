import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { quantidade, formatos, objetivos, tema, plataforma, tom, publico, estrategia } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = Number(quantidade) || 8;

    // Build distribution string
    const formatDist = (formatos || [])
      .map((f: any) => `${f.qtd}x ${f.tipo}`)
      .join(", ");

    const objList = (objetivos || []).join(", ");

    // Strategy context
    let estrategiaCtx = "";
    if (estrategia) {
      const r = estrategia.strategy_result || {};
      const a = estrategia.answers || {};
      estrategiaCtx = `
ESTRATÉGIA ATIVA DO CLIENTE:
- Empresa: ${a.empresa || a.step_0 || "N/A"}
- Produto: ${a.produto || a.step_1 || "N/A"}
- Público-alvo: ${a.publico || a.step_3 || "N/A"}
- Problema: ${a.problema || a.step_4 || "N/A"}
- Diferencial: ${a.diferencial || a.step_6 || "N/A"}
- Objetivo: ${a.objetivo || a.step_9 || "N/A"}
${r.proposta_valor ? `- Proposta de valor: ${JSON.stringify(r.proposta_valor)}` : ""}
${r.estrategia_conteudo ? `- Pilares: ${JSON.stringify(r.estrategia_conteudo)}` : ""}
${r.icp ? `- ICP: ${JSON.stringify(r.icp)}` : ""}
Use estes dados para alinhar 100% dos conteúdos com a estratégia.`;
    }

    const systemPrompt = `Você é um estrategista de marketing digital. Sua tarefa é gerar um LOTE de ${count} conteúdos completos e prontos para uso.

${estrategiaCtx}

DISTRIBUIÇÃO DE FORMATOS: ${formatDist || "decidir pela IA"}
OBJETIVOS SELECIONADOS: ${objList || "educar, autoridade, engajamento, vender"}
PLATAFORMA: ${plataforma || "Instagram"}
TOM: ${tom || "educativo e direto"}
PÚBLICO: ${publico || "definido pela estratégia"}
${tema ? `TEMA DIRECIONADOR: ${tema}` : "Use os pilares da estratégia como base temática."}

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
