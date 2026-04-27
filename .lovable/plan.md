## Problema

A modal **Editar Membro** (`src/components/EditMemberDialog.tsx`) abre com largura estreita (`sm:max-w-md`) e sem altura máxima nem rolagem interna. Como agora ela contém o `MemberPermissionsEditor` (CRM, geração com créditos, WhatsApp) e o `ModuleAccessEditor` (grid de toggles de módulos), o conteúdo ultrapassa a altura da viewport, o footer com "Salvar/Cancelar/Remover" fica empurrado para fora e a leitura fica prejudicada.

## Solução

Ajustar apenas o layout do `DialogContent` e estruturar a modal em três áreas: cabeçalho fixo, corpo rolável e rodapé fixo.

### Alterações em `src/components/EditMemberDialog.tsx`

1. **DialogContent** — aumentar largura, limitar altura à viewport e transformar em coluna flex:
   - De: `className="sm:max-w-md"`
   - Para: `className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0"`

2. **DialogHeader** — manter fixo no topo com padding próprio:
   - Adicionar `className="px-6 pt-6 pb-4 border-b shrink-0"`

3. **Corpo** (a `<div className="space-y-4">` que envolve os campos e os editores) — torná-lo a área rolável:
   - Trocar para `className="flex-1 overflow-y-auto px-6 py-4 space-y-4"`

4. **DialogFooter** — fixar no rodapé:
   - Adicionar `border-t px-6 py-4 shrink-0 bg-background` mantendo o restante das classes existentes (`flex items-center justify-between gap-2`).

### Resultado

- Modal mais larga em desktop (`max-w-2xl`) acomoda confortavelmente o grid 2x4 de módulos e os toggles de permissões.
- Em telas menores que `sm`, continua ocupando a largura padrão do Dialog.
- Altura limitada a 90% da viewport, com rolagem somente no miolo — header e footer permanecem sempre visíveis, eliminando o corte do botão "Salvar".

Sem mudanças de lógica, dados ou outros componentes.
