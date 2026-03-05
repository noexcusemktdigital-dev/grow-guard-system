

# Plano: Vincular conteúdo gerado ao Step 5 (Texto da arte)

## Problema
No passo 5 do wizard de artes, o usuário precisa digitar manualmente headline, subheadline, CTA, etc. Mas esses textos já existem nos conteúdos gerados na ferramenta "Conteúdos". Hoje o conteúdo vinculado (contentData) só preenche o briefing no step 1 — não preenche os campos do step 5.

## Solução

No **step 5** (`case 5` do `renderArtStep`, linha 771), adicionar um seletor de conteúdo no topo:

1. **Botão "Importar de Conteúdo"** — abre um dialog/dropdown com a lista de conteúdos aprovados (`useContentHistory`)
2. Ao selecionar um conteúdo, preenche automaticamente os campos: `headline`, `subheadline`, `supportingText`, `bulletPoints`, `cta` a partir do `result` do conteúdo
3. Se já existe `contentData` vinculado no step 1, mostrar um botão direto "Usar texto do conteúdo vinculado" sem precisar abrir o seletor
4. O usuário pode editar todos os campos após o preenchimento automático

### Arquivo: `src/pages/cliente/ClienteRedesSociais.tsx`

**Mudanças:**

- Importar `useContentHistory` de `useClienteContentV2`
- No step 5, antes dos inputs, renderizar:
  - Se `contentData` existe: card com botão "Usar texto deste conteúdo" que preenche os campos
  - Botão "Importar de outro conteúdo" que abre um Dialog com a lista de conteúdos aprovados
- Criar função `fillTextFromContent(content)` que extrai do `result`:
  - `result.conteudo_principal.headline` → headline
  - `result.conteudo_principal.subtitulo` ou legenda parcial → subheadline
  - `result.legenda` (truncada) → supportingText  
  - `result.conteudo_principal.bullet_points` → bulletPoints
  - `result.conteudo_principal.cta` → cta
- Dialog simples com ScrollArea listando conteúdos com título e data, clicável

### UX

O step 5 ficará assim:
```text
┌─────────────────────────────────┐
│ Texto da arte                   │
│ Preencha ou importe de conteúdo │
│                                 │
│ ┌─[Conteúdo vinculado: "..."]─┐ │  ← só se contentData existe
│ │ [Usar texto deste conteúdo] │ │
│ └─────────────────────────────┘ │
│                                 │
│ [📄 Importar de outro conteúdo] │  ← abre dialog com lista
│                                 │
│ Headline: [____________]        │
│ Subheadline: [_________]        │
│ Texto de apoio: [______]        │
│ Bullet points: [_______]        │
│ CTA: [_________________]        │
│ Marca: [_______________]        │
└─────────────────────────────────┘
```

Nenhuma migration necessária. Apenas alteração de UI no `ClienteRedesSociais.tsx`.

