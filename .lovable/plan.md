

## Plano — Correção completa do PDF do Diagnóstico Estratégico

### Problemas identificados (análise visual das 9 páginas)

1. **Capa (pag 1)**: Logo achatada (forçada em 55x18mm sem respeitar aspect ratio). Scores e dados desnecessários na capa. Grande espaço vazio. O usuário quer: logo + título + data apenas.
2. **KPIs (pag 2)**: Texto transborda dos cards — valores longos estouram a largura e sobrepõem outros elementos.
3. **Emojis (pag 3, 6-8)**: jsPDF não renderiza emojis (🏗️📊📈📦). Aparecem como "Ø<ß×þ" e "Ø=ÜË".
4. **Texto cortado à direita (pag 4-7)**: Ações Estratégicas e Concorrência usam checkmarks que jsPDF renderiza com espaçamento largo, cortando texto na margem direita.
5. **Páginas quase vazias (pag 5, 9)**: Conteúdo "sobra" de uma seção e deixa o resto da página em branco.
6. **Ações Estratégicas**: O caractere "✓" usado nos bullets é renderizado com letter-spacing distorcido no Helvetica do jsPDF.

### Correções no `strategyPdfGenerator.ts`

#### 1. Capa simplificada
- Carregar logo e calcular aspect ratio real da imagem (via `Image()` no browser) em vez de forçar dimensões fixas
- Remover GPS Score, Score Marketing/Comercial, segmento da capa
- Manter apenas: logo (proporção correta, centralizada ou topo-esquerda), título "DIAGNÓSTICO ESTRATÉGICO", nome da empresa, e data. Fundo preto com accent vermelho

#### 2. KPIs — Wrapping seguro
- Usar `splitTextToSize` para valores dos KPIs com largura máxima do card
- Reduzir font size do valor quando o texto for longo (fallback para 8pt)
- Adicionar altura dinâmica ao card baseado no número de linhas

#### 3. Substituir emojis por texto
- `🏗️ ESTRUTURA` → `ESTRUTURA`
- `📊 COLETA DE DADOS` → `COLETA DE DADOS`
- `📈 ESCALA` → `ESCALA`
- `📦 ENTREGÁVEIS` → `ENTREGÁVEIS`
- `⚠ PROBLEMAS` → `PROBLEMAS IDENTIFICADOS`
- Usar um pequeno quadrado colorido (`roundedRect`) como ícone visual no lugar do emoji

#### 4. Substituir "✓" por ">" ou "-" nos bullets
- O caractere "✓" causa espaçamento largo no Helvetica do jsPDF
- Trocar por traço ou seta simples: `"> ${acao}"` ou `"- ${acao}"`

#### 5. Wrapping correto em todas as seções de texto
- Garantir que `splitTextToSize` usa `CW - margem_interna` em todas as seções (Ações, Concorrência, Persona)
- Na seção de Ações Estratégicas, usar margem `CW - 12` em vez do valor atual que ignora indentação

#### 6. Evitar páginas vazias
- Na seção de Concorrência (que é longa e transborda), calcular altura real antes de inserir e usar `ensureSpace` com estimativa melhor
- Na seção de entregáveis, agrupar melhor para não deixar 2 itens na última página com 80% vazio

### Arquivo afetado

| Arquivo | Acao |
|---------|------|
| `src/lib/strategyPdfGenerator.ts` | Reescrever `drawCoverPage`, corrigir emojis/checkmarks, fix wrapping KPIs e Ações, melhorar estimativa de `ensureSpace` |

