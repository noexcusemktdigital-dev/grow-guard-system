
# Modulo de Disparos WhatsApp — Evolucao Completa

Reformulacao total da pagina de Disparos com regras de seguranca anti-bloqueio, criacao de mensagens com imagem, e tres formas de adicionar destinatarios.

---

## 1. Nova Edge Function: `whatsapp-bulk-send`

Substitui o envio direto no frontend por uma funcao server-side que controla o fluxo.

### Logica principal

1. Recebe: `dispatch_id` (referencia ao disparo salvo)
2. Busca o disparo no banco (`client_dispatches`) para pegar mensagem, imagem e lista de destinatarios
3. Valida regras:
   - Maximo **100 destinatarios** por disparo
   - Verifica se instancia Z-API esta conectada
4. Envia as mensagens em loop com **intervalo de 5-10 segundos** (aleatorio) entre cada envio
5. Se tiver imagem, usa endpoint Z-API `send-image` em vez de `send-text`
6. Atualiza o disparo com `stats` (enviados, falhas) e `status = "sent"` ao final
7. Registra cada mensagem na tabela `whatsapp_messages`

### Endpoints Z-API utilizados

| Tipo | Endpoint |
|------|----------|
| Texto | `POST /send-text` |
| Imagem + legenda | `POST /send-image` |

### Arquivo

`supabase/functions/whatsapp-bulk-send/index.ts`

---

## 2. Alteracoes na tabela `client_dispatches`

Adicionar colunas via migracao SQL:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `image_url` | text | URL da imagem anexada (opcional) |
| `max_per_day` | integer (default 100) | Limite diario configurado |
| `delay_seconds` | integer (default 7) | Intervalo entre envios |
| `source_type` | text (default 'manual') | 'manual', 'crm_contacts', 'list' |

A coluna `recipients` (jsonb) ja existe e sera usada para armazenar a lista final de telefones.

---

## 3. Reformulacao da UI — `ClienteDisparos.tsx`

### Painel de alertas (topo)

- Banner permanente (vermelho/laranja) com aviso claro:
  - "Disparos em massa tem risco de bloqueio pelo Meta/WhatsApp"
  - "Use com moderacao. Maximo de 100 destinatarios por disparo"
  - "Intervalo automatico entre envios para simular comportamento humano"
  - "Nao envie conteudo spam, promocional excessivo ou sem consentimento"
  - "Numeros novos (sem historico de conversa) tem maior risco de denuncia"
  - Link para boas praticas

### Wizard de criacao (Sheet reformulado)

**Etapa 1 — Mensagem**
- Campo: Nome do disparo
- Campo: Mensagem (textarea com suporte a variaveis `{{nome}}`)
- Campo: Imagem (upload opcional via input file, salva no Storage bucket)
- Preview da mensagem ao lado (simula bolha WhatsApp)

**Etapa 2 — Destinatarios**
- Tres abas/opcoes:
  1. **Manual**: Textarea para colar numeros (um por linha ou separados por virgula)
  2. **Contatos CRM**: Seletor com busca e multi-select dos contatos que tem telefone. Permite filtrar por tags
  3. **Lista de numeros**: Upload de arquivo CSV/TXT com uma coluna de telefones
- Contador de destinatarios selecionados (maximo 100)
- Validacao: exibe erro se > 100

**Etapa 3 — Configuracoes e confirmacao**
- Slider: intervalo entre envios (5s a 15s, default 7s)
- Checkbox de confirmacao: "Entendo os riscos de bloqueio e assumo a responsabilidade"
- Resumo: X destinatarios, mensagem preview, imagem sim/nao
- Botao "Criar e Enviar" (chama a edge function)

### Cards de disparos existentes

- Mostrar contador de enviados/total
- Badge de status com cores
- Ao clicar, abre detalhe com lista de destinatarios e status individual

---

## 4. Storage para imagens

Criar bucket `dispatch-media` (publico) para armazenar as imagens enviadas junto com os disparos.

---

## 5. Resumo de arquivos

| Arquivo | Tipo |
|---------|------|
| `supabase/functions/whatsapp-bulk-send/index.ts` | Novo |
| `src/pages/cliente/ClienteDisparos.tsx` | Reescrita completa |
| `src/hooks/useClienteDispatches.ts` | Adicionar funcao de disparo bulk |
| Migracao SQL (colunas + bucket) | Novo |
| `supabase/config.toml` | Adicionar nova function |

---

## Detalhes tecnicos da protecao anti-bloqueio

- O intervalo entre envios e randomizado (delay_seconds +/- 2s) para parecer humano
- Se a Z-API retornar erro 429 ou similar, a funcao para e marca o disparo como "parcial"
- O frontend bloqueia disparos se nao houver instancia conectada
- O limite de 100 e enforced tanto no frontend (validacao) quanto na edge function (server-side)
