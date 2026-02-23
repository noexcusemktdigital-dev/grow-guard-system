
# Sites & Landing Pages -- Geracao de Codigo HTML Real com Preview Visual

## Resumo

A plataforma atua como intermediario: coleta tudo que sabe do cliente, monta um briefing, envia para a IA que gera **codigo HTML/CSS/JS completo e responsivo**, renderiza num **iframe real dentro da plataforma** para o cliente ver e aprovar, e so depois permite baixar o codigo para hospedar no dominio dele.

---

## 1. Limites por Plano

Atualizar `src/constants/plans.ts`:

| Plano | Sites Ativos | Tipos Permitidos |
|-------|-------------|-----------------|
| Starter | 1 | Landing Page (1 pagina) |
| Growth | 2 | LP, 3 paginas, 5 paginas |
| Scale | 5 | LP, 3, 5 e 8 paginas |

Adicionar `maxSites: number` e `siteTypes: string[]` ao `PlanConfig`.

---

## 2. Edge Function `generate-site` (NOVA)

Nova edge function que recebe o briefing completo e retorna **codigo HTML completo** (nao JSON, nao mockup).

**System prompt:** Instrui a IA a atuar como um desenvolvedor web expert e gerar:
- HTML5 semantico completo (doctype, head com meta tags, body)
- CSS embutido em tag `<style>` (autocontido, sem dependencias externas exceto Google Fonts)
- Design responsivo mobile-first com media queries
- Secoes corretas para o tipo (hero, features, testimonials, contact form, footer, etc.)
- Textos reais baseados nos dados do cliente (nao lorem ipsum)
- Cores e fontes do cliente aplicadas como CSS variables
- Animacoes suaves com CSS (scroll reveal, hover effects)
- Meta tags SEO basicas (title, description, og:tags)
- Favicon placeholder

**Input do body:**
```text
{
  tipo: "lp" | "3pages" | "5pages" | "8pages",
  objetivo: "leads" | "institucional" | "vendas" | "portfolio",
  estilo: "moderno" | "corporativo" | "ousado" | "minimalista",
  cta_principal: string,
  persona: { nome, descricao },
  identidade_visual: { paleta, fontes, estilo, referencias, tom_visual },
  servicos: string,
  diferencial: string,
  depoimentos: string,
  contato: string,
  instrucoes_adicionais: string,
  estrategia: { segmento, modelo_negocio, cliente_ideal, diferencial, ... }
}
```

**Output:** `{ html: string }` -- string HTML completa pronta para `srcdoc` de iframe.

Usa `google/gemini-3-flash-preview` sem streaming (precisa do HTML inteiro).

---

## 3. Reescrita de `ClienteSites.tsx`

### Wizard de 4 Etapas

**Etapa 1 -- Tipo de Site**
- Cards para cada tipo (LP, 3, 5, 8 paginas)
- Descricao das paginas incluidas em cada tipo
- Tipos fora do plano mostram badge "Disponivel no plano Growth/Scale" e ficam desabilitados
- Contagem de sites ativos vs. limite do plano

**Etapa 2 -- Objetivo e Estilo**
- Objetivo: Captura de Leads / Institucional / Vendas / Portfolio
- Estilo visual: Moderno e clean / Corporativo / Ousado / Minimalista
- CTA principal (input de texto, ex: "Agendar demo gratuita")

**Etapa 3 -- Briefing (revisao)**
- Exibe automaticamente todos os dados coletados:
  - Estrategia (de `localStorage` key `estrategia_data`)
  - Persona (de `localStorage`)
  - Identidade visual (da base de conhecimento local do modulo)
  - Servicos, diferencial, depoimentos, contato (dos campos da base de conhecimento)
- Cada bloco editavel inline
- Campos vazios com indicador visual e sugestao de preencher
- Textarea "Instrucoes adicionais" para complementar

**Etapa 4 -- Geracao e Preview**
- Botao "Gerar Site com IA"
- Barra de progresso animada durante geracao (loading state)
- Apos gerar:
  - **iframe com `srcdoc`** renderizando o HTML completo -- o cliente ve o site real
  - Toggle Desktop (100%) / Tablet (768px) / Mobile (375px) -- muda a largura do iframe
  - Botao fullscreen para ver em tela cheia
  - **Botoes de acao:**
    - "Aprovar e Baixar" -- gera download do HTML como arquivo
    - "Regenerar" -- gera novamente com mesmo briefing
    - "Editar Briefing" -- volta ao passo 3
  - Card de guia de publicacao com instrucoes para hospedar no dominio

### Preview Visual (o ponto principal)
O preview usa `<iframe srcdoc={generatedHtml} />` que renderiza o HTML completo como se fosse um site real. O cliente ve exatamente o que vai publicar: cores, fontes, layout, textos, responsividade -- tudo visivel e interativo dentro do iframe.

### Guia de Publicacao
Card com instrucoes claras:
1. Clique em "Aprovar e Baixar"
2. Descompacte o arquivo no seu computador
3. Acesse o painel da sua hospedagem
4. Faca upload dos arquivos na pasta raiz do seu dominio
5. Aguarde a propagacao (ate 24h)

Campo para o usuario informar a URL apos publicar (status muda para "Publicado").

### Historico
Lista de sites gerados salvos em localStorage (`client-sites`) com:
- Nome, tipo, data, status (Rascunho/Publicado), URL informada
- Botao para re-visualizar (abre preview do HTML salvo)
- Botao para re-baixar

---

## 4. Persistencia da Estrategia

`ClientePlanoMarketing.tsx` linha 686: quando `setCompleted(true)` e chamado, adicionar `localStorage.setItem("estrategia_data", JSON.stringify(answers))` para que Sites e Conteudos possam ler os dados.

---

## Detalhes Tecnicos

### `src/constants/plans.ts`

```typescript
// Adicionar ao PlanConfig:
maxSites: number;
siteTypes: string[];

// Valores:
// Starter: maxSites: 1, siteTypes: ["lp"]
// Growth: maxSites: 2, siteTypes: ["lp", "3pages", "5pages"]
// Scale: maxSites: 5, siteTypes: ["lp", "3pages", "5pages", "8pages"]
```

### `supabase/functions/generate-site/index.ts` (NOVO)

- Recebe briefing completo via POST
- Monta system prompt instruindo a gerar HTML/CSS autocontido
- Chama Lovable AI gateway com `google/gemini-3-flash-preview`
- Retorna `{ html: string }`
- Trata erros 429/402

### `src/pages/cliente/ClienteSites.tsx` (REESCRITA)

- Wizard animado com 4 etapas (framer-motion)
- Leitura automatica de estrategia, persona, identidade visual
- Chamada via `supabase.functions.invoke("generate-site", { body })`
- Preview em `<iframe srcdoc={html} sandbox="allow-scripts" />` com toggle de viewport
- Download via `new Blob([html], { type: "text/html" })` + `URL.createObjectURL`
- Historico persistido em localStorage

### `src/pages/cliente/ClientePlanoMarketing.tsx`

- Adicionar 1 linha em `handleNext`: salvar answers no localStorage quando completa

### `supabase/config.toml`

- Adicionar `[functions.generate-site]` com `verify_jwt = false`

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/constants/plans.ts` | Adicionar `maxSites` e `siteTypes` |
| `src/pages/cliente/ClienteSites.tsx` | Reescrita completa: wizard 4 etapas, geracao real, preview iframe, download |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Salvar answers no localStorage |
| `supabase/functions/generate-site/index.ts` | Nova edge function (Lovable AI -> HTML completo) |
| `supabase/config.toml` | Adicionar config do generate-site |
