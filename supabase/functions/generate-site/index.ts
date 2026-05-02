// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

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

    // API-005: Rate limit por usuario (3/min - geracao muito cara)
    const _rl = await checkRateLimit(_authUser.id, organization_id ?? null, 'generate-site', { windowSeconds: 60, maxRequests: 3 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

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

    const tomDescricao: Record<string, string> = {
      formal: "Formal e corporativo — linguagem profissional, vocabulário técnico",
      descontraido: "Descontraído e amigável — linguagem leve, próxima do leitor",
      tecnico: "Técnico e especializado — foco em dados, especificações, autoridade",
      inspiracional: "Inspiracional e motivador — frases de impacto, storytelling emocional",
    };

    // Build section list for prompt
    const sectionsList = (sections || ["hero", "sobre", "servicos", "contato", "footer"])
      .map((s: string) => `<section id="section-${s}">`)
      .join(", ");

    const systemPrompt = edit_mode
      ? buildEditSystemPrompt()
      : buildGenerateSystemPrompt(sectionsList);

    const userPrompt = edit_mode
      ? buildEditUserPrompt(current_html, edit_instructions)
      : buildGenerateUserPrompt({
          tipo, objetivo, estilo, cta_principal, nome_empresa, slogan, descricao_negocio,
          segmento, servicos, diferencial, faixa_preco, publico_alvo, faixa_etaria, dores,
          depoimentos, numeros_impacto, logos_clientes, cores_principais, fontes_preferidas,
          tom_comunicacao, tomDescricao, referencia_visual, logo_url, telefone, email_contato,
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

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildGenerateSystemPrompt(sectionsList: string) {
  return `Você é um desenvolvedor web expert e designer UI/UX de altíssimo nível. Seu trabalho é gerar código HTML/CSS/JS COMPLETO, RESPONSIVO e PRONTO PARA PRODUÇÃO.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS o código HTML completo, começando com <!DOCTYPE html> e terminando com </html>
2. NÃO inclua markdown, explicações ou texto fora do HTML
3. Todo CSS deve estar em uma tag <style> dentro do <head> (autocontido)
4. Use Google Fonts via CDN (link no head)
5. Design mobile-first com media queries para responsividade
6. Textos REAIS baseados nos dados fornecidos (NUNCA lorem ipsum)
7. OBRIGATÓRIO: Se cores forem fornecidas, use EXATAMENTE essas cores como CSS variables :root. NÃO invente cores diferentes.
8. OBRIGATÓRIO: Se fontes forem fornecidas, use essas fontes via Google Fonts. NÃO use fontes diferentes.
9. Animações suaves com CSS (hover effects, transitions, scroll animations)
10. Meta tags SEO (title, description, og:tags)
11. HTML5 semântico (header, main, section, footer, nav)
12. Formulário de contato estilizado (sem backend, apenas visual)
13. Botões de CTA destacados e chamativos
14. OBRIGATÓRIO: Cada seção do site DEVE ter um id seguindo o padrão: ${sectionsList}. Isso é essencial para edição posterior.
15. Inclua smooth scrolling
16. Adicione ícones usando SVG inline quando necessário
17. O site deve parecer profissional e moderno
18. Use o nome real da empresa em todos os lugares
19. Se houver slogan, use no hero
20. Se houver depoimentos, crie cards de testimonial
21. Se houver números de impacto, crie seção de "Números" com counters visuais
22. Se houver link de WhatsApp, use nos botões de CTA como href
23. OBRIGATÓRIO: Se houver logo_url, inclua <img src="URL_DA_LOGO" alt="Logo NOME_EMPRESA" style="height:48px"> no header E no footer.`;
}

function buildEditSystemPrompt() {
  return `Você é um desenvolvedor web expert. O usuário já tem um site HTML gerado e quer fazer alterações ESPECÍFICAS em seções determinadas.

REGRAS:
1. Retorne o HTML COMPLETO (do <!DOCTYPE html> até </html>)
2. MANTENHA toda a estrutura, design, CSS e layout do HTML original
3. APLIQUE APENAS as alterações solicitadas nas seções indicadas
4. NÃO mude nada que não foi solicitado
5. Mantenha todos os IDs de seção (section-hero, section-sobre, etc.)
6. NÃO inclua markdown ou explicações, apenas o HTML`;
}

function buildGenerateUserPrompt(data: Record<string, any>) {
  const { tipo, objetivo, estilo, cta_principal, nome_empresa, slogan, descricao_negocio,
    segmento, servicos, diferencial, faixa_preco, publico_alvo, faixa_etaria, dores,
    depoimentos, numeros_impacto, logos_clientes, cores_principais, fontes_preferidas,
    tom_comunicacao, tomDescricao, referencia_visual, logo_url, telefone, email_contato,
    endereco, redes_sociais, link_whatsapp, persona, identidade_visual, estrategia,
    instrucoes_adicionais, sections } = data;

  const sectionNames = (sections || []).join(", ");

  return `Gere um site completo com as seguintes especificações:

TIPO DE SITE: ${tipo}
SEÇÕES OBRIGATÓRIAS (cada uma com id="section-NOME"): ${sectionNames}
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
${logo_url ? `- LOGO DA EMPRESA (OBRIGATÓRIO incluir no header e footer): ${logo_url}` : "- Sem logo fornecida"}

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
}

function buildEditUserPrompt(currentHtml: string, editInstructions: Record<string, any>) {
  const instructionsList = Object.entries(editInstructions || {})
    .filter(([_, edit]) => edit.textos || edit.imagem || edit.instrucao)
    .map(([sectionId, edit]) => {
      const parts: string[] = [`Seção: section-${sectionId}`];
      if (edit.textos) parts.push(`  Novos textos: ${edit.textos}`);
      if (edit.imagem) parts.push(`  Imagem: ${edit.imagem}`);
      if (edit.instrucao) parts.push(`  Instrução: ${edit.instrucao}`);
      return parts.join("\n");
    })
    .join("\n\n");

  return `Aqui está o HTML atual do site:

${currentHtml}

ALTERAÇÕES SOLICITADAS:
${instructionsList}

Aplique APENAS essas alterações e retorne o HTML COMPLETO atualizado. Mantenha todo o restante exatamente igual.`;
}
