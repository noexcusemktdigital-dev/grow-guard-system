

# Análise: As perguntas do wizard de Sites são suficientes?

## Diagnóstico atual

O wizard de 10 steps em `ClienteSites.tsx` coleta as seguintes informações:

| Step | O que coleta | Problema |
|------|-------------|----------|
| 1. Referência | URL ou descrição manual | Bom, mas opcional e vago |
| 2. Tipo de Negócio | 7 opções (consultoria, serviços, etc.) | OK |
| 3. Objetivo | 4 opções (leads, institucional, vendas, portfólio) | OK |
| 4. Público | Chips genéricos + campo livre | Chips muito vagos ("Empresários") |
| 5. Serviços | Textarea livre | OK |
| 6. Diferenciais | Textarea livre | OK |
| 7. Prova Social | Chips + campos condicionais | OK |
| 8. CTA | 4 opções + personalizado | OK |
| 9. Páginas | Multi-select de 8 opções | OK |
| 10. Estilo | 5 opções simples | Muito superficial |

## Gaps críticos que prejudicam o resultado

### 1. Nome da empresa não é perguntado
O wizard **nunca pede o nome da empresa**. Depende de `strategyAnswers.empresa`, que pode estar vazio. O prompt envia `nome_empresa: ""` e o site gerado fica sem nome no header, footer e title.

### 2. Dados de contato não são coletados
Telefone, email, endereço, WhatsApp e redes sociais são todos enviados como string vazia. O site gerado fica com formulário de contato sem dados reais e botões de CTA sem link.

### 3. Slogan não é perguntado
O hero do site fica genérico sem uma tagline da empresa.

### 4. Tom de comunicação não é perguntado
O edge function suporta 4 tons (formal, descontraído, técnico, inspiracional) mas o wizard não oferece essa escolha. O tom fica indefinido.

### 5. Descrição do negócio é fraca
O campo "descrição manual" no step de referência não tem contexto suficiente. O usuário não sabe que essa descrição será usada na seção "Sobre" do site.

### 6. Estilo visual muito superficial
Apenas 5 palavras (Moderno, Minimalista, Corporativo, Sofisticado, Tecnológico) sem descrição do que cada uma significa visualmente.

### 7. SiteWizardStep3 existe mas não é usado
Há um componente completo (`SiteWizardStep3.tsx`) com briefing detalhado, qualidade bar, seções colapsáveis e todos os campos necessários — mas ele **não é usado** no fluxo principal do wizard.

## Proposta: Reorganizar o wizard para cobrir os gaps

Manter a abordagem de steps interativos (não o formulário longo do Step3), mas adicionar os campos ausentes:

| Step | Conteúdo | Mudança |
|------|----------|---------|
| 1 | **Empresa** | **NOVO** — Nome, slogan, descrição do negócio, segmento |
| 2 | Objetivo | Manter atual |
| 3 | Público-alvo | Melhorar chips + adicionar dores |
| 4 | Serviços + Diferenciais | Unificar em 1 step |
| 5 | Prova Social | Manter atual |
| 6 | **Contato** | **NOVO** — Telefone, email, WhatsApp, endereço, redes |
| 7 | CTA | Manter + vincular ao WhatsApp do step anterior |
| 8 | Páginas | Manter atual |
| 9 | **Estilo + Tom** | Expandir — estilo visual com descrições + tom de comunicação + referência URL |
| 10 | **Revisão** | **NOVO** — Resumo de tudo antes de gerar |

### Detalhes das mudanças

**Step 1 (Empresa):** 4 campos — nome (obrigatório), slogan, descrição (textarea), segmento (chips). Auto-preenche de `strategyAnswers` e `visualIdentity`.

**Step 6 (Contato):** Telefone/WhatsApp, email, endereço, redes sociais, link WhatsApp para CTA. Essencial para o site ter dados reais.

**Step 9 (Estilo + Tom):** Cada estilo com descrição visual (ex: "Corporativo — Tons sóbrios, layout clássico, tipografia serifada"). Adicionar seletor de tom de comunicação (formal, descontraído, técnico, inspiracional). Campo de URL de referência.

**Step 10 (Revisão):** Resumo visual de todos os campos preenchidos com indicador de completude, similar ao `QualityBar` do `SiteWizardStep3`.

### Arquivos a modificar

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteSites.tsx` | Reorganizar steps, adicionar campos empresa/contato/revisão |
| `supabase/functions/generate-site/index.ts` | Sem mudanças — já aceita todos os campos, só não recebe dados hoje |

O edge function `generate-site` já está preparado para receber nome, contato, slogan, tom — o problema é exclusivamente no wizard que não coleta essas informações.

