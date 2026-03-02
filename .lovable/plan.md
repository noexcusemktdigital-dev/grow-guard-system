
# Reestruturar Perfil de Usuario nas 3 Plataformas

## Problema Atual

- **Franqueadora (`FranqueadoraPerfil`)**: Mistura dados pessoais e dados da organizacao na mesma pagina. Nao permite trocar foto de perfil. Dados da org deveriam estar em outro lugar (Matriz ou Configuracoes).
- **Franqueado (`FranqueadoPerfil`)**: So tem dados pessoais (OK), mas nao permite trocar foto de perfil. Dados da organizacao (unidade) ja estao corretamente em `FranqueadoConfiguracoes`.
- **SaaS (`ClienteConfiguracoes`)**: Ja esta correto -- perfil com upload de avatar, org separada em aba, usuarios em aba. Servira de referencia.

## Solucao

### 1. Refatorar `FranqueadoraPerfil.tsx`
- **Remover** toda a secao "Dados da Organizacao" (card com CNPJ, endereco, etc.) -- esses dados ja sao gerenciados na pagina Matriz ou devem ir para uma pagina de Configuracoes da Franqueadora
- **Adicionar upload de foto de perfil** no avatar (overlay com icone de camera, upload para bucket `avatars`, mesmo codigo do `ClienteConfiguracoes`)
- Manter: banner, avatar, stats (Unidades Ativas, Leads, Membros, Dias de Operacao), formulario pessoal (nome, telefone, cargo)
- Remover imports de `useOrgProfile`

### 2. Refatorar `FranqueadoPerfil.tsx`
- **Adicionar upload de foto de perfil** no avatar (mesmo mecanismo: overlay camera, upload `avatars` bucket, cache buster)
- Manter tudo como esta (nao tem dados de org misturados)
- Adicionar `useRef`, import de `supabase`, `Camera` icon, logica de upload

### 3. Ambos perfis (Franqueadora e Franqueado)
- Avatar tera comportamento hover: overlay escuro com icone Camera
- Input file hidden, aceita `image/*`, max 2MB
- Upload para `avatars/{userId}/avatar.{ext}` com `upsert: true`
- Atualiza `avatar_url` no perfil via `update.mutate({ avatar_url })`

### 4. Onde ficam os dados de organizacao?
- **Franqueadora**: Pagina Matriz (`/franqueadora/matriz`) ja gerencia usuarios e permissoes. Os dados da organizacao (CNPJ, razao social, endereco) podem ser acessados la ou em uma futura pagina de Configuracoes
- **Franqueado**: Ja tem `FranqueadoConfiguracoes` com aba "Unidade" que edita dados da unidade -- correto
- **SaaS**: Ja tem `ClienteConfiguracoes` com aba "Organizacao" -- correto

## Arquivos Alterados

| Arquivo | Acao |
|---------|------|
| `src/pages/franqueadora/FranqueadoraPerfil.tsx` | Remover secao org, adicionar upload de avatar |
| `src/pages/franqueado/FranqueadoPerfil.tsx` | Adicionar upload de avatar |

## Detalhes Tecnicos

**Upload de avatar (mesmo padrao do SaaS):**

```text
1. Input file hidden com ref
2. Avatar envolto em div "relative group"
3. Overlay absoluto com bg-black/50, opacity-0, group-hover:opacity-100
4. Icone Camera branco centralizado
5. onClick -> fileInputRef.current.click()
6. onChange -> validar 2MB, upload supabase.storage "avatars", update.mutate({ avatar_url })
```

**Remocoes do FranqueadoraPerfil:**
- useState `editingOrg` e `orgForm`
- useEffect para `org`
- `useOrgProfile` import e uso
- Card inteiro "Dados da Organizacao" (linhas 178-256)
- Botao "Editar" da org

**Resultado final:**
- Perfil = dados da PESSOA (nome, cargo, telefone, foto)
- Dados da organizacao = gerenciados no local correto de cada plataforma
