

# Reestruturacao do Modulo Contratos

## Resumo

Reorganizar o modulo Contratos no Administrativo com as seguintes mudancas:

1. Renomear "Gerador" para **"Criar Contratos"** e torna-lo a primeira sub-aba
2. Simplificar o fluxo de criacao: selecionar template, preencher dados do cliente, gerar PDF/Word
3. Melhorar o **Gerenciamento** com organizacao por pastas (franqueado, unidade, internos, tipo)
4. Manter Templates e Configuracoes como estao

---

## Arquivos

```text
MODIFICAR:
src/components/FranqueadoraSidebar.tsx   -- renomear "Gerador" para "Criar Contratos", reordenar como 1a sub-aba
src/App.tsx                              -- renomear rota de /contratos/gerador para /contratos/criar
src/pages/ContratosGerador.tsx           -- renomear arquivo para ContratoscriarContratos, simplificar wizard
src/pages/ContratosGerenciamento.tsx     -- adicionar organizacao por pastas/grupos

CRIAR:
(nenhum arquivo novo -- apenas refatoracao dos existentes)
```

---

## 1. Sidebar -- Reordenar e Renomear

No `FranqueadoraSidebar.tsx`, alterar os children de Contratos:

```text
children:
  1. "Criar Contratos" (icone FilePlus, path /franqueadora/contratos/criar)   <-- PRIMEIRO
  2. "Gerenciamento"   (icone FileText, path /franqueadora/contratos)
  3. "Templates"       (icone Copy, path /franqueadora/contratos/templates)
  4. "Configuracoes"   (icone Settings, path /franqueadora/contratos/configuracoes)
```

---

## 2. Rota -- Atualizar App.tsx

Trocar a rota `contratos/gerador` por `contratos/criar` apontando para o componente renomeado.

---

## 3. Criar Contratos (antigo Gerador) -- Simplificado

Renomear o arquivo de `ContratosGerador.tsx` para manter o mesmo arquivo mas com titulo e fluxo simplificado.

### Mudancas no fluxo

O wizard atual de 5 etapas sera mantido porem com melhorias de clareza:

- **Titulo da pagina**: "Criar Contratos" (em vez de "Gerador de Contratos")
- **Step 1 -- Tipo e Template**: Selecionar tipo de negocio (Assessoria, SaaS, Sistema, Franquia) e o template correspondente. Templates alimentam automaticamente o conteudo do contrato.
- **Step 2 -- Dono/Origem**: Manter como esta (Interno, Franqueado, Parceiro).
- **Step 3 -- Dados do Cliente**: Formulario com dados do cliente que serao inseridos nos placeholders do template.
- **Step 4 -- Contratacao**: Valores, datas, parcelas, servicos.
- **Step 5 -- Revisao e Geracao**: Preview do contrato preenchido com botoes:
  - **"Criar Contrato"** (status Gerado) -- em vez de "Gerar Contrato"
  - **"Salvar Rascunho"** (status Rascunho)
  - **"Exportar PDF"** (placeholder com toast)
  - **"Exportar DOCX"** (placeholder com toast)

---

## 4. Gerenciamento -- Organizacao Aprimorada

No `ContratosGerenciamento.tsx`, adicionar uma nova aba de organizacao alem do Kanban, Lista e Repositorio existentes:

### Nova aba: "Pastas" (icone FolderOpen)

Organizacao visual em pastas/grupos com opcoes de agrupamento:

- **Por Franqueado**: agrupa contratos pelo nome do franqueado (+ pasta "Internos" para contratos sem franqueado)
- **Por Tipo**: Assessoria, SaaS, Sistema, Franquia
- **Por Status**: Ativos (Assinado), Em andamento (Rascunho/Gerado/Enviado/Aguardando), Inativos (Vencido/Cancelado)
- **Por Unidade**: usando o franqueadoNome como referencia

### Seletor de agrupamento

No topo da aba "Pastas", um Select com as opcoes:
- Agrupar por: Franqueado | Tipo | Status | Todos

### Visual das pastas

- Icone de pasta com cor por grupo
- Nome do grupo + contagem de contratos
- Clicavel para expandir/colapsar (similar ao Repositorio atual)
- Dentro de cada pasta, cards compactos dos contratos com acoes rapidas (Ver, Editar, Excluir)

### Manter as abas existentes

- Kanban (status flow)
- Lista (tabela)
- Repositorio (Ativos/Andamento/Inativos -- como ja esta)
- **Pastas** (nova, com agrupamento flexivel)

---

## 5. Ordem de Implementacao

1. `FranqueadoraSidebar.tsx` -- reordenar children, renomear "Gerador" para "Criar Contratos", novo path
2. `App.tsx` -- atualizar rota de `contratos/gerador` para `contratos/criar`
3. `ContratosGerador.tsx` -- renomear titulo para "Criar Contratos", ajustar botao principal para "Criar Contrato"
4. `ContratosGerenciamento.tsx` -- adicionar aba "Pastas" com agrupamento por Franqueado/Tipo/Status

