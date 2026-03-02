
# Criar Pagina "Meu Perfil" da Franqueadora

## Contexto
A plataforma Franqueado ja possui uma pagina de perfil completa (`/franqueado/perfil`) com banner, avatar, estatisticas e formulario de edicao. A Franqueadora nao tem essa pagina -- precisa ser criada seguindo o mesmo design, mas com metricas relevantes para o super_admin/admin da rede.

## Arquivos a Criar/Editar

### 1. Criar `src/pages/franqueadora/FranqueadoraPerfil.tsx`
Nova pagina seguindo o mesmo layout do `FranqueadoPerfil.tsx`:
- **Banner gradiente** + Avatar grande com iniciais
- **Botao "Editar Perfil"** no canto superior direito
- **Info do usuario**: nome, cargo, e-mail, telefone
- **Grid de estatisticas** (4 cards) com metricas da Franqueadora:
  - Unidades Ativas (via `useUnits`)
  - Leads da Rede (via `useCrmLeads`)
  - Membros da Equipe (via `useOrgMembers`)
  - Dias de Operacao (calculado a partir do `created_at` do perfil)
- **Secao "Dados da Organizacao"** (diferencial da matriz): exibir e permitir editar CNPJ, razao social, telefone e endereco da organizacao usando `useOrgProfile`
- **Formulario de edicao pessoal** (nome, telefone, cargo) usando `useUserProfile`
- Hooks reutilizados: `useAuth`, `useUserProfile`, `useOrgProfile`, `useUnits`, `useOrgMembers`, `useCrmLeads`

### 2. Editar `src/App.tsx`
- Importar `FranqueadoraPerfil`
- Adicionar rota `<Route path="perfil" element={<FranqueadoraPerfil />} />` dentro do bloco `franqueadora`

### 3. Editar `src/components/FranqueadoraSidebar.tsx`
- Adicionar link "Meu Perfil" no popover do usuario (mesmo padrao do FranqueadoSidebar) apontando para `/franqueadora/perfil`

## Detalhes Tecnicos

**Estatisticas da Matriz vs Franqueado:**

```text
Franqueado                    Franqueadora
-----------                   ------------
Contratos Ativos              Unidades Ativas
Leads no CRM                  Leads da Rede (total)
Propostas Enviadas            Membros da Equipe
Dias na Rede                  Dias de Operacao
```

**Secao extra "Dados da Organizacao":**
- Campos: Nome Fantasia, CNPJ, E-mail, Telefone, Endereco, Cidade, Estado
- Usa `useOrgProfile().update` para salvar
- Separada do formulario pessoal (sao duas cards distintas)

**Popover do usuario na sidebar:**
- Adicionar botao "Meu Perfil" com icone `User` no popover que ja existe para logout, identico ao padrao do FranqueadoSidebar
