

# Correção do Bug do Funil + Testes Reais #14-18

## 1. Correção: `src/hooks/useCrmFunnels.ts`
No `createFunnel`, adicionar reset de `is_default = false` nos outros funis da org antes de inserir um novo como padrão (mesma lógica que já existe no `updateFunnel`).

## 2. Correção de dados
Executar query para garantir apenas 1 funil com `is_default = true` por organização.

## 3. Testes reais via browser automation
Login com `cliente.teste@noexcuse.com` → Navegar ao CRM → Executar:

| # | Teste | Ação real |
|---|-------|-----------|
| 14 | Integrações | Abrir aba, copiar webhook, verificar CSV |
| 15 | Criar automação | Preencher form, salvar |
| 16 | Editar automação | Alterar campos, salvar |
| 17 | Toggle status | Clicar switch ativo/inativo |
| 18 | Deletar automação | Clicar excluir, confirmar |

Screenshots de evidência após cada ação.

## Arquivo alterado
- `src/hooks/useCrmFunnels.ts` — reset `is_default` no `createFunnel`

