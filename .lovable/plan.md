
# Atualizar Limites dos Planos: Conteudos e Artes

## Resumo

Alterar os limites de geracao por plano para refletir os novos valores e adicionar logica para que o cliente escolha as quantidades por formato (conteudo) e selecione quais artes produzir a partir dos conteudos gerados.

---

## Novos Limites por Plano

| Modulo | Starter | Growth | Scale |
|--------|---------|--------|-------|
| Conteudos gerados/mes | 8 | 12 | 20 |
| Artes sociais/mes | 4 | 8 | 12 |
| Sites ativos | 1 (LP) | 2 (LP, 3p, 5p) | 5 (todos) |

**Importante:** Os limites de conteudo agora representam **quantidade total de conteudos** (nao campanhas). O cliente pode escolher como distribuir entre formatos (Feed, Carrossel, Reels, Story) ou deixar a plataforma recomendar automaticamente.

---

## Mudancas por Arquivo

### 1. `src/constants/plans.ts`

Renomear `maxContentCampaigns` para `maxContents` e atualizar `maxSocialArts`:

| Campo | Starter | Growth | Scale |
|-------|---------|--------|-------|
| maxContents | 8 | 12 | 20 |
| maxSocialArts | 4 | 8 | 12 |

Atualizar os textos de features para refletir os novos valores.

### 2. `src/pages/cliente/ClienteConteudos.tsx`

**Mudancas no wizard (Step 2 - Formatos):**
- Mudar a logica de cota: em vez de contar campanhas, contar o **total de conteudos gerados no mes** (soma de todos os conteudos de todas as campanhas do mes)
- Mostrar no banner: "X de Y conteudos usados este mes"
- Adicionar opcao "Deixar a plataforma recomendar" que distribui automaticamente entre formatos com base no total disponivel restante (ex: se restam 8, sugere 3 Feed + 2 Carrossel + 2 Reels + 1 Story)
- Validar que o total de formatos escolhidos nao ultrapassa o saldo restante do plano
- Atualizar label do banner de "campanhas de conteudo" para "conteudos"

**Mudancas na validacao:**
- Bloquear geracao se `totalFormatosEscolhidos + totalJaGeradosNoMes > maxContents`
- Mostrar saldo restante: "Voce ainda pode gerar X conteudos este mes"

### 3. `src/pages/cliente/ClienteRedesSociais.tsx`

**Mudancas no wizard:**
- Mudar a cota para contar **total de artes geradas no mes** (nao por campanha)
- Banner: "X de Y artes usadas este mes"
- Na selecao de quantidade (campo `bQtd`), limitar o max ao saldo restante
- Quando o fluxo e "Puxar do conteudo", o cliente seleciona quais conteudos quer transformar em arte, mas o total selecionado nao pode ultrapassar o limite de artes restantes

**Mudancas na validacao:**
- Bloquear se `qtdEscolhida + totalArtesNoMes > maxSocialArts`
- Mostrar aviso: "Voce pode gerar mais X artes este mes"

### 4. `src/components/quota/UsageQuotaBanner.tsx`

- Nenhuma mudanca estrutural, apenas os valores passados mudarao (de campanhas para conteudos individuais)

### 5. `src/pages/cliente/ClientePlanoCreditos.tsx`

- Atualizar os textos de features dos planos para refletir "8 conteudos/mes" em vez de "1 campanha/mes" etc.

---

## Detalhes Tecnicos

### Calculo de uso mensal (Conteudos)

```text
// Contar todos os conteudos de campanhas do mes atual
const contentosNoMes = campaigns
  .filter(c => c.mes includes mesAtual)
  .reduce((sum, c) => sum + c.conteudos.length, 0);

const saldoRestante = maxContents - contentosNoMes;
```

### Distribuicao automatica recomendada

Quando o usuario clica "Deixar a plataforma recomendar":
- Para 8: 3 Feed + 2 Carrossel + 2 Reels + 1 Story
- Para 12: 4 Feed + 3 Carrossel + 3 Reels + 2 Story
- Para 20: 7 Feed + 5 Carrossel + 5 Reels + 3 Story
- Para qualquer saldo customizado: distribui proporcionalmente (40% Feed, 25% Carrossel, 25% Reels, 10% Story)

### Validacao no Step 2 do wizard de conteudos

- Mostrar card com saldo: "Saldo disponivel: X conteudos"
- Se totalFormatos > saldoRestante: botao desabilitado + mensagem "Reduza a quantidade. Voce pode gerar ate X conteudos."
- Botao "Recomendar para mim" que preenche automaticamente baseado no saldo

### Validacao no wizard de artes

- Campo quantidade max = min(10, saldoRestanteArtes)
- Se saldo = 0: wizard nao abre, toast com sugestao de upgrade
