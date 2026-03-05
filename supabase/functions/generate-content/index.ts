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
    const { tema, formato, objetivo, mensagem_principal, cta, estrategia } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build strategy context
    let estrategiaContext = "";
    if (estrategia) {
      const r = estrategia.strategy_result || {};
      const a = estrategia.answers || {};
      estrategiaContext = `
DADOS DA ESTRATÉGIA ATIVA DO CLIENTE:
- Empresa: ${a.empresa || "N/A"}
- Produto: ${a.produto || "N/A"}
- Público-alvo: ${a.publico || "N/A"}
- Problema que resolve: ${a.problema || "N/A"}
- Diferencial: ${a.diferencial || "N/A"}
- Objetivo de marketing: ${a.objetivo || "N/A"}
${r.posicionamento ? `- Posicionamento: ${JSON.stringify(r.posicionamento)}` : ""}
${r.persona ? `- Persona: ${JSON.stringify(r.persona)}` : ""}
${r.pilares_conteudo ? `- Pilares de conteúdo: ${JSON.stringify(r.pilares_conteudo)}` : ""}

Use estes dados para alinhar 100% do conteúdo com a estratégia do cliente.`;
    }

    // Format-specific instructions
    const formatInstructions: Record<string, string> = {
      "carrossel": `Para CARROSSEL, gere uma estrutura de slides:
- Slide 1: Gancho forte (pergunta ou dado impactante)
- Slide 2: Introdução do problema
- Slide 3: Aprofundamento
- Slide 4: Reflexão
- Slide 5: Solução
- Slide 6: Benefício
- Slide 7: Reforço de autoridade
- Slide 8: CTA
Cada slide deve ter título curto + texto de 2-3 linhas.
O campo "conteudo_principal" deve ser um array de objetos com "slide_numero", "titulo" e "texto".`,

      "post_unico": `Para POST ÚNICO, gere:
- headline impactante
- texto principal completo (3-5 parágrafos)
- CTA final
O campo "conteudo_principal" deve ser um objeto com "headline", "texto" e "cta".`,

      "roteiro_video": `Para ROTEIRO DE VÍDEO, gere:
- Hook inicial [0-3s]
- Contexto/Problema [3-15s]
- Desenvolvimento [15-40s]
- Solução/Resultado [40-55s]
- CTA [55-60s]
Inclua também sugestões de texto na tela e legenda do vídeo.
O campo "conteudo_principal" deve ser um objeto com "hook", "desenvolvimento", "conclusao", "cta", "texto_tela" e "legenda_video".`,

      "thread": `Para THREAD, gere uma sequência de 5-8 tweets/posts conectados:
- Tweet 1: Gancho
- Tweets 2-6: Desenvolvimento (1 ideia por tweet)
- Tweet final: CTA
O campo "conteudo_principal" deve ser um array de objetos com "numero" e "texto".`,

      "artigo_curto": `Para ARTIGO CURTO, gere:
- Título SEO-friendly
- Introdução (1 parágrafo)
- 3-4 subtítulos com conteúdo
- Conclusão com CTA
O campo "conteudo_principal" deve ser um objeto com "titulo", "introducao", "secoes" (array com "subtitulo" e "texto") e "conclusao".`,
    };

    const formatKey = formato?.toLowerCase().replace(/ /g, "_") || "post_unico";
    const formatInstruction = formatInstructions[formatKey] || formatInstructions["post_unico"];

    const systemPrompt = `Você é um estrategista de marketing digital especializado em criação de conteúdo.
Sua tarefa é gerar UM conteúdo completo e pronto para uso.
${estrategiaContext}

FORMATO SOLICITADO: ${formato}
${formatInstruction}

REGRAS:
- O conteúdo deve ser completo, pronto para usar (não apenas ideias)
- Adapte a linguagem ao público-alvo e posicionamento da marca
- O CTA deve ser natural e alinhado ao objetivo
- Gere 5 variações de headline criativas
- A legenda deve ser completa para redes sociais (com emojis, quebras de linha)
- Sugira hashtags relevantes (5-10)
- A pergunta de engajamento deve estimular comentários
- O embasamento deve explicar por que esse conteúdo funciona`;

    const userPrompt = `Gere um conteúdo com as seguintes informações:
- Tema: ${tema}
- Formato: ${formato}
- Objetivo: ${objetivo}
- Mensagem principal: ${mensagem_principal || "A critério da IA, baseado no tema e estratégia"}
- CTA desejado: ${cta}`;

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
                name: "generate_content",
                description: "Retorna o conteúdo gerado com estrutura completa",
                parameters: {
                  type: "object",
                  properties: {
                    titulo: { type: "string", description: "Título principal do conteúdo" },
                    conteudo_principal: {
                      description: "Estrutura do conteúdo conforme formato (slides para carrossel, hook/dev/cta para vídeo, etc.)",
                    },
                    legenda: { type: "string", description: "Legenda completa para redes sociais com emojis" },
                    headlines: {
                      type: "array",
                      items: { type: "string" },
                      description: "5 variações de headline",
                    },
                    pergunta_engajamento: { type: "string", description: "Pergunta para estimular comentários" },
                    hashtags: {
                      type: "array",
                      items: { type: "string" },
                      description: "5-10 hashtags relevantes",
                    },
                    embasamento: { type: "string", description: "Explicação de por que este conteúdo funciona (2-3 linhas)" },
                  },
                  required: ["titulo", "conteudo_principal", "legenda", "headlines", "pergunta_engajamento", "hashtags", "embasamento"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_content" },
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
