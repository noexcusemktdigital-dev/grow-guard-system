

# Conteudos — Reformulacao Completa com IA Generativa

Transformar a pagina de Conteudos em uma experiencia de "Agencia de IA" que gera campanhas mensais completas (roteiros, carrosseis, posts, reels) com base em um briefing rapido + dados da Estrategia, usando Lovable AI (sem custo extra de API).

---

## Conceito Geral

A pagina atual tem uma "Base de Conhecimento" estatica e pastas de arquivos mock. A nova versao sera organizada em 3 abas:

1. **Campanhas** (principal) — Criar e gerenciar campanhas mensais de conteudo
2. **Tutorial** — Guia visual e didatico sobre formatos, como gravar, dimensoes
3. **Historico** — Timeline de campanhas anteriores

---

## Aba 1 — Campanhas

### Fluxo de criacao

**Botao "Nova Campanha Mensal"** abre um wizard em 3 etapas:

**Etapa 1 — Briefing Rapido (1 tela)**
Formulario agrupado com campos essenciais:
- Mes de referencia (select com meses)
- Objetivo principal do mes (choice: Gerar leads, Aumentar engajamento, Lancar produto, Vender mais, Fortalecer marca)
- Tema central (texto curto)
- Promocoes/ofertas do mes (texto, opcional)
- Datas comemorativas relevantes (texto, opcional)
- Destaques/novidades (texto, opcional)
- Tom de comunicacao (choice: Educativo, Inspirador, Direto, Storytelling, Misto)

**Etapa 2 — Quantidade e Formatos (1 tela)**
Cards clicaveis para selecionar formatos com quantidades:
- Posts Feed (input numerico, sugestao: 8)
- Carrosseis (input numerico, sugestao: 4)
- Roteiros de Reels/Video (input numerico, sugestao: 4)
- Stories (input numerico, sugestao: 4)
Total automatico calculado no rodape.

**Etapa 3 — Geracao com IA**
Botao "Gerar Conteudos" chama a edge function que envia o briefing + dados da estrategia (se disponivel no localStorage) para o Lovable AI Gateway. Exibe um loading animado com frases rotativas ("Analisando seu publico...", "Criando roteiros...", "Definindo CTAs...").

### Resultado da Geracao

Pasta do mes criada automaticamente com os conteudos gerados. Cada conteudo inclui:
- Titulo
- Formato (Feed, Carrossel, Reels, Story)
- Rede social sugerida
- Etapa do funil (Topo, Meio, Fundo)
- Roteiro/texto completo
- Hashtags sugeridas
- **Embasamento**: Um bloco explicativo de 2-3 linhas dizendo POR QUE aquele formato e conteudo foram escolhidos (ex: "Carrosseis educativos no Instagram tem 3x mais salvamentos, ideal para topo de funil com publico que esta na fase de descoberta")
- Status de aprovacao (aprovado/pendente)

### Organizacao Visual

- Pastas mensais como cards grandes com destaque no mes atual (borda primaria, badge "Mes Atual")
- Dentro da pasta: grid de cards por conteudo (nao lista de arquivos)
- Cada card mostra: titulo, formato (badge colorida), rede, funil, status de aprovacao
- Ao clicar: abre o roteiro completo + embasamento + botoes (Aprovar, Copiar, Editar)
- Filtros rapidos por formato e status dentro da pasta

---

## Aba 2 — Tutorial

Secao visual e didatica com cards informativos sobre cada formato:

| Formato | Conteudo do Tutorial |
|---------|---------------------|
| Feed | Dimensao 1080x1080, dicas de legenda, exemplos de estrutura |
| Carrossel | Ate 10 slides, narrativa sequencial, dicas de capa |
| Reels | Duracao ideal (15-60s), gancho nos 3 primeiros segundos, como gravar com celular |
| Story | 1080x1920, enquetes/stickers, sequencia narrativa |
| Video longo | Formato YouTube, estrutura intro-conteudo-CTA |

Cada card tera:
- Icone e nome do formato
- Dimensoes e especificacoes tecnicas
- "Como gravar" com dicas praticas (iluminacao, cenario, audio)
- "Estrutura ideal" com template
- Badge visual com a proporcao (1:1, 9:16, 16:9)

---

## Aba 3 — Historico

Lista cronologica das campanhas geradas, com:
- Mes, quantidade de conteudos, status geral (X aprovados de Y)
- Expansivel para ver resumo dos conteudos

---

## Backend — Edge Function com Lovable AI

Nova edge function `generate-content` que:

1. Recebe o briefing + dados da estrategia
2. Monta um prompt de sistema detalhado que gera conteudos estruturados
3. Usa tool calling para retornar JSON estruturado com os conteudos
4. Retorna array de conteudos com titulo, roteiro, formato, rede, funil, hashtags e embasamento

O modelo usado sera `google/gemini-3-flash-preview` (rapido, sem custo de API key — ja incluido no Lovable AI).

A funcao sera chamada via `supabase.functions.invoke('generate-content', { body: {...} })` sem streaming (resposta unica).

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteConteudos.tsx` | Reescrita completa |
| `supabase/functions/generate-content/index.ts` | Nova edge function |
| `supabase/config.toml` | Adicionar entrada da funcao (verify_jwt = false) |

---

## Detalhes Tecnicos

### Edge Function — generate-content

```text
POST /generate-content
Body: {
  briefing: { mes, objetivo, tema, promocoes, datas, destaques, tom },
  formatos: { feed: 8, carrossel: 4, reels: 4, story: 4 },
  estrategia: { segmento, publico, concorrencia, presenca_digital, ... } // opcional
}

Response: {
  conteudos: [
    {
      titulo: string,
      formato: "Feed" | "Carrossel" | "Reels" | "Story",
      rede: "Instagram" | "LinkedIn" | "TikTok",
      funil: "Topo" | "Meio" | "Fundo",
      roteiro: string,
      hashtags: string[],
      embasamento: string
    }
  ]
}
```

Usa tool calling do Lovable AI para garantir resposta JSON estruturada.

### Estado Local

Os conteudos gerados serao armazenados em `useState` (mock/local) nesta fase — persistencia em banco sera adicionada depois. Os dados da estrategia serao lidos do `localStorage` se disponiveis.

### Tutorial

Componente estatico com dados hardcoded sobre cada formato. Sem integracao com IA — e conteudo educacional fixo.

### Estilo Visual

- Cards de conteudo com badge de formato colorida (Feed=azul, Carrossel=roxo, Reels=rosa, Story=amber)
- Embasamento em bloco destacado com icone Lightbulb e fundo suave
- Loading de geracao com animacao framer-motion (pulse + texto rotativo)
- Tutorial com cards visuais grandes, icones e proporcoes ilustradas

