# ADR-004: AI Gateway Lovable (Gemini-only)

- Status: Aceito
- Data: 2026-05-01
- Decisores: Rafael Marutaka (founder/CTO), Davi Tesch (cliente NOEXCUSE)

## Contexto

O Sistema Noé usa LLM em vários pontos: assistente de cadastro, geração de descrições, classificação de tickets, análise de feedback de clientes. À época da decisão (Q1 2026), as opções viáveis eram (1) chamar Anthropic Claude direto via API, (2) chamar OpenAI direto, (3) usar Google Gemini via Lovable AI Gateway, (4) usar OpenRouter como roteador multi-provider.

A Lovable Cloud disponibiliza um AI Gateway integrado que, na data desta decisão (2026-04-18), suportava apenas modelos Google Gemini. Vantagens do gateway: billing unificado com a Lovable, sem precisar gerenciar `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` como secret separado, latência baixa por estar no mesmo backbone, rate limits negociados.

Custos relevantes para o volume do Noé (estimativa baixa, milhares de chamadas/mês): Gemini Flash é significativamente mais barato que Claude Sonnet ou GPT-4o-mini para a maioria das tarefas (classificação, extração, geração curta). Qualidade do Gemini 1.5/2.0 Flash é suficiente para os casos de uso do produto — não há necessidade de raciocínio complexo nem janela de contexto enorme.

## Decisão

**100% das chamadas LLM do Sistema Noé passam pelo Lovable AI Gateway, usando modelos Google Gemini.** Não há integração direta com Claude (Anthropic) nem OpenAI no produto. Quando o gateway adicionar outros providers (esperado), reavaliar caso a caso — esta decisão NÃO veta uso futuro de Claude, apenas registra que hoje (2026-05-01) só Gemini está disponível.

## Consequências

### Positivas
- Custo significativamente mais baixo que Claude/GPT-4 para o volume atual
- Sem secret de API a gerenciar/rotacionar (gateway cuida)
- Billing unificado com Lovable — uma fatura, fácil de prever
- Latência baixa (mesmo backbone Lovable)
- Onboarding rápido: SDK simples, exemplos prontos na doc Lovable

### Negativas / Trade-offs
- **Dependência de provider único** — outage do Gemini ou do gateway = funcionalidades de IA caem
- Sem fallback automático para outro modelo
- Casos que precisariam de Claude (raciocínio longo, agentes complexos) não são cobertos
- Migração futura para multi-provider exige refatorar wrapper de chamadas LLM
- Lock-in moderado no roadmap da Lovable

## Alternativas consideradas

- **Anthropic Claude direto:** qualidade superior em raciocínio, mas 5-10× mais caro para o volume e exige gerenciar secret. Rejeitado por custo.
- **OpenAI direto:** similar a Claude em custo; sem vantagem clara sobre Gemini para os casos de uso. Rejeitado.
- **OpenRouter:** flexibilidade multi-provider, mas adiciona dependência externa, latência extra e billing separado. Rejeitado por complexidade.
- **Self-hosted (Llama/Mixtral em VPS):** elimina custo de API mas exige GPU dedicada e MLOps. Inviável para a equipe atual.
