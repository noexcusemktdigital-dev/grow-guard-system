
# Agentes de IA -- Evolucao Completa

## Resumo

Reestruturar completamente o sistema de agentes de IA com funcoes definidas (SDR, Closer, Pos-venda, Suporte), persona detalhada com sexo e foto, base de conhecimento com arquivos e links, prompt guiado com perguntas didaticas e geracao via IA, simulador funcional, suporte a audio (transcrever e enviar), vinculacao a instancias WhatsApp especificas, e acoes/objetivos no CRM.

---

## 1. Migration -- Novas colunas em `client_ai_agents`

Adicionar colunas para suportar os novos recursos:

- `role` text NOT NULL default 'sdr' -- funcao do agente (sdr, closer, pos_venda, suporte)
- `gender` text nullable -- sexo da persona (masculino, feminino, neutro)
- `objectives` jsonb default '[]' -- objetivos especificos do agente (ex: qualificar leads, agendar reuniao)
- `crm_actions` jsonb default '{}' -- config de acoes automaticas no CRM (quais etapas pode mover, limites)
- `whatsapp_instance_ids` jsonb default '[]' -- IDs das instancias WhatsApp vinculadas (permite multiplas)

Nao remover colunas existentes para manter compatibilidade.

## 2. Storage Bucket para arquivos da base de conhecimento

Criar um bucket `agent-knowledge` (privado) para upload de PDFs, documentos e imagens que servem de base de conhecimento.

Migration SQL:
```
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-knowledge', 'agent-knowledge', false);
-- RLS: membros da org podem fazer upload e ler
```

## 3. Card do Agente (AgentCard.tsx) -- Redesign

### Mudancas visuais:
- Exibir a **funcao** do agente com badge colorida (SDR = azul, Closer = verde, Pos-venda = roxo, Suporte = laranja)
- **Botao de toggle Ativar/Pausar** em destaque no card (Switch grande ou botao Play/Pause) -- clicavel sem abrir o menu
- Foto do agente em avatar maior e mais destacado
- Remover o status do badge superior (ja visivel pelo toggle)
- Mostrar quantas instancias WhatsApp estao vinculadas

## 4. Formulario do Agente (AgentFormSheet.tsx) -- Reestruturacao Completa

Substituir as 6 abas atuais por **5 abas** (remover Diagnostico, ativar Simulador):

### Aba 1: Identidade
- **Nome** do agente (input obrigatorio)
- **Foto** do agente (upload de imagem com preview circular -- usa bucket `agent-knowledge` ou avatar_url)
- **Funcao**: Select com opcoes:
  - SDR (Prospecao e qualificacao)
  - Closer (Fechamento de vendas)
  - Pos-venda (Acompanhamento e fidelizacao)
  - Suporte/Atendimento (Resolucao de problemas)
- **Sexo**: Radio group (Masculino, Feminino, Neutro)
- **Canal**: Select (WhatsApp, Instagram, etc.)
- **Instancias WhatsApp**: Multi-select com as instancias disponiveis da organizacao (busca `whatsapp_instances`)
- **Tags**: Input de tags (ja existe)

### Aba 2: Persona (guiada com perguntas)
Reformular como um formulario didatico com perguntas de selecao:

- **Como o agente deve cumprimentar?** (selecao: Formal, Informal, Personalizado + campo texto)
- **Nivel de formalidade** (selecao: Muito formal, Profissional, Casual, Descontraido)
- **Uso de emojis** (selecao: Nunca, Pouco, Moderado, Bastante)
- **Comprimento das mensagens** (selecao: Curtas e diretas, Medias, Detalhadas)
- **Personalidade** (multi-select: Empatetico, Consultivo, Proativo, Objetivo, Paciente, Persuasivo)
- **Restricoes**: Textarea para o que o agente NAO deve fazer
- **Botao "Gerar com IA"**: ao clicar, usa as selecoes acima para gerar via edge function uma descricao completa da persona, que o usuario pode editar

### Aba 3: Base de Conhecimento
Reformular para dois tipos de entrada:

**Links/URLs:**
- Input para adicionar URLs de sites, documentos online
- Cada URL exibe preview (titulo extraido se possivel)

**Arquivos:**
- Area de upload (drag & drop ou botao) para PDFs, DOCx, TXT, imagens
- Upload vai para o bucket `agent-knowledge` com path `{org_id}/{agent_id}/{filename}`
- Lista de arquivos com nome, tamanho e botao de remover
- Os arquivos sao referenciados no campo `knowledge_base` como objetos: `{type: "file", name, url, size}` ou `{type: "url", content: "https://..."}`

**Textos manuais:**
- Textarea para colar textos longos de referencia
- Cada texto salvo como `{type: "text", content: "..."}`

### Aba 4: Prompt e Objetivos
Combinar prompt config + objetivos:

**System Prompt:**
- Textarea grande para o prompt
- **Botao "Gerar Prompt com IA"**: gera automaticamente com base na funcao, persona e base de conhecimento do agente
- Temperatura e modelo (ja existem)

**Objetivos do Agente:**
- Lista de objetivos especificos adicionaveis (ex: "Qualificar leads", "Agendar reuniao", "Enviar proposta")
- Cada objetivo pode ter uma descricao curta
- Opcoes pre-definidas por funcao:
  - SDR: Qualificar lead, Coletar informacoes, Agendar reuniao, Identificar decisor
  - Closer: Apresentar proposta, Negociar, Fechar venda, Superar objecoes
  - Pos-venda: Verificar satisfacao, Coletar feedback, Oferecer upsell, Resolver duvidas
  - Suporte: Resolver problema, Escalar ticket, Coletar informacoes do erro, Encaminhar para setor

**Acoes no CRM:**
- Checkboxes: "Pode mover lead de etapa", "Pode atualizar valor", "Pode adicionar tags", "Pode solicitar transbordo", "Pode criar tarefas"
- Select de etapas disponiveis (quais etapas o agente pode movimentar)

### Aba 5: Simulador (funcional)
Implementar um chat simulado dentro do formulario:

- Area de chat com bolhas de mensagem
- Input para o usuario digitar mensagens de teste
- Chama a mesma edge function `ai-agent-reply` em modo simulacao (sem enviar via WhatsApp)
- Ou chama direto o gateway de IA com o system prompt montado
- Exibe as respostas do agente em tempo real
- Mostra acoes detectadas (ex: "IA moveu lead para Proposta") como badges

## 5. Edge Function -- Suporte a audio

### Transcrever audio recebido:
- No `ai-agent-reply`, quando o `message_text` indicar que e audio (ou tipo da mensagem for audio), usar o Lovable AI Gateway para transcrever antes de processar
- Alternativa: na `whatsapp-webhook`, ao receber mensagem de audio, baixar o audio via Z-API, transcrever com IA e salvar o texto transcrito no campo `content` da mensagem

### Enviar audio como resposta:
- Usar o endpoint de TTS do gateway se disponivel, ou enviar texto normal
- Marcar no prompt_config se o agente deve responder com audio

## 6. Edge Function -- Prompt enriquecido por funcao

Atualizar `ai-agent-reply` para montar o system prompt com base na funcao:

- SDR: foco em qualificacao, perguntas abertas, identificar necessidades
- Closer: foco em proposta de valor, superacao de objecoes, senso de urgencia
- Pos-venda: foco em satisfacao, follow-up, oportunidades de upsell
- Suporte: foco em resolucao, empatia, coleta de informacoes

Incluir os objetivos configurados e as restricoes de acoes no CRM.

## 7. Edge Function -- Gerar persona/prompt com IA

Criar edge function `ai-generate-agent-config` que:
- Recebe: funcao, selecoes da persona, base de conhecimento resumida
- Retorna: texto de persona completa e/ou system prompt sugerido
- Usa o Lovable AI Gateway

## 8. Edge Function -- Simulador

Criar edge function `ai-agent-simulate` que:
- Recebe: agent config (persona, prompt, kb), mensagem do usuario
- Monta o system prompt igual ao `ai-agent-reply` mas NAO envia WhatsApp
- Retorna: resposta da IA + acoes detectadas
- Util para testar antes de ativar

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Migration | Adicionar `role`, `gender`, `objectives`, `crm_actions`, `whatsapp_instance_ids` em `client_ai_agents`; criar bucket `agent-knowledge` |
| Reescrever | `src/components/cliente/AgentFormSheet.tsx` -- 5 abas reestruturadas com persona guiada, upload de arquivos, objetivos, simulador funcional |
| Reescrever | `src/components/cliente/AgentCard.tsx` -- badge de funcao, toggle ativar/pausar em destaque, avatar maior |
| Editar | `src/pages/cliente/ClienteAgentesIA.tsx` -- handler para toggle de status direto do card |
| Editar | `src/hooks/useClienteAgents.ts` -- mutation de toggle de status |
| Editar | `src/types/cliente.ts` -- atualizar interface AiAgent |
| Criar | `supabase/functions/ai-generate-agent-config/index.ts` -- gerar persona/prompt com IA |
| Criar | `supabase/functions/ai-agent-simulate/index.ts` -- simulador de conversa |
| Editar | `supabase/functions/ai-agent-reply/index.ts` -- prompt por funcao, restricoes de acoes CRM, suporte a audio |

## Pontos adicionais de melhoria sugeridos (ja incluidos)

- **Historico de conversas do agente**: na aba de simulador, poder ver o log de conversas reais do agente (dados de `ai_conversation_logs`)
- **Metricas no card**: exibir no card do agente um mini-indicador de mensagens processadas nas ultimas 24h
- **Templates de agente**: oferecer templates pre-configurados ao criar novo agente (ex: "SDR para imobiliaria", "Suporte para e-commerce") -- pode ser implementado futuramente
- **Horario de funcionamento**: config de horarios em que o agente deve responder (fora do horario, nao responde ou envia mensagem padrao) -- implementado como campo `schedule` no `prompt_config`

## Detalhes Tecnicos

- O bucket `agent-knowledge` usa RLS: membros da org podem INSERT e SELECT nos paths `{org_id}/*`
- O upload de arquivos usa `supabase.storage.from("agent-knowledge").upload(path, file)`
- A base de conhecimento passa a ser um array de objetos tipados: `{type: "url"|"file"|"text", content: string, name?: string, url?: string, size?: number}`
- O simulador chama o Lovable AI Gateway direto com o prompt montado, sem passar pela Z-API
- A geracao de persona/prompt via IA usa `google/gemini-3-flash-preview` para rapidez
- O toggle de status no card chama `updateAgent.mutate({id, status: newStatus})` direto
- A vinculacao a instancias WhatsApp permite que um agente responda em multiplos numeros
- No `ai-agent-reply`, o `whatsapp_instance_ids` do agente e verificado para garantir que ele so responde nas instancias configuradas
- Para audio: a Z-API fornece URL do audio recebido; baixar via fetch, converter para base64 e enviar ao gateway de STT ou usar o modelo multimodal Gemini que aceita audio
