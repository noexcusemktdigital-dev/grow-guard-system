# Runbook: Rotação de Secrets Lovable

**Severidade:** P0 (quando secret vazou) / P3 (rotação preventiva programada)
**Aplica a:** Todos os secrets configurados em Lovable Dashboard → Settings → Secrets

## REGRA ABSOLUTA — LER ANTES DE QUALQUER AÇÃO

> **Rotação de secrets, chaves, senhas ou tokens EXIGE 2× confirmação explícita do Rafael na mesma conversa.**
>
> Esta regra não tem exceções, mesmo que o item seja marcado CRÍTICO ou P0 em auditoria.
>
> Procedimento obrigatório:
> 1. Listar o item como **"Plano Futuro"** — NUNCA no lote automático de correções
> 2. Executar **por ÚLTIMO** — após todas as outras correções da sessão concluídas
> 3. Aguardar **2 confirmações explícitas** do Rafael na mesma conversa antes de agir
>
> Referência: `memory/directives_audit_safety.md` — Diretiva de Rotação

## Inventário de Secrets (Sistema Noé)

| Secret | Onde usar | Origem | Frequência rotação |
|--------|-----------|--------|-------------------|
| `META_APP_SECRET` | `meta-leadgen-webhook` | Meta App Dashboard | Quando comprometido |
| `WHATSAPP_APP_SECRET` | `whatsapp-cloud-webhook` | Meta App Dashboard | Quando comprometido |
| `ASAAS_API_KEY` | `asaas-*` fns | Asaas Dashboard | Anual ou quando comprometido |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge fns server-side | Supabase Dashboard | Quando comprometido |
| `OPENAI_API_KEY` | `generate-*` fns | OpenAI Dashboard | Quando comprometido |

## Sintoma que exige rotação imediata

- Secret exposto em log, erro ou resposta HTTP pública
- Secret commitado em repositório Git (mesmo por 1 segundo)
- Acesso não autorizado detectado via secret
- Notificação do provider de comprometimento

## Diagnóstico pré-rotação

1. Confirmar que o secret está de fato comprometido (não falso positivo):
   ```
   Verificar: onde o valor apareceu? (log, commit, resposta HTTP)
   Verificar: alguém externo teve acesso ao valor?
   ```

2. Mapear todas as fns que usam o secret:
   - Verificar `Lovable Dashboard → Functions → [fn] → Environment`
   - Testar fns afetadas com secret atual antes de rotacionar

3. **Aguardar 2 confirmações explícitas do Rafael** (ver regra acima)

## Procedimento de rotação (após confirmações)

### Passo 1: Gerar novo valor
- Meta/WhatsApp: `developers.facebook.com → App Settings → Basic → Reset App Secret`
- Asaas: `Asaas Dashboard → Configurações → API → Gerar nova chave`
- OpenAI: `platform.openai.com → API Keys → Create new`
- Supabase service_role: NÃO rotacionar sem suporte Supabase (impacta todas as fns)

### Passo 2: Atualizar em Lovable (janela de downtime mínimo)
1. `Lovable Dashboard → Settings → Secrets`
2. Clicar no secret → editar valor → salvar
3. Fns são reiniciadas automaticamente em ~30s
4. **NÃO deletar o secret antigo ainda** — aguardar 2min para confirmar que fns subiram

### Passo 3: Revogar valor antigo no provider
1. Após confirmar que fns estão operacionais com novo valor
2. Revogar/invalidar o secret antigo no provider
3. Registrar a rotação:

```sql
INSERT INTO audit_logs (action, entity_type, entity_id, metadata, performed_by)
VALUES (
  'secret_rotated',
  'system',
  'lovable_secrets',
  '{"secret": "<SECRET_NAME>", "reason": "<MOTIVO>", "rotated_at": "<ISO_DATE>"}',
  '<ADMIN_USER_UUID>'
);
```

### Passo 4: Validar
- Testar fn afetada manualmente (request de teste)
- Verificar logs por 5min para garantir que não há erros de autenticação

## Se secret foi commitado no Git

1. **NÃO fazer git push --force para apagar** sem confirmar com Rafael
2. Rotacionar o secret IMEDIATAMENTE (o valor exposto já é inválido após rotação)
3. Usar `git filter-repo` ou BFG para limpar histórico — após confirmação Rafael
4. Notificar o time sobre o incidente via postmortem

## Prevenção

- `.gitignore` deve incluir `.env`, `.env.local`, `*.secret`
- Nunca logar valores de env vars (nem parcialmente)
- Revisar secrets ativos anualmente — remover os não utilizados
- Usar `SUPABASE_ANON_KEY` (pública) vs `SERVICE_ROLE_KEY` (privada) corretamente
