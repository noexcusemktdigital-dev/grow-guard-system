import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CREDIT_COST = 100;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const organization_id = body.organization_id;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Debit credits BEFORE generation
    if (organization_id) {
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
            error: isInsufficient
              ? `Créditos insuficientes. Você precisa de ${CREDIT_COST} créditos.`
              : "Erro ao debitar créditos.",
            code: isInsufficient ? "INSUFFICIENT_CREDITS" : "DEBIT_ERROR",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const tipoDescricao: Record<string, string> = {
      lp: "Landing Page com 1 página (hero, features, testimonials, CTA, footer)",
      "3pages": "Site com 3 páginas: Home (hero, features, CTA), Sobre (história, equipe), Contato (formulário, mapa, info)",
      "5pages": "Site com 5 páginas: Home, Sobre, Serviços (lista detalhada), Depoimentos, Contato",
      "8pages": "Site com 8 páginas: Home, Sobre, Serviços, Portfólio, Blog, Depoimentos, FAQ, Contato",
    };

    const tomDescricao: Record<string, string> = {
      formal: "Formal e corporativo — linguagem profissional, vocabulário técnico",
      descontraido: "Descontraído e amigável — linguagem leve, próxima do leitor",
      tecnico: "Técnico e especializado — foco em dados, especificações, autoridade",
      inspiracional: "Inspiracional e motivador — frases de impacto, storytelling emocional",
    };

    const systemPrompt = `Você é um desenvolvedor web expert e designer UI/UX de altíssimo nível. Seu trabalho é gerar código HTML/CSS/JS COMPLETO, RESPONSIVO e PRONTO PARA PRODUÇÃO.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS o código HTML completo, começando com <!DOCTYPE html> e terminando com </html>
2. NÃO inclua markdown, explicações ou texto fora do HTML
3. Todo CSS deve estar em uma tag <style> dentro do <head> (autocontido)
4. Use Google Fonts via CDN (link no head)
5. Design mobile-first com media queries para responsividade
6. Textos REAIS baseados nos dados fornecidos (NUNCA lorem ipsum)
7. Cores e fontes do cliente aplicadas como CSS variables
8. Animações suaves com CSS (hover effects, transitions, scroll animations)
9. Meta tags SEO (title, description, og:tags)
10. HTML5 semântico (header, main, section, footer, nav)
11. Formulário de contato estilizado (sem backend, apenas visual)
12. Botões de CTA destacados e chamativos
13. Se for site multi-página, gere TODAS as páginas em um único HTML usando navegação por âncoras/seções
14. Inclua smooth scrolling
15. Adicione ícones usando SVG inline quando necessário
16. O site deve parecer profissional e moderno, como se tivesse sido feito por uma agência top
17. Use o nome real da empresa em todos os lugares (header, footer, title, meta tags)
18. Se houver slogan, use no hero
19. Se houver depoimentos, crie cards de testimonial com aspas e nome do autor
20. Se houver números de impacto, crie uma seção de "Números" com counters visuais grandes
21. Se houver link de WhatsApp, use nos botões de CTA como href
22. Inclua seção de FAQ quando o tipo permitir`;

    const userPrompt = `Gere um site completo com as seguintes especificações:

TIPO: ${tipoDescricao[tipo] || tipo}
OBJETIVO: ${objetivo}
ESTILO VISUAL: ${estilo}
CTA PRINCIPAL: ${cta_principal || "Entre em contato"}

EMPRESA:
- Nome: ${nome_empresa || "Não informado"}
- Slogan: ${slogan || "Não informado"}
- Descrição: ${descricao_negocio || "Não informado"}
- Segmento: ${segmento || "Não informado"}

SERVIÇOS/PRODUTOS:
- Serviços: ${servicos || "Não informado"}
- Diferencial: ${diferencial || "Não informado"}
- Faixa de preço: ${faixa_preco || "Não informado"}

PÚBLICO-ALVO:
- Cliente ideal: ${publico_alvo || "Não informado"}
- Faixa etária: ${faixa_etaria || "Não informado"}
- Dores que resolve: ${dores || "Não informado"}

PROVA SOCIAL:
- Depoimentos: ${depoimentos || "Não informado"}
- Números de impacto: ${numeros_impacto || "Não informado"}
- Clientes/Parceiros: ${logos_clientes || "Não informado"}

IDENTIDADE VISUAL:
- Cores: ${cores_principais || identidade_visual?.paleta || "Usar cores modernas e profissionais"}
- Fontes: ${fontes_preferidas || identidade_visual?.fontes || "Usar Google Fonts modernas"}
- Tom: ${tom_comunicacao ? tomDescricao[tom_comunicacao] || tom_comunicacao : identidade_visual?.tom_visual || "Profissional e confiável"}
- Estilo: ${identidade_visual?.estilo || estilo}
${referencia_visual ? `- Site de referência: ${referencia_visual}` : ""}

CONTATO:
- Telefone/WhatsApp: ${telefone || "Não informado"}
- Email: ${email_contato || "Não informado"}
- Endereço: ${endereco || "Não informado"}
- Redes sociais: ${redes_sociais || "Não informado"}
- Link WhatsApp para CTA: ${link_whatsapp || "Não informado"}

${persona ? `PERSONA:\n- Nome: ${persona.nome || "Não definida"}\n- Descrição: ${persona.descricao || "Não definida"}` : ""}

${estrategia ? `CONTEXTO ESTRATÉGICO:\n- Segmento: ${estrategia.segmento || ""}\n- Modelo de negócio: ${estrategia.modelo_negocio || ""}\n- Cliente ideal: ${estrategia.cliente_ideal || estrategia.publico || ""}\n- Diferencial competitivo: ${estrategia.diferencial || ""}\n- Objetivo de marketing: ${estrategia.meta_principal || estrategia.objetivo || ""}` : ""}

${instrucoes_adicionais ? `INSTRUÇÕES ADICIONAIS: ${instrucoes_adicionais}` : ""}

Gere o HTML COMPLETO agora.`;

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
      // Refund credits on AI failure
      if (organization_id) {
        try {
          await adminClient
            .from("credit_wallets")
            .update({ balance: adminClient.rpc ? undefined : undefined })
          // Simple refund via direct balance increment
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos para continuar." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar site. Tente novamente. (Créditos foram reembolsados)" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-site error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
