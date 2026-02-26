
## Plano: Refinamento de Artes/Videos, Acoes nos Conteudos e Tutorial Interativo

Tres blocos de melhorias para o fluxo criativo do cliente.

---

### 1. Tutorial de Primeiro Acesso - Tour Interativo na Interface

Reconstruir `OnboardingTour.tsx` como um tour com overlay que destaca elementos reais da sidebar.

**Mudancas em `src/components/cliente/OnboardingTour.tsx`**:
- Substituir o dialog generico por um tooltip flutuante posicionado ao lado de elementos da sidebar
- Usar `document.querySelector('[data-tour="..."]')` + `getBoundingClientRect()` para posicionar cada step
- Overlay escuro com recorte (clip-path ou mask) para destacar o elemento alvo
- Steps:
  1. Boas-vindas (overlay central)
  2. Secao "Vendas" na sidebar (CRM, Agentes IA, Scripts)
  3. Secao "Marketing" (Estrategia, Conteudos, Redes Sociais, Sites, Trafego)
  4. Checklist e Gamificacao (items globais)
  5. Creditos e Plano (footer da sidebar)
  6. Suporte e Notificacoes (header)
- Botoes "Anterior", "Proximo", "Pular tour"
- Manter localStorage para persistencia

**Mudancas em `src/components/ClienteSidebar.tsx`**:
- Adicionar `data-tour="vendas"`, `data-tour="marketing"`, `data-tour="sistema"`, `data-tour="creditos"` nos elementos relevantes

---

### 2. Refinamento de Artes e Videos em Redes Sociais

**Mudancas em `src/pages/cliente/ClienteRedesSociais.tsx`**:

#### 2.1 Selecao de Formato e Quantidade Individual
- No wizard briefing, substituir o campo unico `bQtd` por campos individuais:
  - Artes: Feed (1:1), Story (9:16), Carrossel
  - Videos: Reels (9:16), Story animado
- Cada formato tem campo numerico de quantidade
- Total respeita limite do plano (`saldoRestanteArtes`)

#### 2.2 Selecao de Tipo/Estilo Visual com Exemplos
- Adicionar step no wizard antes de gerar, com galeria de "tipos visuais":
  - **Tipos de Arte**: Foto com texto overlay, Composicao grafica, Mockup de produto, Quote card, Before/After
  - **Tipos de Video**: Slideshow com texto, Animacao de texto (kinetic), Revelacao de produto, Countdown
- Cada tipo e um card selecionavel com icone representativo, nome e descricao curta
- O tipo selecionado e enviado ao prompt da IA

#### 2.3 Sistema de Revisao (1 alteracao por peca)
- No `GeneratedArt`, adicionar campos `hasRevision: boolean` e `revisionNote: string`
- Na visualizacao de cada arte, adicionar botao "Solicitar Alteracao"
- Ao clicar, abre textarea para descrever a alteracao
- Botao "Regerar com Alteracao" chama `generate-social-image` com prompt original + nota de revisao
- Apos usar a revisao, botao desabilitado com texto "Revisao utilizada"

#### 2.4 Videos curtos com foco em imagem+texto
- Deixar claro no UI que videos sao curtos (5-15s), formato Reels (9:16) ou Stories
- Opcoes de tipo de video: Slideshow com texto, Revelacao de produto, Kinetic text

---

### 3. Acoes nos Conteudos (PDF, Gerar Arte, Gravar Video)

**Mudancas em `src/pages/cliente/ClienteConteudos.tsx`**:

Na view de detalhe do conteudo (`openContent`), adicionar barra de acoes abaixo do `ApprovalPanel`:

- **Copiar**: Ja existe. Manter.
- **Baixar PDF**: Usar `html2pdf.js` (ja instalado) para gerar PDF com titulo, formato, rede, funil, roteiro, hashtags e embasamento
- **Gerar Arte**: Botao que navega para `/cliente/redes-sociais?fromContent=ID` pre-preenchendo briefing de arte com dados do conteudo
- **Gravar Video**: Se o formato for Reels ou Story (conteudo de video), botao "Gravar" que navega para a aba Tutorial de Conteudos (`/cliente/conteudos` aba tutorial) filtrada pelo formato correspondente (Reels/Story), mostrando as instrucoes de gravacao

---

### Resumo de Arquivos

**Editar:**

| Arquivo | Mudanca |
|---------|---------|
| `src/components/cliente/OnboardingTour.tsx` | Reconstruir como tour com overlay + tooltips posicionados sobre sidebar |
| `src/components/ClienteSidebar.tsx` | Adicionar atributos `data-tour` nos elementos de menu |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Formato/quantidade individual, tipos visuais com exemplos, sistema de revisao |
| `src/pages/cliente/ClienteConteudos.tsx` | Botoes PDF, Gerar Arte, Gravar Video na view de detalhe |

### Detalhes Tecnicos

- O tour usa `getBoundingClientRect()` para posicionar tooltips e `clip-path` para o overlay com recorte
- A revisao reutiliza a edge function `generate-social-image` adicionando `revision_note` ao prompt
- O PDF usa `html2pdf.js` ja instalado como dependencia
- "Gravar Video" em Conteudos navega para a aba Tutorial dentro da propria pagina de Conteudos, filtrada pelo formato (Reels/Story), onde ficam as instrucoes didaticas de gravacao
- "Gerar Arte" navega para Redes Sociais com query params para pre-preencher o briefing
- A navegacao usa `useNavigate` e `useSearchParams`
