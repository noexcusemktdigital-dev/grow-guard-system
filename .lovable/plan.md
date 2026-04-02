

## Plano — Refazer a Landing Page focada em conversão e soluções reais

### Problema atual

A landing page atual é genérica: fala de "CRM", "WhatsApp", "automação" de forma superficial, sem comunicar o real diferencial do sistema — que é um **ecossistema completo de gestão comercial com IA** que diagnostica, estrategiza e executa marketing + vendas de forma personalizada para cada negócio.

### Abordagem

Reescrever `SaasLanding.tsx` inteiramente, mantendo a mesma estrutura técnica (React + Framer Motion + Tailwind) mas com **copy focada em conversão** e **seções que comunicam as soluções reais**.

### Nova estrutura da página

#### 1. Nav (mantém)
Logo + "Entrar" + "Começar grátis"

#### 2. Hero — Proposta de valor clara
- Headline: foco no resultado (gestão comercial completa com IA que diagnostica e executa)
- Sub: "Do diagnóstico à execução — marketing, vendas e estratégia personalizada em um só lugar"
- Badges: GPS do Negócio · CRM Inteligente · Marketing com IA · Agente de Vendas 24/7
- CTA principal + "Teste grátis por 7 dias"

#### 3. Problema → Solução (nova seção)
3 colunas mostrando dores reais vs como o sistema resolve:
- "Sem estratégia clara" → GPS do Negócio analisa e cria estratégia personalizada
- "Marketing sem resultado" → IA gera conteúdos, artes e campanhas alinhados ao negócio
- "Vendas desorganizadas" → CRM com funis, metas, scripts e acompanhamento em tempo real

#### 4. O ecossistema completo (substituir features genéricas)
Cards maiores organizados por "jornada":
- **Diagnosticar**: GPS do Negócio — análise completa, score comercial, plano de ação
- **Planejar**: Estratégia de Marketing + Plano de Vendas com IA
- **Executar Marketing**: Conteúdos, Artes, Sites, Tráfego Pago — tudo gerado pela IA
- **Executar Vendas**: CRM, Scripts, Metas, Ranking, Prospecção
- **Automatizar**: Agente de IA 24/7, disparos, follow-ups, WhatsApp
- **Acompanhar**: Dashboards, relatórios, checklist diário, alertas inteligentes

#### 5. Como funciona (refinar)
- Passo 1: Crie sua conta e responda o GPS do Negócio (5 min)
- Passo 2: A IA cria sua estratégia personalizada de marketing e vendas
- Passo 3: Execute com as ferramentas integradas e acompanhe resultados em tempo real

#### 6. Diferenciais (nova seção)
"Por que a NoExcuse é diferente?"
- Tudo em um só lugar (não precisa de 5 ferramentas separadas)
- IA que entende SEU negócio (não genérica)
- Do diagnóstico à execução (não só ferramenta, é estratégia)
- Para empresas, equipes e setores diferentes

#### 7. Social proof (números + depoimentos — mantém estrutura, refinar copy)

#### 8. Pricing (mantém com UNIFIED_PLANS)

#### 9. FAQ (atualizar perguntas para refletir soluções reais)

#### 10. CTA Final + Footer (mantém)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/SaasLanding.tsx` | Reescrever completo — nova copy, novas seções, mesma base técnica |

### Resultado

- Landing page comunica as soluções reais do sistema, não features genéricas
- Foco em conversão: dor → solução → prova social → preço → CTA
- Mantém design dark com a identidade visual atual (cores, logo, animações)
- Responsiva e performática (mesma stack)

