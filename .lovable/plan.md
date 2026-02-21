

# Simplificar Upload - Funcionar como Drive Real

## Resumo

Simplificar drasticamente o fluxo de criacao de pasta e upload de arquivo. Ao inves de pedir muitos metadados, o sistema deve funcionar como um Drive: criar pasta so pede o nome, upload de arquivo so pede o arquivo e titulo (o tipo de material ja e inferido pela aba ativa, e a pasta destino e a pasta atual). Campos extras ficam opcionais e recolhidos.

---

## 1. Upload Simplificado (`MarketingUpload.tsx`)

### Antes (atual)
O dialog pede 7 campos obrigatorios: titulo, tipo de material, formato, mes, ano, produto, arquivo. Muito atrito para um simples upload.

### Depois
- **Tipo de material**: pre-preenchido e travado (vem da aba ativa, nao precisa selecionar)
- **Campos principais** (visíveis): Titulo + Arquivo (drag area ou input file)
- **Campos extras** recolhiveis (Collapsible "Mais opcoes"): formato, mes/ano, produto, campanha, tags, versao
  - Formato: auto-detectado pela extensao do arquivo quando possivel
  - Mes/Ano: default para mes/ano atual
  - Produto: default "Geral"
- Botoes: "Salvar" (rascunho) e "Publicar"

### Props atualizadas
- `defaultCategory` agora e obrigatorio (sempre vem da aba ativa)
- Novo prop `currentFolder` (string) para saber a pasta destino

---

## 2. Criacao de Pasta (`MarketingDrive.tsx`)

A criacao de pasta ja esta simples (so nome). Manter como esta -- dialog com campo de nome e botao Criar. Sem mudancas necessarias.

---

## 3. Area de Upload mais Visual

Substituir o `Input type="file"` basico por uma area de drag-and-drop visual:
- Caixa tracejada com icone de upload
- Texto "Arraste arquivos ou clique para selecionar"
- Aceita multiplos arquivos
- Mostra lista dos arquivos selecionados com nome + tamanho

---

## 4. Contexto Automatico

Quando o usuario clica "Upload" dentro de uma pasta (ex: Redes Sociais > 2026 > 02 Fevereiro > Feed):
- Categoria: "RedesSociais" (travada)
- Pasta destino: "2026/02 Fevereiro/Feed" (informada no dialog)
- Formato: sugerido automaticamente baseado na extensao
- Mes: 2 (inferido do path "02 Fevereiro" quando possivel)

---

## Detalhes Tecnicos

### Arquivo modificado

```text
src/components/MarketingUpload.tsx  -- simplificar dialog, area de drag, campos recolhiveis
src/components/MarketingDrive.tsx   -- passar currentFolder para onUpload
src/pages/Marketing.tsx             -- passar categoria e pasta para MarketingUpload
```

### MarketingUpload.tsx

1. Receber `defaultCategory` (obrigatorio) e `currentFolder` (string opcional)
2. Remover select de "Tipo de Material" -- mostrar como badge informativo travado
3. Criar area de drag-and-drop com `onDragOver`/`onDrop` + input file hidden
4. State `files: File[]` para arquivos selecionados, mostrar lista
5. Mover formato, mes/ano, produto, campanha, tags, versao para dentro de `Collapsible` com label "Mais opcoes"
6. Defaults automaticos: ano=2026, mes=mes atual, produto="Geral", versao="v1"
7. Validacao minima: so precisa de titulo e pelo menos 1 arquivo

### MarketingDrive.tsx

1. Alterar prop `onUpload` para `onUpload?: (folder: string) => void`
2. Passar `pathString` ao chamar `onUpload`

### Marketing.tsx

1. State `uploadFolder` (string) para receber a pasta de contexto
2. Ao receber `onUpload(folder)` do MarketingDrive, setar `uploadFolder` e abrir dialog
3. Passar `currentFolder={uploadFolder}` e `defaultCategory={activeTab}` para MarketingUpload

