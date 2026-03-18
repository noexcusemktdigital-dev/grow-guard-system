

# Plano: Teste Funcional Completo do CRM (Funis, Contatos, Automações, Config)

## Contexto

Estou em modo de planejamento (somente leitura). Para executar os testes funcionais reais via browser automation, preciso estar em modo de implementação. O plano abaixo detalha exatamente o que será testado.

## Pré-requisito
- Login com `cliente.teste@noexcuse.com` / `19961996`
- Navegar para `/cliente/crm`

## Testes Funcionais (18 ações)

### Bloco A — Funis (5 ações)
1. **Criar Funil** → Abrir Config (`/cliente/crm` > botão Config > aba Funis), clicar "Novo funil", preencher nome "Funil Teste", adicionar 4 etapas customizadas com cores e ícones diferentes, salvar
2. **Editar Funil** → Clicar "Editar" no funil criado, renomear para "Funil Teste Editado", reordenar etapas (mover ▲/▼), salvar
3. **Tornar Padrão** → Clicar "Tornar padrão" no funil de teste, verificar badge "Padrão"
4. **Trocar Funil no Pipeline** → Voltar ao pipeline, selecionar o funil de teste no dropdown, verificar que as colunas do Kanban refletem as etapas customizadas
5. **Deletar Funil** → Voltar a Config, deletar o funil de teste, confirmar remoção

### Bloco B — Contatos (4 ações)
6. **Criar Contato** → No CRM, aba "Contatos", clicar "+ Contato", preencher nome, email, telefone, empresa, tags, salvar
7. **Editar Contato** → Clicar no contato criado, alterar empresa e adicionar tag, salvar
8. **Converter Contato em Lead** → Usar ação de conversão (se disponível no UI)
9. **Deletar Contato** → Excluir contato de teste

### Bloco C — Configurações CRM (5 ações)
10. **Equipe** → Aba "Equipe", verificar listagem de membros
11. **Produtos** → Aba "Produtos", criar produto "Produto Teste" com valor R$ 500, verificar listagem, deletar
12. **Parceiros** → Aba "Parceiros", criar parceiro "Parceiro Teste", verificar, deletar
13. **SLA** → Aba "SLA", verificar/alterar configuração de alertas
14. **Integrações** → Aba "Integ.", verificar API key e webhook URL exibidos

### Bloco D — Automações (4 ações)
15. **Criar Automação** → Aba "Autom.", clicar "Nova automação", configurar trigger "lead_created" + action "send_notification", salvar
16. **Editar Automação** → Alterar trigger ou ação, salvar
17. **Ativar/Desativar** → Toggle de is_active na automação
18. **Deletar Automação** → Excluir automação de teste

## Entregável
Tabela consolidada:
| # | Módulo | Ação | Status (OK/BUG) | Detalhe |

Para cada BUG: screenshot + descrição técnica + correção proposta.

## Execução
Cada ação será executada com `act` (interação real), não apenas `observe`. Após aprovação, iniciarei o browser, farei login e executarei sequencialmente.

