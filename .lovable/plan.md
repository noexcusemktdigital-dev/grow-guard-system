

# Corrigir Pagamento da Calculadora (Logica da Calculadora NOE)

## Resumo

Alinhar completamente a logica de pagamento, duracao e resumo financeiro com o projeto "calculadora NOE" de referencia. As principais mudancas:

1. **Adicionar duracao "1 Mes"** -- para projetos de entrega unica (so unitario)
2. **Remover "Total do Projeto"** -- nao existe na referencia, so mostra Total Unitario + Total Mensal separados
3. **Corrigir logica de parcelamento** -- o parcelamento dilui o unitario dentro do mensal (nao divide o total geral)
4. **Pagamento so aparece quando duracao > 1** -- se for 1 mes, nao tem opcao de pagamento
5. **Permitir contratar so unitario** -- cliente pode selecionar apenas servicos unitarios e pagar a vista

---

## O que muda na interface

### Step 2 - Duracao

Adicionar opcao "01 Mes" (entrega unica) alem de 6 e 12 meses:

```text
[01 Mes]  [Semestral]  [Anual]
 Entrega    6 meses    12 meses
  unica    de projeto  de projeto
```

### Step 2 - Pagamento

- So aparece se duracao > 1 mes
- Cards mostram valores diluidos (unitario + mensal juntos), nao parcelas do total:

```text
A Vista:     Mes 1: R$ (unitario + mensal) | Mes 2+: R$ mensal
3x:          Mes 1-3: R$ (mensal + unitario/3) | Mes 4+: R$ mensal
6x:          Mes 1-6: R$ (mensal + unitario/6) | Mes 7+: R$ mensal
```

- Se nao tem mensal (so unitario): mostra "Pagamento unico" / "Sem mensalidade apos"

### Step 2 - Simulacao

- Remover "Total do Projeto" e "parcelas x de R$ valor"
- Mostrar apenas: Total Unitario | Total Mensal | Forma de pagamento com meses diluidos

### Step 3 - Preview/PDF

- Resumo Financeiro: so Total Unitario (Setup) e Total Mensal (Recorrencia), sem total do projeto
- Investimento: mostrar "Mes 1: R$ X | Mes 2+: R$ Y" em vez de "Nx de R$ valor"

### Mini resumo (Step 1)

- Manter Total Unitario + Total Mensal separados, remover totalGeral

---

## Secao Tecnica

### Arquivo modificado

```text
src/pages/franqueado/FranqueadoPropostas.tsx
```

### Mudancas especificas

**1. Tipo de duracao** -- mudar de `"6" | "12"` para `1 | 6 | 12`:
```text
const [duracao, setDuracao] = useState<1 | 6 | 12>(12);
```

**2. Remover totalProjeto e totalGeral** -- essas variaveis nao existem na referencia:
```text
// REMOVER:
const totalGeral = totalUnitario + totalMensal;
const totalProjeto = totalUnitario + totalMensal * Number(duracao);
```

**3. Reescrever parcelaInfo** -- usar logica de diluicao:
```text
getDilutedMonthly(installments) = totalMensal + (totalUnitario / installments)

getPaymentDetails():
  avista -> { firstMonths: "Mes 1: R$ (unitario+mensal)", afterMonths: "Mes 2+: R$ mensal" }
  3x     -> { firstMonths: "Mes 1-3: R$ getDiluted(3)", afterMonths: "Mes 4+: R$ mensal" }
  6x     -> { firstMonths: "Mes 1-6: R$ getDiluted(6)", afterMonths: "Mes 7+: R$ mensal" }

  Se totalMensal === 0: afterMonths = "Pagamento unico" / "Sem mensalidade apos"
```

**4. Step 2 - Duracao**: grid de 3 colunas com opcao 1/6/12 meses

**5. Step 2 - Pagamento**: so renderizar se `duracao > 1`. Cards mostram firstMonths + afterMonths (nao parcelas)

**6. Step 2 - Simulacao**: remover Total Projeto e campo de parcelas. Mostrar so: Total Unitario | Total Mensal | Forma de pagamento diluida

**7. Mini resumo (Step 1)**: trocar `R$ totalGeral` por mostrar unitario e mensal separados

**8. Step 3 - Preview PDF**: atualizar Resumo Financeiro (remover Total do Projeto) e Investimento (usar firstMonths/afterMonths)

**9. handleSalvarProposta**: salvar `valor: totalUnitario + totalMensal` (soma base, nao projeto total)

