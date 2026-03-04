

# Bloco 4: Redesign Artes para Redes Sociais

## Visao Geral

Transformar a pagina `ClienteRedesSociais.tsx` de um wizard em dialog para uma **experiencia full-page em 3 etapas** (Formato → Modo → Criar), com templates selecionaveis, mockup Instagram para aprovacao, e identidade visual integrada. Baseado nas referencias enviadas pelo usuario.

---

## A. Wizard Full-Page em 3 Steps

### Situacao Atual
O wizard roda dentro de um `Dialog` com 4 sub-steps. O fluxo e: choose → content/briefing → steps 1-4 dentro do dialog.

### Alteracoes
- Substituir o `Dialog` do wizard por uma **pagina full-screen** com stepper visual no topo (circulo numerado + label + linha conectora, como na referencia)
- **Step 1 — Formato**: Grid de cards visuais com preview do formato (Feed 1:1, Story 9:16, Carrossel, Post Portrait, etc). Filtro por rede social (Instagram, Facebook, LinkedIn). Cards com gradiente roxo/rosa como na referencia.
- **Step 2 — Modo**: 3 opcoes grandes — "Criar do Zero" (IA gera tudo), "A partir de Link" (cola URL e IA extrai conteudo), "A partir de Template" (selecionar template base). Abaixo, chips de objetivo (Alcance, Vender, Engajar, Educar, Autoridade).
- **Step 3 — Criar**: Briefing contextualizado + geracao + preview com mockup Instagram

### Nova Rota
- `/cliente/redes-sociais/criar` — pagina standalone do wizard (nao dialog)
- O botao "Nova Criacao" redireciona para essa rota ao inves de abrir dialog

---

## B. Templates Selecionaveis (6 Padroes)

### Alteracoes
- Adicionar opcao "A partir de Template" no Step 2
- Criar **6 templates base** como constantes (JSON com layout, cores, posicoes de texto):
  1. **Impacto Bold** — fundo escuro, texto grande uppercase, faixas diagonais
  2. **Clean Moderno** — fundo claro, tipografia fina, muito espaco branco
  3. **Elegante Premium** — fundo escuro, acentos dourados, serifa
  4. **Colorido Vibrante** — gradientes, formas organicas, sans-serif bold
  5. **Foto Destaque** — foto full-bleed com overlay e texto sobre
  6. **Corporativo Pro** — grid limpo, cores neutras, logo no topo
- Cada template e um `TemplateConfig` do `canvasTemplateEngine.ts` que ja existe
- O usuario seleciona o template → a IA ajusta textos/cores baseado no briefing e identidade visual
- Preview do template com miniatura visual antes de selecionar

---

## C. Mockup Instagram para Aprovacao

### Situacao Atual
As artes geradas aparecem como cards simples com img + legenda. Nao ha preview tipo Instagram.

### Alteracoes
- Criar componente `InstagramMockup` que renderiza a arte dentro de um frame de celular/Instagram:
  - Header com foto de perfil + nome da conta + "..."
  - Imagem da arte no centro
  - Barra de acoes (coracao, comentario, enviar, salvar)
  - Contagem de curtidas ficticia
  - Legenda com @handle + texto + hashtags
  - Indicador de slides para carrossel (1/5)
- Painel lateral com:
  - Legenda final editavel
  - Contagem de caracteres + hashtags
  - Botao "Refinar com IA"
  - Botao "Publicar no Instagram" (placeholder, mostra aviso de conexao)
  - Botoes: Agendar, Baixar, Salvar
  - Copiar Legenda, Criar Novo Post
- Substituir o editor modal atual por essa view de mockup

---

## D. Fluxo de Geracao Atualizado

### Alteracoes no Step 3 (Criar)
- Quando modo = "template": enviar o `TemplateConfig` do template selecionado para o `generate-template-layout` que ja existe. A IA ajusta elementos baseado no briefing.
- Quando modo = "link": campo de URL + botao para IA extrair headline/copy do link
- Quando modo = "zero": briefing simplificado (titulo, subtitulo, CTA, estilo — sem o formulario extenso atual)
- Apos geracao, mostrar resultado no `InstagramMockup`

---

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Refatorar — remover wizard dialog, manter campanhas/calendario/identidade visual |
| `src/pages/cliente/ClienteRedesSociaisCriar.tsx` | CRIAR — wizard full-page 3 steps |
| `src/components/cliente/InstagramMockup.tsx` | CRIAR — preview mockup Instagram + painel lateral |
| `src/components/cliente/ArtTemplates.tsx` | CRIAR — 6 templates base + seletor visual |
| `src/App.tsx` | Nova rota `/cliente/redes-sociais/criar` |

Nenhuma migracao de banco necessaria.

