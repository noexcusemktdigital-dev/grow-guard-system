// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

const CREDIT_COST = 50;

// ── TOOL SCHEMAS ────────────────────────────────────────────────────

const GPS_DIAGNOSIS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera o diagnóstico GPS do negócio com scores de marketing e comercial, radar 5 eixos, persona, análise de concorrência e análise ECE.",
    parameters: {
      type: "object",
      properties: {
        resumo_executivo: { type: "string", description: "Resumo executivo de 3-4 parágrafos" },
        resumo_cliente: {
          type: "object",
          properties: {
            nome_empresa: { type: "string" },
            segmento: { type: "string" },
            proposta_valor: { type: "string" },
            diferencial: { type: "string" },
            modelo_negocio: { type: "string" },
          },
          required: ["nome_empresa", "segmento", "proposta_valor", "diferencial", "modelo_negocio"],
        },
        score_marketing: { type: "integer", description: "Score de marketing de 0-100, OBRIGATORIAMENTE número inteiro, nunca decimal" },
        score_comercial: { type: "integer", description: "Score comercial de 0-100, OBRIGATORIAMENTE número inteiro, nunca decimal" },
        diagnostico_gps: {
          type: "object",
          properties: {
            score_geral: { type: "integer", description: "Média ponderada dos scores de marketing e comercial, 0-100, OBRIGATORIAMENTE inteiro" },
            nivel: { type: "string", description: "Crítico (0-25), Básico (26-50), Intermediário (51-75), Avançado (76-100)" },
            descricao: { type: "string" },
            radar_data: {
              type: "array",
              items: {
                type: "object",
                properties: { eixo: { type: "string" }, score: { type: "number" }, max: { type: "number" } },
                required: ["eixo", "score", "max"],
              },
              description: "5 eixos: Conteúdo, Tráfego, Web, Sales, Escala. Score 0-100 cada.",
            },
            problemas_por_etapa: {
              type: "object",
              properties: {
                conteudo: { type: "array", items: { type: "string" } },
                trafego: { type: "array", items: { type: "string" } },
                web: { type: "array", items: { type: "string" } },
                sales: { type: "array", items: { type: "string" } },
                validacao: { type: "array", items: { type: "string" } },
              },
              required: ["conteudo", "trafego", "web", "sales", "validacao"],
            },
            gargalos_ece: {
              type: "object",
              properties: {
                estrutura: { type: "string", description: "Problemas na Estrutura (E de ECE) — site, CRM, funil, processos" },
                coleta: { type: "string", description: "Problemas na Coleta de dados (C de ECE) — métricas, tráfego, leads" },
                escala: { type: "string", description: "Problemas na Escala (E de ECE) — validação, crescimento, capacidade" },
              },
              required: ["estrutura", "coleta", "escala"],
            },
            insights: { type: "array", items: { type: "string" }, description: "3-5 insights personalizados" },
          },
          required: ["score_geral", "nivel", "descricao", "radar_data", "problemas_por_etapa", "gargalos_ece", "insights"],
        },
        persona: {
          type: "object",
          properties: {
            descricao: { type: "string", description: "Descrição narrativa da persona ideal" },
            faixa_etaria: { type: "string" },
            genero: { type: "string" },
            canais: { type: "array", items: { type: "string" } },
            dor_principal: { type: "string" },
            decisao_compra: { type: "string" },
            poder_aquisitivo: { type: "string" },
          },
          required: ["descricao", "faixa_etaria", "canais", "dor_principal", "decisao_compra"],
        },
        analise_concorrencia: {
          type: "object",
          properties: {
            concorrentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  pontos_fortes: { type: "array", items: { type: "string" } },
                  pontos_fracos: { type: "array", items: { type: "string" } },
                  oportunidades: { type: "array", items: { type: "string" } },
                },
                required: ["nome", "pontos_fortes", "pontos_fracos", "oportunidades"],
              },
            },
            diferencial_empresa: { type: "string" },
            posicionamento_recomendado: { type: "string" },
          },
          required: ["concorrentes", "diferencial_empresa", "posicionamento_recomendado"],
        },
        tom_comunicacao: {
          type: "object",
          description: "Tom de voz e comunicação da marca baseado nas respostas do briefing",
          properties: {
            tom_principal: { type: "string", description: "Tom principal da comunicação (ex: Educativo e acessível, Profissional e inspirador)" },
            personalidade_marca: { type: "array", items: { type: "string" }, description: "3-5 traços de personalidade da marca" },
            palavras_usar: { type: "array", items: { type: "string" }, description: "5-8 palavras/expressões que a marca deve usar" },
            palavras_evitar: { type: "array", items: { type: "string" }, description: "5-8 palavras/expressões que a marca deve evitar" },
            exemplo_mensagem: { type: "string", description: "Exemplo de mensagem no tom ideal da marca" },
            nivel_formalidade: { type: "string", description: "Nível de formalidade: Casual, Equilibrado, Formal" },
          },
          required: ["tom_principal", "personalidade_marca", "palavras_usar", "palavras_evitar"],
        },
        kpis_hero: {
          type: "object",
          properties: {
            meta_faturamento: { type: "string" },
            ticket_medio: { type: "string" },
            recorrencia: { type: "string" },
            ltv_cac: { type: "string" },
          },
          required: ["meta_faturamento", "ticket_medio", "recorrencia", "ltv_cac"],
        },
      },
      required: ["resumo_executivo", "resumo_cliente", "score_marketing", "score_comercial", "diagnostico_gps", "persona", "analise_concorrencia", "tom_comunicacao", "kpis_hero"],
      additionalProperties: false,
    },
  },
};

const STRATEGIC_PLAN_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera o planejamento estratégico das 5 etapas NoExcuse.",
    parameters: {
      type: "object",
      properties: {
        etapas: {
          type: "object",
          properties: {
            conteudo: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                diagnostico: { type: "string" },
                score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } },
                acoes: { type: "array", items: { type: "string" }, description: "5-8 ações específicas" },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } },
                entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            trafego: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            web: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            sales: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            validacao: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
          },
          required: ["conteudo", "trafego", "web", "sales", "validacao"],
        },
      },
      required: ["etapas"],
      additionalProperties: false,
    },
  },
};

const PROJECTIONS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera projeções financeiras, unit economics e entregáveis para calculadora.",
    parameters: {
      type: "object",
      properties: {
        projecoes: {
          type: "object",
          properties: {
            unit_economics: {
              type: "object",
              properties: {
                cac: { type: "string" }, ltv: { type: "string" }, ltv_cac_ratio: { type: "string" },
                ticket_medio: { type: "string" }, margem: { type: "string" },
              },
              required: ["cac", "ltv", "ltv_cac_ratio", "ticket_medio", "margem"],
            },
            funil_conversao: {
              type: "array",
              items: {
                type: "object",
                properties: { etapa: { type: "string" }, volume: { type: "number" }, taxa: { type: "string" } },
                required: ["etapa", "volume", "taxa"],
              },
            },
            projecao_mensal: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "number" }, leads: { type: "number" }, clientes: { type: "number" }, receita: { type: "number" }, investimento: { type: "number" } },
                required: ["mes", "leads", "clientes", "receita", "investimento"],
              },
              description: "Projeção de 6 meses",
            },
            crescimento_acumulado: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "number" }, receita_acumulada: { type: "number" }, clientes_acumulados: { type: "number" } },
                required: ["mes", "receita_acumulada", "clientes_acumulados"],
              },
            },
          },
          required: ["unit_economics", "funil_conversao", "projecao_mensal", "crescimento_acumulado"],
        },
        entregaveis_calculadora: {
          type: "array",
          items: {
            type: "object",
            properties: {
              service_id: { type: "string", description: "ID do serviço no catálogo NoExcuse. IDs válidos: logo-manual, material-marca, midia-off, naming, registro-inpi, ebook, apresentacao-comercial, artes-organicas, videos-reels, programacao-meta, programacao-linkedin, programacao-tiktok, programacao-youtube, capa-destaques, criacao-avatar, template-canva, edicao-youtube, gestao-meta, gestao-google, gestao-linkedin, gestao-tiktok, config-gmb, artes-campanha, videos-campanha, pagina-site, lp-link-bio, lp-vsl, lp-vendas, lp-captura, lp-ebook, alterar-contato, alterar-secao, ecommerce, config-crm" },
              service_name: { type: "string" },
              quantity: { type: "number" },
              justificativa: { type: "string" },
              etapa: { type: "string", enum: ["conteudo", "trafego", "web", "sales", "validacao"], description: "Etapa do plano estratégico à qual este entregável pertence" },
            },
            required: ["service_id", "service_name", "quantity", "justificativa", "etapa"],
          },
          description: "Lista de serviços do catálogo NoExcuse necessários para executar o plano. Cada item deve estar vinculado à etapa estratégica correspondente.",
        },
      },
      required: ["projecoes", "entregaveis_calculadora"],
      additionalProperties: false,
    },
  },
};

// ── SYSTEM PROMPTS ──────────────────────────────────────────────────

const GPS_PROMPT = `Você é um estrategista de negócios sênior da No Excuse Digital. Analise o briefing e gere o DIAGNÓSTICO GPS DO NEGÓCIO.

METODOLOGIA NO EXCUSE:

- 5 Etapas Estratégicas: Conteúdo e Linha Editorial, Tráfego e Distribuição, Web e Conversão, Sales e Fechamento, Validação e Escala

- Framework ECE: Estrutura → Coleta de dados → Escala

IMPORTANTE — SCORE AUTOMÁTICO:

Calcule o score de MARKETING (0-100) e o score COMERCIAL (0-100) automaticamente com base nas respostas do briefing, SEM depender de autoavaliação do cliente. Analise:

- Score Marketing: conteúdo, tráfego, presença web, funil, métricas de marketing

- Score Comercial: processo de vendas, CRM, follow-up, taxa de conversão, time comercial, métricas comerciais

Use indicadores reais de mercado como benchmark:

- Marketing: taxa de engajamento média 1-3%, CTR 1-2%, CPL referência por segmento

- Comercial: taxa de conversão média 10-20%, tempo de fechamento, LTV/CAC > 3x

CAPACIDADE OPERACIONAL:

- Analise quantos clientes/pacientes/atendimentos o negócio consegue realizar por semana/mês

- Se for profissional liberal (psicólogo, dentista, advogado, médico), considere limitação de agenda

- Se for produto/e-commerce, considere capacidade logística e estoque

- Se informado no briefing, use o dado real. Senão, estime com base no segmento

RECORRÊNCIA DO MODELO DE NEGÓCIO:

- Identifique se o modelo de receita é recorrente (assinatura, sessão semanal, mensalidade) ou avulso (venda única)

- Para serviços recorrentes: o LTV deve refletir MESES de permanência, não apenas 1 compra

- Isso impacta diretamente o cálculo de LTV, receita projetada e meta de novos clientes

GERE:

1. RESUMO EXECUTIVO: 3-4 parágrafos sobre a empresa, momento atual e oportunidades

2. RESUMO DO CLIENTE: Nome, segmento, proposta de valor, diferencial, modelo de negócio

3. SCORE MARKETING (0-100) e SCORE COMERCIAL (0-100)

4. DIAGNÓSTICO GPS:

   - Score geral (média ponderada dos dois scores)

   - Nível: Crítico (0-25), Básico (26-50), Intermediário (51-75), Avançado (76-100)

   - Radar com 5 eixos (Conteúdo, Tráfego, Web, Sales, Escala) score 0-100 cada

   - Problemas identificados por etapa (2-4 por etapa)

   - Gargalos ECE: Estrutura, Coleta de dados, Escala

   - 3-5 insights personalizados — INCLUA alertas sobre gaps entre projeção e meta, limitações de capacidade operacional e oportunidades de recorrência

5. PERSONA: Crie uma persona detalhada baseada nas respostas sobre público-alvo

6. ANÁLISE DE CONCORRÊNCIA: Analise os concorrentes informados com pontos fortes, fracos e oportunidades

7. TOM DE COMUNICAÇÃO: Defina o tom de voz ideal para a marca com base no segmento, público e posicionamento. Inclua:
   - Tom principal (ex: "Educativo e acessível", "Profissional e inspirador")
   - 3-5 traços de personalidade da marca
   - 5-8 palavras/expressões que a marca DEVE usar
   - 5-8 palavras/expressões que a marca deve EVITAR
   - Um exemplo de mensagem no tom ideal
   - Nível de formalidade (Casual, Equilibrado, Formal)

8. KPIs HERO: Meta faturamento, ticket médio, recorrência, LTV/CAC

REGRAS CRÍTICAS DE QUALIDADE:

- NUNCA use placeholders como "R$ X.XXX" ou "X meses" — sempre calcule e preencha com valores reais baseados nas respostas

- O campo "objetivo" dos KPIs deve ser uma frase de ação clara: "Crescer de R$[faturamento_atual] para R$[meta] em 6 meses"

- O campo "canal_prioritario" deve ser curto e direto: ex. "Instagram orgânico + Google Ads" — nunca o título de uma etapa

- Pontos Fortes devem descrever o que a empresa JÁ FAZ bem — nunca ações futuras

- Seja ESPECÍFICO com base nas respostas — nunca genérico

- Use CÁLCULOS REAIS baseados nos dados informados

- Scores devem ser calculados pela IA, não informados pelo cliente

- score_marketing e score_comercial DEVEM ser números inteiros entre 0 e 100 — NUNCA decimais. Arredonde sempre para o inteiro mais próximo.

- Sempre em português brasileiro

- Valores monetários em R$

Use a ferramenta generate_strategy para retornar.`;

const STRATEGIC_PLAN_PROMPT = `Você é um estrategista de marketing e vendas sênior da No Excuse Digital. Gere o PLANEJAMENTO ESTRATÉGICO das 5 ETAPAS.

POSTURA NOEXCUSE — AGRESSIVA E ESCALÁVEL:
- Ações devem ser AGRESSIVAS, DETALHADAS e EXECUTÁVEIS — não genéricas
- Cada ação deve ter nível de detalhe que permita execução imediata
- RUIM: "Produzir conteúdo para redes sociais"
- BOM: "Publicar 3 reels/semana com ângulo emocional de identificação + dor + validação, alternando entre: (1) história de transformação, (2) quebra de objeção, (3) prova social real"

CONTEÚDO — ALÉM DO EDUCATIVO:
- Para QUALQUER nicho, conteúdo puramente educativo NÃO escala sozinho
- Incluir obrigatoriamente: conteúdo EMOCIONAL (identificação + dor + validação), conteúdo de AUTORIDADE (posicionamento pessoal/marca), conteúdo de PROVA SOCIAL (resultados reais, depoimentos, antes/depois)
- O mix ideal é: 40% emocional/identificação, 30% autoridade/educativo, 30% prova social/conversão
- Gatilhos obrigatórios por nicho: dor silenciosa, vergonha, urgência invisível, transformação aspiracional

AUTORIDADE ORGÂNICA:
- Para profissionais liberais e marcas pessoais, autoridade orgânica pode ser o PRINCIPAL canal de aquisição
- Explorar posicionamento pessoal forte antes de escalar tráfego pago
- Conteúdo orgânico bem feito reduz CAC e aumenta taxa de conversão do tráfego pago

CAPACIDADE OPERACIONAL:
- Considerar limitação de capacidade do cliente (agenda, equipe, logística)
- Se profissional liberal com agenda limitada: não projetar mais leads do que ele consegue atender
- Se empresa com equipe pequena: dimensionar ações para a capacidade real
- Incluir nas métricas-alvo a "capacidade utilizada" quando relevante

METODOLOGIA NO EXCUSE - 5 ETAPAS:

01. CONTEÚDO E LINHA EDITORIAL
- Funil de conteúdo (topo/meio/fundo/pós-venda) com ângulos emocionais por etapa
- Formatos recomendados por canal com frequência exata
- Pilares de conteúdo com mix emocional/educativo/conversão
- Diferenciação criativa: o que torna esse conteúdo ÚNICO no feed

02. TRÁFEGO E DISTRIBUIÇÃO
- Plataformas recomendadas com investimento sugerido por plataforma
- Métricas-alvo por plataforma (CTR, CPC, CPL, MQLs) usando benchmarks REAIS do segmento no Brasil
- Estratégia de tráfego orgânico + pago com complementaridade clara
- Remarketing e audiências lookalike

03. WEB E CONVERSÃO
- LPs necessárias por segmento/público com objetivo específico de cada uma
- Elementos obrigatórios (prova social, CTA, urgência, escassez)
- Testes A/B sugeridos com hipóteses claras
- Otimizações de conversão prioritárias

04. SALES E FECHAMENTO
- Funil de vendas com taxas REALISTAS por etapa
- Processo comercial detalhado passo a passo
- Script e abordagem com ângulo emocional
- Follow-up e cadência com tempos específicos
- Tratamento de objeções principais do nicho

05. VALIDAÇÃO E ESCALA
- KPIs para monitorar por etapa com valores-alvo
- Testes controlados sugeridos com critérios de sucesso
- Critérios claros para escalar (quando e como)
- Gargalos de capacidade e como superá-los

Para CADA etapa, gere: título, diagnóstico da situação atual, score 0-100, problemas (2-4), ações específicas (5-8 DETALHADAS), métricas-alvo com valores numéricos, e entregáveis NoExcuse recomendados.

REGRAS:
- Ações devem ser ESPECÍFICAS, AGRESSIVAS e executáveis (não genéricas)
- Métricas com valores numéricos reais baseados no segmento e no mercado brasileiro
- Entregáveis devem ser nomes de serviços do catálogo NoExcuse
- Considere o histórico de problemas e tentativas do cliente
- Sempre em português brasileiro

Use a ferramenta generate_strategy para retornar.`;

const PROJECTIONS_PROMPT = `Você é um analista financeiro e estrategista da No Excuse Digital. Gere PROJEÇÕES FINANCEIRAS e mapeie ENTREGÁVEIS para a calculadora.

REGRAS CRÍTICAS DE CONSISTÊNCIA FINANCEIRA:

1. RECORRÊNCIA REAL:
- Se o modelo de negócio é recorrente (psicologia = paciente semanal, academia = mensalidade, SaaS = assinatura mensal, consultoria = contrato mensal):
  - LTV = ticket médio mensal × meses médios de permanência (não apenas 1 compra)
  - Receita mensal = clientes ATIVOS (não apenas novos no mês) × ticket mensal
  - Clientes acumulam mês a mês (churn aplicado)
- Se o modelo é avulso (e-commerce, evento, projeto pontual):
  - LTV = ticket médio × frequência anual de compra
  - Receita = novas vendas no mês × ticket

2. PROJEÇÃO DEVE BATER COM A META:
- A projeção de 6 meses DEVE mostrar um caminho claro para atingir a meta de faturamento informada
- Se a projeção NÃO atingir a meta no período, EXPLICAR o gap e o que seria necessário (mais investimento, mais tempo, ajuste de ticket)
- NUNCA projetar receita inconsistente com a meta sem explicação

3. CAC REALISTA POR SEGMENTO (benchmarks Brasil):
- Saúde/Bem-estar: R$80-300
- Educação: R$50-200
- E-commerce: R$30-150
- B2B/Serviços: R$200-800
- Imobiliário: R$300-1500
- Se o CAC calculado estiver fora dessa faixa, justificar

4. CAPACIDADE OPERACIONAL COMO LIMITADOR:
- Se o cliente informou capacidade (ex: 20 atendimentos/semana), a projeção de clientes NÃO pode exceder isso
- Se não informou, estimar com base no segmento e incluir como nota

GERE:
1. UNIT ECONOMICS: CAC, LTV, LTV/CAC ratio, ticket médio, margem — CALCULE com base nos dados do briefing considerando recorrência
2. FUNIL DE CONVERSÃO: Etapas do funil com volumes e taxas de conversão realistas para o mercado brasileiro
3. PROJEÇÃO MENSAL (6 meses): Leads, clientes, receita e investimento — considerar ACÚMULO de clientes recorrentes
4. CRESCIMENTO ACUMULADO (6 meses): Receita e clientes acumulados com recorrência e churn aplicados

5. ENTREGÁVEIS PARA CALCULADORA — EXECUÇÕES DO PLANO:
Esta é a seção mais importante. Mapeie EXATAMENTE quais serviços do catálogo NoExcuse precisam ser executados para que o plano estratégico funcione.

CATÁLOGO DE SERVIÇOS (use EXATAMENTE estes IDs):
- Branding: logo-manual, material-marca, midia-off, naming, registro-inpi, ebook, apresentacao-comercial
- Social Media: artes-organicas (artes orgânicas p/ redes sociais), videos-reels (vídeos reels), programacao-meta (programação de posts Meta), programacao-linkedin, programacao-tiktok, programacao-youtube, capa-destaques, criacao-avatar, template-canva, edicao-youtube
- Performance/Tráfego: gestao-meta (gestão de tráfego Meta Ads), gestao-google (gestão Google Ads), gestao-linkedin (gestão LinkedIn Ads), gestao-tiktok (gestão TikTok Ads), config-gmb (configuração Google Meu Negócio), artes-campanha (artes para campanhas), videos-campanha (vídeos para campanhas)
- Web: pagina-site (página de site), lp-link-bio (LP link bio), lp-vsl (LP com VSL), lp-vendas (LP de vendas), lp-captura (LP de captura), lp-ebook (LP de ebook), alterar-contato (alteração de contato site), alterar-secao (alteração de seção site), ecommerce (e-commerce)
- CRM: config-crm (configuração de CRM)

VINCULE CADA ENTREGÁVEL À ETAPA DO PLANO:
- Cada serviço deve ter o campo "etapa" indicando a qual etapa estratégica ele pertence: conteudo, trafego, web, sales ou validacao
- A justificativa deve referenciar ações ESPECÍFICAS do planejamento (ex: "Para implementar a ação de publicar 8 posts/semana conforme definido na etapa de conteúdo")
- Quantidades devem ser REAIS e praticáveis (ex: 8 artes orgânicas/mês, 4 vídeos reels/mês, 1 LP de captura)

INDICADORES REAIS DE REFERÊNCIA:
- Taxa de conversão de site: 2-5% é bom, acima de 5% é excelente
- CPL médio Brasil: R$15-50 dependendo do segmento
- Taxa de fechamento: 10-20% é aceitável, acima de 20% é bom
- LTV/CAC: acima de 3x é saudável
- Margem de lucro serviços: 30-60%

Escolha 5-15 serviços mais relevantes. CADA serviço precisa de: service_id (ID exato), service_name, quantity (mensal), justificativa (vinculada ao plano), etapa (conteudo/trafego/web/sales/validacao).

REGRAS:
- CÁLCULOS REAIS baseados em ticket médio, faturamento, metas informadas
- Projeções realistas para o mercado brasileiro
- IDs de serviço devem ser EXATOS conforme lista acima
- Sempre em português brasileiro
- Valores monetários em R$ formatados com separadores

Use a ferramenta generate_strategy para retornar.`;

// ── HELPERS ─────────────────────────────────────────────────────────

function buildUserPrompt(answers: Record<string, unknown>, section: string): string {
  const answersText = Object.entries(answers)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length > 0 && typeof v[0] === 'object') {
          return `- ${k}: ${JSON.stringify(v)}`;
        }
        return `- ${k}: ${v.join(", ")}`;
      }
      return `- ${k}: ${v}`;
    })
    .join("\n");

  const sectionLabel =
    section === "gps" || section === "marketing-core"
      ? "DIAGNÓSTICO GPS DO NEGÓCIO — MARKETING (scores de marketing, persona, ICP, posicionamento, tom de voz, canais, concorrência, projeções e plano de execução)"
      : section === "marketing-growth"
      ? "DIAGNÓSTICO GPS DO NEGÓCIO — CRESCIMENTO (estratégias de crescimento, roadmap 90 dias, oportunidades de mercado e recomendações de canais pagos)"
      : section === "comercial"
      ? "DIAGNÓSTICO GPS DO NEGÓCIO — COMERCIAL (score comercial, radar 5 eixos, funil reverso, insights comerciais, estratégias de vendas, projeções de receita e plano de ação comercial)"
      : section === "strategic"
      ? "PLANEJAMENTO ESTRATÉGICO DAS 5 ETAPAS"
      : "PROJEÇÕES FINANCEIRAS E ENTREGÁVEIS";

  return `Com base nas respostas do briefing do cliente abaixo, gere o ${sectionLabel}.

RESPOSTAS DO BRIEFING:

${answersText}

Use a ferramenta generate_strategy para retornar.`;
}

async function callAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  toolSchema: Record<string, unknown>,
): Promise<{ result: Record<string, unknown> | null; tokensUsed: number }> {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [toolSchema],
      tool_choice: { type: "function", function: { name: "generate_strategy" } },
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    const errText = await aiResponse.text();
    console.error("AI gateway error:", status, errText);
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("AI_CREDITS");
    throw new Error("AI_ERROR");
  }

  const aiData = await aiResponse.json();
  const tokensUsed = aiData.usage?.total_tokens || 0;

  let result: Record<string, unknown> | null = null;
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      result = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch (e) {
      console.error("Failed to parse tool call arguments:", e);
    }
  }

  if (!result) {
    const messageContent = aiData.choices?.[0]?.message?.content;
    if (messageContent) {
      try {
        const cleaned = messageContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(cleaned);
      } catch (e) {
        console.error("Fallback JSON parse failed:", e);
      }
    }
  }

  return { result, tokensUsed };
}

// ── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const _rl = await checkRateLimit(userId, null, 'generate-strategy', { windowSeconds: 60, maxRequests: 20 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

    const { answers, organization_id, section } = await req.json();
    if (!answers) {
      return new Response(
        JSON.stringify({ error: "Respostas do briefing são obrigatórias" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Débito condicional ao GPS aprovado (no-op no primeiro GPS; debita em regenerações)
    if (organization_id) {
      const debited = await debitIfGPSDone(
        serviceClient, organization_id, CREDIT_COST, "Estratégia de marketing", "generate-strategy",
        Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      if (debited === false) {
        const { data: wallet } = await serviceClient
          .from("credit_wallets")
          .select("balance")
          .eq("organization_id", organization_id)
          .maybeSingle();
        if (wallet && wallet.balance < CREDIT_COST) {
          return new Response(
            JSON.stringify({ error: `Créditos insuficientes. Você precisa de ${CREDIT_COST} créditos.`, code: "INSUFFICIENT_CREDITS" }),
            { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ── Enrich answers with site content (if URL provided) ──────────
    const siteUrl = (answers?.website_url || answers?.site_url || answers?.website || answers?.site || "").toString().trim();
    let siteContent = "";
    if (siteUrl && /^https?:\/\//i.test(siteUrl)) {
      try {
        const siteRes = await fetch(siteUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; NOEXCUSE-Bot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await siteRes.text();
        siteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);
        console.log("Site content extracted:", siteContent.length, "chars from", siteUrl);
      } catch (e) {
        console.warn("Failed to fetch site:", siteUrl, (e as Error)?.message);
      }
    }
    const siteContextBlock = siteContent
      ? `\n\nCONTEÚDO DO SITE DO CLIENTE (${siteUrl}):\n${siteContent}\n`
      : "";

    if (section) {
      const configs: Record<string, { schema: any; prompt: string }> = {
        "gps": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "marketing-core": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "marketing-growth": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "comercial": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "strategic": { schema: STRATEGIC_PLAN_SCHEMA, prompt: STRATEGIC_PLAN_PROMPT },
        "projections": { schema: PROJECTIONS_SCHEMA, prompt: PROJECTIONS_PROMPT },
      };
      const config = configs[section];
      if (!config) {
        return new Response(JSON.stringify({ error: "Seção inválida" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const userPrompt = buildUserPrompt(answers, section) + siteContextBlock;
      const { result, tokensUsed } = await callAI(LOVABLE_API_KEY, config.prompt, userPrompt, config.schema);

      if (!result) {
        return new Response(
          JSON.stringify({ error: "Falha ao gerar. Tente novamente." }),
          { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ result, tokens_used: tokensUsed }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ── Full generation: 3 parallel calls ───────────────────────────
    console.log("Generating full strategy (3 parallel calls)...");

    const userPromptBase = Object.entries(answers)
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          if (v.length > 0 && typeof v[0] === 'object') return `- ${k}: ${JSON.stringify(v)}`;
          return `- ${k}: ${v.join(", ")}`;
        }
        return `- ${k}: ${v}`;
      })
      .join("\n");

    const makePrompt = (s: string) => `Com base nas respostas do briefing do cliente abaixo, gere o ${
      s === "gps" ? "DIAGNÓSTICO GPS DO NEGÓCIO (com scores automáticos de marketing e comercial, persona e análise de concorrência)" :
      s === "strategic" ? "PLANEJAMENTO ESTRATÉGICO DAS 5 ETAPAS" :
      "PROJEÇÕES FINANCEIRAS E ENTREGÁVEIS"
    }.\n\nRESPOSTAS DO BRIEFING:\n${userPromptBase}${siteContextBlock}\n\nUse a ferramenta generate_strategy para retornar.`;

    const [gpsResult, strategicResult, projectionsResult] = await Promise.all([
      callAI(LOVABLE_API_KEY, GPS_PROMPT, makePrompt("gps"), GPS_DIAGNOSIS_SCHEMA),
      callAI(LOVABLE_API_KEY, STRATEGIC_PLAN_PROMPT, makePrompt("strategic"), STRATEGIC_PLAN_SCHEMA),
      callAI(LOVABLE_API_KEY, PROJECTIONS_PROMPT, makePrompt("projections"), PROJECTIONS_SCHEMA),
    ]);

    const totalTokens = gpsResult.tokensUsed + strategicResult.tokensUsed + projectionsResult.tokensUsed;

    if (!gpsResult.result) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar diagnóstico GPS. Tente novamente." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Garantir que scores são sempre inteiros antes de retornar
    const sanitizeScores = (obj: Record<string, unknown>): Record<string, unknown> => {
      const scoreFields = ["score_marketing", "score_comercial", "score_geral"];
      const sanitized = { ...obj };
      for (const field of scoreFields) {
        if (typeof sanitized[field] === "number") {
          sanitized[field] = Math.round(sanitized[field] as number);
        }
        if (sanitized.diagnostico_gps && typeof (sanitized.diagnostico_gps as any)?.[field] === "number") {
          (sanitized.diagnostico_gps as any)[field] = Math.round((sanitized.diagnostico_gps as any)[field]);
        }
      }
      return sanitized;
    };

    const mergedResult = sanitizeScores({
      ...(gpsResult.result || {}),
      ...(strategicResult.result || {}),
      ...(projectionsResult.result || {}),
    });

    console.log(`Full strategy generated. Total tokens: ${totalTokens}`);

    // Resolve org for logging + campaign trigger (try saas first, fallback to franchise)
    let { data: orgData } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgData) {
      const fb = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "franchise" });
      orgData = fb.data;
    }

    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Estratégia] Briefing com ${Object.keys(answers).length} respostas`,
        output_message: JSON.stringify(mergedResult).substring(0, 500),
        tokens_used: totalTokens,
        model: "google/gemini-2.5-flash",
      });

      // Trigger gps_completed campaign email (idempotent — once per org)
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-campaign-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trigger_event: "gps_completed",
            organization_id: orgData,
            user_id: userId,
            metadata: { tokens_used: totalTokens },
          }),
        });
      } catch (e) {
        console.error("gps_completed campaign trigger failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ result: mergedResult, tokens_used: totalTokens }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Strategy generation error:", err);
    const message = err instanceof Error ? err.message : "Erro interno";

    if (message === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
        { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }
    if (message === "AI_CREDITS") {
      return new Response(
        JSON.stringify({ error: "Créditos de IA insuficientes." }),
        { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
