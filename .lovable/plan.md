

# Correção do Bug do Funil + Testes Reais #14-18

## Contexto
A senha correta é `19961996`. O plano já foi aprovado anteriormente.

## 1. Correção de código: `src/hooks/useCrmFunnels.ts`
O `createFunnel` já foi corrigido na última iteração (adicionado reset de `is_default`). Nenhuma alteração de código adicional necessária.

## 2. Correção de dados no banco
Executar SQL para garantir apenas 1 funil com `is_default = true` na org `adb09618`:
- Setar `is_default = false` no funil "Funil Teste Editado" (`1f6539b4`)
- Manter apenas "Funil Principal" (`d92b6d1d`) como padrão

## 3. Testes reais via browser
Login com `cliente.teste@noexcuse.com` / `19961996` → CRM → Configurações:

| # | Teste | Ação real |
|---|-------|-----------|
| 5b | Deletar funil | Verificar que botão "Excluir" agora aparece no funil não-padrão, clicar e confirmar |
| 14 | Integrações | Abrir aba, verificar Webhook URL e CSV import |
| 15 | Criar automação | Preencher nome, trigger, ação, salvar |
| 16 | Editar automação | Alterar campos, salvar |
| 17 | Toggle status | Clicar switch ativo/inativo |
| 18 | Deletar automação | Clicar excluir, confirmar |

Screenshots de evidência após cada bloco.

## Arquivos alterados
- Nenhum arquivo de código (fix já aplicado)
- Correção de dados via migration SQL

