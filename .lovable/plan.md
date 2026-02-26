

## Ajustes no Plano de Vendas e Estratégia de Marketing

### 1. Plano de Vendas (`ClientePlanoVendas.tsx`)

**Remover historico da aba Diagnostico:**
- Remover o bloco `Collapsible` de "Historico de Diagnosticos" (linhas 1198-1240) que esta dentro da `TabsContent value="diagnostico"`

**Adicionar nova aba "Historico" ao lado de "Metas":**
- Adicionar `TabsTrigger value="historico"` com icone `Clock` na TabsList (apos Metas)
- Criar `TabsContent value="historico"` com o conteudo de historico de planos de vendas (similar ao historico de metas mas para diagnosticos anteriores)
- Persistir historico no banco de dados (atualmente usa localStorage e mock data com `useState`)

**Corrigir minimizacao do diagnostico:**
- O Collapsible existe mas o icone ChevronDown nao rotaciona e o trigger visual nao e claro
- Melhorar o CollapsibleTrigger com rotacao do icone e visual mais explicito (seta animada, estilo toggle)
- Manter `defaultOpen={!completed}` para abrir quando nao completou

### 2. Estrategia de Marketing (`ClientePlanoMarketing.tsx`)

**Resultado aberto com opcao de refazer:**
- Quando `completed = true`, mostrar resultado diretamente (ja faz isso)
- Garantir que o botao "Refazer Estrategia" salve a estrategia atual no historico antes de resetar
- O `handleRestart` atual apenas limpa estado -- precisa chamar `useSaveStrategy` para garantir que a ativa vai para historico antes de refazer

**Renomear aba "Historico" para "Historico de Estrategias":**
- Alterar o label da TabsTrigger de "Historico" para "Historico de Estrategias"

---

### Detalhes Tecnicos

**Arquivo: `src/pages/cliente/ClientePlanoVendas.tsx`**

1. Na TabsList (linha 965-972), adicionar terceira aba:
```
<TabsTrigger value="historico" className="gap-1.5">
  <Clock className="w-3.5 h-3.5" /> Historico
</TabsTrigger>
```

2. Remover linhas 1198-1240 (Collapsible de historico dentro da tab diagnostico)

3. Melhorar o CollapsibleTrigger do diagnostico (linha 978) -- adicionar `data-state` para rotacionar o ChevronDown e tornar mais visivel que e colapsavel

4. Adicionar `TabsContent value="historico"` apos a tab Metas com:
   - Lista de diagnosticos anteriores do localStorage (mock por enquanto, dados estaticos atuais)
   - Card visual similar ao historico de metas

**Arquivo: `src/pages/cliente/ClientePlanoMarketing.tsx`**

1. Renomear aba "Historico" (linha 843) para "Historico de Estrategias"

2. No `handleRestart` (linha 732-734), a logica atual ja funciona corretamente porque ao refazer e completar novamente, o `useSaveStrategy` ja desativa a estrategia anterior automaticamente (`is_active = false`). Nao precisa mudar a logica -- apenas garantir que o fluxo esta claro para o usuario

---

### Resumo de Arquivos

| Arquivo | Mudancas |
|---------|----------|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Remover historico da aba diagnostico, adicionar aba Historico, melhorar Collapsible |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Renomear aba para "Historico de Estrategias" |

