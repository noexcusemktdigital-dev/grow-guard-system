

# Meu Perfil (estilo rede social) + Configuracoes do Franqueado

## 1. Meu Perfil - Pagina estilo rede social

Uma pagina de perfil visual inspirada em redes sociais, com capa, avatar grande e informacoes do usuario em destaque.

### Layout

```text
+---------------------------------------------+
|  Banner / Capa (gradiente dark premium)      |
|                                              |
|   [Avatar Grande]                            |
|   Nome Completo                              |
|   Cargo · Unidade Curitiba                   |
|   franqueado@email.com · (41) 99999-0001     |
+---------------------------------------------+
|                                              |
|  [ Editar Perfil ]                           |
|                                              |
|  Informacoes Pessoais (Card)                 |
|  - Nome, Telefone, Cargo                     |
|  - E-mail (readonly)                         |
|  - Botao Salvar                              |
|                                              |
|  Estatisticas Rapidas (Cards em grid)        |
|  - Contratos Ativos | Leads no CRM |         |
|    Propostas Enviadas | Dias na rede          |
+---------------------------------------------+
```

### Dados
- Usa `useUserProfile` para dados pessoais (ja existe)
- Usa `useContracts` para contar contratos ativos
- Usa `useCrmLeads` para contar leads
- Calcula "dias na rede" a partir do `created_at` do profile

### Arquivo
- `src/pages/franqueado/FranqueadoPerfil.tsx` (novo)

---

## 2. Configuracoes do Franqueado

Pagina com 3 abas para gestao da unidade:

### Aba "Dados da Unidade"
- Formulario para editar nome, cidade, estado, endereco, telefone, email da unidade
- Usa `useUnits` para buscar a unidade do franqueado e `useUnitMutations` para salvar
- Exibe CNPJ e dados financeiros como readonly (repasse, royalties, mensalidade)

### Aba "Equipe"
- Lista de usuarios da unidade (membros da org com role franqueado ou operador)
- Botao "Convidar Funcionario" usando o edge function `invite-user` existente
- Roles disponiveis: `franqueado` (Admin) ou `cliente_user` (Operador)
- Mesmo padrao do `ClienteConfiguracoes > UsersTab`

### Aba "Contrato de Franquia"
- Exibe o contrato de franquia vinculado a unidade (se existir na tabela `contracts`)
- Informacoes: titulo, data inicio, data fim, status, valor
- Botao para baixar PDF do contrato (se disponivel)
- Seção readonly - franqueado so visualiza, nao edita

---

## 3. Rotas e Navegacao

### Novas rotas em App.tsx
- `/franqueado/perfil` → `FranqueadoPerfil`
- `/franqueado/configuracoes` → `FranqueadoConfiguracoes`

### Sidebar
- Adicionar "Configuracoes" no rodape da sidebar (icone Settings)

### UserMenu
- "Meu Perfil" → navega para `/franqueado/perfil` (quando role = franqueado)
- "Configuracoes" → navega para `/franqueado/configuracoes` (quando role = franqueado)

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/franqueado/FranqueadoPerfil.tsx` | Novo - pagina de perfil estilo rede social |
| `src/pages/franqueado/FranqueadoConfiguracoes.tsx` | Novo - configuracoes com 3 abas (Unidade, Equipe, Contrato) |
| `src/App.tsx` | Adicionar 2 rotas novas |
| `src/components/FranqueadoSidebar.tsx` | Adicionar link de Configuracoes no rodape |
| `src/components/UserMenu.tsx` | Navegar para perfil/config com base no role |

Nenhuma mudanca no banco de dados necessaria - todas as tabelas e hooks ja existem.

