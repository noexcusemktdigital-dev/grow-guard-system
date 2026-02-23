
# Estrategia de Marketing — Reformulacao Completa

Transformar a pagina "Plano de Marketing" em "Estrategia de Marketing", uma experiencia de consultoria interativa que diagnostica, orienta e conecta o cliente aos produtos da plataforma.

---

## Conceito

A pagina atual tem um dashboard com dados mock e um diagnostico basico com perguntas de radio. A nova versao sera uma jornada consultiva em 3 etapas:

1. **Conversa Estrategica** (wizard de perguntas interativas)
2. **Resultado e Diagnostico** (relatorio visual com termometro, radar, insights e recomendacoes)
3. **Mapa de Produtos** (conexao direta com Conteudos, Redes Sociais, Sites e Trafego Pago)

---

## Estrutura da Pagina

### Aba 1 — Estrategia (principal)

**Se o cliente ainda nao completou a estrategia:**

Wizard conversacional, uma pergunta por vez (estilo typeform), com barra de progresso no topo. Categorias de perguntas:

| Categoria | Perguntas (resumo) |
|-----------|-------------------|
| Negocio | Segmento, tempo de mercado, faturamento mensal, ticket medio |
| Publico | Quem e o cliente ideal, faixa etaria, onde esta, como decide |
| Marketing Atual | Redes ativas, frequencia de publicacao, investe em trafego, tem site |
| Objetivos | Meta principal (leads, vendas, autoridade, reconhecimento), prazo |
| Orcamento | Quanto investe em marketing, quanto pode investir |
| Dores | Maiores dificuldades, o que ja tentou que nao funcionou |

Formato misto: perguntas de multipla escolha (cards clicaveis), sliders para valores numericos e campos de texto curto para respostas abertas. Cada pergunta aparece isolada com animacao de transicao (framer-motion fade).

**Apos completar:**

Relatorio visual "Sua Estrategia de Marketing" com:

- **Termometro de Maturidade** (reutiliza DiagnosticoTermometro com niveis adaptados: Iniciante / Basico / Intermediario / Avancado)
- **Radar Chart** por area (Presenca Digital, Estrategia, Conteudo, Trafego, Branding)
- **Cards de Insights** com icones e cores por tipo (sucesso/alerta/oportunidade)
- **Projecao de Resultados** — grafico de area mostrando cenario atual vs cenario com a estrategia implementada (leads projetados, engajamento, conversoes)
- **Plano de Acao em 3 Fases**: Fase 1 Fundacao (mes 1-2), Fase 2 Crescimento (mes 3-4), Fase 3 Escala (mes 5-6)

### Aba 2 — Produtos Recomendados

Cards premium dos 4 modulos de marketing da plataforma, cada um com:

- Icone e nome do modulo
- Descricao de como ele resolve uma dor identificada na estrategia
- Indicador visual (ex: "Recomendado para voce" com badge verde se a area esta fraca)
- Botao "Acessar" que navega para a pagina do modulo
- Mini KPI do modulo (ex: "0 conteudos gerados" ou "Site nao criado")

Modulos apresentados:
1. **Conteudos** — Geracao de roteiros com IA baseados na sua estrategia
2. **Redes Sociais** — Artes prontas para Feed e Story todo mes
3. **Sites** — Landing page otimizada para captura de leads
4. **Trafego Pago** — Campanhas estruturadas para Meta, Google, TikTok

### Aba 3 — Historico

Timeline das estrategias geradas anteriormente, permitindo comparar evolucao.

---

## Alteracoes na Sidebar

- Renomear "Plano de Marketing" para "Estrategia" na sidebar (`ClienteSidebar.tsx`, linha 45)
- Manter o icone Megaphone

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Reescrita completa |
| `src/components/ClienteSidebar.tsx` | Renomear label de "Plano de Marketing" para "Estrategia" |

Nao ha necessidade de tabelas novas neste momento — os dados da estrategia serao gerenciados em estado local (mock), com persistencia em banco planejada para uma fase posterior.

---

## Detalhes Tecnicos

### Wizard Conversacional

- Estado controlado por `currentStep` (numero da pergunta)
- Array de objetos `StrategyQuestion` com: id, category, question, type (choice/slider/text), options
- Animacao com `framer-motion` (AnimatePresence + motion.div com fade/slide)
- Barra de progresso no topo mostrando X/total
- Botoes "Voltar" e "Proximo" com validacao (resposta obrigatoria)

### Resultado Visual

- Calculo de score por categoria baseado nas respostas
- Score geral de maturidade (0-100%) com 4 niveis
- Radar chart (recharts) com 5 eixos
- Cards de insight gerados automaticamente baseados nos scores baixos
- Secao "Produtos Recomendados" destaca modulos onde o score e mais fraco
- Botao "Refazer Estrategia" para reiniciar o wizard

### Cards de Produtos

- Cada card verifica o score da area correspondente
- Se score < 50%, exibe badge "Prioridade Alta" em vermelho
- Se score 50-75%, exibe "Recomendado" em amarelo
- Se score > 75%, exibe "Otimizar" em verde
- Links diretos para `/cliente/conteudos`, `/cliente/redes-sociais`, `/cliente/sites`, `/cliente/trafego-pago`

### Estilo Visual

- Mantém o padrao premium existente (glass-card, section-label, font-black tracking-tighter)
- Wizard com fundo suave gradient e cards de opcao com borda hover
- Resultado com layout de relatorio consultivo (secoes bem separadas, tipografia forte)
