import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      persona, identidade_visual, servicos, diferencial,
      depoimentos, contato, instrucoes_adicionais, estrategia,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tipoDescricao: Record<string, string> = {
      lp: "Landing Page com 1 página (hero, features, testimonials, CTA, footer)",
      "3pages": "Site com 3 páginas: Home (hero, features, CTA), Sobre (história, equipe), Contato (formulário, mapa, info)",
      "5pages": "Site com 5 páginas: Home, Sobre, Serviços (lista detalhada), Depoimentos, Contato",
      "8pages": "Site com 8 páginas: Home, Sobre, Serviços, Portfólio, Blog, Depoimentos, FAQ, Contato",
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
8. Animações suaves com CSS (hover effects, transitions)
9. Meta tags SEO (title, description, og:tags)
10. HTML5 semântico (header, main, section, footer, nav)
11. Formulário de contato estilizado (sem backend, apenas visual)
12. Botões de CTA destacados e chamativos
13. Se for site multi-página, gere TODAS as páginas em um único HTML usando navegação por âncoras/seções
14. Inclua smooth scrolling
15. Adicione ícones usando SVG inline quando necessário
16. O site deve parecer profissional e moderno, como se tivesse sido feito por uma agência top`;

    const userPrompt = `Gere um site completo com as seguintes especificações:

TIPO: ${tipoDescricao[tipo] || tipo}
OBJETIVO: ${objetivo}
ESTILO VISUAL: ${estilo}
CTA PRINCIPAL: ${cta_principal || "Entre em contato"}

DADOS DA EMPRESA:
- Serviços/Produtos: ${servicos || "Não informado"}
- Diferencial: ${diferencial || "Não informado"}
- Depoimentos: ${depoimentos || "Não informado"}
- Contato: ${contato || "Não informado"}

${persona ? `PERSONA DO CLIENTE:
- Nome: ${persona.nome || "Não definida"}
- Descrição: ${persona.descricao || "Não definida"}` : ""}

${identidade_visual ? `IDENTIDADE VISUAL:
- Paleta de cores: ${identidade_visual.paleta || "Usar cores modernas e profissionais"}
- Fontes: ${identidade_visual.fontes || "Usar Google Fonts modernas"}
- Estilo: ${identidade_visual.estilo || estilo}
- Tom visual: ${identidade_visual.tom_visual || "Profissional e confiável"}` : ""}

${estrategia ? `CONTEXTO ESTRATÉGICO:
- Segmento: ${estrategia.segmento || ""}
- Modelo de negócio: ${estrategia.modelo_negocio || ""}
- Cliente ideal: ${estrategia.cliente_ideal || ""}
- Diferencial competitivo: ${estrategia.diferencial || ""}
- Objetivo de marketing: ${estrategia.meta_principal || ""}` : ""}

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
      return new Response(JSON.stringify({ error: "Erro ao gerar site. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || "";

    // Clean markdown wrappers if present
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
