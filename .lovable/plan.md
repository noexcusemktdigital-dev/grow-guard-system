

# Modulo Comercial -- Marketing (Drive de Materiais)

## Resumo

Criar a pagina **Marketing** no modulo Comercial, funcionando como um drive curado de materiais. Organizado por 6 abas internas (Redes Sociais, Campanhas por Produto, Embalde Mensal, Apresentacoes e Portfolio, Materiais da Marca, Kit do Dia a Dia), com navegacao por pastas, breadcrumb, filtros, upload pela franqueadora e download pelo franqueado.

---

## Arquivos a Criar

```text
src/data/marketingData.ts         -- tipos, interfaces, mock data, helpers
src/pages/Marketing.tsx           -- pagina principal com abas e drive
src/components/MarketingDrive.tsx  -- componente de navegacao tipo drive (pastas + arquivos)
src/components/MarketingUpload.tsx -- dialog de upload com metadados obrigatorios
```

## Arquivos a Modificar

```text
src/components/FranqueadoraSidebar.tsx  -- ativar Marketing (remover disabled)
src/App.tsx                             -- adicionar rota /franqueadora/marketing
```

---

## 1. Dados Mock (`src/data/marketingData.ts`)

### Tipos

```text
MarketingCategory =
  "RedesSociais" | "CampanhaProduto" | "EmbaldeMensal" |
  "ApresentacaoPortfolio" | "Marca" | "KitDiaADia"

MarketingFormat =
  "feed" | "story" | "reels" | "carrossel" | "legenda" |
  "pdf" | "ppt" | "zip" | "png" | "svg" | "psd" | "jpg" |
  "mp4" | "doc" | "ai" | "figma"

MarketingProduct = "Noexcuse" | "SaaS" | "Sistema" | "Franquia" | "Geral"
```

### Interface MarketingAsset

```text
id, title, fileName, fileSize (string ex: "2.4 MB"),
type (MarketingCategory),
year (number), month (number),
product (MarketingProduct),
campaign (string opcional),
format (MarketingFormat),
tags (string[]),
version (string ex: "v1"),
isPublished (boolean),
uploadedBy (string),
createdAt (string),
// Subpasta dentro da categoria (ex: "Feed", "Story", "2026/02")
folder (string opcional)
```

### Interface MarketingFolder

```text
id, name, parentId (string | null),
category (MarketingCategory),
path (string -- breadcrumb completo ex: "Redes Sociais/2026/02 Fevereiro/Feed"),
childCount (number)
```

### Dados iniciais

- 15-20 assets mock distribuidos entre as 6 categorias
- Estrutura de pastas mock para cada categoria:
  - Redes Sociais: 2026 > 02 Fevereiro > Feed, Story, Reels, Carrossel, Legendas
  - Campanhas por Produto: Noexcuse > Venda Franquia 2026 > Criativos, Copy, Midia Paga
  - Embalde Mensal: 2026 > 02 Fevereiro (ZIP + Guia)
  - Apresentacoes: pastas fixas (Institucional, Portfolio, Propostas, Cases)
  - Marca: pastas fixas (Logos, Manual, Paleta, Arquivos Abertos)
  - Kit Dia a Dia: pastas fixas (Fundos Tela, Foto Perfil, Assinatura Email, Templates Docs)

### Helpers

- `getAssetsByCategory(category)` -- filtra assets
- `getFoldersByCategory(category)` -- retorna arvore de pastas
- `getCategoryLabel(category)` -- nome amigavel
- `getCategoryIcon(category)` -- icone lucide correspondente
- `getFormatIcon(format)` -- icone baseado no tipo de arquivo

---

## 2. Pagina Principal (`src/pages/Marketing.tsx`)

### Layout

- Titulo "Marketing" + badge "Franqueadora (acesso total)"
- 6 abas internas usando componente Tabs (mesmo padrao do Gerenciamento de Contratos):
  - Redes Sociais (icone `Image`)
  - Campanhas por Produto (icone `Target`)
  - Embalde Mensal (icone `Package`)
  - Apresentacoes e Portfolio (icone `Presentation`)
  - Materiais da Marca (icone `Palette`)
  - Kit do Dia a Dia (icone `Briefcase`)

### Barra de acoes (acima das abas)

- Busca por nome/tag (Input com icone Search)
- Filtros rapidos (chips):
  - Mes (Select)
  - Produto (Select: Noexcuse/SaaS/Sistema/Franquia/Geral)
  - Formato (Select: feed/story/reels/pdf/ppt/zip/png/etc)
  - Campanha (Select, populado dos dados)
  - Status: Publicado / Rascunho (Select)
- Botao "+ Novo Upload" (abre dialog de upload -- so visivel no modo franqueadora)

### Conteudo de cada aba

- Renderiza o componente `MarketingDrive` passando a categoria correspondente
- Os filtros globais se aplicam dentro de cada aba

---

## 3. Componente Drive (`src/components/MarketingDrive.tsx`)

### Navegacao por pastas

- State `currentPath` (array de strings representando o caminho)
- **Breadcrumb** no topo: Marketing > [Categoria] > [Pasta] > [Subpasta]
  - Cada nivel clicavel para voltar
- **Grid de pastas** (quando ha subpastas no nivel atual):
  - Cards com icone `FolderOpen`, nome da pasta, contagem de arquivos
  - Clicar entra na pasta (push no currentPath)
  - Grid responsivo: 4 colunas desktop, 3 tablet, 2 mobile

### Lista de arquivos (no nivel atual)

- Exibidos abaixo das pastas (ou sozinhos se nao ha subpastas)
- Cada arquivo como card horizontal:
  - Icone baseado no formato (imagem, pdf, zip, video, etc)
  - Titulo + nome do arquivo
  - Badges: formato, produto, campanha (se houver)
  - Tags (chips pequenos)
  - Versao (ex: "v2")
  - Tamanho do arquivo
  - Status: badge "Publicado" (verde) ou "Rascunho" (cinza) -- rascunho so visivel para franqueadora
  - Data de upload
  - Botoes:
    - Download (icone `Download`) -- toast "Download iniciado"
    - Ver detalhes (icone `Eye`) -- abre dialog com todos os metadados
    - Editar (icone `Pencil`) -- so franqueadora, abre dialog de edicao
    - Excluir (icone `Trash2`) -- so franqueadora, com confirmacao

### Estado vazio

- Quando uma pasta nao tem arquivos: mensagem "Nenhum material nesta pasta" com icone

---

## 4. Dialog de Upload (`src/components/MarketingUpload.tsx`)

### Campos obrigatorios

- Titulo (Input)
- Arquivo (Input type file -- aceita multiplos)
- Tipo de material (Select com as 6 categorias)
- Mes competencia (Select meses)
- Ano (Input number, default ano atual)
- Produto (Select: Noexcuse/SaaS/Sistema/Franquia/Geral)
- Formato (Select com lista de formatos)

### Campos opcionais

- Campanha (Input texto)
- Tags (Input texto, separar por virgula)
- Versao (Input, default "v1")
- Pasta destino (Select baseado na categoria selecionada)

### Acoes

- "Salvar como Rascunho" -- cria com isPublished = false
- "Publicar" -- cria com isPublished = true
- Validacao: nao permite salvar sem titulo, tipo, mes, ano e produto

### Dialog de edicao

- Mesmo formulario, pre-preenchido
- Botao extra: "Publicar" / "Despublicar" (toggle)

---

## 5. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Remover `disabled: true` do item Marketing na secao Comercial:

```text
{ label: "Marketing", icon: Zap, path: "/franqueadora/marketing" }
```

### App.tsx

Adicionar rota:

```text
<Route path="marketing" element={<Marketing />} />
```

---

## 6. Detalhes de UX

### Visao Franqueadora vs Franqueado (preparacao visual)

- Badge no topo indica perfil ativo
- Franqueadora: ve tudo (rascunhos + publicados), pode fazer upload/editar/excluir/publicar
- Franqueado: ve somente publicados, so pode baixar e ver detalhes
- Por ora, visao padrao e franqueadora (controle real vira com auth)

### Download

- Botao de download em cada arquivo (toast "Download iniciado - nome_arquivo")
- Nao implementar ZIP real neste momento -- botao "Baixar pasta como ZIP" aparece mas mostra toast "Em breve"

### Responsividade

- Grid de pastas: 4 cols desktop, 3 tablet, 2 mobile
- Lista de arquivos: cards que se adaptam a largura
- Filtros em linha no desktop, empilhados no mobile

---

## Ordem de implementacao

1. `marketingData.ts` -- tipos, interfaces, mock data, helpers
2. `MarketingDrive.tsx` -- componente de navegacao (pastas + arquivos + breadcrumb)
3. `MarketingUpload.tsx` -- dialog de upload/edicao com metadados
4. `Marketing.tsx` -- pagina principal com abas e filtros
5. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

