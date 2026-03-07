

## Plano: Atualizar Troféus e Seletor de Metas por Mês

### 1. Troféus — `FranqueadoMetasRanking.tsx` (linhas 27-34)

Substituir os 6 troféus atuais por estes 6:

| ID | Título | Descrição | Ícone |
|---|---|---|---|
| `first_sale` | Primeira Venda | Feche seu primeiro contrato | Star |
| `hat_trick` | Hat-trick | Conquiste seus 3 primeiros clientes | Flame |
| `top_revenue` | Top Faturamento | Alcance R$ 20.000 em um mês | TrendingUp |
| `speed_close` | Fechamento Relâmpago | Feche um contrato em menos de 7 dias | Zap |
| `first_goal` | Primeira Meta Batida | Atinja sua primeira meta mensal | Target |
| `ten_clients` | 10 Clientes Ativos | Alcance 10 clientes ativos na carteira | Users |

Remove: "Status Elite" e "Consistência".
Adiciona: "Primeira Meta Batida" e "10 Clientes Ativos".

### 2. Metas — `MetasRanking.tsx` (dialog de criação, linhas 331-355)

- Adicionar opção de escopo **"Matriz (interna)"** além de "Toda a Rede" e "Por Unidade"
- Já usa `<Input type="month">` para seleção de mês — manter assim, sem campos de data

Escopos finais:
- `rede` — Toda a Rede
- `matriz` — Matriz (interna)
- `unidade` — Por Unidade

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/franqueado/FranqueadoMetasRanking.tsx` | Atualizar array de troféus |
| `src/pages/MetasRanking.tsx` | Adicionar escopo "matriz" no Select |

