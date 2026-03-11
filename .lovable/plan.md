

## Adicionar Validação de Segredo no Evolution Webhook

### Situação atual
O `evolution-webhook` **não valida** o header `x-evolution-secret` — aceita qualquer payload. Os logs mostram que mensagens estão sendo recebidas e processadas normalmente. O problema anterior (contatos invisíveis) já foi resolvido.

### O que fazer

**A. Adicionar o segredo ao projeto**
- Configurar `EVOLUTION_WEBHOOK_SECRET` = `izitech_evo_key_2026` nos segredos do projeto usando a ferramenta de segredos

**B. Atualizar `evolution-webhook/index.ts`**
- Antes de processar o payload, verificar o header `x-evolution-secret`
- Se o segredo não bater, retornar 401 Unauthorized
- Se o segredo não estiver configurado no projeto (env var ausente), aceitar tudo (fallback para comportamento atual)

```text
Request chega → Verifica x-evolution-secret
  ├── Header bate com ENV → processa normalmente
  ├── ENV não configurada → processa normalmente (fallback)
  └── Header não bate → retorna 401
```

**C. Atualizar CORS headers**
- Adicionar `x-evolution-secret` à lista de headers permitidos

### Resultado
Webhook fica protegido contra payloads não autorizados, mantendo compatibilidade retroativa.

