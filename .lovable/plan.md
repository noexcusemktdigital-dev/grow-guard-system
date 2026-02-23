
# Correção de 3 Bugs nos Agentes de IA

## Bug 1: Erro ao excluir agente

**Causa**: A policy RLS de DELETE na tabela `client_ai_agents` permite apenas `super_admin`, `admin` ou `cliente_admin`. Se o usuario logado nao tiver uma dessas roles, o DELETE falha silenciosamente (retorna 0 rows affected), e o Supabase client nao retorna erro explicito -- mas o agente nao e excluido e o frontend mostra erro.

**Solucao**: Verificar a role do usuario. A policy ja inclui `cliente_admin`, que e a role principal de clientes. Provavelmente o usuario tem a role `cliente_user`, que nao tem permissao de DELETE. Vamos criar uma nova policy que permita tambem que o criador do agente (`created_by = auth.uid()`) possa excluir, ou ajustar a policy existente para incluir membros da org.

**Acao**: Migration SQL para alterar a policy de DELETE, permitindo que membros da organizacao possam excluir agentes que eles criaram (`created_by = auth.uid()`).

---

## Bug 2: Foto do agente nao aparece apos upload

**Causa**: O bucket `agent-knowledge` e **privado** (`public: false`). O codigo usa `getPublicUrl()` que gera uma URL publica, mas como o bucket e privado, essa URL retorna erro 403. A imagem e salva corretamente, mas nao pode ser exibida.

**Solucao**: Duas opcoes:
1. Tornar o bucket publico (mais simples, adequado para avatares)
2. Usar URLs assinadas (`createSignedUrl`) ao exibir

Como os avatares nao sao dados sensiveis e precisam ser exibidos em cards publicamente, a opcao mais simples e tornar o bucket publico via migration.

**Acao**: Migration SQL para atualizar o bucket para `public = true`.

---

## Bug 3: "Numero nao configurado" apesar de WhatsApp estar integrado

**Causa**: No banco, o campo `phone_number` da instancia WhatsApp esta `NULL`. A Z-API retorna o numero no campo `phoneConnected` durante o check-status, mas o `phone_number` so e salvo se `statusData.smartphoneConnected` for `true` (linha 92 do whatsapp-setup). Se essa flag nao vier da Z-API ou for `false`, o numero nao e salvo.

O numero da instancia Z-API esta conectado (`status: connected`), mas a API pode usar um campo diferente. Alem disso, o campo pode nao ter sido populado durante o setup inicial.

**Solucao**:
1. Na edge function `whatsapp-setup`, no action `check-status`, salvar o `phoneConnected` sempre que disponivel, sem depender do flag `smartphoneConnected`
2. No frontend (`AgentFormSheet.tsx`), quando `phone_number` for null mas a instancia existir e estiver connected, fazer um fetch ao check-status para tentar obter o numero
3. Como alternativa imediata, buscar o numero diretamente da Z-API na edge function e garantir que ele seja salvo

**Acao**: 
- Editar `supabase/functions/whatsapp-setup/index.ts` -- simplificar a logica de `phone_number` no check-status para salvar `statusData.phoneConnected` diretamente quando disponivel
- Editar `src/components/cliente/AgentFormSheet.tsx` -- quando a instancia existir mas `phone_number` for null, exibir o instance_id mascarado e um botao "Atualizar numero" que chama check-status

---

## Arquivos a editar

| Acao | Arquivo |
|------|---------|
| Migration | Alterar policy DELETE em `client_ai_agents` para permitir `created_by = auth.uid()` |
| Migration | Atualizar bucket `agent-knowledge` para publico |
| Editar | `supabase/functions/whatsapp-setup/index.ts` -- corrigir logica de phone_number no check-status |
| Editar | `src/components/cliente/AgentFormSheet.tsx` -- fallback quando phone_number e null, botao atualizar |

## Detalhes Tecnicos

- A policy de DELETE sera: `USING (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid())` OU manter a original para admins. Combinar ambas com OR
- O bucket sera atualizado com `UPDATE storage.buckets SET public = true WHERE id = 'agent-knowledge'`
- No check-status, a linha 92 sera simplificada para: `phone_number: statusData.phoneConnected || instance.phone_number || null`
- No frontend, ao montar o formulario, se `whatsappInstance` existir com status `connected` mas sem `phone_number`, chamar automaticamente o check-status via edge function para tentar obter o numero
