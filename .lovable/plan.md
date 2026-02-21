

# Redesign Completo do Modulo Marketing

## Resumo

Redesign UX/UI completo da aba Marketing: abas mais chamativas com icones grandes e contagem, botoes de criacao de pasta e upload dentro de cada aba, preview visual ao clicar em um arquivo (simulando thumbnail), e melhorias gerais de diagramacao e espacamento.

---

## 1. Abas Visuais Chamativas (`Marketing.tsx`)

Substituir o `TabsList` padrao (cinza pequeno) por cards grandes e visuais, um para cada categoria. Cada card tera:

- Icone grande (24px) com fundo colorido arredondado (cor unica por categoria)
- Nome da categoria em negrito
- Contagem de materiais da categoria (ex: "12 arquivos")
- Borda inferior colorida ou fundo highlight quando ativo
- Grid de 6 cards em linha no desktop, wrap no mobile

Cores por categoria:
- Redes Sociais: azul (`blue-500`)
- Campanhas por Produto: laranja (`orange-500`)
- Embalde Mensal: roxo (`purple-500`)
- Apresentacoes: verde (`emerald-500`)
- Materiais da Marca: rosa/primary (`rose-500`)
- Kit do Dia a Dia: amarelo (`amber-500`)

### Filtros

Mover os filtros para uma barra mais compacta com icone de funil e collapsible (mostrar/esconder filtros). Busca sempre visivel, filtros extras em linha recolhivel.

---

## 2. Toolbar de Acoes Dentro do Drive (`MarketingDrive.tsx`)

Adicionar uma barra de acoes contextual entre o breadcrumb e o conteudo:

- Botao "Nova Pasta" (icone `FolderPlus`) -- abre dialog simples com campo nome
- Botao "Upload de Arquivo" (icone `Upload`) -- abre o dialog de upload existente, pre-selecionando a categoria e pasta atual
- Botao "Baixar pasta como ZIP" (quando dentro de subpasta)

### Dialog "Nova Pasta"

- Campo: Nome da pasta
- A pasta e criada como filha da pasta atual (mock: toast de confirmacao)

---

## 3. Preview Visual ao Clicar no Arquivo (`MarketingDrive.tsx`)

Substituir o dialog simples de detalhes por um painel de preview mais rico:

- Dialog maior (`max-w-2xl`)
- Area de preview no topo:
  - Imagens (png/jpg/svg/feed/story/reels/carrossel): placeholder visual colorido com icone grande e nome do formato (simula thumbnail)
  - Videos (mp4): placeholder com icone Play central
  - PDFs/Docs: placeholder com icone de documento e "Clique para abrir"
  - ZIPs: placeholder com icone de arquivo e lista de conteudo simulada
- Abaixo do preview: metadados em grid organizado
- Barra de acoes no rodape: Download, Editar, Excluir
- Tags como chips coloridos

---

## 4. Melhorias de Design Geral

### Header da pagina

- Titulo maior com descricao curta abaixo ("Gerencie e distribua materiais de marketing para a rede")
- Badge de perfil mais destacado
- Botao "Novo Upload" com estilo primario mais proeminente

### Cards de pasta (folder grid)

- Cards maiores com padding maior
- Icone de pasta com cor baseada na categoria (nao sempre amarelo)
- Hover com leve elevacao (shadow) e scale
- Contagem de arquivos + sub-itens

### Cards de arquivo (asset list)

- Redesign com mais espacamento e hierarquia visual
- Thumbnail placeholder a esquerda (quadrado colorido com icone do formato, 48x48)
- Titulo em fonte maior
- Metadados (tamanho, versao, data) em linha cinza abaixo
- Badges mais legveis com cores distintas por formato
- Acoes em menu dropdown (tres pontos) ao inves de botoes soltos para visual mais limpo
- Separador visual entre cada arquivo

### Estado vazio

- Ilustracao maior
- Texto mais explicativo
- Botao CTA "Fazer primeiro upload" ou "Criar pasta"

---

## Detalhes Tecnicos

### Arquivos modificados

```text
src/pages/Marketing.tsx           -- abas visuais, header, filtros recolhiveis
src/components/MarketingDrive.tsx  -- toolbar, nova pasta, preview, redesign cards
src/data/marketingData.ts          -- adicionar campo de descricao por categoria e cores
```

### Novas dependencias de icones (lucide-react, ja instalado)

```text
FolderPlus, Filter, MoreVertical, Play, ImageIcon, FileText, X
```

### Alteracoes em Marketing.tsx

1. Substituir `TabsList` por grid de cards clicaveis usando `Tabs` com value controlado
2. Adicionar state `activeTab` controlado
3. Filtros em `Collapsible` com botao "Filtros" toggle
4. Header com subtitulo descritivo

### Alteracoes em MarketingDrive.tsx

1. Adicionar state `newFolderOpen` + dialog de criacao de pasta
2. Toolbar com botoes Nova Pasta, Upload, ZIP
3. Prop `onUpload` para disparar o dialog de upload pre-configurado
4. Preview dialog redesenhado com area visual grande
5. Cards de arquivo redesenhados com thumbnail, dropdown de acoes
6. Cards de pasta com hover elevado e cores por categoria

### Alteracoes em marketingData.ts

1. Adicionar `getCategoryColor(cat)` retornando classe Tailwind (ex: "blue-500")
2. Adicionar `getCategoryDescription(cat)` com descricao curta

### Upload pre-configurado

O `MarketingDrive` recebera `onUpload(category, folder)` e ao clicar "Upload" dentro de uma pasta, abrira o dialog de upload ja com categoria e pasta pre-selecionados.

