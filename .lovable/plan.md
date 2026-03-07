

## Plano: Fechamentos Financeiros — Matriz → Unidade → Franqueado

### Problema

A tabela `finance_closings` já existe com campo `unit_id`, mas:
1. **FinanceiroFechamentos.tsx** (Matriz) não tem botão para criar/publicar fechamentos vinculados a uma unidade
2. **UnidadeFinanceiroReal.tsx** (aba Financeiro dentro de Unidades e Minha Unidade) não exibe fechamentos — mostra apenas config financeira e pagamentos do sistema
3. O franqueado em "Minha Unidade" > Financeiro não vê nenhum fechamento/DRE

### Solução

**1. FinanceiroFechamentos.tsx — Adicionar criação de fechamento por unidade**

- Botão "Novo Fechamento" que abre dialog com:
  - Seletor de unidade (lista de units)
  - Mês/Ano
  - Título (auto-preenchido: "DRE {Unidade} - {Mês}/{Ano}")
  - Upload de arquivo (PDF/planilha) para o bucket `closing-files`
  - Notas opcionais
- Ao salvar: insere em `finance_closings` com `unit_id`, `organization_id` (da matriz), `status: 'published'`, `file_url`
- Botão de publicar/despublicar nos fechamentos existentes

**2. UnidadeFinanceiroReal.tsx — Exibir fechamentos da unidade**

- Nova seção "Fechamentos / DREs" abaixo do histórico de pagamentos
- Query: buscar `finance_closings` onde `unit_id = unit.id`
- Exibir como cards com: título, mês/ano, status (badge), botão "Baixar" se `file_url` existir
- Em modo `readOnly` (franqueado): apenas visualizar e baixar — sem editar/deletar
- Em modo normal (matriz dentro de Unidades): pode ver e tem link para gerenciar na página Fechamentos

**3. Formato DRE (inspirado na referência noexcusedigital.com/projecao)**

O fechamento é um arquivo (PDF/Excel) que a matriz gera e faz upload. A visualização no sistema é apenas a lista de fechamentos com download — o DRE em si é o arquivo.

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `src/pages/FinanceiroFechamentos.tsx` | Adicionar dialog "Novo Fechamento" com upload e seletor de unidade |
| `src/components/unidades/UnidadeFinanceiroReal.tsx` | Adicionar seção de fechamentos vinculados à unidade |

### Ordem

1. Adicionar seção de fechamentos no `UnidadeFinanceiroReal.tsx`
2. Adicionar dialog de criação no `FinanceiroFechamentos.tsx`

