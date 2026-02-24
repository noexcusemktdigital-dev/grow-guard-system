

# Marketing por Objetivo + Academy Funcional

## 1. Marketing - Navegacao por Objetivo do Material

A estrutura atual e puramente por pastas (nome + parent_id). O usuario quer categorias fixas como navegacao principal, com filtro por tipo de arquivo dentro de cada uma.

### Mudanca no banco
Adicionar coluna `category` na tabela `marketing_folders` para classificar pastas por objetivo:

| Categoria | Descricao |
|-----------|-----------|
| logo | Logos e identidade visual |
| dia-a-dia | Materiais do dia a dia (fundos, assinaturas, templates) |
| setup | Setup inicial da unidade |
| redes-sociais | Conteudo para redes sociais (organizado mes a mes) |
| campanhas | Materiais de campanhas especificas |
| apresentacoes | Apresentacoes institucionais e comerciais |

### Novo layout da pagina `FranqueadoMateriais.tsx`
- Substituir a navegacao atual por um grid de categorias fixas no topo (6 cards com icones)
- Ao clicar numa categoria, filtra pastas e assets daquela categoria
- Dentro da categoria, manter a navegacao por subpastas (ex: Redes Sociais > 2026 > Fevereiro)
- Barra de filtros por tipo de arquivo permanece (Imagem, Video, PDF, etc.)
- Breadcrumb atualizado: "Marketing > Redes Sociais > 2026 > Fevereiro"

### Arquivos editados
- Migracao SQL: adicionar coluna `category` em `marketing_folders`
- `src/pages/franqueado/FranqueadoMateriais.tsx`: reescrever com navegacao por categoria + subpastas

---

## 2. Academy - Conectar a Gestao da Franqueadora

O motivo dos modulos nao aparecerem: a pagina `Academy.tsx` (franqueadora) tem a aba "Gestao" mas **nao renderiza o componente `AcademyAdmin`** - mostra apenas um empty state estatico para todas as abas. O componente `AcademyAdmin` ja existe em `src/components/academy/AcademyAdmin.tsx` com funcionalidade completa de criar modulos, aulas e provas, mas nunca e importado.

### Correcao
- Na pagina `Academy.tsx` (franqueadora), importar e renderizar `AcademyAdmin` quando a aba ativa for "admin"
- Renderizar `AcademyModules` (lista de modulos publicados) quando a aba for "modulos"
- Manter os empty states apenas para abas que realmente nao tem conteudo ainda
- Assim, o admin cria modulos, publica, e eles aparecem no `FranqueadoAcademy.tsx`

### Fluxo corrigido
```text
1. Admin vai em Academy > Gestao
2. Cria um modulo (titulo, categoria, descricao)
3. Adiciona aulas (titulo, video YouTube, duracao)
4. Publica o modulo (botao olho)
5. Franqueado abre NOE Academy > Trilhas
6. Ve o modulo publicado com as aulas
```

### Arquivos editados
- `src/pages/Academy.tsx`: importar `AcademyAdmin` e renderizar nas abas corretas

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar coluna `category` em `marketing_folders` |
| `src/pages/franqueado/FranqueadoMateriais.tsx` | Reescrever com navegacao por categoria (Logo, Dia a dia, Setup, Redes Sociais, Campanhas, Apresentacoes) |
| `src/pages/Academy.tsx` | Conectar `AcademyAdmin` na aba Gestao + renderizar conteudo real nas outras abas |

