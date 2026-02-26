import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefing, formatos, estrategia, persona, organization_id, objetivos, materiais } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pre-check credits
    if (organization_id) {
      const { data: wallet } = await supabaseAdmin
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos para esta ação." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const totalConteudos =
      (formatos?.feed || 0) +
      (formatos?.carrossel || 0) +
      (formatos?.reels || 0) +
      (formatos?.story || 0);

    const estrategiaContext = estrategia
      ? `\n\nDados da estratégia ativa do cliente:
Persona: ${estrategia.answers?.persona_nome || "N/A"} — ${estrategia.answers?.persona_descricao || "N/A"}
Segmento: ${estrategia.answers?.segmento || "N/A"}
Tom de voz: ${estrategia.answers?.tom_comunicacao || "N/A"}
Diferenciais: ${estrategia.answers?.diferenciais || "N/A"}
Objetivos: ${estrategia.answers?.objetivo_principal || "N/A"}
Canais: ${estrategia.answers?.canais_ativos || "N/A"}
Nível de maturidade: ${estrategia.nivel || "N/A"} (score: ${estrategia.score_percentage || 0}%)
\nUse estes dados para alinhar 100% dos conteúdos com a estratégia.`
      : "";

    const objetivosText = Array.isArray(objetivos) && objetivos.length > 0
      ? `Objetivos selecionados: ${objetivos.join(", ")}`
      : `Objetivo: ${briefing.objetivo}`;

    const materiaisContext = Array.isArray(materiais) && materiais.length > 0
      ? `\n\nMateriais de apoio fornecidos:\n${materiais.map((m: any, i: number) => `${i + 1}. ${m.type === "link" ? `Link: ${m.url}` : `Arquivo: ${m.name}`}`).join("\n")}\nConsidere estes materiais ao criar os conteúdos.`
      : "";

    const personaContext = persona?.nome || persona?.descricao
      ? `\n\nPERSONA DO PÚBLICO-ALVO:
${persona.nome ? `Nome: ${persona.nome}` : ""}
${persona.descricao ? `Descrição: ${persona.descricao}` : ""}

Adapte TODOS os roteiros, CTAs e embasamentos para este público específico.
Use linguagem, referências e exemplos que ressoem com esta persona.
O tom, vocabulário e nível de complexidade devem ser calibrados para esta persona.`
      : "";

    const systemPrompt = `Você é um estrategista de marketing digital especializado em redes sociais. Sua tarefa é gerar conteúdos mensais completos para uma marca/empresa.
${personaContext}

REGRAS OBRIGATÓRIAS:
- Gere EXATAMENTE ${totalConteudos} conteúdos no total
- Distribua os formatos assim: ${formatos?.feed || 0} Posts Feed, ${formatos?.carrossel || 0} Carrosséis, ${formatos?.reels || 0} Roteiros de Reels/Vídeo, ${formatos?.story || 0} Stories
- Cada conteúdo deve ter roteiro/texto COMPLETO e pronto para uso (não apenas ideias)
- Para Carrosséis: escreva o conteúdo de cada slide (5-10 slides)
- Para Reels: escreva roteiro com timestamps [0-5s], [5-15s] etc
- Para Stories: escreva sequência de 2-4 stories
- Para Feed: escreva legenda completa com parágrafos
- Distribua entre etapas do funil: ~40% Topo, ~35% Meio, ~25% Fundo
- Inclua hashtags relevantes (5-10 por conteúdo)
- IMPORTANTE: Para cada conteúdo, inclua um "embasamento" de 2-3 linhas explicando POR QUE esse formato e conteúdo foram escolhidos, com dados ou lógica de marketing
- Sugira a rede social mais adequada (Instagram, LinkedIn, TikTok)
${estrategiaContext}${materiaisContext}`;

    const userPrompt = `Gere a campanha de conteúdo para o mês de ${briefing.mes} com as seguintes informações:

${objetivosText}
Tema central: ${briefing.tema}
Tom de comunicação: ${briefing.tom}
${briefing.promocoes ? `Promoções/Ofertas: ${briefing.promocoes}` : ""}
${briefing.datas ? `Datas comemorativas: ${briefing.datas}` : ""}
${briefing.destaques ? `Destaques/Novidades: ${briefing.destaques}` : ""}

Gere os ${totalConteudos} conteúdos distribuídos nos formatos solicitados.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
          tools: [
            {
              type: "function",
              function: {
                name: "generate_monthly_content",
                description:
                  "Retorna array de conteúdos gerados para a campanha mensal",
                parameters: {
                  type: "object",
                  properties: {
                    conteudos: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          titulo: { type: "string", description: "Título do conteúdo" },
                          formato: { type: "string", enum: ["Feed", "Carrossel", "Reels", "Story"] },
                          rede: { type: "string", enum: ["Instagram", "LinkedIn", "TikTok"] },
                          funil: { type: "string", enum: ["Topo", "Meio", "Fundo"] },
                          roteiro: { type: "string", description: "Roteiro/texto completo do conteúdo" },
                          hashtags: { type: "array", items: { type: "string" } },
                          embasamento: { type: "string", description: "Explicação de 2-3 linhas sobre POR QUE esse formato e conteúdo foram escolhidos" },
                        },
                        required: ["titulo", "formato", "rede", "funil", "roteiro", "hashtags", "embasamento"],
                        additionalProperties: false,
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
            function: { name: "generate_monthly_content" },
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdos" }),
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

    // Debit credits after successful generation
    if (organization_id) {
      try {
        await supabaseAdmin.rpc("debit_credits", {
          _org_id: organization_id,
          _amount: CREDIT_COST,
          _description: `Geração de ${totalConteudos} conteúdos`,
          _source: "generate-content",
        });
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

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
