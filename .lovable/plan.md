

# Estrategia de Marketing — Perguntas Agrupadas e Diagnostico Profundo

Expandir o questionario para ~30 perguntas com analise de concorrencia, CAC, LTV, CRM e canais offline, porem **agrupando perguntas por secao** (varias na mesma tela) para manter a experiencia rapida e pratica.

---

## Mudanca de Formato: de 1 pergunta/tela para Secoes Agrupadas

Em vez de mostrar uma pergunta por vez (17 cliques), o wizard agora mostrara **9 secoes** com 2-5 perguntas cada, na mesma tela. O usuario responde um bloco completo e avanca.

| Secao | Perguntas | Formato |
|-------|-----------|---------|
| 1. Seu Negocio | Segmento, tempo de mercado, modelo (B2B/B2C), num. funcionarios | 4 perguntas choice |
| 2. Financeiro | Faturamento (choice ate R$10M), ticket medio (choice) | 2 perguntas choice |
| 3. Seu Publico | Cliente ideal (texto), faixa etaria, onde esta, como decide | 4 perguntas mistas |
| 4. Concorrencia | Qtd concorrentes, se investem em digital, diferencial competitivo | 3 perguntas mistas |
| 5. Presenca Digital | Redes ativas, link Instagram (condicional), frequencia, tem site, URL site (condicional) | 3-5 perguntas com condicionais |
| 6. Trafego e Vendas | Investe em trafego, quanto investe (choice), leads/mes, taxa conversao | 4 perguntas choice |
| 7. Metricas CAC/LTV | Sabe o CAC, LTV medio, processo de recompra | 3 perguntas choice |
| 8. Gestao de Dados | Usa CRM, historico de dados, estrategias offline | 3 perguntas mistas |
| 9. Objetivos e Dores | Meta principal, prazo, dificuldades (expandido), tentativas anteriores | 4 perguntas mistas |

Total: ~30 perguntas em **9 telas** em vez de 30 telas. Cada secao tem titulo e subtitulo contextuais.

---

## Perguntas Novas Detalhadas

### Secao 1 — Seu Negocio
- Segmento (choice, mesmo atual)
- Tempo de mercado (choice, mesmo)
- Modelo de negocio: B2B / B2C / Ambos (choice, novo)
- Numero de funcionarios: 1-5, 6-20, 21-50, 51-200, 200+ (choice, novo)

### Secao 2 — Financeiro
- Faturamento mensal (muda de slider para choice): Ate R$10mil, R$10-30mil, R$30-50mil, R$50-100mil, R$100-300mil, R$300mil-1M, R$1-5M, R$5-10M
- Ticket medio (muda de slider para choice): Ate R$100, R$100-500, R$500-2mil, R$2-5mil, R$5-15mil, R$15mil+

### Secao 3 — Seu Publico
- Cliente ideal (text, mesmo)
- Faixa etaria (choice, mesmo)
- Onde esta (multi-choice, mesmo)
- Como decide a compra (multi-choice, novo): Indicacao, pesquisa Google, redes sociais, preco, confianca na marca, visita presencial

### Secao 4 — Concorrencia (nova)
- Quantos concorrentes diretos: 1-3, 4-10, 10+, nao sei (choice)
- Concorrentes investem em digital: Nao, pouco, sim bastante, sao referencia (choice)
- Diferencial competitivo (text)

### Secao 5 — Presenca Digital
- Redes ativas (multi-choice, adiciona Twitter/X)
- Link do Instagram/principal rede (text, condicional: aparece se redes != nenhuma)
- Frequencia de publicacao (choice, mesmo)
- Tem site (choice, mesmo)
- URL do site (text, condicional: aparece se tem_site != "nao")

### Secao 6 — Trafego e Vendas
- Investe em trafego pago (choice, mesmo)
- Quanto investe por mes (choice, novo): Nao invisto, ate R$500, R$500-2mil, R$2-5mil, R$5-15mil, R$15mil+
- Quantos leads recebe por mes (choice, novo): 0-10, 11-30, 31-100, 100-500, 500+
- Taxa de conversao estimada (choice, novo): Nao sei, menos de 5%, 5-15%, 15-30%, mais de 30%

### Secao 7 — Metricas CAC/LTV (nova)
- Sabe quanto custa adquirir um cliente (choice): Nao sei, ate R$50, R$50-200, R$200-500, R$500+
- Tempo medio do cliente (choice): Compra unica, 1-3 meses, 3-12 meses, mais de 1 ano
- Processo de recompra/fidelizacao (choice): Nao, informal, sim estruturado

### Secao 8 — Gestao de Dados (nova)
- Usa CRM (choice): Nao gerencio, planilha, CRM basico, CRM profissional
- Historico de dados dos clientes (choice): Nenhum, parcial, sim completo
- Estrategias alem do digital (multi-choice): Eventos, panfletos, networking, parcerias locais, indicacao, nenhuma

### Secao 9 — Objetivos e Dores
- Meta principal (choice, mesmo)
- Prazo para resultados (choice, mesmo)
- Dificuldades (multi-choice, expandido): adiciona "Nao sei meu CAC/LTV", "Nao tenho dados organizados", "Concorrencia forte"
- O que ja tentou (text, mesmo)

---

## Logica de Perguntas Condicionais

Perguntas com `condition` so aparecem se a condicao for verdadeira:
- `url_rede`: aparece se `redes_ativas` nao inclui "nenhuma"
- `url_site`: aparece se `tem_site` diferente de "nao"

As demais perguntas aparecem sempre.

---

## Scoring Expandido (7 eixos)

O radar passa de 5 para 7 eixos:

| Eixo | Fontes |
|------|--------|
| Presenca Digital | redes_ativas, tem_site, freq_publicacao, url_site, url_rede |
| Estrategia | meta_principal, prazo, cliente_ideal, modelo_negocio |
| Conteudo | freq_publicacao, redes_ativas diversidade |
| Trafego | investe_trafego, valor_trafego, leads_mes, taxa_conversao |
| Branding | tempo_mercado, diferencial_competitivo, segmento |
| Gestao de Dados | usa_crm, historico_dados, sabe_cac |
| Vendas e Retencao | taxa_conversao, ltv_medio, processo_recompra |

---

## Novos Insights

- CAC: "Voce nao sabe seu CAC — sem isso, e impossivel medir ROI"
- CRM: "Seus dados nao estao organizados. O CRM centraliza leads e historico"
- Concorrencia: "Seus concorrentes investem forte em digital. Acelere para nao perder mercado"
- Retencao: "Sem processo de fidelizacao, voce perde receita recorrente"
- Conversao: Se taxa menor que 5%, insight sobre qualificacao de leads
- Offline: Se usa estrategias offline, insight sobre integracao com digital

---

## Projecao Expandida

Dois graficos de area:
1. Leads projetados (ja existe)
2. Faturamento estimado (baseado em ticket medio x taxa conversao x leads)

---

## Plano de Acao Dinamico

Gerado por funcao `generateActionPlan(scoreMap, answers)`:
- Gestao de Dados baixo: Fase 1 inclui "Implantar CRM"
- Trafego baixo: Fase 2 inclui "Iniciar campanhas com orcamento controlado"
- Retencao baixo: Fase 3 inclui "Criar programa de fidelizacao"
- Concorrencia forte: Fase 2 inclui "Analise competitiva"

---

## Produtos Recomendados: adiciona CRM

| Produto | Score Vinculado | Path |
|---------|----------------|------|
| Conteudos | Conteudo | /cliente/conteudos |
| Redes Sociais | Presenca Digital | /cliente/redes-sociais |
| Sites | Presenca Digital | /cliente/sites |
| Trafego Pago | Trafego | /cliente/trafego-pago |
| CRM (novo) | Gestao de Dados | /cliente/crm |

---

## Detalhes Tecnicos

### Estrutura de dados das secoes

A estrutura muda de `StrategyQuestion[]` (flat) para `StrategySection[]` com perguntas agrupadas:

```text
StrategySection {
  id: string
  title: string          // ex: "Seu Negocio"
  subtitle: string       // ex: "Conte sobre sua empresa"
  icon: LucideIcon
  questions: StrategyQuestion[]  // 2-5 perguntas por secao
}
```

O wizard itera por secoes (9 steps) e renderiza todas as perguntas da secao ativa numa unica tela com scroll.

### Validacao por secao

O botao "Proximo" so habilita quando todas as perguntas obrigatorias da secao estiverem respondidas. Perguntas condicionais que nao aparecem nao bloqueiam o avanço.

### Arquivo alterado

`src/pages/cliente/ClientePlanoMarketing.tsx` — reescrita completa das perguntas, secoes, scoring, insights, projecao e plano de acao.

Nenhum arquivo novo. Sem mudancas de banco.
