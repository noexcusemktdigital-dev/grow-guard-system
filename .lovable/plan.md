

# Redesign Completo do Modulo de Marketing - Cliente Final

## Visao Geral

Reestruturar todo o ecossistema de Marketing do Cliente Final, transformando cada pagina em um modulo com abordagem de **Base de Conhecimento** (dados fixos de referencia) + **Briefing Mensal** (informacoes objetivas para gerar entregas). Remover a pagina de Campanhas.

---

## 1. Remover Campanhas

**Arquivos afetados:**
- Remover rota `/cliente/campanhas` de `src/App.tsx`
- Remover item "Campanhas" do `src/components/ClienteSidebar.tsx`
- Deletar `src/pages/cliente/ClienteCampanhas.tsx`

---

## 2. Plano de Marketing (Dashboard + Diagnostico)

**Arquivo: `src/pages/cliente/ClientePlanoMarketing.tsx`** - Reescrita completa

**Estrutura com 2 abas:**

### Aba 1: Dashboard Principal
- KPIs consolidados puxando dados de todos os modulos (conteudos produzidos, artes geradas, campanhas de trafego ativas, leads do site)
- Cards de status por modulo: Conteudos, Redes Sociais, Sites, Trafego Pago - cada um com progresso mensal e ultimas entregas
- Insights e recomendacoes (cards com icone Sparkles, texto de sugestao baseado nos dados)
- Timeline de atividades recentes do marketing
- Grafico de evolucao mensal (leads, conteudos, investimento)

### Aba 2: Diagnostico de Marketing
- Questionario profundo sobre o negocio organizado em categorias:
  - Presenca Digital (site, redes sociais, frequencia de postagem)
  - Estrategia (persona definida, funil estruturado, metricas acompanhadas)
  - Trafego Pago (investe? quanto? quais plataformas?)
  - Conteudo (produz conteudo? qual frequencia? qual formato?)
  - Branding (identidade visual definida? manual de marca?)
- Cada pergunta com opcoes de resposta (escala ou multipla escolha)
- Resultado: Termometro de maturidade com 4 niveis (Iniciante 0-25%, Basico 26-50%, Intermediario 51-75%, Avancado 76-100%)
- Grafico radar por area
- Plano de acao recomendado baseado no nivel

---

## 3. Conteudos (Base de Conhecimento + Geracao Mensal)

**Arquivo: `src/pages/cliente/ClienteConteudos.tsx`** - Reescrita completa

**Estrutura com 2 abas:**

### Aba 1: Base de Conhecimento
- Secoes organizadas em cards editaveis:
  - **Sobre o Negocio**: Nicho, publico-alvo, persona, tom de voz, proposta de valor
  - **Concorrencia**: Lista de concorrentes com links e observacoes
  - **Referencias**: Links e perfis de referencia de conteudo
  - **Pilares de Conteudo**: Temas e categorias que o cliente aborda
  - **Regras e Restricoes**: O que nao pode ser dito, termos obrigatorios, compliance
- Cada secao com botao de editar e salvar
- Status de preenchimento (barra de progresso geral)

### Aba 2: Geracao Mensal
- Briefing do mes: campos objetivos (tema do mes, promocoes, datas comemorativas, destaques)
- Botao "Gerar Conteudos do Mes" com IA
- Resultado: Lista de roteiros e ideias organizados por semana
  - Cada item: titulo, descricao curta, formato sugerido, rede social, etapa do funil
  - Botoes: Copiar, Editar, Aprovar
- Calendario visual com os conteudos distribuidos
- Contador de conteudos gerados vs pacote mensal

---

## 4. Redes Sociais (Base de Conhecimento + Artes Mensais + Calendario)

**Arquivo: `src/pages/cliente/ClienteRedesSociais.tsx`** - Reescrita completa

**Estrutura com 3 abas:**

### Aba 1: Base de Conhecimento
- Secoes editaveis:
  - **Identidade Visual**: Logo (upload), paleta de cores, fontes, estilo visual preferido
  - **Referencias Visuais**: Imagens e links de referencia
  - **Concorrencia Visual**: Exemplos visuais de concorrentes
  - **Tom e Linguagem**: Como a marca se comunica visualmente
  - **Banco de Imagens**: Upload de fotos de produtos, equipe, espaco fisico
- Area de upload de arquivos (logo, imagens de referencia)

### Aba 2: Pacote Mensal
- Briefing mensal: promocoes, destaques, eventos, temas visuais
- Configuracao do pacote: quantidade de posts (feed, stories, carrossel)
- Botao "Gerar Pacote do Mes" com IA
- Grid de artes geradas com preview visual (placeholder), legenda e hashtags
- Cada arte com acoes: Baixar, Copiar Legenda, Editar, Aprovar
- Progresso: X de Y artes geradas

### Aba 3: Calendario
- Calendario mensal com as artes distribuidas por dia
- Drag visual dos posts entre dias
- Legenda por tipo (Feed, Story, Carrossel)
- Visao semanal compacta

---

## 5. Sites (Base de Conhecimento + Criacao de Site)

**Arquivo: `src/pages/cliente/ClienteSites.tsx`** - Reescrita completa

**Estrutura com 2 abas:**

### Aba 1: Base de Conhecimento
- Perguntas essenciais para criacao do site:
  - Qual o objetivo do site? (Captura, Institucional, Vendas, Portfolio)
  - Quais servicos/produtos oferece?
  - Qual o diferencial?
  - Tem depoimentos de clientes?
  - Quais informacoes de contato?
  - Tem imagens proprias? (upload)
  - Cores e estilo visual preferido
  - Referencia de sites que gosta (links)
- Campos editaveis e salvos como base fixa

### Aba 2: Gerar Site
- Resumo das informacoes da base de conhecimento
- Botao "Gerar Site com IA"
- Preview do site gerado (iframe ou mock visual)
- Opcoes:
  - "Publicar Site" (colocar no ar)
  - "Baixar Codigo" (download do HTML/CSS)
  - "Editar" (ajustar textos e blocos antes de publicar)
- Historico de sites gerados

---

## 6. Trafego Pago (Base de Conhecimento + Campanhas + Tutoriais)

**Arquivo: `src/pages/cliente/ClienteTrafegoPago.tsx`** - Reescrita completa

**Estrutura com 3 abas:**

### Aba 1: Base de Conhecimento
- Informacoes essenciais para campanhas:
  - Publico-alvo detalhado (idade, localizacao, interesses, comportamento)
  - Orcamento mensal disponivel
  - Plataformas de interesse (Google, Meta, TikTok, LinkedIn)
  - Historico de campanhas anteriores
  - Paginas de destino (URLs de LPs)
  - Pixel/tags ja instalados?
  - Objetivos de negocio (leads, vendas, awareness)

### Aba 2: Campanhas
- Briefing mensal: objetivo do mes, promocoes, orcamento
- Botao "Gerar Estrutura de Campanhas"
- Cards visuais por plataforma (Google, Meta, TikTok, LinkedIn) com:
  - Nome da campanha sugerida
  - Objetivo
  - Publico segmentado
  - Orcamento sugerido
  - Copy do anuncio
  - Formato de criativo sugerido
- Visual didatico com icones e badges por plataforma
- KPIs estimados (alcance, cliques, CPC estimado)

### Aba 3: Tutoriais
- Guias passo a passo para criar campanhas em cada plataforma
- Cards por plataforma (Meta, Google, TikTok, LinkedIn)
- Cada tutorial com passos numerados, screenshots placeholder, dicas
- Checklist de configuracao por plataforma
- Links uteis e boas praticas

---

## 7. Atualizacao da Sidebar

**Arquivo: `src/components/ClienteSidebar.tsx`**
- Remover item "Campanhas" da `marketingSection`

---

## Detalhes Tecnicos

### Arquivos modificados:
1. `src/App.tsx` - Remover rota de campanhas
2. `src/components/ClienteSidebar.tsx` - Remover item campanhas
3. `src/pages/cliente/ClientePlanoMarketing.tsx` - Reescrita (Dashboard + Diagnostico)
4. `src/pages/cliente/ClienteConteudos.tsx` - Reescrita (Base Conhecimento + Geracao)
5. `src/pages/cliente/ClienteRedesSociais.tsx` - Reescrita (Base + Pacote + Calendario)
6. `src/pages/cliente/ClienteSites.tsx` - Reescrita (Base + Gerar Site)
7. `src/pages/cliente/ClienteTrafegoPago.tsx` - Reescrita (Base + Campanhas + Tutoriais)

### Arquivo deletado:
- `src/pages/cliente/ClienteCampanhas.tsx`

### Padrao de design:
- Todas as paginas seguem o estilo "Premium Impact" ja implementado (Inter, tracking-tighter, rounded-2xl, icones Lucide)
- Tabs com estilo consistente para navegacao entre Base de Conhecimento e Geracao
- Cards com hover premium e shapes decorativos
- Sem emojis - apenas icones Lucide
- Labels em uppercase tracking-widest para secoes

