// @ts-nocheck
// Prompts versionados para generate-site.
// Dois modos: generate (novo site) e edit (editar seções do HTML existente).

export const PROMPT_VERSION = "1.0.0";

const TOM_DESCRICAO: Record<string, string> = {
  formal: "Formal e corporativo — linguagem profissional, vocabulário técnico",
  descontraido: "Descontraído e amigável — linguagem leve, próxima do leitor",
  tecnico: "Técnico e especializado — foco em dados, especificações, autoridade",
  inspiracional: "Inspiracional e motivador — frases de impacto, storytelling emocional",
};

// ── System prompts ────────────────────────────────────────────────────────────

export function buildGenerateSystemPrompt(sectionsList: string): string {
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

export const EDIT_SYSTEM_PROMPT = `Você é um desenvolvedor web expert. O usuário já tem um site HTML gerado e quer fazer alterações ESPECÍFICAS em seções determinadas.

REGRAS:
1. Retorne o HTML COMPLETO (do <!DOCTYPE html> até </html>)
2. MANTENHA toda a estrutura, design, CSS e layout do HTML original
3. APLIQUE APENAS as alterações solicitadas nas seções indicadas
4. NÃO mude nada que não foi solicitado
5. Mantenha todos os IDs de seção (section-hero, section-sobre, etc.)
6. NÃO inclua markdown ou explicações, apenas o HTML`;

// ── User prompt builders ──────────────────────────────────────────────────────

export interface GenerateSiteInput {
  tipo?: string;
  objetivo?: string;
  estilo?: string;
  cta_principal?: string;
  nome_empresa?: string;
  slogan?: string;
  descricao_negocio?: string;
  segmento?: string;
  servicos?: string;
  diferencial?: string;
  faixa_preco?: string;
  publico_alvo?: string;
  faixa_etaria?: string;
  dores?: string;
  depoimentos?: string;
  numeros_impacto?: string;
  logos_clientes?: string;
  cores_principais?: string;
  fontes_preferidas?: string;
  tom_comunicacao?: string;
  referencia_visual?: string;
  logo_url?: string;
  telefone?: string;
  email_contato?: string;
  endereco?: string;
  redes_sociais?: string;
  link_whatsapp?: string;
  instrucoes_adicionais?: string;
  persona?: { nome?: string; descricao?: string };
  identidade_visual?: { paleta?: string; fontes?: string; tom_visual?: string; estilo?: string };
  estrategia?: {
    segmento?: string;
    modelo_negocio?: string;
    cliente_ideal?: string;
    publico?: string;
    diferencial?: string;
    meta_principal?: string;
    objetivo?: string;
  };
  sections?: string[];
}

export function buildGenerateUserPrompt(data: GenerateSiteInput): string {
  const {
    tipo, objetivo, estilo, cta_principal, nome_empresa, slogan, descricao_negocio,
    segmento, servicos, diferencial, faixa_preco, publico_alvo, faixa_etaria, dores,
    depoimentos, numeros_impacto, logos_clientes, cores_principais, fontes_preferidas,
    tom_comunicacao, referencia_visual, logo_url, telefone, email_contato,
    endereco, redes_sociais, link_whatsapp, persona, identidade_visual, estrategia,
    instrucoes_adicionais, sections,
  } = data;

  const sectionNames = (sections || []).join(", ");
  const tomDesc = tom_comunicacao ? (TOM_DESCRICAO[tom_comunicacao] || tom_comunicacao) : (identidade_visual?.tom_visual || "Profissional e confiável");

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
- Tom: ${tomDesc}
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

export interface EditSiteInput {
  current_html: string;
  edit_instructions: Record<string, { textos?: string; imagem?: string; instrucao?: string }>;
}

export function buildEditUserPrompt(data: EditSiteInput): string {
  const { current_html, edit_instructions } = data;

  const instructionsList = Object.entries(edit_instructions || {})
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

${current_html}

ALTERAÇÕES SOLICITADAS:
${instructionsList}

Aplique APENAS essas alterações e retorne o HTML COMPLETO atualizado. Mantenha todo o restante exatamente igual.`;
}

// Convenience wrapper used by the edge fn
export function buildUserPrompt(data: GenerateSiteInput | (EditSiteInput & { edit_mode: true })): string {
  if ("edit_mode" in data && data.edit_mode) {
    return buildEditUserPrompt(data as EditSiteInput);
  }
  return buildGenerateUserPrompt(data as GenerateSiteInput);
}
