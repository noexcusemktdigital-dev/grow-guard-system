# Runbook: Data Subject Request (DSR) — LGPD Art. 18

**Severidade:** P3 (prazo legal: 15 dias úteis para resposta)
**Aplica a:** Titulares de dados que exercem direitos LGPD

## Tipos de DSR

- **Exportação (Art. 18 II):** titular quer cópia de todos os seus dados
- **Exclusão (Art. 18 VI):** titular quer deletar conta e dados pessoais
- **Retificação (Art. 18 III):** titular quer corrigir dado incorreto
- **Revogação de consentimento (Art. 18 IX):** titular quer parar processamento

## Sintoma / Gatilho

- Email para dpo@grupolamadre.com.br ou rafael@grupolamadre.com.br com pedido de acesso/exclusão
- Formulário no sistema Noé (se implementado) gerou entrada em `dsr_requests`
- Solicitação via WhatsApp ou suporte

## Diagnóstico

```sql
-- Ver DSR requests pendentes
SELECT id, user_id, request_type, status, created_at, deadline_at
FROM dsr_requests
WHERE status IN ('pending', 'processing')
ORDER BY deadline_at ASC;
```

```sql
-- Encontrar user pelo email
SELECT id, email, created_at, deleted_at
FROM auth.users
WHERE email = '<EMAIL_DO_TITULAR>';
```

## Mitigação

### Exportação de dados (Art. 18 II)

1. Identificar `user_id` pelo email
2. Executar export via edge fn (se disponível): `POST /dsr-export { user_id }`
3. Se fn não disponível, executar queries manuais:

```sql
-- Dados do usuário
SELECT * FROM profiles WHERE user_id = '<USER_UUID>';
SELECT * FROM credit_transactions WHERE organization_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = '<USER_UUID>'
);
SELECT * FROM webhook_events WHERE user_id = '<USER_UUID>';
-- Adicionar demais tabelas com FK para user_id
```

4. Exportar resultado como JSON/CSV
5. Enviar por email criptografado ao titular em até 15 dias úteis
6. Registrar atendimento:

```sql
UPDATE dsr_requests
SET status = 'completed', completed_at = now(), notes = 'Exportação enviada por email em <DATA>'
WHERE id = '<DSR_ID>';
```

### Exclusão de dados (Art. 18 VI)

1. **Confirmar identidade** do titular (solicitar foto do documento)
2. Verificar se há obrigações legais que impedem exclusão (contratos ativos, obrigação fiscal)
3. Executar soft delete:

```sql
-- Soft delete do usuário (mantém registros financeiros por obrigação legal)
UPDATE auth.users SET deleted_at = now() WHERE id = '<USER_UUID>';
UPDATE profiles SET deleted_at = now(), email = 'deleted-<USER_UUID>@noé.invalid'
WHERE user_id = '<USER_UUID>';
```

4. Revogar sessões ativas via Supabase Auth Admin API
5. Registrar conclusão no `dsr_requests`

### Retificação

1. Identificar o dado incorreto e a tabela
2. Corrigir com `UPDATE` documentado
3. Registrar o que foi alterado em `dsr_requests.notes`

## Prazo Legal

- Prazo máximo: **15 dias úteis** a partir do recebimento
- Registrar data de recebimento em `dsr_requests.created_at`
- Alerta interno se `deadline_at < now() + interval '3 days'` e status ainda `pending`

## Prevenção

- Manter `dsr_requests` atualizado — nunca processar DSR "de cabeça" sem registrar
- Responder acuse de recebimento em 24h mesmo que o processamento demore mais
- Revisar mensalmente DSRs pendentes:

```sql
SELECT * FROM dsr_requests WHERE status != 'completed' ORDER BY created_at;
```
