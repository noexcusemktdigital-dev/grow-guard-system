
# Briefing Completo + Tutorial de Implantacao Visual e Didatico

## Problema Atual

O briefing (Step 3) e superficial: apenas 4 campos de texto livre (servicos, diferencial, depoimentos, contato) sem guia. O tutorial de publicacao e uma lista de texto escondida num accordion. Resultado: sites genericos e clientes perdidos na implantacao.

---

## Parte 1: Briefing Profissional (SiteWizardStep3 reescrito)

O briefing sera dividido em **secoes tematicas** com campos especificos, dicas contextuais e exemplos reais. Cada secao tera um icone, titulo descritivo e indicador de preenchimento.

### Secoes do Novo Briefing

**Secao 1 -- Sobre a Empresa (obrigatoria)**
- Nome da empresa (input)
- Slogan / tagline (input, com placeholder: "Ex: Transformando ideias em resultados")
- Descricao curta do negocio (textarea 3 linhas, com dica: "Descreva em 2-3 frases o que sua empresa faz")
- Segmento de atuacao (input, pre-preenchido da estrategia se disponivel)

**Secao 2 -- Servicos / Produtos (obrigatoria)**
- Lista de servicos ou produtos principais (textarea, com dica: "Liste seus principais servicos, um por linha")
- Diferencial competitivo (textarea, com dica: "O que te torna unico? Ex: 10 anos de experiencia, atendimento 24h")
- Preco/faixa de preco (input, opcional, placeholder: "Ex: A partir de R$199/mes")

**Secao 3 -- Publico-Alvo**
- Quem e seu cliente ideal? (textarea, pre-preenchido da persona se disponivel)
- Faixa etaria (input)
- Principais dores/problemas que voce resolve (textarea, com dica: "Ex: Dificuldade em encontrar profissionais qualificados")

**Secao 4 -- Prova Social**
- Depoimentos de clientes (textarea, com dica: "Cole ate 3 depoimentos reais. Formato: 'Texto do depoimento' — Nome, Cargo")
- Numeros de impacto (input, placeholder: "Ex: +500 clientes, 98% de satisfacao, 10 anos no mercado")
- Logos de clientes ou parceiros (textarea, opcional, placeholder: "Liste os nomes das empresas para mencao")

**Secao 5 -- Identidade Visual**
- Cores principais (input ou color picker, pre-preenchido da identidade se disponivel)
- Fontes preferidas (input, pre-preenchido)
- Tom de comunicacao (select: Formal / Descontraido / Tecnico / Inspiracional)
- URL de site de referencia (input, opcional, placeholder: "Cole um site que voce admira como referencia")

**Secao 6 -- Contato e Conversao**
- Telefone / WhatsApp (input)
- Email (input)
- Endereco (input, opcional)
- Redes sociais (input, placeholder: "@suaempresa no Instagram")
- CTA principal (pre-preenchido do Step 2 mas editavel aqui)
- Link do WhatsApp ou formulario (input, placeholder: "https://wa.me/5511999999999")

**Secao 7 -- Instrucoes Extras (opcional)**
- Textarea livre para instrucoes adicionais
- Dica: "Mencione secoes especificas que deseja, textos exatos, ou qualquer detalhe importante"

### Dados Auto-Preenchidos
Cards com badge "Auto" no topo (como ja existe) para Estrategia, Persona e Identidade Visual, mas agora os dados tambem pre-preenchem os campos especificos acima.

### Indicador de Qualidade do Briefing
No topo, uma barra de "Qualidade do Briefing" que calcula uma porcentagem baseada em campos preenchidos:
- 0-40%: Vermelho "Briefing fraco — site generico"
- 40-70%: Amarelo "Briefing razoavel — pode melhorar"
- 70-100%: Verde "Briefing completo — melhor resultado"

Cada secao tem um indicador lateral (check verde ou circulo vazio).

### UX
- Secoes em Collapsible (accordion) para nao sobrecarregar
- Secoes obrigatorias abertas por padrao
- Secoes opcionais fechadas com indicador "Opcional" em badge

---

## Parte 2: Tutorial de Implantacao Visual e Didatico (SitePreview reescrito)

Substituir a lista de texto simples por um **tutorial visual passo-a-passo** com cards ilustrados, icones grandes e botao de suporte.

### Novo Componente: `SiteDeployGuide`

Exibido apos aprovacao do site (em vez de accordion escondido), como uma secao sempre visivel com:

**Design**
- Card grande com fundo gradiente suave
- Titulo "Como Publicar seu Site" com icone de foguete
- Subtitulo "Siga o passo-a-passo para colocar seu site no ar"

**Passos Visuais (cards horizontais com scroll ou grid 2x3)**

Cada passo e um card com:
- Numero grande e colorido (circulo primario)
- Icone Lucide grande (40px) representando a acao
- Titulo curto e em negrito
- Descricao de 2-3 linhas explicando o que fazer
- Badge opcional com tempo estimado

Passos:
1. **Baixe seu site** (Download icon) — "Clique no botao 'Baixar Codigo' acima para salvar o arquivo HTML no seu computador" — Badge: "10 segundos"
2. **Acesse sua hospedagem** (Globe icon) — "Entre no painel de controle da sua hospedagem. Exemplos: Hostinger, Locaweb, Vercel, Netlify" — Badge: "2 minutos"
3. **Acesse o gerenciador de arquivos** (FolderOpen icon) — "Procure por 'Gerenciador de Arquivos' ou 'File Manager' no painel da hospedagem" — Badge: "1 minuto"
4. **Faca upload do arquivo** (Upload icon) — "Navegue ate a pasta 'public_html' ou raiz do dominio e faca upload do arquivo HTML" — Badge: "2 minutos"
5. **Configure o dominio** (Link icon) — "Se ainda nao fez, aponte seu dominio para o servidor da hospedagem nas configuracoes de DNS" — Badge: "5 minutos"
6. **Pronto!** (CheckCircle icon) — "Aguarde ate 24h para propagacao do DNS. Apos isso, seu site estara no ar!" — Badge: "ate 24h"

**Card de Hospedagens Populares**
Abaixo dos passos, um card com logos/nomes das hospedagens mais comuns e links para seus tutoriais:
- Hostinger — "Tutorial de upload"
- Vercel — "Deploy em 1 clique"
- Netlify — "Arrastar e soltar"
- Locaweb — "Painel de controle"
(cada um com link externo real para a documentacao)

**Botao de Duvida/Suporte**
Card destacado no final:
- Icone de headset/suporte grande
- Titulo "Precisa de ajuda?"
- Texto "Nossa equipe esta pronta para te ajudar a publicar seu site"
- Botao "Falar com Suporte" que abre o modulo de atendimento (`/cliente/suporte` ou abre WhatsApp)
- Badge "Resposta em ate 4h" (referencia ao SLA do modulo de atendimento)

### Informar URL Publicada
Apos o guia, manter o campo para informar a URL com visual melhorado:
- Card com icone de link
- Input com label claro "Informe a URL do seu site publicado"
- Botao "Salvar URL" que muda o status para "Publicado"
- Feedback visual (confetti ou animacao de sucesso ao salvar)

---

## Parte 3: Atualizacao do Edge Function

Atualizar o system prompt e user prompt do `generate-site` para receber os novos campos do briefing expandido (nome da empresa, slogan, segmento, publico-alvo, prova social, numeros de impacto, tom de comunicacao, redes sociais, referencia visual). Isso resultara em sites muito mais personalizados e profissionais.

---

## Detalhes Tecnicos

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/sites/SiteWizardStep3.tsx` | Reescrita completa: 7 secoes tematicas em accordion, campos especificos, indicador de qualidade, pre-preenchimento automatico |
| `src/components/sites/SitePreview.tsx` | Substituir guia de texto por tutorial visual com cards passo-a-passo, hospedagens populares e botao de suporte |
| `src/pages/cliente/ClienteSites.tsx` | Atualizar o state do briefing para incluir os novos campos (nomeEmpresa, slogan, segmento, publicoAlvo, dores, numerosImpacto, tomComunicacao, redesSociais, referenciaVisual, telefone, email, endereco, linkWhatsapp) e enviar tudo ao edge function |
| `supabase/functions/generate-site/index.ts` | Atualizar prompts para usar os novos campos do briefing expandido |

### Novos Campos no State do Briefing

```text
nomeEmpresa: string
slogan: string
descricaoNegocio: string
segmento: string
servicos: string
diferencial: string
faixaPreco: string
publicoAlvo: string
faixaEtaria: string
dores: string
depoimentos: string
numerosImpacto: string
logosClientes: string
coresPrincipais: string
fontesPreferidas: string
tomComunicacao: string
referenciaVisual: string
telefone: string
email: string
endereco: string
redesSociais: string
linkWhatsapp: string
instrucoes: string
estrategia: Record<string, any> | null
persona: { nome, descricao } | null
identidade: { paleta, fontes, estilo, tom_visual } | null
```

### Calculo da Qualidade do Briefing

Campos com peso:
- Obrigatorios (peso 2): nomeEmpresa, descricaoNegocio, servicos, diferencial, contato (telefone ou email)
- Importantes (peso 1.5): publicoAlvo, depoimentos, coresPrincipais
- Opcionais (peso 1): slogan, segmento, faixaPreco, dores, numerosImpacto, tomComunicacao, redesSociais, referenciaVisual, instrucoes

Score = soma dos pesos preenchidos / soma total dos pesos * 100
