

# Reestruturação da Ferramenta de Conteúdos

## Resumo das Mudanças

O usuário quer 3 grandes melhorias:

1. **Wizard simplificado para 4 blocos** (não 5 ou 8) — dados da estratégia são importados automaticamente, sem perguntar novamente
2. **Apresentação visual rica** dos conteúdos gerados — cards estilo rede social, não código/JSON
3. **Organização em pastas de lotes** (por data) em vez de histórico plano, com CTAs: Copiar, Baixar PDF, Gerar Postagem

## Plano de Implementação

### 1. Wizard: 4 Blocos Fixos (`ClienteConteudos.tsx`)

Eliminar a lógica adaptativa de 5/8 steps. Sempre 4 blocos:

| Bloco | Conteúdo |
|---|---|
| 1 — Quantidade e Formatos | Slider + distribuição (como hoje). Mostrar limite do plano |
| 2 — Objetivo | Seleção múltipla: Educar, Autoridade, Engajar, Quebrar objeções, Promover, Gerar leads |
| 3 — Tema | Campo opcional. Se há estratégia, mostrar pilares como chips clicáveis. Placeholder: "Ex: marketing para médicos..." |
| 4 — Plataforma | Instagram, LinkedIn, TikTok, YouTube, Blog |

Quando há estratégia → dados de público, tom, ICP, diferenciais, dores são injetados automaticamente no payload sem perguntar. Quando não há → esses campos vão vazios e o edge function lida com isso.

Remover: steps de negócio, público, tom, funil, contexto especial, estilo do lote. O prompt da IA já tem inteligência para distribuir funil e tom baseado na estratégia.

### 2. Apresentação Visual dos Conteúdos (`ClienteConteudos.tsx`)

Redesenhar completamente os cards de resultado:

**Card de Carrossel**: Mostrar slides numerados como mini-cards empilhados com título bold e texto. Visual clean, sem labels "Slide 1".

**Card de Post Único**: Headline grande em destaque, texto abaixo, CTA em badge colorido. Simular visual de post.

**Card de Vídeo**: Hook em destaque (como thumbnail), roteiro em seções colapsadas, CTA final.

**Card de Story**: Frames em row horizontal scrollável.

Cada card terá **3 CTAs fixos**:
- **Copiar** — copia legenda + conteúdo formatado
- **Baixar PDF** — usa html2pdf.js (já instalado) para exportar o card
- **Gerar Postagem** — navega para `/cliente/redes-sociais`

Remover: botão "Ver mais" / expand pattern. Todo conteúdo visível direto. Remover labels técnicos como "conteudo_principal", "embasamento".

### 3. Organização em Pastas de Lotes (tab "Meus Conteúdos")

Renomear tab "Histórico" → "Meus Conteúdos".

Agrupar conteúdos por data de criação (lote = mesma `created_at` ±1min). Mostrar como:

```text
📁 Lote 05/03/2026 — 8 conteúdos
📁 Lote 28/02/2026 — 12 conteúdos
📁 Lote 15/02/2026 — 8 conteúdos
```

Cada pasta expande para mostrar os cards visuais com os mesmos CTAs (copiar, PDF, gerar postagem). Usar `Collapsible` do Radix.

### Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/ClienteConteudos.tsx` | Wizard 4 blocos, cards visuais por formato, pastas de lotes, CTAs (copiar/PDF/postagem) |

Nenhuma mudança no edge function ou hook — o payload já suporta os campos necessários, e campos não enviados são tratados como vazios.

