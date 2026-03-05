

# Fix: Reescrever ClienteRedesSociais.tsx

## Problema

O arquivo `ClienteRedesSociais.tsx` ainda contém o código legado de 1940 linhas (calendário, chat Theo, canvas editor, batch generation). A reescrita planejada no Documento 4 não foi aplicada ao arquivo. O hook `useClientePosts.ts` e a tabela `client_posts` já existem e estão prontos.

## Solução

Reescrever completamente `ClienteRedesSociais.tsx` com o wizard de 4 etapas conforme planejado:

### Estrutura da nova página

1. **Tela principal** — Histórico de postagens (via `usePostHistory`) + botão "Nova Postagem"
2. **Etapa 1 — Conteúdo Base** — Lista conteúdos aprovados de `client_content` (via `useContentHistory` do `useClienteContentV2`) + opção texto manual
3. **Etapa 2 — Tipo** — Cards: Arte ou Vídeo
4. **Etapa 3 — Configuração**:
   - Arte: formato (1:1, 4:5, 9:16), referências visuais (upload), identidade visual (auto via `useVisualIdentity`), texto
   - Vídeo: roteiro, duração (15s/30s/60s), estilo (educativo/institucional/promocional/storytelling)
5. **Etapa 4 — Geração** — Chama `useGeneratePost`, loading animado, resultado com Aprovar/Regenerar/Baixar

### Dependências já prontas
- `useClientePosts.ts` — `usePostHistory`, `useGeneratePost`, `useApprovePost`
- `useClienteContentV2.ts` — `useContentHistory` (para listar conteúdos na etapa 1)
- `useVisualIdentity` — auto-preencher identidade visual
- Edge functions `generate-social-image` e `generate-social-video-frames` já ajustadas
- Tabela `client_posts` com RLS já criada

### Arquivo
| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Reescrever completamente (1940 → ~500 linhas) |

