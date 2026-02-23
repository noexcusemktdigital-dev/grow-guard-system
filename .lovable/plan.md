
# Fluxo Padrao por Conteudos + Personas + Referencias Visuais

## Resumo

Tres melhorias principais:
1. **Fluxo padrao = importar conteudos** (criar do zero vira opcao secundaria)
2. **Personas/publico-alvo** em todo o pipeline (Conteudos, Redes Sociais, edge functions)
3. **Referencias visuais por tipo de post** — briefing completo com tudo que a IA precisa para gerar artes de qualidade

---

## 1. Reorganizar o Fluxo: Conteudos como Padrao

Ao clicar em "Nova Criacao Mensal" em Redes Sociais, o usuario ve duas opcoes:

| Opcao | Destaque | Descricao |
|-------|----------|-----------|
| **Gerar a partir dos Conteudos** | PRIMARIO (card grande) | Lista campanhas de conteudos existentes. Seleciona quais transformar em arte. Titulo, legenda e CTA ja vem preenchidos. |
| **Criar do zero (briefing)** | SECUNDARIO (link/card menor) | Abre wizard atual com briefing completo. |

**Fluxo "A partir dos Conteudos":**
- Tela 1: Lista campanhas do localStorage com conteudos (titulo, formato, funil)
- O usuario marca quais conteudos quer transformar em arte (checkbox)
- Tela 2: Campos rapidos — persona, nivel de qualidade, estilo visual, tipo de post
- Tela 3: Confirma e gera

**Persistencia:** `ClienteConteudos.tsx` salva campanhas em localStorage (chave `content-campaigns`) apos gerar, para que Redes Sociais consiga ler.

---

## 2. Adicionar Persona/Publico-Alvo

Nova secao de **Persona** que aparece em:
- Wizard de Conteudos (etapa 1, junto com objetivo e tema)
- Wizard de Redes Sociais (ambos os fluxos)
- Aba "Identidade Visual" em Redes Sociais (como campo persistente)

**Campos da Persona:**
- `persona_nome` — Nome da persona (ex: "Maria, dona de franquia, 38 anos")
- `persona_descricao` — Textarea com: idade, profissao, dores, desejos, comportamento de compra, redes que usa, tom que prefere

A persona e enviada para todas as edge functions:
- `generate-content`: adapta roteiros, CTAs e embasamento ao publico
- `generate-social-concepts`: adapta linguagem, angulo visual e CTA
- `generate-social-image`: adapta estetica (persona jovem = visual moderno; persona executivo = visual corporativo)

---

## 3. Referencias Visuais por Tipo de Post

Adicionar ao briefing (e ao system prompt das edge functions) um bloco de **referencias visuais** que a IA usa para entender o que gerar. O sistema ja tem campos de "Referencias Visuais" e "Concorrencia Visual" na base de conhecimento, mas eles nao sao enviados para as edge functions.

**Mudancas:**
- Ler os campos da base de conhecimento (`initialSections`) e incluir no body das chamadas as edge functions como `identidade_visual`
- Adicionar campo de **referencia visual por tipo de post** no wizard — uma textarea onde o usuario pode descrever ou colar links de posts que gosta para aquele tipo especifico
- Incluir no prompt da IA instrucoes especificas por tipo usando essas referencias

**Novo campo no wizard:**
- `referencias_tipo` — Textarea: "Descreva ou cole links de posts que voce gosta para este tipo de conteudo"

**No system prompt do `generate-social-concepts`:**

```text
IDENTIDADE VISUAL DO CLIENTE:
- Paleta: ${identidade.paleta}
- Fontes: ${identidade.fontes}
- Estilo: ${identidade.estilo}
- Referencias: ${identidade.referencias}
- Concorrencia: ${identidade.concorrencia}
- Tom Visual: ${identidade.tom_visual}

REFERENCIAS ESPECIFICAS PARA ESTE TIPO (${tipo_post}):
${referencias_tipo}

Use estas referencias como base para gerar prompts visuais que sigam
o mesmo padrao estetico, paleta e nivel de qualidade.
```

**No system prompt do `generate-social-image`:**

```text
BRAND IDENTITY:
- Colors: ${identidade.paleta}
- Style: ${identidade.estilo}
- Visual tone: ${identidade.tom_visual}
- Audience: ${persona}

Ensure the generated image matches this brand identity precisely.
Use the brand colors as dominant palette.
```

---

## 4. Briefing Completo: Tudo que a IA Precisa

Consolidando todos os dados que serao enviados para as edge functions:

| Dado | Origem | Usado em |
|------|--------|----------|
| Persona (nome + descricao) | Wizard ou Identidade Visual | Conteudos, Concepts, Image |
| Tipo de post (produto, servico, etc) | Wizard | Concepts, Image |
| Nivel de qualidade (simples, elaborado, alto padrao) | Wizard | Concepts, Image |
| Descricao do produto/servico | Wizard (condicional) | Concepts |
| Paleta de cores | Identidade Visual | Concepts, Image |
| Fontes | Identidade Visual | Concepts |
| Estilo visual preferido | Identidade Visual | Concepts, Image |
| Referencias visuais | Identidade Visual | Concepts |
| Concorrencia visual | Identidade Visual | Concepts |
| Tom visual | Identidade Visual | Concepts, Image |
| Roteiros importados | Conteudos (localStorage) | Concepts |
| Referencias por tipo | Wizard | Concepts |
| Objetivo, temas, promocoes | Wizard | Concepts, Content |

---

## Detalhes Tecnicos

### Frontend: `ClienteRedesSociais.tsx`

1. Reescrever inicio do wizard com 2 cards (conteudos como padrao, briefing como secundario)
2. Fluxo "conteudos": ler `content-campaigns` do localStorage, exibir lista com checkboxes, campos rapidos
3. Adicionar campos: `personaNome`, `personaDescricao`, `referenciasTipo`
4. Na Identidade Visual: adicionar secao "Persona" com campos nome e descricao
5. Ao chamar `generate-social-concepts`: enviar `identidade_visual` (lido dos `sections`), `persona`, `referencias_tipo`
6. Ao chamar `generate-social-image`: enviar `persona` e `identidade_visual` (cores, estilo)

### Frontend: `ClienteConteudos.tsx`

1. Adicionar campos `personaNome` e `personaDescricao` na etapa 1 do wizard
2. Enviar `persona` para `generate-content`
3. Salvar campanhas em localStorage (`content-campaigns`) apos geracao:
```typescript
localStorage.setItem("content-campaigns", JSON.stringify(campaigns));
```

### Edge Function: `generate-social-concepts`

Adicionar ao body aceito: `persona`, `identidade_visual`, `referencias_tipo`

Injetar no system prompt:
```text
TARGET AUDIENCE (PERSONA):
Name: ${persona?.nome}
Description: ${persona?.descricao}
Adapt ALL content to resonate with this persona.

BRAND IDENTITY:
Colors: ${identidade_visual?.paleta}
Fonts: ${identidade_visual?.fontes}
Style: ${identidade_visual?.estilo}
References: ${identidade_visual?.referencias}
Competitors: ${identidade_visual?.concorrencia}
Visual Tone: ${identidade_visual?.tom_visual}

TYPE-SPECIFIC REFERENCES:
${referencias_tipo}
```

### Edge Function: `generate-social-image`

Adicionar ao body aceito: `persona`, `identidade_visual`

Injetar no prompt:
```text
BRAND IDENTITY:
- Primary colors: ${identidade_visual?.paleta}
- Visual style: ${identidade_visual?.estilo}
- Target audience: ${persona?.descricao}

Match these brand guidelines precisely in the generated image.
```

### Edge Function: `generate-content`

Adicionar ao body aceito: `persona`

Injetar no system prompt:
```text
PERSONA DO PUBLICO-ALVO:
${persona?.nome}: ${persona?.descricao}
Adapte TODOS os roteiros, CTAs e embasamentos para este publico.
Use linguagem e referencias que ressoem com esta persona.
```

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Wizard com 2 fluxos, campo persona, referencias por tipo, envio de identidade visual |
| `src/pages/cliente/ClienteConteudos.tsx` | Salvar em localStorage, campo persona, enviar para edge function |
| `supabase/functions/generate-social-concepts/index.ts` | Receber persona, identidade visual e referencias no prompt |
| `supabase/functions/generate-social-image/index.ts` | Receber persona e identidade visual no prompt |
| `supabase/functions/generate-content/index.ts` | Receber e usar persona no prompt |
