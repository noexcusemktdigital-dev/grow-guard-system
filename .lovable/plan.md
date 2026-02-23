
# Ajustes no Agente de IA -- Refinamentos

## Resumo

Corrigir e simplificar varios pontos do formulario e card do agente: foto por upload (nao URL), sexo apenas Masculino/Feminino, remover Tags, mostrar numero do WhatsApp ao inves de instancia, remover Temperatura e Modelo da interface (usar valores fixos otimos), e adicionar botao "Gerar saudacao com IA".

---

## 1. Foto do agente por Upload (nao URL)

Atualmente a aba Identidade tem um input de URL para o avatar. Trocar por um botao de upload de imagem que:
- Faz upload para o bucket `agent-knowledge` no path `{org_id}/avatars/{timestamp}_{filename}`
- Exibe preview circular da imagem
- Botao "Alterar foto" / "Remover foto"
- Salva a URL publica no campo `avatar_url`

## 2. Sexo: apenas Masculino e Feminino

Remover a opcao "Neutro" do RadioGroup. Manter apenas:
- Masculino
- Feminino

## 3. Remover campo Tags

Remover completamente a secao de Tags da aba Identidade (input, badges, funcoes `addTag`/`removeTag`). O campo `tags` no form pode continuar existindo como array vazio por padrao, mas nao sera exibido na interface.

## 4. WhatsApp: mostrar numero ao inves de instancia

Trocar o label "Instancias WhatsApp" por "Numeros de WhatsApp". Exibir o `phone_number` da instancia (que ja vem do hook `useWhatsAppInstance`). Se houver multiplas instancias no futuro, listar todas com seus numeros. O comportamento interno (salvar `instance_id`) continua o mesmo, mas o usuario ve o numero.

## 5. Remover Temperatura e Modelo da interface

O usuario nao precisa escolher esses parametros. Remover o bloco com Slider de temperatura e Select de modelo da aba "Prompt e Objetivos". Usar valores fixos no codigo:
- Modelo: `google/gemini-3-flash-preview` (o melhor equilibrio velocidade/qualidade, ja usado na edge function)
- Temperatura: omitir (usar o padrao do modelo)

O campo `prompt_config` continua existindo mas sem `temperatura` e `modelo` expostos ao usuario.

## 6. Gerar saudacao com IA

Na aba Persona, quando o usuario selecionar "Personalizado" na saudacao, alem do input de texto, adicionar um botao "Gerar com IA" que:
- Chama a edge function `ai-generate-agent-config` com `type: "greeting"`, `role`, `persona` e `name`
- Retorna uma sugestao de saudacao personalizada
- Preenche o campo `custom_greeting` com o resultado

Tambem atualizar a edge function `ai-generate-agent-config` para aceitar `type: "greeting"`.

---

## Arquivos a editar

| Acao | Arquivo |
|------|---------|
| Editar | `src/components/cliente/AgentFormSheet.tsx` -- upload de foto, remover tags, remover temperatura/modelo, sexo sem neutro, label WhatsApp, botao gerar saudacao |
| Editar | `supabase/functions/ai-generate-agent-config/index.ts` -- suportar `type: "greeting"` |

## Detalhes Tecnicos

- O upload da foto reutiliza o mesmo bucket `agent-knowledge` e a mesma logica de `handleFileUpload` ja existente, adaptada para imagem unica
- O modelo fixo `google/gemini-3-flash-preview` e o melhor dos tres para este caso: rapido, barato e com qualidade suficiente para conversas. O Pro e mais caro/lento sem ganho significativo para chat, e o GPT-5 Mini tambem nao justifica o custo extra
- A temperatura padrao do Gemini Flash ja e adequada para conversas naturais, nao precisa de ajuste manual
- Na edge function `ai-agent-reply`, o campo `promptConfig.model` ja tem fallback para `google/gemini-3-flash-preview`, entao remover da UI nao quebra nada
