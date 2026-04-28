## Problemas identificados

**1. Duplicação dos valores entre campos adicionais (bug)**

No `CrmFunnelManager.tsx` (linha 295), ao editar o nome do campo, o `key` é gerado automaticamente a partir do label:
```
key: e.target.value.toLowerCase().replace(/\s+/g, "_")
```

Quando o usuário cria 3 campos com o mesmo nome ("CAMPO TESTE"), os 3 ficam com `key="campo_teste"`. No diálogo de criação do lead (`CrmNewLeadDialog.tsx`), o estado é indexado por `field.key` — por isso digitar em um campo replica o valor nos outros.

**2. Campos adicionais não aparecem na edição de leads existentes**

O componente `CrmLeadDetailSheet.tsx` (usado tanto no portal Cliente quanto Franqueado) não lê nem renderiza o `custom_fields_schema` do funil, nem permite editar `lead.custom_fields`. Só o diálogo de criação faz isso.

## Mudanças propostas

### A. `src/components/crm/CrmFunnelManager.tsx` — garantir keys únicas

- Gerar `key` estável e único na criação do campo (usar o `Date.now()` que já existe no `newField`) e parar de regenerar a partir do label.
- O label (visível ao usuário) continua editável livremente, sem afetar o `key`.
- Para schemas legados que já têm chaves duplicadas, deduplicar ao carregar (`useEffect` de hidratação) acrescentando sufixo `_2`, `_3` quando colidir.

### B. `src/components/crm/CrmLeadDetailSheet.tsx` — editar campos adicionais

- Buscar o funil do lead via `useCrmFunnels()` (ou usar a prop `funnels` já recebida, fazendo lookup por `lead.funnel_id`) para obter o `custom_fields_schema`.
- Adicionar estado `editCustomFields` inicializado com `lead.custom_fields || {}`.
- Renderizar uma seção "Campos adicionais" na aba de detalhes (acima de Tags), com mesmo padrão visual do `CrmNewLeadDialog` (text/number/select).
- Incluir `custom_fields: editCustomFields` no payload do `updateLead.mutate` em `handleSave`.

### C. `src/components/crm/CrmNewLeadDialog.tsx` — pequeno hardening

- Não depende da correção, mas garantir que se o schema vier com keys duplicadas (dados legados), os inputs ainda funcionem isoladamente. Solução simples: usar `idx` como fallback de chave de estado quando detectar colisão.

## Resultado esperado

- Cada campo adicional armazena seu próprio valor, mesmo quando os labels são iguais.
- Ao abrir um lead já criado, o usuário vê e pode editar os campos adicionais definidos no funil.
- Schemas e leads existentes continuam funcionando (migração suave via dedup no carregamento).
