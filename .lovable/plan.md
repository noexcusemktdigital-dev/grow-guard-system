

# Repositorio Drive + Indicador de Anexo no Kanban

## Resumo

Adicionar uma terceira aba **"Repositorio"** estilo drive/pasta de arquivos na pagina de Gerenciamento, agrupando contratos por situacao (Ativos, Em andamento, Inativos). Tambem adicionar indicador visual de PDF/anexo nos cards do Kanban.

---

## 1. Indicador de Anexo no Kanban

Nos cards do Kanban, adicionar um pequeno icone de clipe/arquivo (`Paperclip`) quando o contrato tiver `arquivoUrl` preenchido. Ficara ao lado do valor/data, indicando visualmente que o contrato ja tem documento anexado.

---

## 2. Nova aba: Repositorio

### Estrutura

Terceira aba nas Tabs existentes com icone `FolderOpen` e label "Repositorio".

### Tres secoes colapsaveis

| Secao | Status incluidos | Cor do icone |
|-------|-----------------|--------------|
| Ativos | Assinado | Verde |
| Em andamento | Rascunho, Gerado, Enviado, Aguardando Assinatura | Amarelo |
| Inativos | Vencido, Cancelado | Cinza/Vermelho |

Cada secao tera um cabecalho clicavel com icone de pasta, nome da categoria e badge com contagem. Ao expandir, mostra os contratos em grid responsivo.

### Card estilo arquivo

Cada contrato aparece como um "arquivo" contendo:
- Icone de documento com cor baseada no status
- Numero do contrato (CTR-001) em destaque
- Nome do cliente
- Badges de tipo/produto e status
- Valor (mensal ou total)
- Periodo (inicio - fim)
- Icone de clipe se tem anexo (`arquivoUrl`)
- Botoes: Ver detalhes, Editar, Excluir

### Funcionalidades
- Filtros do topo se aplicam tambem nessa aba
- Clicar em "Ver" abre o Dialog de detalhes ja existente
- Grid responsivo: 3 colunas desktop, 2 tablet, 1 mobile

---

## Detalhes Tecnicos

### Arquivo modificado

```text
src/pages/ContratosGerenciamento.tsx
```

### Alteracoes

1. Adicionar imports: `FolderOpen`, `Paperclip`, `ChevronDown`, `ChevronRight`, `FileText` (como icone de arquivo)
2. Adicionar state `openSections` para controlar quais secoes estao expandidas (default: todas abertas)
3. Adicionar `TabsTrigger` "Repositorio" com icone `FolderOpen`
4. Adicionar `TabsContent` com tres secoes colapsaveis, cada uma filtrando `filtered` pelo grupo de status
5. No Kanban, adicionar icone `Paperclip` condicional no card quando `c.arquivoUrl` existe
6. Reutilizar `setViewContrato` / `setDetailOpen` e `openEdit` / `setDeleteId` nos cards do repositorio

### Agrupamento

```text
const ativos = filtered.filter(c => c.status === "Assinado");
const emAndamento = filtered.filter(c => ["Rascunho","Gerado","Enviado","Aguardando Assinatura"].includes(c.status));
const inativos = filtered.filter(c => ["Vencido","Cancelado"].includes(c.status));
```

