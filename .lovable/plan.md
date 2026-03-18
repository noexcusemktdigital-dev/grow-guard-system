

# Plano: Testes Funcionais Completos do CRM via Browser

## Abordagem
Executar os 14 testes restantes do CRM usando browser automation (`act`, `observe`, `screenshot`). Interações reais no preview — clicar, preencher formulários, verificar resultados visuais.

## Pré-requisito
O usuário confirmou que já fez login no preview. Vou navegar diretamente para `/cliente/crm` e executar sequencialmente.

## Sequência de Execução

### Bloco 1 — Funis (#5)
- Navegar para Config > Funis
- Deletar funil não-padrão
- Screenshot de confirmação

### Bloco 2 — Contatos (#6-9)
- Navegar para aba Contatos
- Criar contato (nome, email, telefone, empresa, tags)
- Editar contato (alterar empresa, adicionar tag)
- Converter contato em lead
- Deletar contato
- Screenshot após cada ação

### Bloco 3 — Config (#10-14)
- Verificar aba Equipe
- Criar/deletar Produto
- Criar/deletar Parceiro
- Verificar SLA
- Verificar Integrações
- Screenshot de cada aba

### Bloco 4 — Automações (#15-18)
- Criar automação
- Editar automação
- Toggle ativo/inativo
- Deletar automação
- Screenshot de cada ação

## Entregável
Tabela consolidada dos 18 testes com status OK/BUG, screenshots das evidências, e correções inline para bugs encontrados.

