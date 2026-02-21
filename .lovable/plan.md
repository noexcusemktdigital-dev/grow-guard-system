

# Modulo Marketing 360 -- Sistema Estrategico + Operacional

## Resumo

Transformar os 6 modulos do pilar Marketing (Plano de Marketing, Campanhas, Conteudos, Redes Sociais, Sites, Trafego Pago) de paginas informativas simples em um sistema integrado de execucao estrategica de marketing. O Plano de Marketing se torna o cerebro que alimenta todos os outros modulos. Cada modulo ganha capacidade de execucao real (criar posts, montar landing pages, configurar campanhas pagas) com dados integrados ao CRM comercial.

---

## Estado Atual vs Desejado

| Modulo | Hoje | Desejado |
|--------|------|----------|
| Plano de Marketing | 3 KPIs + input objetivo + lista canais | Diagnostico completo com 6 secoes (Posicionamento, Objetivo, Canais, Orcamento, Funil, Plano de Acao automatico) |
| Campanhas | Cards simples com KPIs basicos | Hub de organizacao com dialog de criacao, entregaveis vinculados (conteudos, anuncios, LPs) |
| Conteudos | Grid de cards com filtro por rede | Calendario editorial visual + criador de conteudo com IA (copy, titulo, CTA, hashtags) |
| Redes Sociais | 3 cards estaticos com badge "em breve" | Dashboard por rede com metricas + biblioteca de posts criados |
| Sites | Lista simples de 3 sites | Construtor de landing pages com blocos prontos (Hero, CTA, Formulario, FAQ) |
| Trafego Pago | Grafico + lista de campanhas | Criador de campanha paga + dashboard de performance com CPC/CTR/CPA/ROI |

---

## Divisao em 2 Etapas

Devido ao tamanho, a implementacao sera dividida:

**Etapa 1 (esta implementacao):**
1. Expandir `clienteData.ts` com todos os novos tipos e dados mock
2. Reescrever Plano de Marketing com 6 secoes estrategicas
3. Reescrever Campanhas com dialog de criacao e entregaveis vinculados
4. Reescrever Conteudos com calendario editorial + criador de conteudo IA

**Etapa 2 (proxima implementacao):**
5. Reescrever Redes Sociais com dashboard de metricas e biblioteca
6. Reescrever Sites com construtor de landing pages por blocos
7. Reescrever Trafego Pago com criador de campanha e dashboard avancado

---

## 1. Plano de Marketing -- Cerebro Estrategico (6 Secoes)

Formato: Accordion ou Tabs verticais com 6 secoes sequenciais. Barra de progresso no topo indicando quantas secoes estao preenchidas.

### Secao 1: Posicionamento
- Textarea: Publico-alvo
- Textarea: Persona (nome, idade, dor, desejo)
- Input: Ticket medio
- Textarea: Diferenciais
- Textarea: Concorrentes (ate 3)
- Input: Mercado de atuacao
- Badge "IA pode auxiliar" com botao placeholder "Sugestao de Posicionamento"

### Secao 2: Objetivo
- Select: Tipo de objetivo (Reconhecimento, Geracao de Leads, Vendas Diretas, Autoridade)
- Input: Meta de leads/mes
- Input: Meta de vendas/mes
- Input: ROI esperado (%)

### Secao 3: Canais
- Grid de checkboxes com icones: Instagram, Facebook, Google, YouTube, TikTok, WhatsApp, Site
- Ao ativar canal, sistema registra e pode ativar modulos correspondentes
- Badge de frequencia sugerida por canal

### Secao 4: Orcamento
- Input: Orcamento organico
- Input: Orcamento pago (trafego)
- Input: Orcamento producao (criativos, video)
- KPI: Total do orcamento (soma)
- Grafico pizza simples com distribuicao

### Secao 5: Funil de Marketing
- Visual de funil com 3 camadas (Topo, Meio, Fundo)
- Cada camada com:
  - Descricao do estagio
  - Tipo de conteudo sugerido
  - Metrica-alvo
- Funil desenhado visualmente com CSS (trapezoid shapes ou barras decrescentes)

### Secao 6: Plano de Acao Automatico
- Gerado com base nas respostas das secoes anteriores
- Mostra:
  - Quantidade de posts semanais sugerida
  - Tipos de conteudo por dia da semana
  - Estrategia de trafego sugerida
  - Campanhas recomendadas
  - Estrutura de landing page sugerida
- Botao "Aplicar Plano" que exibe toast de confirmacao (mock -- no futuro alimentaria os outros modulos)

---

## 2. Campanhas -- Hub de Organizacao

### Header com KPIs (existentes, mantidos)

### Dialog "Nova Campanha"
Ao clicar "Nova Campanha", abre dialog com:
- Input: Nome da campanha
- Select: Objetivo (Gerar Leads, Vendas, Brand Awareness, Lancamento)
- Select: Canal principal (Instagram, Facebook, Google, Multi-canal)
- Textarea: Publico-alvo
- Date range: Periodo (inicio e fim)
- Input: Orcamento (R$)
- Select: Status (Ativa, Pausada, Rascunho)

### Cards de campanha expandidos
Cada card agora mostra:
- Secao de entregaveis vinculados (badges):
  - X conteudos
  - X anuncios
  - X landing pages
  - X disparos
- Barra de progresso do orcamento (gasto/total)
- Botao "Ver detalhes" que expande card com lista dos entregaveis

### Detalhe da Campanha (expansivel)
Ao clicar "Ver detalhes":
- Tabs: Resumo | Conteudos | Anuncios | Landing Pages
- Cada tab mostra lista dos itens vinculados (mock)

---

## 3. Conteudos -- Producao Inteligente

### Duas views: Calendario | Lista
Toggle no topo para alternar entre visao de calendario mensal e grid de cards (atual).

### Calendario Editorial
- Grid 7 colunas (Seg-Dom) x semanas do mes
- Cada celula mostra mini-badges dos posts agendados
- Ao clicar na celula, abre dialog de criacao
- Navegacao de mes (setas prev/next)

### Dialog "Criar Conteudo"
Ao clicar "Novo Conteudo" ou em uma celula do calendario:
- Select: Formato (Feed, Story, Reels, Carrossel, Blog, Email)
- Select: Rede social (Instagram, Facebook, LinkedIn, TikTok)
- Select: Etapa do funil (Topo, Meio, Fundo)
- Input: Titulo
- Textarea: Descricao/Briefing
- Date picker: Data de publicacao

### Secao "Gerar com IA" (dentro do dialog)
- Botao "Gerar Copy com IA"
- Ao clicar, preenche automaticamente (mock):
  - Copy sugerida
  - Titulo sugerido
  - CTA sugerido
  - Hashtags sugeridas
- Campos editaveis apos geracao
- Botao "Copiar tudo"

### Integracao com Plano
- Se plano de marketing definiu "3 posts por semana", mostrar banner:
  "Seu plano sugere: Segunda (Autoridade), Quarta (Prova Social), Sexta (Oferta)"
- Indicador visual de meta de posts vs realizado

---

## Secao Tecnica

### Arquivos modificados

```
src/data/clienteData.ts                     -- Expandir com novos tipos e dados mock para marketing 360
src/pages/cliente/ClientePlanoMarketing.tsx  -- Reescrever com 6 secoes estrategicas (Accordion)
src/pages/cliente/ClienteCampanhas.tsx       -- Reescrever com dialog de criacao e entregaveis vinculados
src/pages/cliente/ClienteConteudos.tsx       -- Reescrever com calendario editorial + criador IA
```

### Novos tipos em clienteData.ts

```typescript
interface PlanoMarketing {
  posicionamento: {
    publicoAlvo: string;
    persona: string;
    ticketMedio: number;
    diferenciais: string;
    concorrentes: string[];
    mercado: string;
  };
  objetivo: {
    tipo: "reconhecimento" | "leads" | "vendas" | "autoridade";
    metaLeads: number;
    metaVendas: number;
    roiEsperado: number;
  };
  canais: { name: string; active: boolean; icon: string; frequenciaSugerida: string }[];
  orcamento: {
    organico: number;
    pago: number;
    producao: number;
  };
  funil: {
    topo: { descricao: string; conteudo: string; metrica: string };
    meio: { descricao: string; conteudo: string; metrica: string };
    fundo: { descricao: string; conteudo: string; metrica: string };
  };
  planoAcao: {
    postsSemanais: number;
    cronograma: { dia: string; tipo: string }[];
    estrategiaTrafego: string;
    campanhasSugeridas: string[];
    landingPageSugerida: string;
  };
}

interface CampanhaMarketing {
  id: string;
  name: string;
  objective: string;
  channel: string;
  audience: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: "Ativa" | "Pausada" | "Finalizada" | "Rascunho";
  leads: number;
  conversions: number;
  entregaveis: {
    conteudos: number;
    anuncios: number;
    landingPages: number;
    disparos: number;
  };
}

interface ConteudoMarketing {
  id: string;
  title: string;
  network: string;
  format: "Feed" | "Story" | "Reels" | "Carrossel" | "Blog" | "Email";
  funnelStage: "Topo" | "Meio" | "Fundo";
  status: "Rascunho" | "Agendado" | "Publicado";
  date: string;
  description: string;
  copy?: string;
  cta?: string;
  hashtags?: string[];
  campaignId?: string;
}
```

### Estado dos componentes

**PlanoMarketing:**
```
activeSection: number (0-5, controla accordion aberto)
plano: PlanoMarketing (state editavel)
progress: number (calculado: secoes preenchidas / 6)
```

**Campanhas:**
```
campanhas: CampanhaMarketing[]
filter: string
createOpen: boolean (dialog)
detailId: string | null (campanha expandida)
newCampanha: partial CampanhaMarketing (form state)
```

**Conteudos:**
```
view: "calendario" | "lista"
currentMonth: Date
conteudos: ConteudoMarketing[]
createOpen: boolean
selectedDate: string | null
newConteudo: partial ConteudoMarketing
aiGenerated: boolean
```

### Componentes utilizados

- Accordion (secoes do plano)
- Card, Badge, Button, Input, Textarea, Select
- Checkbox (canais)
- Dialog (criacao de campanha/conteudo)
- Progress (barra do plano)
- KpiCard (metricas)
- PieChart (orcamento)
- Collapsible (gerar com IA)
- Calendar-style grid (conteudos -- CSS grid customizado, nao o componente calendar)

### Responsividade

- Desktop: layouts normais
- Mobile: Accordion empilhado, calendario vira lista semanal, dialogs full-width

### Ordem de implementacao

1. Expandir `clienteData.ts` com tipos e dados mock do marketing 360
2. Reescrever `ClientePlanoMarketing.tsx` com 6 secoes (Accordion)
3. Reescrever `ClienteCampanhas.tsx` com dialog de criacao e entregaveis
4. Reescrever `ClienteConteudos.tsx` com calendario + criador IA

