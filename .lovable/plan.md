

# Rewrite -- Marketing + Academy e Treinamentos (Franqueado)

## Problema Atual

- Sidebar mostra "Marketing Local" com itens "Materiais da Marca" e "Academy & Treinos" -- nomes incorretos
- `FranqueadoMateriais.tsx` e um grid basico de categorias, sem navegacao por pastas, sem breadcrumb, sem preview
- `FranqueadoAcademy.tsx` e um resumo estatico com dados hardcoded, sem aulas, sem video, sem prova, sem certificado

## Solucao

Renomear a secao e itens no sidebar, reescrever ambas as paginas como consumidores completos dos dados da franqueadora (`marketingData.ts` e `academyData.ts`), em modo somente leitura.

---

## Arquivo 1: `src/components/FranqueadoSidebar.tsx`

Mudancas pontuais:

- Secao "Marketing Local" renomear para **"Marketing"**
- Item "Materiais da Marca" renomear para **"Marketing"**
- Item "Academy & Treinos" renomear para **"Academy e Treinamentos"**

Rotas permanecem as mesmas (`/franqueado/materiais` e `/franqueado/academy`).

---

## Arquivo 2: `src/pages/franqueado/FranqueadoMateriais.tsx` (rewrite completo)

Drive somente leitura sincronizado com a franqueadora.

### Dados

Importar diretamente de `marketingData.ts`: categorias, pastas, arquivos, helpers. Zero duplicacao.

### Categorias (7 pastas principais -- cards visuais como tabs)

Manter as 5 categorias existentes em `marketingData.ts` (Redes Sociais, Campanhas por Produto, Apresentacoes e Portfolio, Materiais da Marca, Kit do Dia a Dia) mais 2 novas que serao adicionadas: **Templates Comerciais** e **Fundos de Tela / Perfis**.

Como adicionar 2 categorias requer alterar `marketingData.ts` (arquivo da franqueadora), e a regra e nao tocar arquivos da franqueadora, vamos usar as 5 categorias existentes que ja cobrem o conteudo solicitado (Materiais da Marca = Arquivos da Marca, Kit do Dia a Dia = Fundos de Tela/Perfis/Templates).

### Layout

- **Header**: titulo "Marketing" + subtitulo "Materiais sincronizados com a franqueadora"
- **Busca global** com filtro por tipo (Imagem/PDF/Video/Documento)
- **Cards de categoria** (grid 2-3-5 responsivo) com icone, label, contagem -- clicaveis como tabs
- **Breadcrumb** (ex: Marketing > Redes Sociais > 2026 > 02 Fevereiro > Feed)
- **Grid de pastas** (reutiliza estrutura do MarketingDrive da franqueadora)
- **Lista de arquivos** com thumbnail, nome, formato badge, tamanho, data
- **Preview ao clicar**: Dialog com metadados + botao Download
- **SEM**: botao Upload, botao Nova Pasta, botao Editar, botao Excluir, dropdown de acoes administrativas

### Diferenca chave vs franqueadora

O componente `MarketingDrive` da franqueadora tem botoes de Upload, Nova Pasta, Editar e Excluir. Em vez de reutilizar esse componente (que traria funcoes proibidas), vamos construir um drive read-only dedicado inline na pagina, usando os mesmos dados (`getChildFolders`, `getAssetsInFolder`, `getFormatIcon`, etc).

---

## Arquivo 3: `src/pages/franqueado/FranqueadoAcademy.tsx` (rewrite completo)

LMS completo em modo consumidor, usando dados de `academyData.ts`.

### Tela Principal -- Trilhas/Modulos

- **4 KPI cards**: Modulos Disponiveis, Aulas Concluidas, Progresso Geral, Certificados
- **Filtro por categoria**: Todos / Comercial / Estrategia / Institucional / Produtos (badges clicaveis)
- **Grid de modulos** (cards): titulo, categoria badge, descricao, barra de progresso %, status (Nao iniciado / Em andamento / Concluido), botao "Continuar" ou "Iniciar"
- Clicar no modulo abre o **detalhe do modulo**

### Detalhe do Modulo

- Header com titulo, categoria, descricao, progresso geral
- **Lista de aulas** ordenadas: numero, titulo, duracao, status (icone check/play/lock), botao "Assistir"
- Clicar em "Assistir" abre a **tela da aula**
- **Prova final**: aparece no final da lista se todas as aulas estao concluidas. Se nao concluidas, mostra como bloqueada
- Se ja aprovado, mostra badge "Aprovado" + link para certificado

### Tela da Aula

- Header com titulo + botao Voltar
- **Video embed** (YouTube via iframe, usando `youtubeUrl` do `academyData`)
- Descricao da aula
- Anexos (se houver) com botao download
- Botao **"Marcar como Concluida"** (usa `markLessonComplete`)
- Navegacao: Aula Anterior / Proxima Aula

### Prova (Quiz)

- Header: modulo + nota minima + tentativas restantes
- **Perguntas** renderizadas sequencialmente (MCQ com radio buttons, True/False com 2 opcoes)
- Botao "Enviar Respostas"
- Resultado: nota, aprovado/reprovado, feedback por questao (se `showFeedback`)
- Se aprovado: toast + gera certificado automatico (usa `submitQuizAttempt`)
- Se reprovado: mostra tentativas restantes

### Certificados

- Secao "Meus Certificados" no final da tela principal
- Lista: modulo, data emissao, codigo
- Botao "Ver Certificado" (mock download PDF)

### Dados utilizados de `academyData.ts`

- `mockModules`, `getLessonsByModule`, `getModuleProgress`, `getLessonProgress`
- `getQuizByModule`, `getQuestionsByQuiz`, `getQuizAttempts`
- `getUserCertificates`, `markLessonComplete`, `submitQuizAttempt`
- `getTotalProgress`, `getNextRecommendedLesson`
- `categoryColors`, `categoryIcons`

Nenhum dado duplicado em `franqueadoData.ts`. Consumo direto da fonte da franqueadora (como na vida real -- conteudo criado la, consumido aqui).

---

## Arquivos Modificados

```text
src/components/FranqueadoSidebar.tsx               -- renomear secao e 2 itens
src/pages/franqueado/FranqueadoMateriais.tsx        -- rewrite completo: drive read-only
src/pages/franqueado/FranqueadoAcademy.tsx          -- rewrite completo: LMS consumidor
```

Nenhum arquivo da franqueadora e tocado.

---

## Ordem de Implementacao

1. `FranqueadoSidebar.tsx` -- renomear labels
2. `FranqueadoMateriais.tsx` -- drive read-only com categorias, pastas, preview, download
3. `FranqueadoAcademy.tsx` -- LMS com modulos, aulas, video, quiz, certificado

