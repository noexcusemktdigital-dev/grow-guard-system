

# Plano: Garantir que Redes Sociais gere resultados equivalentes ao NanoBanana direto

## Diagnóstico

O teste confirmou: quando as **referências visuais são anexadas**, o NanoBanana extrai paleta, logo, tipografia e layout diretamente das imagens, gerando resultados muito superiores. No nosso sistema, as referências já são enviadas ao edge function, mas há gaps na experiência do wizard e na integração com conteúdos.

## Mudanças Necessárias

### 1. Wizard mais inteligente — IA preenche campos automaticamente

**Problema:** O wizard atual exige que o usuário preencha manualmente 7 etapas (formato, tipo, texto, cena, identidade, elementos, referências). Isso é trabalhoso e o usuário pode não saber descrever a cena ou elementos visuais ideais.

**Solução:** Adicionar um **passo 0 "Briefing rápido"** no início do wizard com um campo de texto livre ("Descreva o que você quer") + opção de selecionar um conteúdo já gerado. A IA (Gemini Flash) analisa o briefing e **pré-preenche** os campos: headline, subheadline, CTA, cena, elementos visuais, supporting text e bullet points. O usuário pode revisar e ajustar antes de gerar.

**Arquivos:**
- `src/pages/cliente/ClienteRedesSociais.tsx` — Novo step 0 com textarea + botão "Preencher com IA" + seletor de conteúdo
- `supabase/functions/generate-social-briefing/index.ts` — Novo edge function que recebe texto livre + identidade visual e retorna campos estruturados via tool calling
- `src/hooks/useClientePosts.ts` — Nova mutation `useGenerateBriefing`

### 2. Integração com Conteúdos gerados

**Problema:** O botão "Gerar Postagem" nos conteúdos redireciona para Redes Sociais mas não carrega os dados do conteúdo no wizard.

**Solução:** Ao clicar "Gerar Postagem" em um conteúdo, navegar para `/cliente/redes-sociais?content_id=xxx`. O wizard detecta o query param, carrega o conteúdo e pré-preenche os campos de texto (headline, texto de apoio, CTA) extraídos do resultado do conteúdo. O usuário só precisa adicionar referências visuais e ajustar a cena.

**Arquivos:**
- `src/pages/cliente/ClienteConteudos.tsx` — Navegar com content_id no query param
- `src/pages/cliente/ClienteRedesSociais.tsx` — Ler query param e pré-preencher campos

### 3. Referências obrigatórias com melhor UX

**Problema:** O upload de 3 referências está no último passo. Usuário pode não entender a importância.

**Solução:**
- Mover referências para o **passo 1** (logo após briefing), com destaque visual explicando que as referências definem cores, logo e tipografia
- Permitir uso de **imagens do banco de imagens** da identidade visual (`image_bank_urls`) como referências pré-carregadas
- Manter mínimo de 3 referências obrigatórias

**Arquivos:**
- `src/pages/cliente/ClienteRedesSociais.tsx` — Reorganizar steps: Briefing → Referências → Formato → Texto → Cena → Revisão

### 4. Tela de revisão antes de gerar

**Problema:** Não há preview do que será enviado ao modelo.

**Solução:** O último step mostra um resumo completo de todos os campos preenchidos + thumbnails das referências + botão "Gerar". Isso dá confiança ao usuário.

**Arquivos:**
- `src/pages/cliente/ClienteRedesSociais.tsx` — Step final de revisão expandido

## Novo Fluxo do Wizard (7 steps)

```text
Step 1: Briefing rápido
  ├─ Textarea livre OU selecionar conteúdo existente
  ├─ Botão "Preencher com IA" → chama generate-social-briefing
  └─ Pré-preenche: headline, sub, CTA, cena, elementos, supporting text

Step 2: Referências visuais (obrigatório, min 3)
  ├─ Upload de imagens
  ├─ Auto-carrega imagens do banco da identidade visual
  └─ Destaque: "As referências definem paleta, logo e tipografia"

Step 3: Formato da imagem (1:1, 4:5, 9:16)

Step 4: Tipo de postagem (post único, capa carrossel, etc.)

Step 5: Texto da arte (pré-preenchido pela IA, editável)
  ├─ Headline, Subheadline, Supporting text, Bullets, CTA
  └─ Nome da marca

Step 6: Cena e elementos visuais (pré-preenchido pela IA, editável)
  ├─ Descrição da cena
  └─ Elementos visuais

Step 7: Revisão e geração
  ├─ Resumo completo de todos os campos
  ├─ Thumbnails das referências
  └─ Botão "Gerar Arte"
```

## Novo Edge Function: `generate-social-briefing`

Recebe:
- `briefing_text` (texto livre do usuário)
- `content_data` (dados do conteúdo selecionado, opcional)
- `identidade_visual` (da org)
- `persona` (opcional)

Usa Gemini Flash com tool calling para retornar:
```json
{
  "headline": "...",
  "subheadline": "...",
  "cta": "...",
  "cena": "...",
  "elementos_visuais": "...",
  "supporting_text": "...",
  "bullet_points": "...",
  "suggested_format": "portrait",
  "suggested_tipo": "post_unico"
}
```

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-social-briefing/index.ts` | Criar — IA extrai campos estruturados do briefing |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Refatorar — Novo fluxo de 7 steps com briefing IA + integração conteúdos |
| `src/hooks/useClientePosts.ts` | Adicionar mutation `useGenerateBriefing` |
| `src/pages/cliente/ClienteConteudos.tsx` | Navegar com content_id para Redes Sociais |

## Resultado Esperado

O usuário digita "Quero uma postagem sobre investimento imobiliário exigir estratégia, para a Klir" → IA preenche todos os campos → usuário sobe 3 referências → revisa → gera. O prompt final enviado ao NanoBanana terá a mesma qualidade e completude dos testes manuais realizados.

