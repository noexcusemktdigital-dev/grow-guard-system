

## Inserir Receitas e Despesas no Financeiro da Matriz

Vou inserir os dados diretamente no banco de dados da organização **NoExcuse Franqueadora**.

### Receitas (20 registros)

Todas as receitas serao inseridas na tabela `finance_revenues` com:
- `organization_id`: NoExcuse Franqueadora
- `status`: "paid" (contratos ativos)
- `category`: baseada na origem (Assessoria, Parceiro, Sistema, Projeto, Franqueado, Indefinido)
- Receitas recorrentes identificadas na descricao

| Cliente | Valor | Categoria |
|---|---|---|
| AllePets | R$ 1.450 | Assessoria |
| Ariadine Casarini | R$ 1.843 | Assessoria |
| Balpas | R$ 3.000 | Assessoria |
| Klir Mga | R$ 4.305 | Assessoria |
| Moro | R$ 900 | Assessoria |
| P2Y Nordeste | R$ 2.836,67 | Assessoria |
| Saura Mais BB | R$ 2.400 | Assessoria |
| Silvan Cult | R$ 1.800 | Assessoria |
| Titania Comex | R$ 2.405 | Assessoria |
| Tortteria | R$ 3.796 | Assessoria |
| Triangulo Consorcio | R$ 6.563 | Assessoria |
| Bruna Felber | R$ 2.000 | Parceiro |
| Maria Gleice | R$ 171 | Sistema |
| LP Saura Agro | R$ 1.400 | Projeto |
| Allure Site | R$ 1.280 | Projeto |
| LP China | R$ 800 | Projeto |
| Mecfilter | R$ 2.800 | Franqueado |
| Massago | R$ 1.800 | Outros |
| Massaru | R$ 1.680 | Outros |
| Moreira | R$ 0 | Outros |

### Despesas (21 registros)

Inseridas na tabela `finance_expenses` com categorias e tipo (fixa/variavel):

| Despesa | Valor | Categoria | Tipo |
|---|---|---|---|
| Atendimento 1 | R$ 2.500 | Pessoas | Fixa |
| Atendimento 2 | R$ 2.500 | Pessoas | Fixa |
| Gestor Performance | R$ 3.000 | Pessoas | Fixa |
| Gerente Criativa | R$ 3.000 | Pessoas | Fixa |
| Pro-labore Davi | R$ 6.500 | Pessoas | Fixa |
| CapCut | R$ 65,90 | Plataformas | Fixa |
| Freepik | R$ 48,33 | Plataformas | Fixa |
| Captions | R$ 124,99 | Plataformas | Fixa |
| Google | R$ 49,99 | Plataformas | Fixa |
| ChatGPT | R$ 100 | Plataformas | Fixa |
| Lovable | R$ 210 | Plataformas | Fixa |
| Envato | R$ 165 | Plataformas | Fixa |
| Ekyte | R$ 625 | Plataformas | Fixa |
| Aluguel + Estrutura | R$ 5.192,25 | Estrutura | Fixa |
| Juridico | R$ 800 | Estrutura | Fixa |
| RH | R$ 1.733,33 | Estrutura | Fixa |
| Emprestimo 9/60 | R$ 2.197 | Emprestimos | Fixa |
| Emprestimo 3/12 | R$ 1.885,60 | Emprestimos | Fixa |
| Moveis sala | R$ 646,67 | Investimentos | Variavel |
| CNP | R$ 2.533 | Investimentos | Variavel |
| Evento mensal empresarios | R$ 3.000 | Eventos | Variavel |
| Treinamento equipe | R$ 2.000 | Treinamentos | Variavel |

### Detalhes tecnicos

- Insercao direta via SQL nas tabelas `finance_revenues` e `finance_expenses`
- Org ID: `4206c8f4-dc9b-414d-9535-0c6d5f2d80b4`
- Nenhuma alteracao de schema necessaria — as tabelas ja existem com as colunas corretas
- Os dados aparecerao automaticamente nas paginas de Receitas e Despesas do financeiro

