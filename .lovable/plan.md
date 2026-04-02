
## Diagnóstico

Revisei o fluxo das 4 ferramentas e encontrei um problema estrutural combinado, não um único bug:

1. Há **autenticação inconsistente** entre as funções de geração:
- algumas dependem da validação no gateway (`generate-site`, `generate-social-briefing`, `generate-video-briefing`, `generate-social-image`, `generate-social-video-frames`, `generate-content`)
- outras validam manualmente no código (`generate-script`, `generate-traffic-strategy`)

2. Já há evidência real de falha de autenticação:
- `generate-social-briefing` retornando **401**
- `generate-traffic-strategy` retornando **401**
- `generate-script` entrando na função, mas respondendo **"Sessão inválida"**

3. O frontend ainda esconde parte do erro real em alguns fluxos:
- `src/pages/cliente/ClienteSites.tsx`
- `src/hooks/useClienteContentV2.ts`

4. As operações mais pesadas continuam síncronas dentro da requisição (site, artes/vídeo, lote de conteúdos, tráfego), o que deixa o sistema frágil para **rate limit / timeout** mesmo depois do ajuste principal.

## Plano

### 1. Padronizar autenticação das funções de geração
Vou unificar o modelo de autenticação das funções que hoje estão quebrando, para que todas validem a sessão do mesmo jeito e parem de falhar de forma aleatória/gateway.

Funções alvo:
- `generate-script`
- `generate-site`
- `generate-social-briefing`
- `generate-video-briefing`
- `generate-social-image`
- `generate-social-video-frames`
- `generate-traffic-strategy`
- `generate-content`

### 2. Padronizar respostas de erro do backend
Todas essas funções vão responder com JSON consistente, por exemplo:
- `401` sessão/autorização
- `402` créditos
- `429` limite/rate limit
- `500` falha interna/IA

Isso elimina casos como o `generate-script` responder erro de autenticação com status 200.

### 3. Corrigir o frontend para mostrar o motivo real
Vou aplicar o mesmo padrão de leitura de erro real nas telas que ainda mostram mensagem genérica:

- `src/hooks/useClienteContentV2.ts`
- `src/pages/cliente/ClienteSites.tsx`

E revisar os fluxos de roteiro/postagem/tráfego para garantir que nenhum deles volte a exibir apenas “Edge Function returned a non-2xx status code”.

### 4. Adicionar rastreabilidade mínima
Vou deixar logs curtos e objetivos nas funções para diferenciar claramente:
- sessão ausente/expirada
- créditos insuficientes
- rate limit
- erro de parsing da IA
- erro interno

Isso resolve também a parte de “entender o porquê do erro”.

### 5. Fazer uma segunda camada de estabilização
Depois do ajuste de autenticação + erro real, vou deixar os fluxos mais pesados preparados para estabilização estrutural.

Se os logs ainda mostrarem falhas por tempo de execução, o próximo passo será migrar os geradores mais pesados para **fila de processamento** em vez de esperar tudo dentro da mesma requisição.

## Arquivos a ajustar

- `supabase/config.toml`
- `supabase/functions/generate-script/index.ts`
- `supabase/functions/generate-site/index.ts`
- `supabase/functions/generate-social-briefing/index.ts`
- `supabase/functions/generate-video-briefing/index.ts`
- `supabase/functions/generate-social-image/index.ts`
- `supabase/functions/generate-social-video-frames/index.ts`
- `supabase/functions/generate-traffic-strategy/index.ts`
- `supabase/functions/generate-content/index.ts`
- `src/hooks/useClienteContentV2.ts`
- `src/pages/cliente/ClienteSites.tsx`

## Detalhes técnicos

- `generate-social-briefing` hoje falha antes de executar a lógica interna, por isso nem produz logs úteis.
- `generate-traffic-strategy` está no mesmo cenário de autorização quebrada.
- `generate-script` já entra na função, mas a checagem manual atual está rejeitando a sessão.
- `ClienteSites.tsx` e `useClienteContentV2.ts` ainda mascaram o erro real.
- `generate-site`, `generate-social-image`, `generate-social-video-frames` e `generate-content` são os principais candidatos a fila se, após o hotfix, ainda houver instabilidade por duração.

## Resultado esperado

Após essa correção:
- gerar roteiro volta a funcionar com erro claro quando houver bloqueio real
- gerar postagem deixa de cair em erro genérico
- gerar site para de mascarar a causa da falha
- gerar tráfego pago volta a autenticar corretamente
- vocês passam a enxergar exatamente o motivo do problema quando algo falhar
- o sistema fica pronto para uma fase 2 com fila, se ainda houver falhas por processamento pesado
