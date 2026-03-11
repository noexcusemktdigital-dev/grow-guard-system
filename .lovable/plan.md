

## Custo Real Lovable vs Receita dos Planos

### Como funciona o custo Lovable AI

A Lovable cobra **exatamente o mesmo preço do provedor** (Google), sem markup. O modelo usado no agente é **Gemini 3 Flash Preview**:

- **Input:** $0,50 / 1M tokens
- **Output:** $3,00 / 1M tokens

Com base nos seus logs reais (20 mensagens registradas), a média é **~2.700 tokens totais por mensagem** do agente IA. Estimando ~30% input e ~70% output (padrão de chatbot):

- Input: ~810 tokens → $0,50 × 0,00081 = **$0,000405**
- Output: ~1.890 tokens → $3,00 × 0,00189 = **$0,00567**
- **Custo real por mensagem: ~$0,006 = R$ 0,034** (câmbio ~R$ 5,70)

### Tabela de Custo vs Receita por Plano

| | Starter R$ 397 | Pro R$ 797 | Enterprise R$ 1.497 |
|---|---|---|---|
| Créditos/mês | 500 | 1.000 | 1.500 |
| Msgs agente (2cr cada) | 250 | 500 | 750 |
| **Custo IA se usar 100% em agente** | 250 × R$ 0,034 = **R$ 8,50** | 500 × R$ 0,034 = **R$ 17** | 750 × R$ 0,034 = **R$ 25,50** |
| Custo Asaas (~3%) | R$ 11,91 | R$ 23,91 | R$ 44,91 |
| Evolution API (estimativa) | — | ~R$ 50 (rateio) | ~R$ 50 (rateio) |
| **Custo total estimado** | **~R$ 20** | **~R$ 91** | **~R$ 120** |
| **Margem bruta** | **~R$ 377 (95%)** | **~R$ 706 (89%)** | **~R$ 1.377 (92%)** |

### Pacotes de Recarga

| Pack | Preço | Msgs agente (100%) | Custo IA | Margem |
|---|---|---|---|---|
| 200 cr / R$ 49 | R$ 49 | 100 | R$ 3,40 | R$ 45,60 (93%) |
| 500 cr / R$ 99 | R$ 99 | 250 | R$ 8,50 | R$ 90,50 (91%) |
| 1.000 cr / R$ 179 | R$ 179 | 500 | R$ 17 | R$ 162 (91%) |

### Custo Lovable por funcionalidade de IA

| Ação | Créditos | Custo real Lovable (est.) | Receita (R$ 0,80/cr) |
|---|---|---|---|
| Agente IA (msg) | 2 | R$ 0,034 | R$ 1,60 |
| Script de vendas | 20 | R$ 0,17 | R$ 16 |
| Arte social (imagem) | 25 | R$ 0,50* | R$ 20 |
| Conteúdo | 30 | R$ 0,17 | R$ 24 |
| Estratégia marketing | 50 | R$ 0,34 | R$ 40 |
| Site | 100 | R$ 0,85 | R$ 80 |

*Geração de imagem usa modelo diferente, custo estimado mais alto.

### Sobre o seu plano Lovable

O Lovable cobra uso de IA no modelo **pay-as-you-go** debitando do seu saldo Cloud & AI. Atualmente o workspace tem **$25 grátis/mês de Cloud + $1 de AI** (promoção até fim do Q1 2026).

**Sobre renovação automática interna:** Não é possível criar uma renovação automática do saldo Lovable Cloud programaticamente — o saldo é gerenciado pela plataforma Lovable em **Settings → Cloud & AI balance**. Quando o saldo AI acabar, as edge functions que chamam o gateway AI vão receber erro **402 (Payment Required)**, que já é tratado no código do agente.

### Recomendação

Para não travar clientes quando o saldo Lovable acabar:
1. **Monitore o saldo** em Settings → Cloud & AI balance
2. **Configure alertas** ou cheque periodicamente
3. **Top up manualmente** quando necessário — o custo real é muito baixo (~R$ 0,034/msg)
4. Considere trocar para **Gemini 2.5 Flash Lite** ($0,25/$1,50 por 1M tokens) para reduzir custo pela metade

Com o volume atual (dezenas de mensagens), o custo real na Lovable é de **centavos por mês**. Mesmo com 10.000 mensagens/mês de agente IA, o custo seria ~R$ 340 — ainda com margem altíssima.

