

# Modulo Matriz -- Gestao de Usuarios da Franqueadora

## Resumo

Criar o modulo "Matriz" dentro da secao Rede do sidebar. Modulo exclusivo para gestao dos usuarios internos da franqueadora (equipe da matriz), com controle granular de permissoes por modulo, permissoes especiais estrategicas e perfis pre-configurados. Usuarios da Matriz NAO sao vinculados a unidades.

---

## Arquivos

```text
CRIAR:
src/data/matrizData.ts                              -- tipos, mock data, perfis, helpers
src/pages/Matriz.tsx                                -- pagina principal (lista + detalhe/edicao)
src/components/matriz/MatrizUserList.tsx             -- lista de usuarios com filtros
src/components/matriz/MatrizUserForm.tsx             -- formulario de criacao/edicao de usuario
src/components/matriz/MatrizPermissions.tsx          -- controle de permissoes por modulo
src/components/matriz/MatrizSpecialPermissions.tsx   -- toggles de permissoes especiais
src/components/matriz/MatrizProfiles.tsx             -- perfis pre-configurados

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- adicionar "Matriz" na secao Rede
src/App.tsx                            -- adicionar rota /franqueadora/matriz
```

---

## 1. Dados (matrizData.ts)

### Tipos

```text
MatrizArea = "Financeiro" | "Comercial" | "Juridico" | "Marketing" | "Operacoes" | "Direcao"

MatrizUserStatus = "Ativo" | "Inativo"

NivelAcesso = "sem_acesso" | "visualizacao" | "edicao" | "admin"

ModuloPermissao:
  modulo (string)
  nivel (NivelAcesso)

MatrizUser:
  id, nome, email, telefone, cargo, area (MatrizArea),
  status (MatrizUserStatus), lastLogin (string),
  permissoes: ModuloPermissao[],
  permissoesEspeciais: PermissoesEspeciais,
  perfilBase? (string -- id do perfil usado como base)

PermissoesEspeciais:
  podeVerFinanceiroCompleto (bool)
  podeEditarRepasse (bool)
  podeGerarDre (bool)
  podeExcluirContratos (bool)
  podeCriarCampanhas (bool)
  podeEnviarComunicadoGlobal (bool)
  podeAlterarPermissoes (bool)

PerfilPreConfigurado:
  id, nome, descricao, icone (string),
  permissoes: ModuloPermissao[],
  permissoesEspeciais: PermissoesEspeciais
```

### Lista de Modulos (para permissoes)

Organizados por secao:

- **Administrativo**: Financeiro, Contratos, Fechamentos (DRE)
- **Comercial**: Marketing, Academy, Metas e Ranking
- **Rede**: Unidades, CRM Expansao, Onboarding, Atendimento, Matriz
- **Principal**: Comunicados, Agenda, Dashboard

### Perfis Pre-Configurados Mock

- **Super Admin**: Acesso total (admin em tudo, todas especiais ativas)
- **Financeiro**: Admin em Financeiro/Contratos/Fechamentos, visualizacao em Comercial
- **Comercial**: Admin em CRM Expansao/Metas/Marketing, visualizacao em restante
- **CS / Operacoes**: Admin em Onboarding/Atendimento/Unidades
- **Marketing**: Admin em Marketing/Comunicados/Agenda

### Usuarios Mock (6-8)

- Davi (Direcao, Super Admin)
- Lucas (Financeiro, perfil Financeiro)
- Amanda (Comercial, perfil Comercial)
- Rafael (Operacoes, perfil CS)
- Camila (Marketing, perfil Marketing)
- Pedro (Juridico, custom -- Contratos admin + visualizacao financeiro)
- 1-2 inativos

### Helpers

- `getModulosBySection()` -- retorna modulos agrupados por secao
- `getPerfilById(id)` -- retorna perfil pre-configurado
- `applyPerfil(user, perfilId)` -- aplica permissoes do perfil ao usuario
- `getUserModulosHabilitados(user)` -- lista de modulos com acesso >= visualizacao
- `getNivelAcessoLabel(nivel)` -- "Sem acesso" / "Visualizacao" / "Edicao" / "Admin"
- `getNivelAcessoIcon(nivel)` -- icone correspondente
- `getAreaColor(area)` -- cor do badge da area

---

## 2. Pagina Principal (Matriz.tsx)

### State

- `view`: "list" | "detail" | "create"
- `selectedUserId`: null ou id
- `users`: MatrizUser[] (state local com mock)

### Header

- Icone Shield/Users + Titulo "Matriz"
- Badge "Franqueadora"
- Subtitulo: "Gestao de usuarios e permissoes da franqueadora"
- Botao "Voltar" (quando em detail/create)
- Botao "+ Novo Usuario" (na lista)

### Renderizacao

- list -> MatrizUserList
- detail -> tabs (Dados, Permissoes por Modulo, Permissoes Especiais)
- create -> MatrizUserForm

---

## 3. Lista de Usuarios (MatrizUserList.tsx)

### Cards resumo (4)

- Total usuarios ativos
- Areas representadas
- Super Admins (count)
- Usuarios inativos

### Filtros

- Area (Select)
- Status (Select: Ativo/Inativo)
- Nivel de acesso (Select: tem pelo menos 1 modulo com admin/edicao/visualizacao)
- Busca por nome/email

### Tabela

Colunas: Nome, Email, Cargo, Area (badge cor), Status (badge), Ultimo login, Modulos habilitados (count + tooltip), Perfil base, Acoes (Ver, Editar)

---

## 4. Formulario de Usuario (MatrizUserForm.tsx)

### Campos

- Nome (Input obrigatorio)
- Email (Input obrigatorio)
- Telefone (Input)
- Cargo (Input)
- Area (Select: Financeiro, Comercial, Juridico, Marketing, Operacoes, Direcao)
- Status (Select: Ativo/Inativo)

### Secao Perfil Base

- Select com perfis pre-configurados (Super Admin, Financeiro, Comercial, CS, Marketing)
- Ao selecionar, pre-preenche permissoes (com aviso: "Permissoes aplicadas do perfil. Voce pode personalizar abaixo.")
- Opcao "Personalizado" para configurar do zero

### Botoes

- Salvar
- Cancelar

---

## 5. Permissoes por Modulo (MatrizPermissions.tsx)

### Layout

Secoes agrupadas (Administrativo, Comercial, Rede, Principal), cada uma com:

Para cada modulo, uma linha com:
- Nome do modulo
- 4 opcoes radio/segmented: Sem acesso | Visualizacao | Edicao | Admin
- Icones visuais para cada nivel

### Visual

- Sem acesso: cinza, icone X
- Visualizacao: azul, icone olho
- Edicao: amarelo, icone lapis
- Admin: verde, icone coroa

### Botao "Aplicar Perfil"

- Dropdown para aplicar um perfil pre-configurado rapidamente
- Aviso: "Isso substituira as permissoes atuais"

---

## 6. Permissoes Especiais (MatrizSpecialPermissions.tsx)

Lista de toggles (Switch) com descricao:

- Pode visualizar dados financeiros completos
- Pode editar repasse
- Pode gerar DRE
- Pode excluir contratos
- Pode criar campanhas
- Pode enviar comunicados globais
- Pode alterar permissoes de outros usuarios

Cada toggle com:
- Label
- Descricao curta explicando o impacto
- Switch ativo/inativo
- Icone de alerta em permissoes criticas (alterar permissoes, excluir contratos)

---

## 7. Perfis Pre-Configurados (MatrizProfiles.tsx)

### Cards dos perfis

Grid com cards para cada perfil:
- Icone + Nome + Descricao
- Lista resumida dos modulos com acesso
- Permissoes especiais ativas
- Botao "Aplicar este perfil" (quando editando usuario)

### Visualizacao standalone

Quando acessado da lista, mostra os perfis como referencia (somente leitura).

---

## 8. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `redeSection`, adicionar apos "Atendimento":
```text
{ label: "Matriz", icon: Shield, path: "/franqueadora/matriz" }
```

Importar `Shield` de lucide-react.

### App.tsx

Adicionar rota:
```text
import Matriz from "./pages/Matriz";
<Route path="matriz" element={<Matriz />} />
```

---

## 9. Design

- Area badges: Financeiro (verde), Comercial (azul), Juridico (roxo), Marketing (laranja), Operacoes (teal), Direcao (vermelho)
- Niveis de acesso: segmented control com cores (cinza/azul/amarelo/verde)
- Permissoes especiais: switches com descricao, icone de alerta para criticas
- Perfis: cards com icone grande e lista de permissoes
- Status Ativo: badge verde, Inativo: badge cinza

---

## 10. Ordem de Implementacao

1. `matrizData.ts` -- tipos, modulos, perfis pre-configurados (5), usuarios mock (6-8), helpers
2. `MatrizUserList.tsx` -- lista com filtros, tabela, cards resumo
3. `MatrizUserForm.tsx` -- formulario com selecao de perfil base
4. `MatrizPermissions.tsx` -- controle de permissoes por modulo com segmented control
5. `MatrizSpecialPermissions.tsx` -- toggles de permissoes especiais
6. `MatrizProfiles.tsx` -- cards dos perfis pre-configurados
7. `Matriz.tsx` -- pagina hub com tabs (Dados, Permissoes, Especiais) no detalhe
8. `FranqueadoraSidebar.tsx` + `App.tsx` -- adicionar menu e rota

