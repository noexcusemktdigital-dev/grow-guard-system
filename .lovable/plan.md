
# Suporte a Multiplas Instancias WhatsApp por Organizacao

## Resumo

Permitir que cada organizacao tenha mais de um numero de WhatsApp conectado. O usuario podera configurar varios numeros na pagina de Integracoes e escolher qual(is) vincular a cada agente de IA.

---

## 1. Banco de Dados -- Remover constraint de unicidade

A tabela `whatsapp_instances` possui atualmente uma constraint `UNIQUE` na coluna `organization_id` (indicada por `isOneToOne: true`). Isso impede mais de uma instancia por organizacao.

**Migracao SQL:**
- Remover a constraint unique de `organization_id` na tabela `whatsapp_instances`
- Adicionar um campo opcional `label` (text) para o usuario nomear cada instancia (ex: "Comercial", "Suporte")

---

## 2. Edge Function `whatsapp-setup` -- Suporte a multiplas instancias

Atualmente o connect faz upsert buscando por `organization_id` (sobrescreve a unica instancia). E o `check-status` busca `.maybeSingle()`.

**Mudancas:**
- **Connect**: Sempre inserir uma nova instancia ao inves de fazer upsert. Verificar se ja existe uma instancia com o mesmo `instance_id` para evitar duplicatas (upsert por `instance_id` ao inves de `organization_id`)
- **Check-status**: Receber um parametro opcional `instanceId` para checar uma instancia especifica. Se nao receber, checar todas da organizacao
- **Disconnect**: Receber o `instanceId` para desconectar uma instancia especifica (ao inves de deletar todas)

---

## 3. Hook `useWhatsApp.ts` -- Retornar lista de instancias

**Mudancas:**
- Renomear `useWhatsAppInstance` para `useWhatsAppInstances` (plural)
- Alterar a query para buscar todas as instancias da organizacao (remover `.maybeSingle()`, usar array)
- Manter export do nome antigo como alias para nao quebrar outros usos
- Adicionar hook `useWhatsAppInstanceById(id)` para casos onde se precisa de uma especifica

---

## 4. Frontend `AgentFormSheet.tsx` -- Selecionar multiplos numeros

Atualmente exibe um unico checkbox com uma instancia. Com multiplas instancias, exibir uma lista de checkboxes onde cada instancia mostra o numero (ou label + numero).

**Mudancas:**
- Usar `useWhatsAppInstances()` (plural)
- Renderizar um checkbox para cada instancia disponivel
- O campo `whatsapp_instance_ids` do agente ja suporta array, entao nada muda no modelo do agente
- Auto-sync de phone_number para todas as instancias que estejam `connected` mas sem `phone_number`

---

## 5. Frontend `WhatsAppSetupWizard.tsx` -- Adicionar nova instancia

Atualmente o wizard sobrescreve a instancia existente.

**Mudancas:**
- O wizard sempre cria uma nova instancia (nao sobrescreve)
- Apos conectar, invalidar `whatsapp-instances` (plural)

---

## 6. Pagina de Integracoes -- Listar instancias

Permitir ao usuario ver todas as instancias conectadas com opcao de desconectar cada uma individualmente.

---

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Remover unique constraint de `organization_id`, adicionar campo `label` |
| `supabase/functions/whatsapp-setup/index.ts` | Upsert por `instance_id`, check-status individual, disconnect individual |
| `src/hooks/useWhatsApp.ts` | `useWhatsAppInstances` retorna array, auto-sync de todas |
| `src/components/cliente/AgentFormSheet.tsx` | Lista de checkboxes com todas as instancias |
| `src/components/cliente/WhatsAppSetupWizard.tsx` | Sempre criar nova instancia |

## Detalhes Tecnicos

- A constraint a remover e provavelmente um `UNIQUE INDEX` em `organization_id` na tabela `whatsapp_instances`
- O upsert no edge function passara a usar `.eq("instance_id", instanceId).eq("organization_id", orgId)` como criterio
- O campo `label` sera `text NULL DEFAULT NULL` -- opcional para o usuario
- O `whatsapp_instance_ids` no agente ja e `jsonb DEFAULT '[]'` -- nao precisa de migracao
- O webhook URL continuara usando `orgId` no path, sem mudancas no webhook receiver
