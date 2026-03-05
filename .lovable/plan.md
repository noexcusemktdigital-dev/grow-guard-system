

# Reestruturação do Formulário de Criação de Artes — Redes Sociais

## Problema

O formulário atual na tela de Redes Sociais (step "config") usa **seleções fixas de estilo** (6 cards pré-definidos) e um **texto base genérico**. O usuário que gerou artes excelentes manualmente usou um processo diferente: campos abertos para cena, ambiente, estilo visual, texto da arte e referências visuais (mínimo 3). Esse processo gera prompts ricos e contextuais que produzem resultados superiores.

A edge function `generate-social-image` já tem toda a infraestrutura pronta (chain-of-thought, referências multimodais, identidade visual). O gargalo é o **formulário de coleta** que não captura informações suficientes.

## Plano

### 1. Reescrever o step "config" em `ClienteRedesSociais.tsx`

Substituir os cards de estilo fixo por **9 campos** baseados no processo que funcionou:

| # | Campo | Tipo | Obrigatório |
|---|---|---|---|
| 1 | Link da marca (site/Instagram) | Input text | Opcional |
| 2 | Formato da imagem | Cards fixos (Feed 4:5, Quadrado 1:1, Story 9:16, Banner 16:9) | Sim |
| 3 | Objetivo da postagem | Textarea com exemplos placeholder | Sim |
| 4 | Tema/assunto | Textarea com exemplos placeholder | Sim |
| 5 | Cena da imagem | Textarea ("descreva o que deve aparecer") | Sim |
| 6 | Ambiente | Input text ("onde a cena acontece") | Opcional |
| 7 | Estilo visual | Input text ("corporativo, minimalista, premium…") | Opcional |
| 8 | Texto da arte | Headline (input) + Subheadline (input, opcional) + CTA (input, opcional) | Headline obrigatório |
| 9 | Referências visuais | Upload múltiplo (mínimo 3 recomendado) | Recomendado |

Remover: `ART_STYLES` (cards fixos de estilo). Manter: `ART_FORMATS` (atualizar com 4:5, 1:1, 9:16, 16:9).

### 2. Atualizar o payload enviado ao `generate-social-image`

Concatenar todos os campos em um prompt rico antes de enviar:

```
Objetivo: {objetivo}
Tema: {tema}
Cena: {cena}
Ambiente: {ambiente}
Estilo visual: {estilo_visual}
Headline: {headline}
Subheadline: {subheadline}
CTA: {cta}
Link da marca: {brand_link}
```

Enviar `art_style` como o texto livre do campo estilo visual (a edge function já trata fallbacks). Continuar passando `reference_images` e `identidade_visual` como já faz.

### 3. Atualizar edge function `generate-social-image`

Ajuste mínimo: adicionar formato `portrait` (4:5) e `banner` (16:9) no mapeamento de `aspectInstruction`. O restante já funciona — o chain-of-thought Flash já recebe o prompt completo e otimiza.

### 4. Manter identidade visual automática

Se o usuário já tem `marketing_visual_identities` configurada, continuar passando automaticamente (já funciona). Se forneceu link da marca no campo 1, incluir no prompt para contexto adicional.

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Reescrever step "config" com 9 campos abertos |
| `supabase/functions/generate-social-image/index.ts` | Adicionar formatos 4:5 e 16:9 no aspect mapping |

