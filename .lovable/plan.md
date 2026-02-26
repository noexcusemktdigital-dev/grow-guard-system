

## Simular Digitacao Humana nos Agentes de IA

### O que muda
Antes de enviar a resposta final, o agente vai:
1. Calcular um tempo de digitacao proporcional ao tamanho da resposta (simula leitura + digitacao)
2. Ativar o indicador "digitando..." no WhatsApp via Z-API
3. Aguardar o tempo calculado
4. Enviar a mensagem

### Detalhes Tecnicos

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts`

**Calculo do delay**:
- Base: 1.5 segundos (tempo de "ler" a mensagem recebida)
- Digitacao: ~40 caracteres por segundo (velocidade humana rapida)
- Minimo: 2 segundos
- Maximo: 12 segundos
- Exemplo: resposta com 200 caracteres = 1.5s + 5s = 6.5 segundos de espera

**Indicador "digitando..."**:
- Z-API disponibiliza o endpoint `POST /send-typing` que mostra o status "digitando..." para o contato
- Sera chamado logo antes do delay, assim o contato ve que alguem esta "digitando"

**Alteracoes no codigo** (entre a geracao da resposta da IA e o envio via Z-API, ~linhas 476-490):

1. Calcular delay baseado no tamanho de `cleanReply`
2. Chamar `https://api.z-api.io/instances/{id}/token/{token}/send-typing` com o telefone do contato
3. Aguardar com `await new Promise(resolve => setTimeout(resolve, delayMs))`
4. Enviar a mensagem normalmente

### Impacto
- 1 arquivo alterado
- Experiencia muito mais natural para quem recebe as mensagens
- Sem impacto em performance (o delay e assincrono dentro da funcao)
