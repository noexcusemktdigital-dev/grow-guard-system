import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

// Fixed credit cost per script generation
const CREDIT_COST = 20;

const stagePrompts: Record<string, string> = {
  prospeccao: `Você é um especialista em vendas B2B. Crie um script de PROSPECÇÃO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro passo a passo numerado
- Inclua saudação inicial, qualificação rápida, gancho de valor e CTA
- Marque com [PAUSA] onde o vendedor deve esperar a resposta do prospect
- Inclua 2-3 variações para diferentes cenários (prospect receptivo, ocupado, resistente)
- Use linguagem adequada ao segmento do negócio
- Adapte o vocabulário e referências ao perfil do cliente ideal`,

  diagnostico: `Você é um especialista em vendas consultivas. Crie um script de DIAGNÓSTICO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro de perguntas estratégicas numeradas
- Organize em blocos: Situação Atual, Desafios, Impacto, Solução Ideal
- Inclua perguntas de follow-up para cada resposta possível
- Marque com [ANOTAR] os pontos que o vendedor deve registrar
- Inclua transições suaves entre os blocos de perguntas
- Use exemplos e dados do segmento do negócio`,

  negociacao: `Você é um especialista em negociação comercial. Crie um script de NEGOCIAÇÃO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro com seções: Apresentação de Valor, Proposta, Condições, Fechamento
- Inclua argumentos de valor antes de mencionar preço
- Adicione respostas para objeções de preço comuns
- Marque com [PAUSA] os momentos de escuta ativa
- Inclua técnicas de ancoragem e concessão estratégica
- Use os diferenciais competitivos da empresa como argumentos`,

  fechamento: `Você é um especialista em fechamento de vendas. Crie um script de FECHAMENTO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro com gatilhos de fechamento
- Inclua técnicas: resumo de benefícios, urgência legítima, alternativa de escolha
- Adicione roteiros para diferentes sinais de compra
- Marque com [DECISÃO] os pontos onde pedir o fechamento
- Inclua script de próximos passos pós-aceite`,

  objecoes: `Você é um especialista em contorno de objeções. Crie um script de QUEBRA DE OBJEÇÕES profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Para cada objeção, use o framework: Empatia → Pergunta → Reframe → Evidência → Próximo passo
- Inclua variações de resposta (curta e detalhada)
- Marque com [EXEMPLO] onde incluir um caso real
- Adicione transições para retomar a negociação
- Organize por categoria: preço, timing, concorrência, autoridade`,
};

serve(async (req) => {
  const origin = req.headers.get("origin") || "unknown";
  console.log(`[generate-script] ${req.method} from origin=${origin}`);

  if (req.method === "OPTIONS")
    return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { stage, briefing, context, mode, existingScript, organization_id, referenceLinks, additionalContext } = await req.json();

    if (!stage || !stagePrompts[stage]) {
      return new Response(
        JSON.stringify({ error: "Etapa do funil inválida" }),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Pre-check credits
    if (organization_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: wallet } = await adminClient.from("credit_wallets").select("balance").eq("organization_id", organization_id).maybeSingle();
      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos." }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }
    }

    // Build enriched context from Sales Plan
    const contextBlock = `
CONTEXTO DO NEGÓCIO (extraído automaticamente do Plano de Vendas):
- Segmento: ${context?.segment || "Não informado"}
- Modelo de Negócio: ${context?.modeloNegocio || "Não informado"}
- Produtos/Serviços: ${context?.produtosServicos || (context?.products?.length ? context.products.map((p: { name: string; price: number }) => `${p.name} (R$${p.price})`).join(", ") : "Não cadastrados")}
- Diferenciais Competitivos: ${context?.diferenciais || "Não informados"}
- Dor Principal do Cliente: ${context?.dorPrincipal || "Não informada"}
- Ticket Médio: ${context?.ticketMedio || "Não informado"}
- Canais de Aquisição: ${context?.channels?.length ? context.channels.join(", ") : "Não informados"}
- Tamanho da Equipe: ${context?.teamSize || "Não informado"}
- Tempo Médio de Fechamento: ${context?.tempoFechamento || "Não informado"}
- Etapas do Funil: ${context?.etapasFunil?.length ? context.etapasFunil.join(", ") : "Não definidas"}

INSTRUÇÕES IMPORTANTES:
- Use os dados acima para personalizar CADA parte do script
- O script deve refletir os produtos/serviços reais da empresa
- Os argumentos devem usar os diferenciais competitivos informados
- A linguagem deve ser adequada ao segmento e modelo de negócio
- Se a dor do cliente foi informada, construa o gancho em torno dela
`;

    const briefingBlock = Object.entries(briefing || {})
      .filter(([, v]) => v)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    // Reference links context
    const linksBlock = Array.isArray(referenceLinks) && referenceLinks.length > 0
      ? `\n\nLINKS DE REFERÊNCIA fornecidos pelo usuário (use como inspiração para tom, abordagem e argumentos):
${referenceLinks.map((l: string, i: number) => `${i + 1}. ${l}`).join("\n")}`
      : "";

    // Additional context
    const additionalBlock = additionalContext
      ? `\n\nCONTEXTO ADICIONAL fornecido pelo usuário (use para personalizar o script):
${additionalContext}`
      : "";

    let fullPrompt: string;

    if (mode === "improve" && existingScript) {
      fullPrompt = `Você é um especialista em vendas. Analise e MELHORE o script abaixo, mantendo a estrutura mas aprimorando linguagem, técnicas e efetividade.

SCRIPT ATUAL:
${existingScript}

${contextBlock}

INSTRUÇÕES:
- Mantenha o formato geral mas aprimore cada seção
- Adicione técnicas de vendas mais modernas
- Melhore as transições e CTAs
- Torne a linguagem mais natural e persuasiva
- Use os diferenciais e dados do negócio para personalizar
- Retorne APENAS o script melhorado, sem comentários${linksBlock}${additionalBlock}`;
    } else {
      fullPrompt = `${stagePrompts[stage]}

${contextBlock}

BRIEFING DO USUÁRIO:
${briefingBlock || "Nenhum briefing adicional fornecido."}${linksBlock}${additionalBlock}

IMPORTANTE:
- Retorne APENAS o script, sem introduções ou comentários extras
- O script deve estar pronto para uso imediato pelo vendedor
- Adapte o tom e linguagem ao segmento do negócio
- Use os produtos, diferenciais e dores do cliente informados para personalizar`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const aiResponse = await fetch(
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
            {
              role: "system",
              content:
                "Você é um consultor de vendas sênior brasileiro. Responda sempre em português brasileiro. Seja direto e prático. Personalize ao máximo com base no contexto do negócio fornecido.",
            },
            { role: "user", content: fullPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisições excedido. Tente novamente em alguns minutos.",
          }),
          {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos insuficientes. Faça upgrade do seu plano.",
          }),
          {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar script" }),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const content =
      aiData.choices?.[0]?.message?.content || "Erro ao gerar conteúdo";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Get org id for logging
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: orgData } = await serviceClient.rpc("get_user_org_id", {
      _user_id: userId,
    });

    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Script ${stage}] ${briefingBlock?.substring(0, 200) || "generate"}`,
        output_message: content.substring(0, 500),
        tokens_used: tokensUsed,
        model: "google/gemini-3-flash-preview",
      });

      // Debit credits
      try {
        await serviceClient.rpc("debit_credits", {
          _org_id: orgData,
          _amount: CREDIT_COST,
          _description: `Geração de script (${stage})`,
          _source: "generate-script",
        });
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

    // Generate a suggested title
    const stageLabels: Record<string, string> = {
      prospeccao: "Prospecção",
      diagnostico: "Diagnóstico",
      negociacao: "Negociação",
      fechamento: "Fechamento",
      objecoes: "Quebra de Objeções",
    };

    const suggestedTitle = mode === "improve"
      ? undefined
      : `Script de ${stageLabels[stage]} - ${context?.segment || context?.produtosServicos?.substring(0, 30) || "Geral"}`;

    return new Response(
      JSON.stringify({
        content,
        title: suggestedTitle,
        tags: [stageLabels[stage], context?.segment, context?.modeloNegocio].filter(Boolean),
        tokens_used: tokensUsed,
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
