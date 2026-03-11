

## Plano: Inserir despesas de Março/2026

Vou inserir 5 registros na tabela `finance_expenses` para Março/2026, com os mesmos dados de categoria e tipo (recorrente/variável) dos registros de Fevereiro que já existem:

| Descrição | Valor | Categoria | Tipo | Data |
|---|---|---|---|---|
| Aluguel + Estrutura | R$ 5.192,25 | Estrutura | Recorrente | 2026-03-01 |
| Empréstimo 9/60 | R$ 2.197,00 | Empréstimos | Recorrente | 2026-03-01 |
| CNP parcela 12/12 | R$ 2.533,00 | Investimentos | Variável | 2026-03-01 |
| RH Angelica | R$ 1.733,33 | Estrutura | Recorrente | 2026-03-01 |
| Empréstimo 3/12 | R$ 1.885,60 | Empréstimos | Recorrente | 2026-03-01 |

### Ação
- Inserir via SQL (`INSERT INTO finance_expenses`) com `organization_id` = `4206c8f4-dc9b-414d-9535-0c6d5f2d80b4`, status `pending` (pois é mês corrente)

Nenhuma alteração de código necessária — apenas inserção de dados.

