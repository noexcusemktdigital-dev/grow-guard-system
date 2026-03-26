

## Plano: Corrigir Build + Reestruturar Conteúdos → Roteiros e Redes Sociais → Postagem

### Fase 1 — Corrigir build error (imediato)

**Problema**: `ClienteConteudos.tsx` importa `html2pdf.js` (não instalado).

**Fix**: Substituir por `jspdf` + `html2canvas` na função `downloadPdf` (linhas 171-180), mesmo padrão já aplicado nos outros arquivos.

Também há ocorrências em:
- `src/pages/cliente/ClientePlanoVendas.tsx`
- `src/components/calculator/ProposalGenerator.tsx`
- `src/components/academy/AcademyCertificates.tsx`
- `src/pages/franqueado/FranqueadoEstrategia.tsx`
- `src/lib/contractPdfTemplate.ts`

Todas serão corrigidas com o mesmo padrão.

---

### Fase 2 — Renomear e reestruturar ferramentas

#### 2a. "Conteúdos" → "Roteiros"
- **Sidebar**: `ClienteSidebar.tsx` — label "Conteúdos" → "Roteiros", ícone `Video`
- **Página**: `ClienteConteudos.tsx` → foco 100% em roteiros de vídeo
  - Remover wizard de formatos texto (carrossel, post único, artigo, story)
  - Novo wizard simplificado: duração do vídeo, formato (Reels/TikTok/YouTube), tom, objetivo
  - Puxa inteligência do Plano de Vendas/Marketing via `useStrategyData`
  - Gera roteiros estruturados (hook, desenvolvimento, CTA, texto de tela)
  - Usa algoritmo/tendências como input para gerar roteiros que performam
  - PageHeader título "Roteiros"

#### 2b. "Redes Sociais" → "Postagem"
- **Sidebar**: label "Redes Sociais" → "Postagem", ícone `Image`
- **Página**: `ClienteRedesSociais.tsx` — foco 100% em postagens com arte
  - Remover wizard de vídeo (migra conceito para Roteiros)
  - Manter ArtWizard como base, com as seguintes mudanças:

---

### Fase 3 — Geração de textos por IA na Postagem

- Botão "Gerar textos com IA" dentro do wizard que preenche headline, subheadline, CTA, supporting text automaticamente
- Já existe parcialmente (`onFillWithAI`), mas será mais proeminente e acessível
- Textos editáveis após geração

---

### Fase 4 — Geração individual obrigatória (1 arte por vez)

**Regra**: Quando `quantity > 1`, o wizard coleta configurações **uma a uma** (textos + referências por peça).

- Adicionar estado `currentPieceIndex` no ArtWizard
- Para cada peça: configurar textos (headline, CTA etc.) + referências individualmente
- Indicador visual "Arte 1 de 3" com navegação entre peças
- Ao finalizar todas, dispara geração sequencial
- **Carrossel**: arquitetura específica — configurações por slide (capa, conteúdo, CTA) já existe parcialmente, será reforçada com prompt diferenciado por slide

---

### Fase 5 — Tutorial didático de referências (step-by-step obrigatório)

O wizard será reorganizado em etapas mais claras:

1. **Etapa Logo**: Upload de logo com explicação ("Sua logo será aplicada na arte final")
2. **Etapa Referências**: Explicação didática do que é referência visual ("Referências são exemplos de artes que você gosta — cores, estilos, composições. Envie pelo menos 3 exemplos.") + exemplos visuais + upload
3. **Etapa Fotos**: Fotos do produto/empresa (opcional) com explicação ("Fotos reais que devem aparecer na arte")

Cada etapa terá:
- Card explicativo com ícone e texto claro
- Dica visual/tooltip
- Upload dedicado
- Referências passam a ser **obrigatórias** (mínimo 3, já implementado na validação)

---

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClienteConteudos.tsx` | Fix html2pdf + refoco em Roteiros |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Remover vídeo, renomear, textos IA |
| `src/components/cliente/social/ArtWizard.tsx` | Steps didáticos, geração 1-a-1, tutorial refs |
| `src/components/ClienteSidebar.tsx` | Labels e ícones |
| `src/App.tsx` | Manter rotas (paths não mudam) |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Fix html2pdf |
| `src/components/calculator/ProposalGenerator.tsx` | Fix html2pdf |
| `src/components/academy/AcademyCertificates.tsx` | Fix html2pdf |
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Fix html2pdf |
| `src/lib/contractPdfTemplate.ts` | Fix html2pdf |
| `src/constants/featureTutorials.ts` | Atualizar tutoriais Roteiros/Postagem |

