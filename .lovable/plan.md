
# Adicionar Aba "Empresa" na Pagina Matriz

## Contexto
A pagina Matriz (`/franqueadora/matriz`) atualmente so tem duas abas: **Equipe** e **Perfis de Permissao**. Falta a aba de **cadastro da empresa** (franqueadora) onde o admin pode ver e editar os dados da organizacao (CNPJ, razao social, endereco, logo, etc.).

O Franqueado ja tem isso na aba "Unidade" dentro de Configuracoes. O SaaS tem na aba "Organizacao" dentro de Configuracoes. A Franqueadora precisa do mesmo, dentro da Matriz.

## Solucao

### Editar `src/pages/Matriz.tsx`

Adicionar uma terceira aba **"Empresa"** com icone `Building2`, posicionada como primeira aba (antes de Equipe e Perfis).

**Conteudo da aba Empresa:**
- Card com formulario editavel contendo todos os campos da tabela `organizations`:
  - Nome Fantasia (`name`)
  - Razao Social (`legal_name`)
  - Nome Comercial (`trade_name`)
  - CNPJ (`cnpj`)
  - E-mail (`email`)
  - Telefone (`phone`)
  - Endereco (`address`)
  - Cidade (`city`)
  - Estado (`state`)
  - Natureza Juridica (`legal_nature`)
  - Porte da Empresa (`company_size`)
  - Data de Fundacao (`founded_at`)
- Upload de logo da empresa (`logo_url`) com preview -- usando o bucket `avatars` ou `marketing-assets`
- Botao "Salvar Dados" usando `useOrgProfile().update`

**Hooks utilizados:**
- `useOrgProfile` (ja existe) -- busca e atualiza dados da organizacao
- Logica de upload de logo similar ao avatar do perfil

**Layout do formulario:**
- Grid 2 colunas em desktop, 1 em mobile
- Secao superior: Logo + Nome Fantasia + Razao Social
- Secao cadastral: CNPJ, Natureza Juridica, Porte, Data de Fundacao
- Secao contato: E-mail, Telefone
- Secao endereco: Endereco, Cidade, Estado

## Detalhes Tecnicos

**Nova aba no TabsList:**
```text
<TabsTrigger value="empresa"><Building2 /> Empresa</TabsTrigger>
<TabsTrigger value="membros"><Users /> Equipe</TabsTrigger>
<TabsTrigger value="perfis"><Shield /> Perfis</TabsTrigger>
```

**Upload de logo:**
- Input file hidden com ref
- Preview da logo atual (ou placeholder com icone Building2)
- Upload para `avatars/{orgId}/logo.{ext}` com upsert
- Atualiza `logo_url` via `useOrgProfile().update`

**Estado do formulario:**
- useState com todos os campos, populado via useEffect quando `org` carrega
- Botao "Salvar" chama `update.mutate(form)`
- Feedback visual de loading no botao

## Arquivo Alterado

| Arquivo | Acao |
|---------|------|
| `src/pages/Matriz.tsx` | Adicionar aba "Empresa" com formulario completo de dados da organizacao e upload de logo |
