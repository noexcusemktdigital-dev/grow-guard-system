

# Recriação da Ferramenta de Geração de Sites (Documento 5)

## Situação Atual

`ClienteSites.tsx` usa o `ChatBriefing` com `ALEX_STEPS` (130+ linhas de perguntas em chat). O Documento 5 pede um **wizard visual por etapas** (não chat), com reaproveitamento automático de dados da Estratégia, Conteúdo e Identidade Visual. A edge function `generate-site` já funciona bem — precisa apenas de ajustes para receber os novos campos e mover o débito de créditos para a aprovação.

## Plano

### 1. Reescrever `ClienteSites.tsx` — Wizard visual por etapas

Substituir o ChatBriefing por stepper visual com 10 etapas:

1. **Referência** — Link do site/Instagram atual (opcional) + descrição manual
2. **Tipo de Negócio** — Cards: consultoria, serviços, clínica, e-commerce, franquia
3. **Objetivo do Site** — Cards: gerar leads, apresentar serviços, vender, captar franqueados
4. **Público** — Chips selecionáveis + texto livre
5. **Serviços/Produtos** — Textarea
6. **Diferenciais** — Textarea
7. **Prova Social** — Multi-select (depoimentos, números, cases) + textareas condicionais
8. **CTA Principal** — Chips: orçamento, WhatsApp, reunião, comprar + custom
9. **Páginas** — Multi-select (Home, Sobre, Serviços, Blog, Contato) com sugestão auto
10. **Estilo Visual** — Cards: moderno, minimalista, corporativo, sofisticado, tecnológico

Dados auto-injetados (badges visuais mostrando):
- **Estratégia**: público-alvo, proposta de valor, posicionamento, diferenciais (via `useActiveStrategy`)
- **Conteúdo**: textos e mensagens principais dos conteúdos aprovados (via `useContentHistory`)
- **Identidade Visual**: cores, fontes, estilo (via `useVisualIdentity`)

**Tela de resultado**: Preview iframe + Aprovar / Regenerar / Editar / Baixar. Aprovação debita créditos (500).

**Histórico**: Lista de sites com status (rascunho/aprovado/publicado).

### 2. Atualizar `generate-site` Edge Function

- Remover débito automático de créditos (mover para aprovação no frontend via `debit_credits` RPC)
- Adicionar campos do Documento 5: `referencia`, `tipo_negocio`, `publico`, `provas`, `paginas`, `dados_conteudo`
- Enriquecer prompt com dados da estratégia, conteúdo e identidade visual

### 3. Remover `ALEX_STEPS` de `briefingAgents.ts`

O chat Alex não será mais usado. Limpar as ~130 linhas de steps e opções auxiliares.

### 4. Atualizar `useClienteSitesDB.ts`

Adicionar `useApproveSite()` mutation que debita créditos e atualiza status para "approved".

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteSites.tsx` | Reescrever completamente |
| `supabase/functions/generate-site/index.ts` | Remover débito auto, adicionar novos campos |
| `src/components/cliente/briefingAgents.ts` | Remover `ALEX_STEPS` e opções auxiliares |
| `src/hooks/useClienteSitesDB.ts` | Adicionar `useApproveSite` |

